const stripe = require('stripe')(process.env.REACT_APP_STRIPE_SECRET_KEY || 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE');

async function checkSubscriptionEvents() {
    console.log('🔍 Checking recent subscription events...');
    
    try {
        // Get the most recent events
        const events = await stripe.events.list({
            limit: 20,
            types: [
                'invoice.created',
                'invoice.paid',
                'invoice.payment_succeeded',
                'invoice.payment_failed',
                'customer.subscription.updated',
                'customer.subscription.created'
            ]
        });
        
        console.log('📝 Last 20 relevant webhook events:');
        
        for (const event of events.data) {
            const obj = event.data.object;
            console.log(`\n🔔 ${event.type} (${event.id})`);
            console.log(`   Created: ${new Date(event.created * 1000).toISOString()}`);
            
            if (event.type.startsWith('invoice.')) {
                console.log(`   Invoice ID: ${obj.id}`);
                console.log(`   Billing Reason: ${obj.billing_reason}`);
                console.log(`   Amount: $${(obj.amount_due || obj.amount_paid || 0) / 100}`);
                console.log(`   Status: ${obj.status}`);
                console.log(`   Subscription: ${obj.subscription}`);
                console.log(`   Customer: ${obj.customer}`);
                
                if (obj.lines && obj.lines.data) {
                    console.log(`   Line Items:`);
                    obj.lines.data.forEach((line, idx) => {
                        console.log(`     ${idx + 1}. ${line.description || 'No description'}`);
                        console.log(`        Amount: $${line.amount / 100}`);
                        console.log(`        Type: ${line.type}`);
                        console.log(`        Proration: ${line.proration || false}`);
                    });
                }
            } else if (event.type.startsWith('customer.subscription.')) {
                console.log(`   Subscription ID: ${obj.id}`);
                console.log(`   Status: ${obj.status}`);
                console.log(`   Customer: ${obj.customer}`);
                console.log(`   Quantity: ${obj.items?.data?.[0]?.quantity || 'N/A'}`);
                console.log(`   Metadata: ${JSON.stringify(obj.metadata || {})}`);
                
                // Check if this looks like a license addition
                if (obj.metadata?.additional_licenses || obj.metadata?.license_addition) {
                    console.log(`   🎯 This appears to be a license addition!`);
                }
            }
        }
        
        // Now specifically look for proration invoices
        console.log('\n\n🔍 Looking for recent proration invoices...');
        const invoices = await stripe.invoices.list({
            limit: 10
        });
        
        for (const invoice of invoices.data) {
            if (invoice.billing_reason === 'subscription_update') {
                console.log(`\n📄 Proration Invoice: ${invoice.id}`);
                console.log(`   Amount: $${invoice.amount_due / 100}`);
                console.log(`   Status: ${invoice.status}`);
                console.log(`   Subscription: ${invoice.subscription}`);
                console.log(`   Created: ${new Date(invoice.created * 1000).toISOString()}`);
                
                if (invoice.lines && invoice.lines.data) {
                    console.log(`   Line Items:`);
                    invoice.lines.data.forEach((line, idx) => {
                        console.log(`     ${idx + 1}. ${line.description || 'No description'}`);
                        console.log(`        Amount: $${line.amount / 100}`);
                        console.log(`        Type: ${line.type}`);
                        console.log(`        Proration: ${line.proration || false}`);
                    });
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking events:', error);
    }
}

checkSubscriptionEvents();