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

const syncPaymentStatusMutation = `
  mutation SyncPaymentStatus($organizationId: ID!) {
    syncPaymentStatus(organizationId: $organizationId) {
      success
      organizationId
      message
      error
      statusUpdated
      invoicesCreated
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
      activeUserCount
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
        billingPeriodStart
        billingPeriodEnd
        userCount
        pricePerUser
        billingPeriod
        isProrated
        createdAt
      }
    }
  }
`;

async function testWithHistorySync(organizationId, quantity, billingPeriod = 'MONTHLY') {
  console.log(`\n🧪 Testing ${quantity} licenses (${billingPeriod}) with history sync for org: ${organizationId}`);
  
  try {
    // Get initial state
    console.log('\n1. Getting initial organization state...');
    let orgResult = await API.graphql({
      query: getOrganizationQuery,
      variables: { id: organizationId }
    });
    
    let org = orgResult.data.getOrganization;
    if (!org) {
      throw new Error('Organization not found!');
    }
    
    console.log(`   Organization: ${org.name}`);
    console.log(`   Initial licenses: ${org.purchasedLicenses || 0}`);
    console.log(`   Active users: ${org.activeUserCount || 0}`);
    console.log(`   Stripe Customer ID: ${org.stripeCustomerId || 'None'}`);
    console.log(`   Subscription Status: ${org.subscriptionStatus || 'None'}`);
    
    // Get initial invoice history
    console.log('\n2. Getting initial invoice history...');
    let invoicesResult = await API.graphql({
      query: listInvoicesQuery,
      variables: {
        filter: { organizationId: { eq: organizationId } }
      }
    });
    const initialInvoices = invoicesResult.data.listSubscriptionInvoices.items;
    console.log(`   Initial invoices: ${initialInvoices.length}`);
    
    if (initialInvoices.length > 0) {
      console.log('   Recent invoices:');
      initialInvoices
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3)
        .forEach((invoice, index) => {
          console.log(`     ${index + 1}. $${invoice.amount} - ${invoice.status} - ${invoice.userCount} users - ${invoice.billingPeriod}`);
        });
    }
    
    // Purchase licenses
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
      throw new Error(response.error);
    }
    
    // Wait and sync payment status
    console.log('\n4. Waiting 2 seconds and syncing payment status...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const syncResult = await API.graphql({
      query: syncPaymentStatusMutation,
      variables: { organizationId: organizationId }
    });
    
    const syncResponse = syncResult.data.syncPaymentStatus;
    console.log('\n🔄 SYNC RESPONSE:');
    console.log(`   Success: ${syncResponse.success}`);
    console.log(`   Message: ${syncResponse.message}`);
    console.log(`   Status Updated: ${syncResponse.statusUpdated}`);
    console.log(`   Invoices Created: ${syncResponse.invoicesCreated}`);
    
    if (syncResponse.error) {
      console.log(`   Error: ${syncResponse.error}`);
    }
    
    // Get updated state
    console.log('\n5. Getting updated organization state...');
    orgResult = await API.graphql({
      query: getOrganizationQuery,
      variables: { id: organizationId }
    });
    
    org = orgResult.data.getOrganization;
    console.log(`   Updated licenses: ${org.purchasedLicenses || 0}`);
    console.log(`   Updated status: ${org.subscriptionStatus || 'None'}`);
    
    // Get updated invoice history
    console.log('\n6. Getting updated invoice history...');
    invoicesResult = await API.graphql({
      query: listInvoicesQuery,
      variables: {
        filter: { organizationId: { eq: organizationId } }
      }
    });
    const finalInvoices = invoicesResult.data.listSubscriptionInvoices.items;
    const newInvoices = finalInvoices.filter(inv => 
      !initialInvoices.some(initial => initial.id === inv.id)
    );
    
    console.log(`   Final invoices: ${finalInvoices.length} (+${newInvoices.length} new)`);
    
    if (newInvoices.length > 0) {
      console.log('\n📄 NEW INVOICES:');
      newInvoices.forEach((invoice, index) => {
        console.log(`   ${index + 1}. Invoice ID: ${invoice.stripeInvoiceId}`);
        console.log(`      Amount: $${invoice.amount}`);
        console.log(`      Status: ${invoice.status}`);
        console.log(`      User Count: ${invoice.userCount}`);
        console.log(`      Billing Period: ${invoice.billingPeriod}`);
        console.log(`      Is Prorated: ${invoice.isProrated}`);
        console.log(`      Date: ${new Date(invoice.createdAt).toLocaleString()}`);
        console.log('');
      });
    }
    
    // Validate results
    const expectedAmount = billingPeriod === 'MONTHLY' ? 2.98 * quantity : 32.00 * quantity;
    const quantityMatch = response.licensesPurchased === quantity;
    const amountMatch = Math.abs(response.totalAmount - expectedAmount) < 0.01;
    
    console.log('✅ VALIDATION:');
    console.log(`   Quantity correct: ${quantityMatch} (expected: ${quantity}, got: ${response.licensesPurchased})`);
    console.log(`   Amount correct: ${amountMatch} (expected: $${expectedAmount}, got: $${response.totalAmount})`);
    console.log(`   Payment sync successful: ${syncResponse.success}`);
    console.log(`   Invoices created: ${newInvoices.length > 0}`);
    
    const testPassed = quantityMatch && amountMatch && response.success && syncResponse.success;
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
    console.error('Usage: node test-history-sync.js <org-id> <quantity> [MONTHLY|YEARLY]');
    console.error('Example: node test-history-sync.js "123-456-789" 3 MONTHLY');
    process.exit(1);
  }
  
  await testWithHistorySync(organizationId, quantity, billingPeriod);
}

if (require.main === module) {
  main();
}