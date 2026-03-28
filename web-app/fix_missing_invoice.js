// Fix missing invoice record in database
const https = require('https');
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY_HERE');

// Configuration
const GRAPHQL_ENDPOINT = 'https://ah2gzx5zdrel3csp6obhtctgtu.appsync-api.us-west-2.amazonaws.com/graphql';
const API_KEY = 'YOUR_GRAPHQL_API_KEY_HERE';

// Helper function to make GraphQL requests
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

const createSubscriptionInvoiceMutation = /* GraphQL */ `
  mutation CreateSubscriptionInvoice($input: CreateSubscriptionInvoiceInput!) {
    createSubscriptionInvoice(input: $input) {
      id
      stripeInvoiceId
      organizationId
      amount
      status
    }
  }
`;

async function fixMissingInvoice() {
    console.log('🔧 Fixing Missing Invoice Record');
    console.log('='.repeat(50));
    
    try {
        const orgId = '19321a09-d898-4a7a-82fe-593d18973e79';
        const invoiceId = 'in_1S94KFBrkA8Ed3JI5bQrDNl1';
        
        // Get invoice details from Stripe
        console.log('1️⃣ Getting invoice details from Stripe...');
        const invoice = await stripe.invoices.retrieve(invoiceId);
        
        console.log('Invoice Details:');
        console.log('  ID:', invoice.id);
        console.log('  Amount:', '$' + (invoice.amount_paid / 100));
        console.log('  Status:', invoice.status);
        console.log('  Customer:', invoice.customer);
        console.log('  Subscription:', invoice.subscription);
        
        // Get subscription details for billing period
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const billingPeriod = subscription.items.data[0].price.recurring.interval.toUpperCase();
        
        console.log('  Billing Period:', billingPeriod);
        
        // Create the missing invoice record
        console.log('\\n2️⃣ Creating missing invoice record in database...');
        
        const invoiceInput = {
            organizationId: orgId,
            stripeInvoiceId: invoice.id,
            amount: invoice.amount_paid / 100, // Convert to dollars
            status: 'PAID',
            billingPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
            billingPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            userCount: subscription.quantity || 1,
            pricePerUser: (invoice.amount_paid / 100) / (subscription.quantity || 1),
            billingPeriod: billingPeriod,
            hostedInvoiceUrl: invoice.hosted_invoice_url || '',
            invoicePdfUrl: invoice.invoice_pdf || '',
            paidAt: new Date(invoice.status_transitions.paid_at * 1000).toISOString()
        };
        
        console.log('Creating invoice with data:', {
            organizationId: invoiceInput.organizationId,
            stripeInvoiceId: invoiceInput.stripeInvoiceId,
            amount: '$' + (invoiceInput.amount / 100),
            userCount: invoiceInput.userCount,
            billingPeriod: invoiceInput.billingPeriod
        });
        
        const result = await makeGraphQLRequest(createSubscriptionInvoiceMutation, {
            input: invoiceInput
        });
        
        if (result.data && result.data.createSubscriptionInvoice) {
            console.log('\\n✅ Invoice record created successfully!');
            console.log('Database ID:', result.data.createSubscriptionInvoice.id);
            console.log('\\n🎯 Transaction history should now be visible in the UI');
        } else if (result.errors) {
            console.log('❌ Failed to create invoice:');
            result.errors.forEach(error => {
                console.log('  Error:', error.message);
            });
        }
        
    } catch (error) {
        console.error('❌ Error fixing invoice:', error.message);
        
        if (error.message.includes('duplicate')) {
            console.log('ℹ️  Invoice record might already exist');
        }
    }
}

// Run the fix
fixMissingInvoice();