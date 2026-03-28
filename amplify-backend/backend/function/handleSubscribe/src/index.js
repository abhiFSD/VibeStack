/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STRIPE_SECRET_KEY
	API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT
	API_LFAPI_GRAPHQLAPIIDOUTPUT
	API_LFAPI_GRAPHQLAPIKEYOUTPUT
Amplify Params - DO NOT EDIT */

const https = require('https');
const AWS = require('aws-sdk');

// Log environment variables (excluding sensitive data)
console.log('Environment variables check:', {
    REGION: process.env.REGION,
    HAS_STRIPE_KEY: !!process.env.STRIPE_SECRET_KEY,
    STRIPE_KEY_LENGTH: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 0,
    HAS_GRAPHQL_ENDPOINT: !!process.env.API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT,
    HAS_GRAPHQL_API_KEY: !!process.env.API_LFAPI_GRAPHQLAPIKEYOUTPUT,
    GRAPHQL_ENDPOINT: process.env.API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT
});

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY environment variable is not set');
}

if (!process.env.API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT || !process.env.API_LFAPI_GRAPHQLAPIKEYOUTPUT) {
    throw new Error('GraphQL API environment variables are not set properly');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// GraphQL query to get organization details
const getOrganizationQuery = /* GraphQL */ `
  query GetOrganization($id: ID!) {
    getOrganization(id: $id) {
      id
      name
      stripeCustomerId
      stripeSubscriptionId
      stripeSubscriptionItemId
      subscriptionStatus
      billingPeriod
      activeUserCount
      _version
    }
  }
`;

// GraphQL mutation to update organization
const updateOrganizationMutation = /* GraphQL */ `
  mutation UpdateOrganization($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      stripeCustomerId
      subscriptionStatus
      subscriptionPeriodEnd
      billingPeriod
    }
  }
`;

// Helper function to make GraphQL requests
const makeGraphQLRequest = async (query, variables) => {
    const endpoint = process.env.API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT;
    const apiKey = process.env.API_LFAPI_GRAPHQLAPIKEYOUTPUT;

    return new Promise((resolve, reject) => {
        const requestBody = JSON.stringify({
            query: query,
            variables: variables
        });

        const url = new URL(endpoint);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
            }
        };

        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.errors) {
                        reject(new Error(parsedData.errors[0].message));
                    } else {
                        resolve(parsedData);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        request.on('error', reject);
        request.write(requestBody);
        request.end();
    });
};

// Payment Status Sync Function
const syncPaymentStatus = async (organizationId) => {
    try {
        console.log('Syncing payment status for organization:', organizationId);
        
        // Get organization
        const orgResult = await makeGraphQLRequest(getOrganizationQuery, { id: organizationId });
        const organization = orgResult.data.getOrganization;
        
        if (!organization) {
            throw new Error(`Organization not found: ${organizationId}`);
        }
        
        console.log('Organization found:', organization.name);
        console.log('Current status:', organization.subscriptionStatus);
        
        let statusUpdated = false;
        let invoicesCreated = 0;
        
        // Sync subscription status if subscription exists
        if (organization.stripeSubscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId);
            console.log('Stripe status:', subscription.status);
            
            if (organization.subscriptionStatus !== subscription.status.toUpperCase()) {
                console.log('Updating organization status...');
                
                const updateInput = {
                    id: organization.id,
                    subscriptionStatus: subscription.status.toUpperCase(),
                    stripeSubscriptionId: subscription.id,
                    subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                    purchasedLicenses: subscription.items.data[0].quantity,
                    _version: organization._version
                };
                
                await makeGraphQLRequest(updateOrganizationMutation, { input: updateInput });
                console.log('Status updated to:', subscription.status.toUpperCase());
                statusUpdated = true;
            }
        }
        
        // Sync recent invoice records
        if (organization.stripeCustomerId) {
            console.log('Syncing recent invoice records...');
            
            // Get recent Stripe invoices (last 5)
            const stripeInvoices = await stripe.invoices.list({
                customer: organization.stripeCustomerId,
                limit: 5
            });
            
            // Check which invoices need to be created
            for (const invoice of stripeInvoices.data) {
                if (invoice.status === 'paid') {
                    try {
                        // Check if invoice already exists
                        const checkInvoiceQuery = /* GraphQL */ `
                          query ListSubscriptionInvoices($filter: ModelSubscriptionInvoiceFilterInput) {
                            listSubscriptionInvoices(filter: $filter) {
                              items {
                                id
                              }
                            }
                          }
                        `;
                        
                        const existingResult = await makeGraphQLRequest(checkInvoiceQuery, {
                            filter: { 
                                organizationId: { eq: organizationId },
                                stripeInvoiceId: { eq: invoice.id }
                            }
                        });
                        
                        if (existingResult.data.listSubscriptionInvoices.items.length === 0) {
                            // Create new invoice record
                            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
                            
                            const createInvoiceMutation = /* GraphQL */ `
                              mutation CreateSubscriptionInvoice($input: CreateSubscriptionInvoiceInput!) {
                                createSubscriptionInvoice(input: $input) {
                                  id
                                  stripeInvoiceId
                                  status
                                }
                              }
                            `;
                            
                            const invoiceInput = {
                                organizationId: organizationId,
                                stripeInvoiceId: invoice.id,
                                amount: invoice.amount_paid / 100,
                                status: 'PAID',
                                billingPeriodStart: new Date(invoice.period_start * 1000).toISOString(),
                                billingPeriodEnd: new Date(invoice.period_end * 1000).toISOString(),
                                userCount: invoice.lines.data[0]?.quantity || 1,
                                pricePerUser: (invoice.amount_paid / 100) / (invoice.lines.data[0]?.quantity || 1),
                                billingPeriod: subscription.items.data[0].price.recurring.interval.toUpperCase(),
                                hostedInvoiceUrl: invoice.hosted_invoice_url || '',
                                isProrated: invoice.billing_reason === 'subscription_update',
                                basePrice: subscription.items.data[0].price.unit_amount / 100
                            };
                            
                            await makeGraphQLRequest(createInvoiceMutation, { input: invoiceInput });
                            console.log('Created invoice record:', invoice.id);
                            invoicesCreated++;
                        }
                    } catch (error) {
                        console.error('Failed to create invoice:', invoice.id, error.message);
                    }
                }
            }
        }
        
        return {
            success: true,
            statusUpdated,
            invoicesCreated,
            organizationId: organizationId,
            message: `Sync completed: ${statusUpdated ? 'Status updated' : 'Status OK'}, ${invoicesCreated} invoices created`
        };
        
    } catch (error) {
        console.error('Sync failed:', error);
        return {
            success: false,
            organizationId: organizationId,
            error: error.message
        };
    }
};

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    console.log('Event field name:', event.fieldName);
    console.log('Event arguments:', event.arguments);
    console.log('Event arguments.quantity:', event.arguments?.quantity, 'type:', typeof event.arguments?.quantity);
    
    try {
        // Handle payment status sync
        if (event.fieldName === 'syncPaymentStatus') {
            return await syncPaymentStatus(event.arguments.organizationId);
        }
        
        // Handle license purchases
        if (event.fieldName === 'purchaseLicenses') {
            console.log('Routing to handleLicensePurchase with args:', event.arguments);
            return await handleLicensePurchase(event.arguments);
        }
        
        // Handle initial subscription creation
        if (event.arguments.billingPeriod && !event.arguments.quantity) {
            return await handleNewSubscription(event.arguments);
        }
        
        // Handle quantity updates
        if (event.arguments.newQuantity) {
            return await handleQuantityUpdate(event.arguments);
        }

        console.log('No matching handler found for event:', {
            fieldName: event.fieldName,
            argumentKeys: Object.keys(event.arguments)
        });

        return {
            success: false,
            error: 'Invalid operation'
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const handleNewSubscription = async ({ organizationId, billingPeriod }) => {
    // Get organization details
    const orgResult = await makeGraphQLRequest(getOrganizationQuery, { id: organizationId });
    const organization = orgResult.data.getOrganization;
    
    if (!organization) {
        throw new Error('Organization not found');
    }

    if (!organization.stripeCustomerId) {
        throw new Error('Organization does not have a Stripe customer ID');
    }

    // Set up subscription parameters
    const priceId = billingPeriod === 'MONTHLY' 
        ? process.env.STRIPE_PRICE_ID_MONTHLY 
        : process.env.STRIPE_PRICE_ID_YEARLY;

    // Create subscription
    const subscription = await stripe.subscriptions.create({
        customer: organization.stripeCustomerId,
        items: [{
            price: priceId,
            quantity: organization.activeUserCount || 1
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
    });

    // Store subscription IDs
    await makeGraphQLRequest(updateOrganizationMutation, {
        input: {
            id: organizationId,
            stripeSubscriptionId: subscription.id,
            stripeSubscriptionItemId: subscription.items.data[0].id,
            subscriptionStatus: 'PENDING',
            billingPeriod: billingPeriod,
            _version: organization._version
        }
    });

    return {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
    };
};

const handleQuantityUpdate = async ({ organizationId, newQuantity }) => {
    // Get organization details
    const orgResult = await makeGraphQLRequest(getOrganizationQuery, { id: organizationId });
    const organization = orgResult.data.getOrganization;
    
    if (!organization) {
        throw new Error('Organization not found');
    }

    if (!organization.stripeCustomerId) {
        throw new Error('Organization does not have a Stripe customer ID');
    }

    try {
        let subscription;
        
        // If no subscription exists, create a new one with the current billing period or default to monthly
        if (!organization.stripeSubscriptionId) {
            const billingPeriod = organization.billingPeriod || 'MONTHLY';
            const priceId = billingPeriod === 'MONTHLY' 
                ? process.env.STRIPE_PRICE_ID_MONTHLY 
                : process.env.STRIPE_PRICE_ID_YEARLY;
            
            // Create new subscription
            subscription = await stripe.subscriptions.create({
                customer: organization.stripeCustomerId,
                items: [{
                    price: priceId,
                    quantity: newQuantity
                }],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent']
            });

            // Update organization with subscription details
            await makeGraphQLRequest(updateOrganizationMutation, {
                input: {
                    id: organizationId,
                    stripeSubscriptionId: subscription.id,
                    stripeSubscriptionItemId: subscription.items.data[0].id,
                    subscriptionStatus: 'INCOMPLETE',
                    billingPeriod: billingPeriod,
                    purchasedLicenses: newQuantity,
                    _version: organization._version
                }
            });
        } else {
            // Update existing subscription
            subscription = await stripe.subscriptions.update(
                organization.stripeSubscriptionId,
                {
                    items: [{
                        id: organization.stripeSubscriptionItemId,
                        quantity: newQuantity
                    }],
                    proration_behavior: 'always_invoice',
                    payment_behavior: 'default_incomplete',
                    expand: ['latest_invoice.payment_intent']
                }
            );

            // Update organization with new quantity - subscription status will be updated by webhook
            await makeGraphQLRequest(updateOrganizationMutation, {
                input: {
                    id: organizationId,
                    subscriptionStatus: 'INCOMPLETE',
                    _version: organization._version
                }
            });
        }

        // Return the client secret and proration details
        return {
            success: true,
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
            proratedAmount: subscription.latest_invoice.amount_due / 100,
            nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString()
        };
    } catch (error) {
        console.error('Error handling quantity update:', error);
        throw error;
    }
};

const handleLicensePurchase = async ({ organizationId, quantity, billingPeriod }) => {
    try {
        console.log('Handling license purchase:', { 
            organizationId, 
            quantity, 
            quantityType: typeof quantity,
            billingPeriod 
        });
        
        // Ensure quantity is an integer
        const licenseQuantity = parseInt(quantity);
        if (isNaN(licenseQuantity) || licenseQuantity < 1) {
            throw new Error(`Invalid quantity: ${quantity}`);
        }
        
        console.log('Parsed license quantity:', licenseQuantity);
        
        // Get organization details
        const orgResult = await makeGraphQLRequest(getOrganizationQuery, { id: organizationId });
        const organization = orgResult.data.getOrganization;
        
        if (!organization) {
            throw new Error('Organization not found');
        }

        if (!organization.stripeCustomerId) {
            throw new Error('Organization does not have a Stripe customer ID');
        }

        // Determine billing period - use existing subscription's period if organization has active subscription
        let effectiveBillingPeriod = billingPeriod;
        if (organization.subscriptionStatus === 'ACTIVE' && organization.billingPeriod) {
            // Normalize billing period to handle old format (MONTH/YEAR) and new format (MONTHLY/YEARLY)
            const normalizedOrgPeriod = organization.billingPeriod === 'MONTH' ? 'MONTHLY' : 
                                        organization.billingPeriod === 'YEAR' ? 'YEARLY' : 
                                        organization.billingPeriod;
            effectiveBillingPeriod = normalizedOrgPeriod;
            console.log('Using existing subscription billing period:', effectiveBillingPeriod, 
                       'from org period:', organization.billingPeriod, 
                       'instead of requested:', billingPeriod);
        }
        
        // Set up pricing
        const priceId = (effectiveBillingPeriod === 'MONTHLY' || effectiveBillingPeriod === 'MONTH')
            ? process.env.STRIPE_PRICE_ID_MONTHLY 
            : process.env.STRIPE_PRICE_ID_YEARLY;

        let subscription;
        
        // Check if organization has an existing active subscription
        if (organization.subscriptionStatus === 'ACTIVE' && organization.stripeSubscriptionId) {
            console.log('Organization has existing subscription, updating quantity...');
            
            // Get the existing subscription
            const existingSubscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId);
            const currentQuantity = existingSubscription.items.data[0].quantity;
            const newQuantity = currentQuantity + licenseQuantity;
            
            console.log('Updating subscription quantity:', {
                existingQuantity: currentQuantity,
                adding: licenseQuantity,
                newTotal: newQuantity
            });
            
            // Update existing subscription quantity
            subscription = await stripe.subscriptions.update(organization.stripeSubscriptionId, {
                items: [{
                    id: existingSubscription.items.data[0].id,
                    quantity: newQuantity
                }],
                proration_behavior: 'create_prorations',
                expand: ['latest_invoice.payment_intent'],
                metadata: {
                    ...existingSubscription.metadata,
                    type: 'license_addition',
                    additional_licenses: licenseQuantity,
                    organization_id: organizationId
                }
            });
        } else {
            console.log('Creating new subscription with quantity:', licenseQuantity);
            
            // Create new subscription for first-time purchase
            subscription = await stripe.subscriptions.create({
                customer: organization.stripeCustomerId,
                items: [{
                    price: priceId,
                    quantity: licenseQuantity
                }],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent'],
                cancel_at_period_end: false,
                metadata: {
                    type: 'license_purchase',
                    additional_licenses: licenseQuantity,
                    organization_id: organizationId
                }
            });
        }

        console.log('Subscription operation completed:', {
            subscriptionId: subscription.id,
            actualQuantity: subscription.items.data[0].quantity,
            operation: organization.subscriptionStatus === 'ACTIVE' ? 'updated_existing' : 'created_new',
            requestedQuantity: licenseQuantity
        });

        // Calculate total amount
        const pricePerUser = billingPeriod === 'MONTHLY' ? 2.98 : 32.00;
        const totalAmount = pricePerUser * licenseQuantity;

        // Check if payment needs confirmation or was already processed
        const invoice = subscription.latest_invoice;
        const isUpdateWithExistingPayment = organization.subscriptionStatus === 'ACTIVE' && 
                                           invoice.status === 'paid';
        
        console.log('Invoice status:', {
            invoiceId: invoice.id,
            status: invoice.status,
            paymentIntentStatus: invoice.payment_intent?.status,
            isUpdateWithExistingPayment
        });

        const result = {
            success: true,
            clientSecret: !isUpdateWithExistingPayment && invoice.payment_intent ? 
                         invoice.payment_intent.client_secret : null,
            licensesPurchased: licenseQuantity,
            totalAmount: totalAmount,
            subscriptionId: subscription.id,
            paymentProcessed: isUpdateWithExistingPayment
        };
        
        console.log('Returning license purchase result:', result);
        return result;

    } catch (error) {
        console.error('Error handling license purchase:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
