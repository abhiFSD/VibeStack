const stripe = require('stripe')(process.env.REACT_APP_STRIPE_SECRET_KEY || 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE');

async function testInvoiceHistoryFix() {
    console.log('🧪 Testing Invoice History Fix for License Additions');
    
    try {
        // Find an existing subscription to test with
        const customers = await stripe.customers.list({ limit: 10 });
        let testCustomer = null;
        let testSubscription = null;
        
        for (const customer of customers.data) {
            if (customer.metadata?.organizationId) {
                const subscriptions = await stripe.subscriptions.list({
                    customer: customer.id,
                    status: 'active',
                    limit: 1
                });
                
                if (subscriptions.data.length > 0) {
                    testCustomer = customer;
                    testSubscription = subscriptions.data[0];
                    break;
                }
            }
        }
        
        if (!testCustomer || !testSubscription) {
            console.log('❌ No suitable test subscription found');
            return;
        }
        
        console.log('📋 Test Setup:', {
            customerId: testCustomer.id,
            subscriptionId: testSubscription.id,
            currentQuantity: testSubscription.items.data[0].quantity,
            organizationId: testCustomer.metadata.organizationId
        });
        
        // Record the time before the update for webhook filtering
        const testStartTime = Math.floor(Date.now() / 1000);
        
        // Add 2 licenses to the subscription
        console.log('🔄 Adding 2 licenses to subscription...');
        
        const updatedSubscription = await stripe.subscriptions.update(testSubscription.id, {
            items: [{
                id: testSubscription.items.data[0].id,
                quantity: testSubscription.items.data[0].quantity + 2
            }],
            metadata: {
                ...testSubscription.metadata,
                additional_licenses: '2',
                license_addition: 'true'
            },
            proration_behavior: 'create_prorations'
        });
        
        console.log('✅ Subscription updated successfully');
        console.log('📊 Updated subscription details:', {
            id: updatedSubscription.id,
            oldQuantity: testSubscription.items.data[0].quantity,
            newQuantity: updatedSubscription.items.data[0].quantity,
            metadata: updatedSubscription.metadata
        });
        
        // Wait for webhook processing
        console.log('⏳ Waiting 10 seconds for webhook processing...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check recent webhook events for our subscription
        console.log('🔍 Checking webhook events for our test...');
        const events = await stripe.events.list({
            limit: 20,
            created: {
                gte: testStartTime
            }
        });
        
        let subscriptionUpdatedFound = false;
        let invoiceEventsFound = [];
        
        events.data.forEach(event => {
            if (event.data.object.subscription === testSubscription.id || 
                event.data.object.id === testSubscription.id) {
                console.log(`  📝 ${event.type} (${event.id})`);
                console.log(`      Created: ${new Date(event.created * 1000).toISOString()}`);
                
                if (event.type === 'customer.subscription.updated') {
                    subscriptionUpdatedFound = true;
                    console.log(`      ✨ Subscription updated event found!`);
                    console.log(`      📄 Metadata: ${JSON.stringify(event.data.object.metadata)}`);
                } else if (event.type.startsWith('invoice.')) {
                    invoiceEventsFound.push(event.type);
                    console.log(`      💰 Invoice event: ${event.data.object.billing_reason}`);
                }
            }
        });
        
        console.log('\n📈 Test Results:');
        console.log(`  • Subscription updated event found: ${subscriptionUpdatedFound ? '✅' : '❌'}`);
        console.log(`  • Invoice events found: ${invoiceEventsFound.length > 0 ? '✅ ' + invoiceEventsFound.join(', ') : '❌ None'}`);
        
        if (subscriptionUpdatedFound && invoiceEventsFound.length === 0) {
            console.log('\n🎯 This confirms the issue: Only customer.subscription.updated events are sent for license additions');
            console.log('   Our webhook fix should create synthetic invoice history records');
        }
        
        // Check if any proration invoices were created
        console.log('\n🔍 Checking for proration invoices...');
        const invoices = await stripe.invoices.list({
            customer: testCustomer.id,
            limit: 5,
            created: {
                gte: testStartTime
            }
        });
        
        if (invoices.data.length > 0) {
            console.log('📄 Recent invoices found:');
            invoices.data.forEach(invoice => {
                console.log(`  - ${invoice.id}: ${invoice.billing_reason} - $${invoice.amount_due/100} - ${invoice.status}`);
            });
        } else {
            console.log('📄 No new invoices found - this confirms license additions don\'t create invoice events');
        }
        
    } catch (error) {
        console.error('❌ Error in test:', error);
    }
}

testInvoiceHistoryFix();