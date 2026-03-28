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

const syncPaymentStatusMutation = `
  mutation SyncPaymentStatus($organizationId: ID!) {
    syncPaymentStatus(organizationId: $organizationId) {
      success
      organizationId
      message
      error
    }
  }
`;

async function testCumulativeLicenses(organizationId) {
  console.log('🧪 Testing Cumulative License Addition\n');
  
  try {
    // Get initial state
    console.log('1. Getting initial license count...');
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
    
    // Test 1: Purchase 2 licenses
    console.log('\n2. Purchasing 2 licenses...');
    const purchase1 = await API.graphql({
      query: purchaseLicensesMutation,
      variables: {
        organizationId: organizationId,
        quantity: 2,
        billingPeriod: 'MONTHLY'
      }
    });
    
    const response1 = purchase1.data.purchaseLicenses;
    console.log(`   Purchase 1 - Success: ${response1.success}, Licenses: ${response1.licensesPurchased}, Amount: $${response1.totalAmount}`);
    
    if (!response1.success) {
      throw new Error(response1.error);
    }
    
    // Wait and sync
    console.log('\n3. Waiting 3 seconds and syncing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await API.graphql({
      query: syncPaymentStatusMutation,
      variables: { organizationId: organizationId }
    });
    
    // Check intermediate state
    orgResult = await API.graphql({
      query: getOrganizationQuery,
      variables: { id: organizationId }
    });
    org = orgResult.data.getOrganization;
    const afterFirst = org.purchasedLicenses || 0;
    console.log(`   Licenses after first purchase: ${afterFirst}`);
    console.log(`   Expected: ${initialLicenses + 2}, Actual: ${afterFirst}, ✅ ${afterFirst === initialLicenses + 2 ? 'CORRECT' : '❌ WRONG'}`);
    
    // Test 2: Purchase 3 more licenses
    console.log('\n4. Purchasing 3 more licenses...');
    const purchase2 = await API.graphql({
      query: purchaseLicensesMutation,
      variables: {
        organizationId: organizationId,
        quantity: 3,
        billingPeriod: 'MONTHLY'
      }
    });
    
    const response2 = purchase2.data.purchaseLicenses;
    console.log(`   Purchase 2 - Success: ${response2.success}, Licenses: ${response2.licensesPurchased}, Amount: $${response2.totalAmount}`);
    
    if (!response2.success) {
      throw new Error(response2.error);
    }
    
    // Wait and sync
    console.log('\n5. Waiting 3 seconds and syncing...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await API.graphql({
      query: syncPaymentStatusMutation,
      variables: { organizationId: organizationId }
    });
    
    // Check final state
    orgResult = await API.graphql({
      query: getOrganizationQuery,
      variables: { id: organizationId }
    });
    org = orgResult.data.getOrganization;
    const finalLicenses = org.purchasedLicenses || 0;
    
    console.log('\n📊 FINAL RESULTS:');
    console.log(`   Initial licenses: ${initialLicenses}`);
    console.log(`   First purchase: +2 licenses`);
    console.log(`   Second purchase: +3 licenses`);
    console.log(`   Expected total: ${initialLicenses + 2 + 3}`);
    console.log(`   Actual total: ${finalLicenses}`);
    
    const isCorrect = finalLicenses === (initialLicenses + 2 + 3);
    console.log(`\n🎯 TEST RESULT: ${isCorrect ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (!isCorrect) {
      console.log(`\n❌ ISSUE: Licenses are ${finalLicenses === response2.licensesPurchased ? 'being REPLACED' : 'not adding correctly'}`);
      console.log(`   This means the webhook is ${finalLicenses === response2.licensesPurchased ? 'still replacing instead of adding' : 'having other calculation issues'}`);
    }
    
    return isCorrect;
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const organizationId = process.argv[2];
  
  if (!organizationId) {
    console.error('Usage: node test-cumulative-licenses.js <organization-id>');
    console.error('Example: node test-cumulative-licenses.js "123-456-789"');
    process.exit(1);
  }
  
  const success = await testCumulativeLicenses(organizationId);
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}