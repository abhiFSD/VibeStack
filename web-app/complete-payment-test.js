const { API } = require('aws-amplify');
const stripe = require('stripe')('sk_test_YOUR_STRIPE_SECRET_KEY_HERE');

// Configure Amplify
const amplifyConfig = {
  aws_project_region: 'us-west-2',
  aws_appsync_graphqlEndpoint: 'https://ah2gzx5zdrel3csp6obhtctgtu.appsync-api.us-west-2.amazonaws.com/graphql',
  aws_appsync_region: 'us-west-2',
  aws_appsync_authenticationType: 'API_KEY',
  aws_appsync_apiKey: 'YOUR_GRAPHQL_API_KEY_HERE'
};

require('aws-amplify').Amplify.configure(amplifyConfig);

const purchaseLicensesMutation = `
  mutation PurchaseLicenses($organizationId: ID!, $quantity: Int!, $billingPeriod: String!) {
    purchaseLicenses(
      organizationId: $organizationId, 
      quantity: $quantity, 
      billingPeriod: $billingPeriod
    ) {
      success
      clientSecret
      licensesPurchased
      totalAmount
      error
    }
  }
`;

const getOrganizationQuery = `
  query GetOrganization($id: ID!) {
    getOrganization(id: $id) {
      id
      name
      purchasedLicenses
      stripeCustomerId
      subscriptionStatus
    }
  }
`;

const listInvoicesQuery = `
  query ListSubscriptionInvoices($filter: ModelSubscriptionInvoiceFilterInput) {
    listSubscriptionInvoices(filter: $filter) {
      items {
        id
        stripeInvoiceId
        amount
        status
        userCount
        billingPeriod
        createdAt
      }
    }
  }
`;

async function completePaymentTest(organizationId, licenseQuantity, billingPeriod = 'MONTHLY') {
  console.log('🧪 Complete Payment Flow Test');
  console.log(`   Testing: ${licenseQuantity} licenses (${billingPeriod})`);
  console.log(`   Organization: ${organizationId}\n`);
  
  try {
    // Step 1: Get initial state
    console.log('1️⃣ Getting initial state...');
    let orgResult = await API.graphql({
      query: getOrganizationQuery,
      variables: { id: organizationId }
    });
    
    let org = orgResult.data.getOrganization;
    if (!org) {
      throw new Error('Organization not found!');
    }
    
    const initialLicenses = org.purchasedLicenses || 0;
    console.log(`   Organization: ${org.name}`);
    console.log(`   Initial licenses: ${initialLicenses}`);
    console.log(`   Stripe Customer: ${org.stripeCustomerId}`);
    
    // Get initial invoices
    let invoicesResult = await API.graphql({
      query: listInvoicesQuery,
      variables: {
        filter: { organizationId: { eq: organizationId } }
      }
    });
    const initialInvoices = invoicesResult.data.listSubscriptionInvoices.items;
    console.log(`   Initial invoices: ${initialInvoices.length}`);
    
    // Step 2: Create license purchase
    console.log('\n2️⃣ Creating license purchase...');
    const purchaseResult = await API.graphql({
      query: purchaseLicensesMutation,
      variables: {
        organizationId: organizationId,
        quantity: licenseQuantity,
        billingPeriod: billingPeriod
      }
    });
    
    const response = purchaseResult.data.purchaseLicenses;
    console.log('   Purchase Response:', {
      success: response.success,
      licensesPurchased: response.licensesPurchased,
      totalAmount: response.totalAmount,
      hasClientSecret: !!response.clientSecret
    });
    
    if (!response.success) {
      throw new Error(response.error);
    }
    
    if (!response.clientSecret) {
      throw new Error('No client secret received - cannot complete payment');
    }
    
    // Step 3: Extract payment intent from client secret
    console.log('\n3️⃣ Extracting payment intent...');
    const clientSecret = response.clientSecret;
    const paymentIntentId = clientSecret.split('_secret_')[0];
    console.log(`   Payment Intent ID: ${paymentIntentId}`);
    
    // Step 4: Get payment intent details
    console.log('\n4️⃣ Getting payment intent details...');
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('   Payment Intent:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata
    });
    
    // Get associated invoice
    if (paymentIntent.invoice) {
      console.log('\n5️⃣ Getting associated invoice...');
      const invoice = await stripe.invoices.retrieve(paymentIntent.invoice);
      console.log('   Invoice:', {
        id: invoice.id,
        status: invoice.status,
        billing_reason: invoice.billing_reason,
        amount_paid: invoice.amount_paid / 100,
        subscription: invoice.subscription
      });
      
      // Get subscription details if exists
      if (invoice.subscription) {
        console.log('\n6️⃣ Getting subscription details...');
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        console.log('   Subscription:', {
          id: subscription.id,
          status: subscription.status,
          quantity: subscription.items.data[0].quantity,
          metadata: subscription.metadata
        });
      }
    }
    
    // Step 5: Complete the payment using test card
    console.log('\n7️⃣ Completing payment with test card...');
    try {
      const paymentMethodResult = await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: '4242424242424242',
          exp_month: 12,
          exp_year: 2025,
          cvc: '123',
        },
      });
      
      console.log(`   Created payment method: ${paymentMethodResult.id}`);
      
      // Attach payment method and confirm payment
      const confirmedPayment = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodResult.id,
      });
      
      console.log('   Payment Confirmation:', {
        id: confirmedPayment.id,
        status: confirmedPayment.status,
        amount_received: confirmedPayment.amount_received / 100
      });
      
      if (confirmedPayment.status === 'succeeded') {
        console.log('   ✅ Payment completed successfully!');
      } else {
        console.log(`   ⚠️ Payment status: ${confirmedPayment.status}`);
      }
      
    } catch (paymentError) {
      console.error('   ❌ Payment completion failed:', paymentError.message);
      throw paymentError;
    }
    
    // Step 6: Wait for webhook processing
    console.log('\n8️⃣ Waiting for webhook processing...');
    console.log('   Monitoring license count and invoices...');
    
    let webhookProcessed = false;
    let finalLicenses = initialLicenses;
    let finalInvoices = initialInvoices.length;
    
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
      
      // Check organization licenses
      orgResult = await API.graphql({
        query: getOrganizationQuery,
        variables: { id: organizationId }
      });
      org = orgResult.data.getOrganization;
      const currentLicenses = org.purchasedLicenses || 0;
      
      // Check invoices
      invoicesResult = await API.graphql({
        query: listInvoicesQuery,
        variables: {
          filter: { organizationId: { eq: organizationId } }
        }
      });
      const currentInvoices = invoicesResult.data.listSubscriptionInvoices.items;
      const newInvoiceCount = currentInvoices.length;
      
      console.log(`   Check ${i + 1}/20 (${(i + 1) * 3}s): Licenses: ${currentLicenses}, Invoices: ${newInvoiceCount} (+${newInvoiceCount - initialInvoices.length})`);
      
      if (currentLicenses !== initialLicenses || newInvoiceCount > initialInvoices.length) {
        console.log('\n   🎉 WEBHOOK PROCESSING DETECTED!');
        finalLicenses = currentLicenses;
        finalInvoices = newInvoiceCount;
        webhookProcessed = true;
        
        // Show details of changes
        if (currentLicenses !== initialLicenses) {
          const licenseDiff = currentLicenses - initialLicenses;
          const wasAdded = licenseDiff === licenseQuantity;
          const wasReplaced = currentLicenses === licenseQuantity;
          
          console.log(`      License Update: ${initialLicenses} → ${currentLicenses}`);
          if (wasAdded) {
            console.log('      ✅ LICENSES WERE ADDED CORRECTLY!');
          } else if (wasReplaced) {
            console.log('      ❌ LICENSES WERE REPLACED (bug still exists)');
          } else {
            console.log('      ❓ UNEXPECTED LICENSE COUNT CHANGE');
          }
        }
        
        if (newInvoiceCount > initialInvoices.length) {
          const newInvoices = currentInvoices.filter(inv => 
            !initialInvoices.some(initial => initial.id === inv.id)
          );
          console.log(`      New Invoices: ${newInvoices.length}`);
          newInvoices.forEach((invoice, index) => {
            console.log(`        ${index + 1}. $${invoice.amount} - ${invoice.status} - ${invoice.userCount} users`);
          });
        }
        
        break;
      }
    }
    
    // Step 7: Final results
    console.log('\n9️⃣ Final Results:');
    console.log(`   Initial licenses: ${initialLicenses}`);
    console.log(`   Purchased: ${licenseQuantity} licenses`);
    console.log(`   Expected total: ${initialLicenses + licenseQuantity}`);
    console.log(`   Actual total: ${finalLicenses}`);
    console.log(`   Webhook processed: ${webhookProcessed ? 'Yes' : 'No'}`);
    
    // Determine test result
    const expectedTotal = initialLicenses + licenseQuantity;
    let testResult = 'UNKNOWN';
    
    if (!webhookProcessed) {
      testResult = 'WEBHOOK_NOT_TRIGGERED';
      console.log('\n   ❌ WEBHOOK NOT TRIGGERED');
      console.log('      - Check Stripe webhook configuration');
      console.log('      - Verify webhook endpoint is accessible');
      console.log('      - Check CloudWatch logs for errors');
    } else if (finalLicenses === expectedTotal) {
      testResult = 'SUCCESS';
      console.log('\n   ✅ SUCCESS: Licenses were added correctly!');
    } else if (finalLicenses === licenseQuantity) {
      testResult = 'REPLACED_BUG';
      console.log('\n   ❌ BUG: Licenses were replaced instead of added!');
    } else {
      testResult = 'UNEXPECTED';
      console.log('\n   ❓ UNEXPECTED: Unexpected license count');
    }
    
    // Step 8: Recent Stripe events (for debugging)
    console.log('\n🔍 Recent Stripe Events (last 10):');
    try {
      const events = await stripe.events.list({ limit: 10 });
      events.data.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.type} - ${new Date(event.created * 1000).toISOString()}`);
        if (event.type.includes('invoice') || event.type.includes('payment')) {
          console.log(`      Object ID: ${event.data.object.id}`);
        }
      });
    } catch (error) {
      console.log('   Could not fetch Stripe events:', error.message);
    }
    
    return {
      testResult,
      initialLicenses,
      finalLicenses,
      licenseQuantity,
      webhookProcessed
    };
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Full error:', error);
    return {
      testResult: 'ERROR',
      error: error.message
    };
  }
}

// Main execution
async function main() {
  const organizationId = process.argv[2];
  const quantity = parseInt(process.argv[3]) || 2;
  const billingPeriod = process.argv[4] || 'MONTHLY';
  
  if (!organizationId) {
    console.error('Usage: node complete-payment-test.js <organization-id> [quantity] [billing-period]');
    console.error('Example: node complete-payment-test.js "123-456-789" 3 MONTHLY');
    process.exit(1);
  }
  
  const result = await completePaymentTest(organizationId, quantity, billingPeriod);
  
  console.log('\n📊 TEST SUMMARY:');
  console.log(`   Result: ${result.testResult}`);
  if (result.testResult !== 'ERROR') {
    console.log(`   License Change: ${result.initialLicenses} → ${result.finalLicenses}`);
    console.log(`   Expected: +${result.licenseQuantity} (cumulative)`);
    console.log(`   Webhook: ${result.webhookProcessed ? 'Processed' : 'Not triggered'}`);
  }
  
  process.exit(result.testResult === 'SUCCESS' ? 0 : 1);
}

if (require.main === module) {
  main();
}