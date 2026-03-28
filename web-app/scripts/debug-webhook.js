const { API } = require('aws-amplify');

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

async function debugWebhookFlow(organizationId) {
  console.log('🔍 Debugging Webhook Flow\n');
  
  try {
    // Get initial state
    console.log('1. Getting initial state...');
    let orgResult = await API.graphql({
      query: getOrganizationQuery,
      variables: { id: organizationId }
    });
    
    let org = orgResult.data.getOrganization;
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
    
    // Purchase 1 license
    console.log('\n2. Purchasing 1 license...');
    const purchaseResult = await API.graphql({
      query: purchaseLicensesMutation,
      variables: {
        organizationId: organizationId,
        quantity: 1,
        billingPeriod: 'MONTHLY'
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
      console.error('   Purchase failed:', response.error);
      return;
    }
    
    console.log(`\n   💳 Client Secret: ${response.clientSecret ? 'Present' : 'Missing'}`);
    
    // Check every 2 seconds for 30 seconds to see if webhook processes
    console.log('\n3. Monitoring for webhook processing...');
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      const newInvoices = currentInvoices.length - initialInvoices.length;
      
      console.log(`   Check ${i + 1}/15 (${(i + 1) * 2}s): Licenses: ${currentLicenses}, Invoices: +${newInvoices}`);
      
      if (currentLicenses !== initialLicenses || newInvoices > 0) {
        console.log('\n   🎉 WEBHOOK ACTIVITY DETECTED!');
        console.log(`      Licenses: ${initialLicenses} → ${currentLicenses} (${currentLicenses > initialLicenses ? 'ADDED' : 'REPLACED'})`);
        console.log(`      New invoices: ${newInvoices}`);
        
        if (newInvoices > 0) {
          const latestInvoice = currentInvoices
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          console.log('      Latest invoice:', {
            amount: latestInvoice.amount,
            status: latestInvoice.status,
            userCount: latestInvoice.userCount,
            stripeId: latestInvoice.stripeInvoiceId
          });
        }
        break;
      }
    }
    
    // Final status
    console.log('\n4. Final Results:');
    orgResult = await API.graphql({
      query: getOrganizationQuery,
      variables: { id: organizationId }
    });
    org = orgResult.data.getOrganization;
    const finalLicenses = org.purchasedLicenses || 0;
    
    console.log(`   Initial licenses: ${initialLicenses}`);
    console.log(`   Purchased: +1 license`);
    console.log(`   Expected total: ${initialLicenses + 1}`);
    console.log(`   Actual total: ${finalLicenses}`);
    
    if (finalLicenses === initialLicenses + 1) {
      console.log('\n   ✅ SUCCESS: Licenses were ADDED correctly!');
    } else if (finalLicenses === 1) {
      console.log('\n   ❌ ISSUE: Licenses were REPLACED (webhook using wrong logic)');
    } else if (finalLicenses === initialLicenses) {
      console.log('\n   ❌ ISSUE: No license update occurred (webhook not triggered or failed)');
    } else {
      console.log('\n   ❓ UNEXPECTED: Unexpected license count');
    }
    
    console.log('\n💡 Next Steps:');
    if (finalLicenses === initialLicenses) {
      console.log('   - Check if Stripe webhook is configured correctly');
      console.log('   - Check CloudWatch logs for handleStripeWebhook function');
      console.log('   - Verify Stripe test mode webhook events are being sent');
    } else if (finalLicenses === 1) {
      console.log('   - Webhook is working but using wrong logic (replacing instead of adding)');
      console.log('   - Check webhook logs to see which condition is being triggered');
    }
    
  } catch (error) {
    console.error('\n❌ DEBUG FAILED:', error.message);
  }
}

// Main execution
async function main() {
  const organizationId = process.argv[2];
  
  if (!organizationId) {
    console.error('Usage: node debug-webhook.js <organization-id>');
    console.error('Example: node debug-webhook.js "123-456-789"');
    process.exit(1);
  }
  
  await debugWebhookFlow(organizationId);
}

if (require.main === module) {
  main();
}