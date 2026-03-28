const https = require('https');
const crypto = require('crypto');

async function testWebhookManually() {
  console.log('🧪 Manual Webhook Test\n');
  
  const webhookUrl = 'https://ht6jio0xrb.execute-api.us-west-2.amazonaws.com/prod/handleStripeWebhook';
  const webhookSecret = 'whsec_YOUR_WEBHOOK_SECRET_HERE';
  
  // Sample invoice.payment_succeeded event
  const testEvent = {
    "id": "evt_test_webhook",
    "object": "event",
    "api_version": "2019-03-14",
    "created": Math.floor(Date.now() / 1000),
    "data": {
      "object": {
        "id": "in_test_123",
        "object": "invoice",
        "amount_paid": 596,
        "billing_reason": "subscription_create",
        "customer": "cus_T4AKNehcwTJj34",
        "subscription": "sub_test_123",
        "status": "paid"
      }
    },
    "livemode": false,
    "pending_webhooks": 1,
    "request": {
      "id": "req_test",
      "idempotency_key": null
    },
    "type": "invoice.payment_succeeded"
  };
  
  const payload = JSON.stringify(testEvent);
  console.log('1️⃣ Creating test webhook payload...');
  console.log(`   Event type: ${testEvent.type}`);
  console.log(`   Invoice ID: ${testEvent.data.object.id}`);
  console.log(`   Amount: $${testEvent.data.object.amount_paid / 100}`);
  
  // Create Stripe signature
  console.log('\n2️⃣ Creating Stripe signature...');
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = timestamp + '.' + payload;
  const signature = crypto
    .createHmac('sha256', webhookSecret.replace('whsec_', ''))
    .update(signedPayload, 'utf8')
    .digest('hex');
  
  const stripeSignature = `t=${timestamp},v1=${signature}`;
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Signature: v1=${signature.substring(0, 16)}...`);
  
  // Send webhook request
  console.log('\n3️⃣ Sending webhook request...');
  
  return new Promise((resolve) => {
    const req = https.request(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': stripeSignature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      timeout: 30000
    }, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   Headers:`, res.headers);
      
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        console.log(`   Response: ${responseData}`);
        
        if (res.statusCode === 200) {
          console.log('\n   ✅ Webhook processed successfully!');
          try {
            const response = JSON.parse(responseData);
            console.log('   Parsed response:', response);
          } catch (e) {
            console.log('   (Non-JSON response)');
          }
        } else {
          console.log('\n   ❌ Webhook failed!');
          console.log('   This explains why licenses are not updating.');
          
          // Common error analysis
          if (res.statusCode === 500 || res.statusCode === 502) {
            console.log('\n   🔍 Analysis: Lambda function error');
            console.log('   - Check CloudWatch logs for the specific error');
            console.log('   - Look for syntax errors, missing imports, or runtime errors');
          } else if (res.statusCode === 401 || res.statusCode === 403) {
            console.log('\n   🔍 Analysis: Authentication/Authorization error');
            console.log('   - Check webhook signature verification');
            console.log('   - Verify webhook secret is correct');
          }
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`   ❌ Request failed: ${error.message}`);
      resolve();
    });
    
    req.on('timeout', () => {
      console.log('   ❌ Request timed out (Lambda might be hanging)');
      req.destroy();
      resolve();
    });
    
    req.write(payload);
    req.end();
  });
}

async function main() {
  await testWebhookManually();
  
  console.log('\n📋 Summary:');
  console.log('This test simulates what Stripe does when sending webhook events.');
  console.log('If this fails, it explains why license counts are not updating.');
  console.log('\nNext steps:');
  console.log('1. Check CloudWatch logs: /aws/lambda/handleStripeWebhook-prod');
  console.log('2. Look for error messages and stack traces');
  console.log('3. Fix any errors in the Lambda function');
  console.log('4. Test again after fixes are deployed');
}

main();