/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	STRIPE_SECRET_KEY
	API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT
	API_LFAPI_GRAPHQLAPIKEYOUTPUT
Amplify Params - DO NOT EDIT */

const https = require('https');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// GraphQL queries for direct API calls
const getOrganizationQuery = /* GraphQL */ `
	query GetOrganization($id: ID!) {
		getOrganization(id: $id) {
			id
			name
			stripeCustomerId
			stripeSubscriptionId
			subscriptionStatus
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
			purchasedLicenses
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

exports.handler = async (event) => {
	const headers = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Content-Type',
		'Access-Control-Allow-Methods': 'OPTIONS,POST'
	};

	// Handle preflight OPTIONS request
	if (event.httpMethod === 'OPTIONS') {
		return {
			statusCode: 200,
			headers,
			body: ''
		};
	}

	try {
		console.log('Cancel subscription request:', JSON.stringify(event, null, 2));
		
		// Parse request body
		const requestBody = JSON.parse(event.body || '{}');
		const { organizationId } = requestBody;
		
		if (!organizationId) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({
					success: false,
					error: 'Organization ID is required'
				})
			};
		}

		// Get organization details
		const orgResult = await makeGraphQLRequest(getOrganizationQuery, { 
			id: organizationId 
		});
		const organization = orgResult.data.getOrganization;

		if (!organization) {
			return {
				statusCode: 404,
				headers,
				body: JSON.stringify({
					success: false,
					error: 'Organization not found'
				})
			};
		}

		console.log('Found organization:', organization.id, 'with subscription:', organization.stripeSubscriptionId);

		if (!organization.stripeSubscriptionId) {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({
					success: false,
					error: 'No active subscription found for this organization'
				})
			};
		}

		if (organization.subscriptionStatus === 'CANCELED') {
			return {
				statusCode: 400,
				headers,
				body: JSON.stringify({
					success: false,
					error: 'Subscription is already canceled'
				})
			};
		}

		// Cancel the subscription immediately in Stripe
		console.log('Canceling Stripe subscription:', organization.stripeSubscriptionId);
		const canceledSubscription = await stripe.subscriptions.cancel(organization.stripeSubscriptionId);
		
		console.log('Stripe subscription canceled:', canceledSubscription.id, 'status:', canceledSubscription.status);

		// Update organization in database
		const updateInput = {
			id: organization.id,
			subscriptionStatus: 'CANCELED',
			stripeSubscriptionId: null, // Clear the subscription ID
			purchasedLicenses: 0, // Remove all licenses
			_version: organization._version
		};

		console.log('Updating organization with:', updateInput);
		await makeGraphQLRequest(updateOrganizationMutation, { input: updateInput });

		return {
			statusCode: 200,
			headers,
			body: JSON.stringify({
				success: true,
				message: 'Subscription canceled successfully. All licenses have been removed.',
				organizationId: organization.id,
				canceledSubscriptionId: canceledSubscription.id
			})
		};

	} catch (error) {
		console.error('Error canceling subscription:', error);
		
		return {
			statusCode: 500,
			headers,
			body: JSON.stringify({
				success: false,
				error: error.message
			})
		};
	}
};