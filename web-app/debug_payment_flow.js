// Debug current payment flow and check for issues
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

const updateSubscriptionMutation = /* GraphQL */ `
  mutation UpdateSubscription($organizationId: ID!, $billingPeriod: String!) {
    updateSubscription(organizationId: $organizationId, billingPeriod: $billingPeriod) {
      success
      subscriptionId
      clientSecret
      proratedAmount
      error
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

const listInvoicesQuery = /* GraphQL */ `
  query ListSubscriptionInvoices($filter: ModelSubscriptionInvoiceFilterInput) {
    listSubscriptionInvoices(filter: $filter) {
      items {
        id
        stripeInvoiceId
        amount
        status
        createdAt
        billingPeriod
      }
    }
  }
`;

async function debugPaymentFlow() {
    console.log('🔍 DEBUGGING PAYMENT FLOW');
    console.log('='.repeat(50));
    
    const orgId = '295a215f-df38-46b8-b1db-d48c1e336ca2';
    
    try {
        // Step 1: Check current state
        console.log('1️⃣ Current organization state...');
        const orgResult = await makeGraphQLRequest(getOrganizationQuery, { id: orgId });
        const organization = orgResult.data.getOrganization;
        
        console.log(`Status: ${organization.subscriptionStatus}`);
        console.log(`Billing: ${organization.billingPeriod}`);
        console.log(`Subscription ID: ${organization.stripeSubscriptionId}`);
        console.log('');
        
        // Step 2: Create a new monthly subscription 
        console.log('2️⃣ Creating new monthly subscription...');
        const result = await makeGraphQLRequest(updateSubscriptionMutation, {
            organizationId: orgId,
            billingPeriod: 'MONTHLY'
        });
        
        if (result.data.updateSubscription.success) {
            const clientSecret = result.data.updateSubscription.clientSecret;
            console.log('✅ Subscription created successfully');
            console.log(`Client Secret: ${clientSecret.substring(0, 30)}...`);
            
            // Step 3: Complete the payment
            console.log('\n3️⃣ Processing payment...');
            const paymentIntentId = clientSecret.split('_secret_')[0];
            
            const paymentMethod = await stripe.paymentMethods.create({
                type: 'card',
                card: {
                    number: '4242424242424242',
                    exp_month: 12,
                    exp_year: 2025,
                    cvc: '123'
                }
            });
            
            const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: paymentMethod.id
            });
            
            if (paymentIntent.status === 'succeeded') {
                console.log('✅ Payment successful!');
                console.log(`Payment ID: ${paymentIntent.id}`);
                console.log(`Amount: $${paymentIntent.amount / 100}`);
                
                // Step 4: Wait and check webhook processing
                console.log('\n4️⃣ Waiting for webhook processing...');
                await new Promise(resolve => setTimeout(resolve, 15000)); // Wait 15 seconds
                
                // Step 5: Check updated status
                console.log('\n5️⃣ Checking updated status...');
                const updatedOrgResult = await makeGraphQLRequest(getOrganizationQuery, { id: orgId });
                const updatedOrg = updatedOrgResult.data.getOrganization;
                
                console.log(`Updated Status: ${updatedOrg.subscriptionStatus}`);
                console.log(`Updated Billing: ${updatedOrg.billingPeriod}`);
                
                // Step 6: Check transaction history
                console.log('\n6️⃣ Checking transaction history...');
                const invoicesResult = await makeGraphQLRequest(listInvoicesQuery, {
                    filter: { organizationId: { eq: orgId } }
                });
                
                const invoices = invoicesResult.data.listSubscriptionInvoices.items;
                console.log(`Found ${invoices.length} transaction records`);
                
                if (invoices.length > 0) {
                    const latestInvoice = invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                    console.log(`Latest: ${latestInvoice.stripeInvoiceId} - ${latestInvoice.status} - $${latestInvoice.amount}`);
                }
                
                // Step 7: Check recent Stripe events
                console.log('\n7️⃣ Recent Stripe webhook events...');
                const events = await stripe.events.list({
                    limit: 5,
                    created: {
                        gte: Math.floor(Date.now() / 1000) - 300 // Last 5 minutes
                    }
                });
                
                console.log(`Found ${events.data.length} recent events:`);
                events.data.forEach(event => {
                    console.log(`  ${event.type} - ${new Date(event.created * 1000).toLocaleTimeString()}`);
                });
                
            } else {
                console.log(`❌ Payment failed: ${paymentIntent.status}`);
            }
            
        } else {
            console.log('❌ Subscription creation failed:');
            console.log(result.data.updateSubscription.error);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

debugPaymentFlow();