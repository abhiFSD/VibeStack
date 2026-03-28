/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STRIPE_SECRET_KEY
	STRIPE_WEBHOOK_SECRET
	API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT
	API_LFAPI_GRAPHQLAPIKEYOUTPUT
Amplify Params - DO NOT EDIT */

const https = require('https');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Helper function to convert Stripe interval to our format
const convertStripeBillingPeriod = (interval) => {
	// Stripe returns 'month' or 'year', we need 'MONTHLY' or 'YEARLY'
	if (!interval) return 'MONTHLY';
	return interval.toLowerCase() === 'month' ? 'MONTHLY' : 'YEARLY';
};

// GraphQL queries and mutations
const getOrganizationQuery = /* GraphQL */ `
	query GetOrganization($id: ID!) {
		getOrganization(id: $id) {
			id
			name
			stripeCustomerId
			stripeSubscriptionId
			subscriptionStatus
			subscriptionPeriodEnd
			billingPeriod
			activeUserCount
			purchasedLicenses
			_version
		}
	}
`;

const updateOrganizationMutation = /* GraphQL */ `
	mutation UpdateOrganization($input: UpdateOrganizationInput!) {
		updateOrganization(input: $input) {
			id
			subscriptionStatus
			stripeSubscriptionId
			subscriptionPeriodEnd
			billingPeriod
			purchasedLicenses
			_version
		}
	}
`;

const createSubscriptionInvoiceMutation = /* GraphQL */ `
	mutation CreateSubscriptionInvoice($input: CreateSubscriptionInvoiceInput!) {
		createSubscriptionInvoice(input: $input) {
			id
			organizationId
			stripeInvoiceId
			amount
			status
			billingPeriodStart
			billingPeriodEnd
			userCount
			pricePerUser
			billingPeriod
			hostedInvoiceUrl
		}
	}
`;

const updateSubscriptionInvoiceMutation = /* GraphQL */ `
	mutation UpdateSubscriptionInvoice($input: UpdateSubscriptionInvoiceInput!) {
		updateSubscriptionInvoice(input: $input) {
			id
			status
			_version
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
						console.error('GraphQL errors:', parsedData.errors);
						reject(new Error(`GraphQL Error: ${parsedData.errors[0].message}`));
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

const retrieveSubscriptionWithRetry = async (subscriptionId, retries = 3) => {
	try {
		return await stripe.subscriptions.retrieve(subscriptionId);
	} catch (error) {
		if (retries > 0) {
			await new Promise(resolve => setTimeout(resolve, 1000));
			return retrieveSubscriptionWithRetry(subscriptionId, retries - 1);
		}
		throw error;
	}
};

const handlePaymentIntentSucceeded = async (paymentIntent) => {
	try {
		// Get the invoice first
		const invoice = await stripe.invoices.retrieve(paymentIntent.invoice);
		
		// Then get the subscription from the invoice
		const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
		
		// Get customer from subscription instead of payment intent
		const customer = await stripe.customers.retrieve(subscription.customer);
		
		// Get organization details
		const orgResult = await makeGraphQLRequest(getOrganizationQuery, { 
			id: customer.metadata.organizationId 
		});
		const organization = orgResult.data.getOrganization;

		if (!organization) {
			throw new Error('Organization not found');
		}

		// Update organization subscription status
		const updateInput = {
			id: organization.id,
			subscriptionStatus: 'ACTIVE',
			subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
			billingPeriod: convertStripeBillingPeriod(subscription.items.data[0].price.recurring.interval),
			_version: organization._version
		};

		await makeGraphQLRequest(updateOrganizationMutation, { input: updateInput });

		// Get the correct quantity - use subscription quantity for license purchases
		const actualQuantity = subscription && subscription.items && subscription.items.data && subscription.items.data[0] ? subscription.items.data[0].quantity : 1;
		
		// Create subscription invoice record with more details
		const invoiceInput = {
			organizationId: organization.id,
			stripeInvoiceId: invoice.id,
			amount: invoice.amount_paid / 100,
			status: invoice.status.toUpperCase(),
			billingPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
			billingPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
			userCount: actualQuantity,
			pricePerUser: (invoice.amount_paid / 100) / actualQuantity,
			billingPeriod: convertStripeBillingPeriod(subscription.items.data[0].price.recurring.interval),
			hostedInvoiceUrl: invoice.hosted_invoice_url,
			invoicePdfUrl: invoice.invoice_pdf,
			isProrated: false,
			basePrice: (invoice.amount_paid / 100) / actualQuantity
		};

		// IMPORTANT: Skip all invoice operations here - let handleInvoicePaymentSucceeded handle everything
		// This prevents duplicate invoice records and status updates for the same payment
		console.log('✅ payment_intent.succeeded: Only updating organization subscription status - invoice operations handled by invoice.payment_succeeded');

		if (!invoice.subscription) {
			console.error('No subscription associated with invoice:', invoice.id);
			return;
		}
	} catch (error) {
		console.error('Error handling payment intent succeeded:', error);
		throw error;
	}
};

const handlePaymentIntentFailed = async (paymentIntent) => {
	try {
		const subscription = await stripe.subscriptions.retrieve(paymentIntent.metadata.subscriptionId);
		const customer = await stripe.customers.retrieve(subscription.customer);
		
		const orgResult = await makeGraphQLRequest(getOrganizationQuery, { 
			id: customer.metadata.organizationId 
		});
		const organization = orgResult.data.getOrganization;

		if (!organization) {
			throw new Error('Organization not found');
		}

		// Update organization status to PAST_DUE
		const updateInput = {
			id: organization.id,
			subscriptionStatus: 'PAST_DUE',
			_version: organization._version
		};

		await makeGraphQLRequest(updateOrganizationMutation, { input: updateInput });
	} catch (error) {
		console.error('Error handling payment intent failed:', error);
		throw error;
	}
};

const handleSubscriptionUpdated = async (subscription) => {
	try {
		console.log('Processing subscription.updated event:', subscription.id);
		const customer = await stripe.customers.retrieve(subscription.customer);
		console.log('Customer metadata:', customer.metadata);
		
		const orgResult = await makeGraphQLRequest(getOrganizationQuery, { 
			id: customer.metadata.organizationId 
		});
		const organization = orgResult.data.getOrganization;

		if (!organization) {
			throw new Error(`Organization not found: ${customer.metadata.organizationId}`);
		}

		console.log('Found organization:', organization.id, 'current status:', organization.subscriptionStatus);

		const currentQuantity = subscription && subscription.items && subscription.items.data && subscription.items.data[0] ? subscription.items.data[0].quantity : 1;
		const price = subscription && subscription.items && subscription.items.data && subscription.items.data[0] ? subscription.items.data[0].price : null;
		
		// Check if this is a license addition that won't trigger invoice events
		const isExistingSubscription = organization.stripeSubscriptionId === subscription.id;
		const hasLicenseIncrease = currentQuantity > (organization.purchasedLicenses || 0);
		const isLicenseAddition = isExistingSubscription && hasLicenseIncrease;
		
		console.log('Subscription analysis:', {
			isExistingSubscription,
			hasLicenseIncrease,
			isLicenseAddition,
			currentQuantity,
			orgCurrentLicenses: organization.purchasedLicenses,
			subscriptionId: subscription.id,
			orgSubscriptionId: organization.stripeSubscriptionId
		});
		
		// Update organization details
		const updateInput = {
			id: organization.id,
			subscriptionStatus: subscription.status.toUpperCase(),
			stripeSubscriptionId: subscription.id,
			subscriptionPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
			billingPeriod: price && price.recurring ? convertStripeBillingPeriod(price.recurring.interval) : 'MONTHLY',
			_version: organization._version
		};
		
		// For license additions that don't trigger invoice events, update license count here
		if (isLicenseAddition) {
			updateInput.purchasedLicenses = currentQuantity;
			console.log('📈 LICENSE ADDITION via subscription.updated:', {
				oldCount: organization.purchasedLicenses,
				newCount: currentQuantity,
				added: currentQuantity - organization.purchasedLicenses
			});
			
			// Create invoice history for license addition
			const addedLicenses = currentQuantity - organization.purchasedLicenses;
			const basePrice = price ? price.unit_amount / 100 : 0;
			const prorationAmount = basePrice * addedLicenses;
			
			const invoiceInput = {
				organizationId: organization.id,
				stripeInvoiceId: `license_addition_${subscription.id}_${Date.now()}`,
				amount: prorationAmount,
				status: 'PAID',
				billingPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
				billingPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
				userCount: addedLicenses,
				pricePerUser: basePrice,
				billingPeriod: price && price.recurring ? convertStripeBillingPeriod(price.recurring.interval) : 'MONTHLY',
				hostedInvoiceUrl: '',
				isProrated: true,
				basePrice: basePrice
			};
			
			console.log('Creating invoice history for license addition:', invoiceInput);
			await makeGraphQLRequest(createSubscriptionInvoiceMutation, { input: invoiceInput });
		} else {
			console.log('🔄 Updating subscription metadata only (no license changes)');
		}
		
		console.log('Updating organization with:', updateInput);
		const updateResult = await makeGraphQLRequest(updateOrganizationMutation, { input: updateInput });
		console.log('Organization updated successfully:', updateResult.data.updateOrganization);
		
	} catch (error) {
		console.error('Error handling subscription updated:', error);
		throw error;
	}
};

const handleSubscriptionDeleted = async (subscription) => {
	try {
		const customer = await stripe.customers.retrieve(subscription.customer);
		
		const orgResult = await makeGraphQLRequest(getOrganizationQuery, { 
			id: customer.metadata.organizationId 
		});
		const organization = orgResult.data.getOrganization;

		if (!organization) {
			throw new Error('Organization not found');
		}

		// Update organization status to CANCELED
		const updateInput = {
			id: organization.id,
			subscriptionStatus: 'CANCELED',
			_version: organization._version
		};

		await makeGraphQLRequest(updateOrganizationMutation, { input: updateInput });
	} catch (error) {
		console.error('Error handling subscription deleted:', error);
		throw error;
	}
};

// Add a new handler for invoice events
const handleInvoicePaymentSucceeded = async (invoice) => {
	try {
		// Get the customer and subscription details
		const customer = await stripe.customers.retrieve(invoice.customer);
		const subscription = invoice.subscription ? await stripe.subscriptions.retrieve(invoice.subscription) : null;
		
		// Get organization details
		const orgResult = await makeGraphQLRequest(getOrganizationQuery, { 
			id: customer.metadata.organizationId 
		});
		const organization = orgResult.data.getOrganization;

		if (!organization) {
			throw new Error('Organization not found');
		}

		// Get the current quantity from the subscription
		const subscriptionQuantity = subscription && subscription.items && subscription.items.data && subscription.items.data[0] ? subscription.items.data[0].quantity : 1;
		const lineItem = invoice.lines && invoice.lines.data && invoice.lines.data[0] ? invoice.lines.data[0] : null;
		const isProrated = lineItem ? lineItem.proration : false;

		let purchasedLicenses;
		let pricePerUser;
		let invoiceUserCount;

		console.log('Processing invoice:', {
			invoiceId: invoice.id,
			billingReason: invoice.billing_reason,
			subscriptionQuantity,
			currentOrgLicenses: organization.purchasedLicenses,
			isProrated,
			amountPaid: invoice.amount_paid / 100
		});

		// Debug subscription metadata
		console.log('Subscription metadata:', subscription ? subscription.metadata : 'No subscription');
		console.log('Invoice billing reason:', invoice.billing_reason);
		
		// SIMPLIFIED LICENSE LOGIC:
		// Always use the subscription quantity as the TOTAL license count
		// This handles all cases: new subscriptions, additions, renewals
		purchasedLicenses = subscriptionQuantity;
		
		// Calculate invoice user count based on billing reason
		if (invoice.billing_reason === 'subscription_create') {
			// New subscription - invoice shows initial license purchase
			invoiceUserCount = subscriptionQuantity;
			pricePerUser = (invoice.amount_paid / 100) / subscriptionQuantity;
			console.log('🆕 NEW SUBSCRIPTION:', { 
				totalLicenses: purchasedLicenses,
				invoiceFor: invoiceUserCount,
				amount: invoice.amount_paid / 100
			});
		} else if (invoice.billing_reason === 'subscription_update' || isProrated) {
			// License addition - invoice shows only the added licenses
			const previousLicenseCount = organization.purchasedLicenses || 0;
			invoiceUserCount = subscriptionQuantity - previousLicenseCount;
			pricePerUser = invoiceUserCount > 0 ? (invoice.amount_paid / 100) / invoiceUserCount : 0;
			console.log('➕ LICENSE ADDITION:', { 
				oldTotal: previousLicenseCount,
				newTotal: purchasedLicenses,
				addedLicenses: invoiceUserCount,
				prorationAmount: invoice.amount_paid / 100
			});
		} else if (invoice.billing_reason === 'subscription_cycle') {
			// Renewal - invoice shows all licenses for the period
			invoiceUserCount = subscriptionQuantity;
			pricePerUser = (invoice.amount_paid / 100) / subscriptionQuantity;
			console.log('🔄 SUBSCRIPTION RENEWAL:', { 
				totalLicenses: purchasedLicenses,
				renewalAmount: invoice.amount_paid / 100
			});
		} else {
			// Fallback - treat as standard billing
			invoiceUserCount = subscriptionQuantity;
			pricePerUser = (invoice.amount_paid / 100) / subscriptionQuantity;
			console.log('📋 STANDARD BILLING:', { 
				totalLicenses: purchasedLicenses,
				billingReason: invoice.billing_reason
			});
		}

		console.log('License and price calculation:', {
			isProrated,
			existingLicenses: organization.purchasedLicenses,
			subscriptionQuantity,
			purchasedLicenses,
			pricePerUser,
			totalAmount: invoice.amount_paid / 100
		});

		// Update organization with subscription details
		const updateInput = {
			id: organization.id,
			subscriptionStatus: 'ACTIVE',
			purchasedLicenses: purchasedLicenses,
			stripeSubscriptionId: subscription?.id,
			billingPeriod: convertStripeBillingPeriod(subscription?.items?.data[0]?.price?.recurring?.interval),
			subscriptionPeriodEnd: subscription ? new Date(subscription.current_period_end * 1000).toISOString() : null,
			_version: organization._version
		};

		await makeGraphQLRequest(updateOrganizationMutation, { input: updateInput });

		// Keep subscription active for recurring billing
		// Note: Previously we canceled subscriptions to make them one-time purchases
		// Now we keep them active to enable automatic monthly/yearly renewals
		console.log('Keeping subscription active for recurring billing:', subscription?.id);

		// Check if invoice already exists to prevent duplicates
		const findInvoiceQuery = /* GraphQL */ `
			query FindInvoiceByStripeId($stripeId: String!) {
				listSubscriptionInvoices(filter: { stripeInvoiceId: { eq: $stripeId } }) {
					items {
						id
						status
						_version
					}
				}
			}
		`;

		const existingInvoiceResult = await makeGraphQLRequest(findInvoiceQuery, { stripeId: invoice.id });
		const existingInvoices = existingInvoiceResult.data.listSubscriptionInvoices.items;

		if (existingInvoices.length > 0) {
			// Update existing invoice to PAID
			const existingInvoice = existingInvoices[0];
			const updateInput = {
				id: existingInvoice.id,
				status: 'PAID',
				_version: existingInvoice._version
			};
			
			await makeGraphQLRequest(updateSubscriptionInvoiceMutation, { input: updateInput });
			console.log('Updated existing invoice to PAID status:', existingInvoice.id);
		} else {
			// Create new invoice record - this should be the primary path for license purchases
			const invoiceInput = {
				organizationId: organization.id,
				stripeInvoiceId: invoice.id,
				amount: invoice.amount_paid / 100,
				status: 'PAID',
				billingPeriodStart: subscription ? new Date(subscription.current_period_start * 1000).toISOString() : new Date(invoice.period_start * 1000).toISOString(),
				billingPeriodEnd: subscription ? new Date(subscription.current_period_end * 1000).toISOString() : new Date(invoice.period_end * 1000).toISOString(),
				userCount: invoiceUserCount,
				pricePerUser: pricePerUser,
				billingPeriod: subscription ? convertStripeBillingPeriod(subscription.items.data[0].price.recurring.interval) : 'MONTHLY',
				hostedInvoiceUrl: invoice.hosted_invoice_url || '',
				isProrated: !!isProrated,
				basePrice: subscription ? subscription.items.data[0].price.unit_amount / 100 : pricePerUser
			};

			await makeGraphQLRequest(createSubscriptionInvoiceMutation, { input: invoiceInput });
			console.log('Created new invoice record with PAID status:', invoice.id);
		}
	} catch (error) {
		console.error('Error handling invoice payment succeeded:', error);
		throw error;
	}
};

const handleInvoiceCreated = async (invoice) => {
	try {
		console.log('Processing invoice.created event:', invoice.id);
		const subscription = invoice.subscription ? await stripe.subscriptions.retrieve(invoice.subscription) : null;
		const customer = subscription ? await stripe.customers.retrieve(subscription.customer) : null;
		
		if (!subscription || !customer) {
			console.log('Skipping invoice.created - no subscription or customer found');
			return;
		}
		console.log('Customer metadata:', customer.metadata);
		
		const orgResult = await makeGraphQLRequest(getOrganizationQuery, { id: customer.metadata.organizationId });
		const organization = orgResult.data.getOrganization;

		if (!organization) {
			throw new Error(`Organization not found: ${customer.metadata.organizationId}`);
		}

		const price = subscription && subscription.items && subscription.items.data && subscription.items.data[0] ? subscription.items.data[0].price : null;
		const isProrated = invoice.billing_reason === 'subscription_update';
		const basePrice = price ? price.unit_amount / 100 : 0;
		
		if (!price) {
			console.log('Skipping invoice.created - no price information available');
			return;
		}
		
		// Skip invoice.created for new subscriptions (subscription_create) but allow updates
		const isNewSubscription = invoice.billing_reason === 'subscription_create';
		
		if (isNewSubscription) {
			console.log('Skipping invoice.created for new subscription - will create when payment succeeds');
			return;
		}
		
		console.log('Processing invoice.created for:', {
			billingReason: invoice.billing_reason,
			isProrated,
			subscriptionMetadata: subscription?.metadata
		});

		// For subscription updates (license additions), calculate the actual licenses added
		let userCount;
		let pricePerUser;
		
		if (isProrated && subscription?.metadata?.additional_licenses) {
			// License addition - show the number of licenses added
			userCount = parseInt(subscription.metadata.additional_licenses);
			pricePerUser = (invoice.amount_due / 100) / userCount;
		} else {
			// Regular subscription or renewal - show total quantity
			userCount = subscription && subscription.items && subscription.items.data && subscription.items.data[0] ? subscription.items.data[0].quantity : 1;
			pricePerUser = basePrice || 0;
		}

		const invoiceInput = {
			organizationId: organization.id,
			stripeInvoiceId: invoice.id,
			amount: invoice.amount_due / 100,
			status: 'UNPAID',
			billingPeriodStart: new Date(invoice.period_start * 1000).toISOString(),
			billingPeriodEnd: new Date(invoice.period_end * 1000).toISOString(),
			userCount: userCount,
			pricePerUser: pricePerUser,
			billingPeriod: price && price.recurring ? convertStripeBillingPeriod(price.recurring.interval) : 'MONTHLY',
			hostedInvoiceUrl: invoice.hosted_invoice_url || '',
			isProrated: !!isProrated,
			basePrice: basePrice || 0
		};

		console.log('Creating invoice record with input:', invoiceInput);
		const result = await makeGraphQLRequest(createSubscriptionInvoiceMutation, { input: invoiceInput });
		console.log('Invoice created successfully:', result.data.createSubscriptionInvoice);
	} catch (error) {
		console.error('Error handling invoice created:', error);
		throw error;
	}
};

// Simple handler for invoice.paid that only updates invoice status (no license processing)
const handleInvoicePaid = async (invoice) => {
	try {
		console.log('Processing invoice.paid event (status update only):', invoice.id);
		
		// Check if this is a license purchase - if so, skip processing as it's handled by invoice.payment_succeeded
		const subscription = invoice.subscription ? await stripe.subscriptions.retrieve(invoice.subscription) : null;
		const isLicensePurchase = (
			invoice.billing_reason === 'subscription_create' || 
			(subscription && subscription.metadata?.type === 'license_purchase') ||
			(subscription && subscription.metadata?.additional_licenses)
		);
		
		if (isLicensePurchase) {
			console.log('Skipping invoice.paid for license purchase - already handled by invoice.payment_succeeded');
			return;
		}
		
		// Find existing invoice record
		const findInvoiceQuery = /* GraphQL */ `
			query FindInvoiceByStripeId($stripeId: String!) {
				listSubscriptionInvoices(filter: { stripeInvoiceId: { eq: $stripeId } }) {
					items {
						id
						status
						_version
					}
				}
			}
		`;

		const existingInvoiceResult = await makeGraphQLRequest(findInvoiceQuery, { stripeId: invoice.id });
		const existingInvoices = existingInvoiceResult.data.listSubscriptionInvoices.items;

		if (existingInvoices.length > 0) {
			// Update existing invoice to PAID
			const existingInvoice = existingInvoices[0];
			const updateInput = {
				id: existingInvoice.id,
				status: 'PAID',
				_version: existingInvoice._version
			};
			
			await makeGraphQLRequest(updateSubscriptionInvoiceMutation, { input: updateInput });
			console.log('Updated existing invoice to PAID status (no license processing):', existingInvoice.id);
		} else {
			console.log('No existing invoice found for invoice.paid event:', invoice.id);
		}
	} catch (error) {
		console.error('Error handling invoice paid:', error);
		throw error;
	}
};

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
	try {
		// Log incoming event details for debugging
		console.log('Received webhook event:', {
			httpMethod: event.httpMethod,
			headerKeys: Object.keys(event.headers),
			bodyLength: event.body?.length,
			isBase64Encoded: event.isBase64Encoded,
			headers: event.headers
		});

		// Handle OPTIONS request for CORS
		if (event.httpMethod === 'OPTIONS') {
			return {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type,stripe-signature,Stripe-Signature",
					"Access-Control-Allow-Methods": "POST,OPTIONS"
				},
				body: ''
			};
		}

		// Get the raw body and handle base64 encoding if present
		let rawBody = event.body;
		if (event.isBase64Encoded) {
			rawBody = Buffer.from(event.body, 'base64').toString('utf8');
			console.log('Decoded base64 body');
		}

		// Important: Do not parse or modify the raw body before verification
		console.log('Raw body check:', {
			length: rawBody?.length,
			preview: rawBody?.substring(0, 100),
			type: typeof rawBody
		});

		// Find Stripe signature header (case-insensitive)
		const stripeSignature = 
			event.headers['stripe-signature'] ||
			event.headers['Stripe-Signature'] ||
			Object.entries(event.headers)
				.find(([key]) => key.toLowerCase() === 'stripe-signature')?.[1];

		if (!stripeSignature) {
			console.error('No Stripe signature found in headers:', {
				availableHeaders: Object.keys(event.headers),
				headerValues: event.headers
			});
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type,stripe-signature,Stripe-Signature"
				},
				body: JSON.stringify({ error: 'No Stripe signature found in request headers' })
			};
		}

		// Verify webhook signature with the raw body
		let stripeEvent;
		try {
			stripeEvent = stripe.webhooks.constructEvent(
				rawBody,
				stripeSignature,
				process.env.STRIPE_WEBHOOK_SECRET
			);
			console.log('🔔 WEBHOOK EVENT RECEIVED:', {
				type: stripeEvent.type,
				id: stripeEvent.id,
				objectType: stripeEvent.data?.object?.object,
				subscriptionId: stripeEvent.data?.object?.subscription,
				customerId: stripeEvent.data?.object?.customer,
				billingReason: stripeEvent.data?.object?.billing_reason
			});
		} catch (err) {
			console.error('Webhook signature verification failed:', {
				error: err.message,
				signature: stripeSignature,
				bodyLength: rawBody?.length,
				bodyPreview: rawBody?.substring(0, 100)
			});
			return {
				statusCode: 400,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "Content-Type,stripe-signature,Stripe-Signature"
				},
				body: JSON.stringify({ error: 'Webhook signature verification failed' })
			};
		}

		// Define allowed event types
		const ALLOWED_EVENTS = [
			'payment_intent.succeeded',
			'payment_intent.payment_failed',
			'customer.subscription.updated',
			'customer.subscription.deleted',
			'invoice.payment_succeeded',
			'invoice.created',
			'invoice.paid',
		];

		// Check if event type is allowed
		if (!ALLOWED_EVENTS.includes(stripeEvent.type)) {
			console.log('Ignoring unhandled event type:', stripeEvent.type);
			return {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "*"
				},
				body: JSON.stringify({ received: true, message: 'Event type not handled' })
			};
		}

		// Handle specific events
		try {
			const handlerMap = {
				'payment_intent.succeeded': handlePaymentIntentSucceeded,
				'payment_intent.payment_failed': handlePaymentIntentFailed,
				'customer.subscription.updated': handleSubscriptionUpdated,
				'customer.subscription.deleted': handleSubscriptionDeleted,
				'invoice.payment_succeeded': handleInvoicePaymentSucceeded,
				'invoice.created': handleInvoiceCreated,
				'invoice.paid': handleInvoicePaid,
			};

			const handler = handlerMap[stripeEvent.type];
			await handler(stripeEvent.data.object);

			return {
				statusCode: 200,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "*"
				},
				body: JSON.stringify({ 
					received: true,
					event: stripeEvent.type,
					success: true
				})
			};
		} catch (error) {
			console.error(`Error handling ${stripeEvent.type} event:`, error);
			// Return 500 error so Stripe will retry the webhook
			return {
				statusCode: 500,
				headers: {
					"Access-Control-Allow-Origin": "*",
					"Access-Control-Allow-Headers": "*"
				},
				body: JSON.stringify({ 
					received: true,
					event: stripeEvent.type,
					success: false,
					error: error.message
				})
			};
		}
	} catch (error) {
		console.error('Error processing webhook:', error);
		return {
			statusCode: 500,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "*"
			},
			body: JSON.stringify({ error: error.message })
		};
	}
};

// Helper function to check if string is valid JSON
function isValidJSON(str) {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
}
