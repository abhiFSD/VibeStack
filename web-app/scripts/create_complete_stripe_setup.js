// Script to create complete Stripe setup (products + prices) in test mode
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY_HERE');

async function createCompleteSetup() {
    console.log('🚀 Creating Complete Stripe Setup in TEST MODE...');
    console.log('='.repeat(50));
    
    try {
        // Create monthly product
        console.log('1. Creating monthly product...');
        const monthlyProduct = await stripe.products.create({
            name: 'VibeStack Pro Monthly',
            description: 'VibeStack Pro subscription - monthly billing per user',
            type: 'service'
        });
        
        console.log('✅ Monthly product created:');
        console.log(`   Product ID: ${monthlyProduct.id}`);
        
        // Create yearly product
        console.log('\n2. Creating yearly product...');
        const yearlyProduct = await stripe.products.create({
            name: 'VibeStack Pro Yearly',
            description: 'VibeStack Pro subscription - yearly billing per user',
            type: 'service'
        });
        
        console.log('✅ Yearly product created:');
        console.log(`   Product ID: ${yearlyProduct.id}`);
        
        // Create monthly price ($2.98/month per user)
        console.log('\n3. Creating monthly price...');
        const monthlyPrice = await stripe.prices.create({
            product: monthlyProduct.id,
            unit_amount: 298, // $2.98 in cents
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
            nickname: 'VibeStack Pro Monthly - $2.98'
        });
        
        console.log('✅ Monthly price created:');
        console.log(`   Price ID: ${monthlyPrice.id}`);
        console.log(`   Amount: $${monthlyPrice.unit_amount / 100}/month per user`);
        
        // Create yearly price ($32/year per user)
        console.log('\n4. Creating yearly price...');
        const yearlyPrice = await stripe.prices.create({
            product: yearlyProduct.id,
            unit_amount: 3200, // $32 in cents
            currency: 'usd',
            recurring: {
                interval: 'year',
            },
            nickname: 'VibeStack Pro Yearly - $32'
        });
        
        console.log('✅ Yearly price created:');
        console.log(`   Price ID: ${yearlyPrice.id}`);
        console.log(`   Amount: $${yearlyPrice.unit_amount / 100}/year per user`);
        
        console.log('\n🔧 UPDATE THESE ENVIRONMENT VARIABLES:');
        console.log('='.repeat(50));
        console.log('In your handleSubscribe Lambda function:');
        console.log('');
        console.log(`STRIPE_PRICE_ID_MONTHLY=${monthlyPrice.id}`);
        console.log(`STRIPE_PRICE_ID_YEARLY=${yearlyPrice.id}`);
        console.log('');
        
        console.log('📊 Pricing Summary:');
        console.log('- Monthly: $2.98 per user per month');
        console.log('- Yearly: $32 per user per year');
        console.log('- Yearly savings: $3.76 per user (10.5% discount)');
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Update Lambda environment variables with the price IDs above');
        console.log('2. Run the payment system test again');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createCompleteSetup();