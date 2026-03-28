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

const createStripeCustomerMutation = `
  mutation CreateStripeCustomer($organization: ID!) {
    createStripeCustomer(organization: $organization) {
      success
      customerId
      error
    }
  }
`;

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

async function testWithCustomerCreation(organizationId, quantity, billingPeriod = 'MONTHLY') {
  console.log(`\n🧪 Testing ${quantity} licenses (${billingPeriod}) with customer creation for org: ${organizationId}`);
  
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
    
    // Create Stripe customer if needed
    if (!org.stripeCustomerId) {
      console.log('\n2. Creating Stripe customer...');
      const customerResult = await API.graphql({
        query: createStripeCustomerMutation,
        variables: { organization: organizationId }
      });
      
      const customerResponse = customerResult.data.createStripeCustomer;
      console.log(`   Customer creation success: ${customerResponse.success}`);
      console.log(`   Customer ID: ${customerResponse.customerId}`);
      
      if (customerResponse.error) {
        console.log(`   Error: ${customerResponse.error}`);
        throw new Error(customerResponse.error);
      }
    }
    
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
    
    const testPassed = quantityMatch && amountMatch && response.success;
    console.log(`\n🎯 TEST RESULT: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
    
    return testPassed;
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

// Main execution
async function main() {
  const organizationId = process.argv[2];
  const quantity = parseInt(process.argv[3]);
  const billingPeriod = process.argv[4] || 'MONTHLY';
  
  if (!organizationId || !quantity) {
    console.error('Usage: node test-with-customer-creation.js <org-id> <quantity> [MONTHLY|YEARLY]');
    console.error('Example: node test-with-customer-creation.js "123-456-789" 3 MONTHLY');
    process.exit(1);
  }
  
  await testWithCustomerCreation(organizationId, quantity, billingPeriod);
}

if (require.main === module) {
  main();
}