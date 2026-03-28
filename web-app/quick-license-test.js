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
        amount
        status
        userCount
        billingPeriod
        createdAt
      }
    }
  }
`;

async function quickTest(organizationId, quantity, billingPeriod = 'MONTHLY') {
  console.log(`\n🧪 Testing ${quantity} licenses (${billingPeriod}) for org: ${organizationId}`);
  
  try {
    // Check initial state
    console.log('\n1. Getting initial organization state...');
    const orgResult = await API.graphql({
      query: getOrganizationQuery,
      variables: { id: organizationId }
    });
    
    const org = orgResult.data.getOrganization;
    if (!org) {
      throw new Error('Organization not found!');
    }
    
    console.log(`   Organization: ${org.name}`);
    console.log(`   Initial licenses: ${org.purchasedLicenses || 0}`);
    console.log(`   Stripe Customer ID: ${org.stripeCustomerId || 'None'}`);
    
    // Get initial invoice count
    console.log('\n2. Getting initial invoice count...');
    const invoicesResult = await API.graphql({
      query: listInvoicesQuery,
      variables: {
        filter: { organizationId: { eq: organizationId } }
      }
    });
    const initialInvoiceCount = invoicesResult.data.listSubscriptionInvoices.items.length;
    console.log(`   Initial invoices: ${initialInvoiceCount}`);
    
    // Test purchase
    console.log(`\n3. Purchasing ${quantity} licenses...`);
    const purchaseResult = await API.graphql({
      query: purchaseLicensesMutation,
      variables: {
        organizationId: organizationId,
        quantity: quantity,
        billingPeriod: billingPeriod
      }
    });
    
    const response = purchaseResult.data.purchaseLicenses;
    console.log('\n📋 PURCHASE RESPONSE:');
    console.log(`   Success: ${response.success}`);
    console.log(`   Licenses Purchased: ${response.licensesPurchased}`);
    console.log(`   Total Amount: $${response.totalAmount}`);
    console.log(`   Has Client Secret: ${!!response.clientSecret}`);
    
    if (response.error) {
      console.log(`   Error: ${response.error}`);
    }
    
    // Validate response
    const expectedAmount = billingPeriod === 'MONTHLY' ? 2.98 * quantity : 32.00 * quantity;
    const quantityMatch = response.licensesPurchased === quantity;
    const amountMatch = Math.abs(response.totalAmount - expectedAmount) < 0.01;
    
    console.log('\n✅ VALIDATION:');
    console.log(`   Quantity correct: ${quantityMatch} (expected: ${quantity}, got: ${response.licensesPurchased})`);
    console.log(`   Amount correct: ${amountMatch} (expected: $${expectedAmount}, got: $${response.totalAmount})`);
    
    // Check final invoice count
    console.log('\n4. Checking updated invoice count...');
    const finalInvoicesResult = await API.graphql({
      query: listInvoicesQuery,
      variables: {
        filter: { organizationId: { eq: organizationId } }
      }
    });
    const finalInvoiceCount = finalInvoicesResult.data.listSubscriptionInvoices.items.length;
    const newInvoices = finalInvoiceCount - initialInvoiceCount;
    console.log(`   Final invoices: ${finalInvoiceCount} (+${newInvoices} new)`);
    
    // Show recent invoices
    if (newInvoices > 0) {
      console.log('\n📄 NEW INVOICES:');
      const allInvoices = finalInvoicesResult.data.listSubscriptionInvoices.items;
      const recentInvoices = allInvoices
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, newInvoices);
      
      recentInvoices.forEach((invoice, index) => {
        console.log(`   ${index + 1}. $${invoice.amount} - ${invoice.status} - ${invoice.userCount} users - ${invoice.billingPeriod}`);
      });
    }
    
    const testPassed = quantityMatch && amountMatch && response.success;
    console.log(`\n🎯 TEST RESULT: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    return testPassed;
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Quick usage function
async function runQuickTests(organizationId) {
  console.log('🚀 Running Quick License Purchase Tests');
  
  const tests = [
    { quantity: 3, billingPeriod: 'MONTHLY' },
    { quantity: 5, billingPeriod: 'YEARLY' },
    { quantity: 1, billingPeriod: 'MONTHLY' }
  ];
  
  let passed = 0;
  
  for (const test of tests) {
    const result = await quickTest(organizationId, test.quantity, test.billingPeriod);
    if (result) passed++;
    
    // Wait between tests
    console.log('\n⏳ Waiting 3 seconds before next test...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log(`\n📊 SUMMARY: ${passed}/${tests.length} tests passed`);
}

// Main execution
async function main() {
  const organizationId = process.argv[2];
  const quantity = parseInt(process.argv[3]);
  const billingPeriod = process.argv[4] || 'MONTHLY';
  
  if (!organizationId) {
    console.error('Usage:');
    console.error('  Single test: node quick-license-test.js <org-id> <quantity> [MONTHLY|YEARLY]');
    console.error('  Multiple tests: node quick-license-test.js <org-id>');
    console.error('\nExample:');
    console.error('  node quick-license-test.js "123-456-789" 3 MONTHLY');
    process.exit(1);
  }
  
  if (quantity) {
    // Single test
    await quickTest(organizationId, quantity, billingPeriod);
  } else {
    // Multiple tests
    await runQuickTests(organizationId);
  }
}

if (require.main === module) {
  main();
}

module.exports = { quickTest, runQuickTests };