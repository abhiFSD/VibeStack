// Check webhook endpoint and recent events
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY_HERE');

async function checkWebhookEndpoint() {
    console.log('🔍 WEBHOOK ENDPOINT DIAGNOSTICS');
    console.log('='.repeat(50));
    
    try {
        // Step 1: List webhook endpoints
        console.log('1️⃣ Checking configured webhook endpoints...');
        const endpoints = await stripe.webhookEndpoints.list();
        
        console.log(`Found ${endpoints.data.length} webhook endpoints:`);
        endpoints.data.forEach((endpoint, index) => {
            console.log(`\nEndpoint ${index + 1}:`);
            console.log(`  URL: ${endpoint.url}`);
            console.log(`  Status: ${endpoint.status}`);
            console.log(`  Events: ${endpoint.enabled_events.join(', ')}`);
        });
        
        // Step 2: Check recent events
        console.log('\n2️⃣ Recent webhook events (last 10)...');
        const events = await stripe.events.list({
            limit: 10,
            created: {
                gte: Math.floor(Date.now() / 1000) - 3600 // Last hour
            }
        });
        
        console.log(`Found ${events.data.length} events in the last hour:`);
        events.data.forEach(event => {
            const time = new Date(event.created * 1000).toLocaleTimeString();
            console.log(`  ${time} - ${event.type} (${event.data.object.object})`);
        });
        
        // Step 3: Check specific events we care about
        console.log('\n3️⃣ Checking recent subscription/invoice events...');
        const relevantEvents = await stripe.events.list({
            limit: 20,
            types: [
                'customer.subscription.updated',
                'invoice.created', 
                'invoice.payment_succeeded',
                'invoice.paid'
            ]
        });
        
        console.log(`Found ${relevantEvents.data.length} relevant events:`);
        relevantEvents.data.slice(0, 5).forEach(event => {
            const time = new Date(event.created * 1000).toLocaleString();
            console.log(`  ${time} - ${event.type}`);
            if (event.data.object.subscription) {
                console.log(`    Subscription: ${event.data.object.subscription}`);
            }
            if (event.data.object.status) {
                console.log(`    Status: ${event.data.object.status}`);
            }
            console.log('');
        });
        
        // Step 4: Check webhook endpoint deliveries (if possible)
        if (endpoints.data.length > 0) {
            console.log('4️⃣ Webhook endpoint delivery status...');
            const endpoint = endpoints.data[0];
            
            // Note: Webhook endpoint events are not directly accessible via API
            // But we can check if events are being sent
            console.log(`Primary endpoint: ${endpoint.url}`);
            console.log(`Status: ${endpoint.status}`);
            console.log('Note: Check Stripe dashboard for delivery details');
        }
        
    } catch (error) {
        console.error('❌ Check failed:', error.message);
    }
}

checkWebhookEndpoint();