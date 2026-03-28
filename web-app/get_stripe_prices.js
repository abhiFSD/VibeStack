// Script to retrieve Stripe Price IDs for the products you created
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY_HERE');

async function getStripePrices() {
    console.log('🔍 Fetching Stripe Prices...');
    console.log('='.repeat(40));
    
    try {
        // Get all prices
        const prices = await stripe.prices.list({
            limit: 100,
            active: true
        });
        
        console.log('📋 All Active Prices:');
        console.log('='.repeat(40));
        
        prices.data.forEach(price => {
            const amount = price.unit_amount / 100; // Convert from cents
            const currency = price.currency.toUpperCase();
            const interval = price.recurring ? price.recurring.interval : 'one-time';
            
            console.log(`Price ID: ${price.id}`);
            console.log(`Product ID: ${price.product}`);
            console.log(`Amount: ${amount} ${currency}`);
            console.log(`Billing: ${interval}`);
            console.log(`Type: ${price.type}`);
            console.log('-'.repeat(30));
        });
        
        // Filter for your specific products
        console.log('\n🎯 Your Product Prices:');
        console.log('='.repeat(40));
        
        const monthlyProduct = 'prod_T5E5GqMhWRuo2q';
        const yearlyProduct = 'prod_T5E6UiWktjQThA';
        
        const monthlyPrices = prices.data.filter(p => p.product === monthlyProduct);
        const yearlyPrices = prices.data.filter(p => p.product === yearlyProduct);
        
        console.log('📅 MONTHLY Product (prod_T5E5GqMhWRuo2q):');
        monthlyPrices.forEach(price => {
            console.log(`  Price ID: ${price.id}`);
            console.log(`  Amount: $${price.unit_amount / 100}`);
            console.log(`  Interval: ${price.recurring ? price.recurring.interval : 'N/A'}`);
        });
        
        console.log('\n📆 YEARLY Product (prod_T5E6UiWktjQThA):');
        yearlyPrices.forEach(price => {
            console.log(`  Price ID: ${price.id}`);
            console.log(`  Amount: $${price.unit_amount / 100}`);
            console.log(`  Interval: ${price.recurring ? price.recurring.interval : 'N/A'}`);
        });
        
        console.log('\n🔧 Environment Variables to Update:');
        console.log('='.repeat(40));
        
        if (monthlyPrices.length > 0) {
            console.log(`STRIPE_PRICE_ID_MONTHLY=${monthlyPrices[0].id}`);
        }
        
        if (yearlyPrices.length > 0) {
            console.log(`STRIPE_PRICE_ID_YEARLY=${yearlyPrices[0].id}`);
        }
        
    } catch (error) {
        console.error('❌ Error fetching prices:', error.message);
    }
}

getStripePrices();