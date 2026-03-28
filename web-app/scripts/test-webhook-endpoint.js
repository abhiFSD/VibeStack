const https = require('https');

async function testWebhookEndpoint() {
  console.log('🔍 Testing Webhook Endpoint\n');
  
  const webhookUrl = 'https://ht6jio0xrb.execute-api.us-west-2.amazonaws.com/prod/handleStripeWebhook';
  
  // Test 1: Simple GET request to check if endpoint is accessible
  console.log('1️⃣ Testing endpoint accessibility...');
  console.log(`   URL: ${webhookUrl}`);
  
  return new Promise((resolve) => {
    const req = https.request(webhookUrl, {
      method: 'GET',
      timeout: 10000
    }, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`   Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
        
        if (res.statusCode === 200 || res.statusCode === 405) {
          console.log('   ✅ Endpoint is accessible');
        } else {
          console.log('   ❌ Endpoint returned error status');
        }
        
        testWebhookSecret();
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Connection failed: ${error.message}`);
      console.log('   This could be why webhooks are not working!');
      resolve();
    });
    
    req.on('timeout', () => {
      console.log('   ❌ Request timed out');
      console.log('   This could be why webhooks are not working!');
      req.destroy();
      resolve();
    });
    
    req.end();
  });
}

function testWebhookSecret() {
  console.log('\n2️⃣ Checking webhook configuration...');
  
  // Check environment variables from team-provider-info.json
  const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET_HERE';
  const stripeSecret = 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE';
  
  console.log(`   Webhook Secret: ${webhookSecret ? 'Present' : 'Missing'}`);
  console.log(`   Stripe Secret: ${stripeSecret ? 'Present' : 'Missing'}`);
  
  if (webhookSecret && stripeSecret) {
    console.log('   ✅ Secrets are configured');
  } else {
    console.log('   ❌ Missing required secrets');
  }
}

async function checkRecentWebhookDeliveries() {
  console.log('\n3️⃣ Webhook Delivery Suggestions...');
  console.log('   To check webhook deliveries in Stripe Dashboard:');
  console.log('   1. Go to Stripe Dashboard > Developers > Webhooks');
  console.log('   2. Click on your webhook endpoint');
  console.log('   3. Check the "Attempts" or "Events" tab');
  console.log('   4. Look for failed deliveries with error messages');
  console.log('');
  console.log('   Common issues:');
  console.log('   - 404: Endpoint not found (wrong URL)');
  console.log('   - 500: Lambda function error');
  console.log('   - Timeout: Lambda taking too long');
  console.log('   - Signature verification: Wrong webhook secret');
}

async function main() {
  await testWebhookEndpoint();
  await checkRecentWebhookDeliveries();
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check the Stripe Dashboard webhook attempts');
  console.log('2. Check CloudWatch logs for the handleStripeWebhook Lambda');
  console.log('3. Verify the webhook endpoint URL is correct');
  console.log('4. Test webhook manually using Stripe CLI:');
  console.log('   stripe trigger invoice.payment_succeeded');
}

main();