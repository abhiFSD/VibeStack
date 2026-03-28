/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT
	API_LFAPI_GRAPHQLAPIIDOUTPUT
	API_LFAPI_GRAPHQLAPIKEYOUTPUT
Amplify Params - DO NOT EDIT */

const https = require('https');
const url = require('url');
const AWS = require('aws-sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Use environment variables (no hardcoded fallbacks for security)
const GRAPHQL_ENDPOINT = process.env.API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT;
const API_KEY = process.env.API_LFAPI_GRAPHQLAPIKEYOUTPUT;

// GraphQL query
const getOrganizationQuery = /* GraphQL */ `
  query GetOrganization($id: ID!) {
    getOrganization(id: $id) {
      id
      name
      owner
      contactEmail
      stripeCustomerId
      _version
    }
  }
`;

const updateOrganizationMutation = /* GraphQL */ `
  mutation UpdateOrganization($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      stripeCustomerId
      subscriptionStatus
    }
  }
`;

// Helper function to make GraphQL requests
const makeGraphQLRequest = async (query, variables) => {
    // Parse the URL
    const parsedUrl = new url.URL(GRAPHQL_ENDPOINT);

    // For debugging
    console.log('GraphQL Request:', {
        host: parsedUrl.host,
        path: parsedUrl.pathname,
        query,
        variables
    });

    return new Promise((resolve, reject) => {
        // Prepare the request body
        const requestBody = JSON.stringify({
            query: query,
            variables: variables
        });

        // Prepare the HTTP request options
        const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
                'x-api-key': API_KEY
            }
        };

        console.log('Request options:', {
            hostname: options.hostname,
            path: options.path,
            method: options.method,
            headers: {
                ...options.headers,
                'x-api-key': '***' // Hide the actual API key in logs
            }
        });

        // Make the HTTP request
        const request = https.request(options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                // For debugging
                console.log('GraphQL Response Status:', response.statusCode);
                console.log('GraphQL Response Headers:', response.headers);
                console.log('GraphQL Response Body:', data);

                try {
                    const parsedData = JSON.parse(data);
                    if (parsedData.errors) {
                        console.error('GraphQL Errors:', parsedData.errors);
                        reject(new Error(parsedData.errors[0].message));
                    } else {
                        resolve(parsedData);
                    }
                } catch (error) {
                    console.error('Error parsing response:', error);
                    reject(error);
                }
            });
        });

        request.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        // Write the request body and end the request
        request.write(requestBody);
        request.end();
    });
};

// Example test event for Lambda console
const testEvent = {
  "arguments": {
    "organization": "2fb1b7a3-103c-40e0-be5b-f13e2d8febb4"  // Replace with your organization ID
  }
};

console.log('Example test event:', JSON.stringify(testEvent, null, 2));

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
    console.log(`EVENT: ${JSON.stringify(event)}`);
    console.log('Environment variables:', {
        REGION: process.env.REGION,
        GRAPHQL_ENDPOINT: GRAPHQL_ENDPOINT,
        HAS_API_KEY: !!API_KEY
    });

    try {
        const { organization } = event.arguments;
        console.log(`Organization ID: ${organization}`);
        
        if (!organization) {
            throw new Error('Organization ID is required');
        }

        // Get organization using GraphQL API
        const orgResult = await makeGraphQLRequest(getOrganizationQuery, { id: organization });
        console.log('Organization query result:', JSON.stringify(orgResult));

        if (!orgResult.data?.getOrganization) {
            throw new Error('Organization not found');
        }

        const organizationData = orgResult.data.getOrganization;

        // Check if organization already has a Stripe customer ID
        if (organizationData.stripeCustomerId) {
            return {
                success: true,
                customerId: organizationData.stripeCustomerId,
                error: null
            };
        }

        // Create a new customer in Stripe
        console.log('Creating Stripe customer for:', organizationData.name);
        const customer = await stripe.customers.create({
            email: organizationData.contactEmail || organizationData.owner,
            name: organizationData.name,
            metadata: {
                organizationId: organizationData.id
            }
        });
        console.log('Stripe customer created:', customer.id);

        // Update organization with Stripe customer ID using GraphQL API
        const updateResult = await makeGraphQLRequest(updateOrganizationMutation, {
            input: {
                id: organization,
                stripeCustomerId: customer.id,
                subscriptionStatus: 'NONE',
                _version: organizationData._version
            }
        });
        console.log('Update mutation result:', JSON.stringify(updateResult));

        return {
            success: true,
            customerId: customer.id,
            error: null
        };

    } catch (error) {
        console.error('Error details:', error);
        console.error('Stack trace:', error.stack);
        return {
            success: false,
            customerId: null,
            error: error.message
        };
    }
};
