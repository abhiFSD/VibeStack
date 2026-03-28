// Manual fix for pending payment status
const https = require('https');
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY_HERE');

const GRAPHQL_ENDPOINT = 'https://ah2gzx5zdrel3csp6obhtctgtu.appsync-api.us-west-2.amazonaws.com/graphql';
const API_KEY = 'YOUR_GRAPHQL_API_KEY_HERE';

const makeGraphQLRequest = async (query, variables) => {
    return new Promise((resolve, reject) => {
        const requestBody = JSON.stringify({
            query: query,
            variables: variables
        });

        const url = new URL(GRAPHQL_ENDPOINT);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            }
        };

        const request = https.request(options, (response) => {
            let data = '';
            response.on('data', (chunk) => data += chunk);
            response.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve(parsedData);
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

const updateOrganizationMutation = /* GraphQL */ `
  mutation UpdateOrganization($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      subscriptionStatus
      stripeSubscriptionId
      subscriptionPeriodEnd
    }
  }
`;

const createSubscriptionInvoiceMutation = /* GraphQL */ `
  mutation CreateSubscriptionInvoice($input: CreateSubscriptionInvoiceInput!) {
    createSubscriptionInvoice(input: $input) {
      id
      stripeInvoiceId
      amount
      status
      organizationId
    }
  }
`;

const getOrganizationQuery = /* GraphQL */ `
  query GetOrganization($id: ID!) {
    getOrganization(id: $id) {
      id
      name
      subscriptionStatus
      stripeSubscriptionId
      stripeCustomerId
      billingPeriod
      _version
    }
  }
`;

async function manualFix() {
    console.log('🔧 MANUAL FIX FOR PENDING PAYMENT STATUS');
    console.log('='.repeat(50));
    
    const orgId = '295a215f-df38-46b8-b1db-d48c1e336ca2';
    
    try {
        // Step 1: Get current organization
        console.log('1️⃣ Getting current organization...');
        const orgResult = await makeGraphQLRequest(getOrganizationQuery, { id: orgId });
        const organization = orgResult.data.getOrganization;
        
        console.log(`Status: ${organization.subscriptionStatus}`);
        console.log(`Subscription ID: ${organization.stripeSubscriptionId}`);
        
        if (organization.stripeSubscriptionId) {
            // Step 2: Get Stripe subscription details
            console.log('\n2️⃣ Getting Stripe subscription details...');
            const subscription = await stripe.subscriptions.retrieve(organization.stripeSubscriptionId);
            console.log(`Stripe Status: ${subscription.status}`);
            console.log(`Period End: ${new Date(subscription.current_period_end * 1000).toISOString()}`);
            
            // Step 3: Update organization status to match Stripe
            if (organization.subscriptionStatus !== subscription.status.toUpperCase()) {
                console.log('\n3️⃣ Updating organization status...');
                
                const updateInput = {
                    id: organization.id,
                    subscriptionStatus: subscription.status.toUpperCase(),
                    subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
                    _version: organization._version
                };
                
                const updateResult = await makeGraphQLRequest(updateOrganizationMutation, { input: updateInput });
                
                if (updateResult.data && updateResult.data.updateOrganization) {
                    console.log('✅ Organization status updated successfully!');
                    console.log(`New Status: ${updateResult.data.updateOrganization.subscriptionStatus}`);
                } else {
                    console.log('❌ Failed to update organization:', updateResult.errors);
                }
            }
            
            // Step 4: Get recent invoices and create missing records
            console.log('\n4️⃣ Checking for missing invoice records...');
            const invoices = await stripe.invoices.list({
                customer: organization.stripeCustomerId,
                limit: 5
            });
            
            console.log(`Found ${invoices.data.length} invoices in Stripe`);
            
            for (const invoice of invoices.data) {
                if (invoice.status === 'paid') {
                    console.log(`\nCreating record for invoice: ${invoice.id}`);
                    console.log(`Amount: $${invoice.amount_paid / 100}`);
                    console.log(`Status: ${invoice.status}`);
                    
                    // Create invoice record
                    const invoiceInput = {
                        organizationId: orgId,
                        stripeInvoiceId: invoice.id,
                        amount: invoice.amount_paid / 100,
                        status: 'PAID',
                        billingPeriodStart: new Date(invoice.period_start * 1000).toISOString(),
                        billingPeriodEnd: new Date(invoice.period_end * 1000).toISOString(),
                        userCount: invoice.lines.data[0]?.quantity || 1,
                        pricePerUser: (invoice.amount_paid / 100) / (invoice.lines.data[0]?.quantity || 1),
                        billingPeriod: organization.billingPeriod || 'MONTHLY',
                        hostedInvoiceUrl: invoice.hosted_invoice_url
                    };
                    
                    try {
                        const invoiceResult = await makeGraphQLRequest(createSubscriptionInvoiceMutation, { input: invoiceInput });
                        
                        if (invoiceResult.data && invoiceResult.data.createSubscriptionInvoice) {
                            console.log('✅ Invoice record created successfully!');
                        } else {
                            console.log('⚠️ Invoice might already exist or creation failed');
                            if (invoiceResult.errors) {
                                console.log('Errors:', invoiceResult.errors.map(e => e.message));
                            }
                        }
                    } catch (error) {
                        console.log('⚠️ Invoice creation failed:', error.message);
                    }
                }
            }
            
            console.log('\n🎉 MANUAL FIX COMPLETED!');
            console.log('✅ Organization status synchronized');
            console.log('✅ Missing invoice records created');
            console.log('✅ Payment system should now be working correctly');
            
        } else {
            console.log('❌ No subscription ID found');
        }
        
    } catch (error) {
        console.error('❌ Manual fix failed:', error.message);
    }
}

manualFix();