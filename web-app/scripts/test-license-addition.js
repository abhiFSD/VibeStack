const stripe = require('stripe')(process.env.REACT_APP_STRIPE_SECRET_KEY || 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE');

async function testLicenseAddition() {
    console.log('🧪 Testing License Addition Webhook Events');
    
    try {
        // Find a customer with an existing subscription
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
            console.log('❌ No customer with active subscription found. Creating test scenario...');
            
            // Create a test customer
            testCustomer = await stripe.customers.create({
                email: 'test-license@VibeStack.com',
                name: 'Test License Customer',
                metadata: {
                    organizationId: 'test-org-12345'
                }
            });
            
            // Create a test subscription
            testSubscription = await stripe.subscriptions.create({
                customer: testCustomer.id,
                items: [{
                    price: 'price_1S93hEBrkA8Ed3JImDvkaXlo', // Monthly price
                    quantity: 2
                }],
                metadata: {
                    type: 'license_purchase',
                    organizationId: 'test-org-12345'
                }
            });
            
            console.log('✅ Created test customer and subscription');
        }
        
        console.log('📋 Test Setup:', {
            customerId: testCustomer.id,
            subscriptionId: testSubscription.id,
            currentQuantity: testSubscription.items.data[0].quantity,
            organizationId: testCustomer.metadata.organizationId
        });
        
        // Now simulate adding 3 licenses to the existing subscription
        console.log('🔄 Adding 3 licenses to existing subscription...');
        
        const updatedSubscription = await stripe.subscriptions.update(testSubscription.id, {
            items: [{
                id: testSubscription.items.data[0].id,
                quantity: testSubscription.items.data[0].quantity + 3
            }],
            metadata: {
                ...testSubscription.metadata,
                additional_licenses: '3',
                license_addition: 'true'
            },
            proration_behavior: 'create_prorations'
        });
        
        console.log('✅ Subscription updated successfully');
        console.log('📊 Updated subscription:', {
            id: updatedSubscription.id,
            oldQuantity: testSubscription.items.data[0].quantity,
            newQuantity: updatedSubscription.items.data[0].quantity,
            metadata: updatedSubscription.metadata
        });
        
        // Wait a moment for webhooks to process
        console.log('⏳ Waiting 5 seconds for webhook processing...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Check recent webhook events
        console.log('🔍 Checking recent webhook events...');
        const events = await stripe.events.list({
            limit: 10,
            types: [
                'invoice.created',
                'invoice.paid',
                'invoice.payment_succeeded',
                'customer.subscription.updated'
            ]
        });
        
        console.log('📝 Recent webhook events:');
        events.data.forEach(event => {
            console.log(`  - ${event.type} (${event.id})`);
            if (event.data.object.subscription === testSubscription.id) {
                console.log(`    ✨ Related to our test subscription!`);
                console.log(`    📄 billing_reason: ${event.data.object.billing_reason}`);
                console.log(`    💰 amount: ${event.data.object.amount_due || event.data.object.amount_paid || 'N/A'}`);
            }
        });
        
        // Check if any invoices were created
        const invoices = await stripe.invoices.list({
            customer: testCustomer.id,
            limit: 5
        });
        
        console.log('📄 Recent invoices for customer:');
        invoices.data.forEach(invoice => {
            console.log(`  - ${invoice.id}: ${invoice.billing_reason} - $${invoice.amount_due/100} - ${invoice.status}`);
        });
        
    } catch (error) {
        console.error('❌ Error in test:', error);
    }
}

testLicenseAddition();