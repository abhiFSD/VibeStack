// Script to create Stripe prices for your products
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY_HERE');

async function createPrices() {
    console.log('🔧 Creating Stripe Prices...');
    console.log('='.repeat(40));
    
    try {
        // Create monthly price ($2.98/month per user)
        console.log('Creating monthly price...');
        const monthlyPrice = await stripe.prices.create({
            product: 'prod_T5E5GqMhWRuo2q',
            unit_amount: 298, // $2.98 in cents
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
            nickname: 'VibeStack Pro Monthly'
        });
        
        console.log('✅ Monthly price created:');
        console.log(`   Price ID: ${monthlyPrice.id}`);
        console.log(`   Amount: $${monthlyPrice.unit_amount / 100}/month`);
        
        // Create yearly price ($32/year per user)
        console.log('\nCreating yearly price...');
        const yearlyPrice = await stripe.prices.create({
            product: 'prod_T5E6UiWktjQThA',
            unit_amount: 3200, // $32 in cents
            currency: 'usd',
            recurring: {
                interval: 'year',
            },
            nickname: 'VibeStack Pro Yearly'
        });
        
        console.log('✅ Yearly price created:');
        console.log(`   Price ID: ${yearlyPrice.id}`);
        console.log(`   Amount: $${yearlyPrice.unit_amount / 100}/year`);
        
        console.log('\n🔧 Update these Environment Variables:');
        console.log('='.repeat(50));
        console.log(`STRIPE_PRICE_ID_MONTHLY=${monthlyPrice.id}`);
        console.log(`STRIPE_PRICE_ID_YEARLY=${yearlyPrice.id}`);
        
        console.log('\n📋 Summary:');
        console.log('- Monthly: $2.98/user/month');
        console.log('- Yearly: $32/user/year (saves $3.76 per year per user)');
        
    } catch (error) {
        console.error('❌ Error creating prices:', error.message);
    }
}

createPrices();