/**
 * Basic Connection Test for VibeStack Pro
 * 
 * Tests basic connectivity to GraphQL API and organization data
 * without requiring Stripe keys
 */

const https = require('https');

const CONFIG = {
  GRAPHQL_ENDPOINT: process.env.API_LFAPI_GRAPHQLAPIENDPOINTOUTPUT || "https://ah2gzx5zdrel3csp6obhtctgtu.appsync-api.us-west-2.amazonaws.com/graphql",
  API_KEY: process.env.API_LFAPI_GRAPHQLAPIKEYOUTPUT || "YOUR_GRAPHQL_API_KEY_HERE",
  TEST_ORGANIZATION_ID: '295a215f-df38-46b8-b1db-d48c1e336ca2'
};

const makeGraphQLRequest = async (query, variables = {}) => {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      query: query,
      variables: variables
    });

    const url = new URL(CONFIG.GRAPHQL_ENDPOINT);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CONFIG.API_KEY
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve(parsedData);
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on('error', reject);
    request.write(requestBody);
    request.end();
  });
};

async function testBasicConnectivity() {
  console.log('🔗 Testing GraphQL API connectivity...');
  console.log(`Endpoint: ${CONFIG.GRAPHQL_ENDPOINT}`);
  console.log(`Using API Key: ${CONFIG.API_KEY.substring(0, 8)}...`);
  
  try {
    // Test a simple introspection query
    const result = await makeGraphQLRequest(`
      query {
        __schema {
          types {
            name
          }
        }
      }
    `);
    
    if (result.data && result.data.__schema) {
      console.log('✅ GraphQL API connection successful');
      const typeCount = result.data.__schema.types.length;
      console.log(`   Found ${typeCount} GraphQL types`);
      return true;
    } else {
      console.log('❌ GraphQL API connection failed');
      console.log('Response:', JSON.stringify(result, null, 2));
      return false;
    }
  } catch (error) {
    console.log('❌ GraphQL API connection error:', error.message);
    return false;
  }
}

async function testOrganizationData() {
  console.log('\n🏢 Testing organization data access...');
  console.log(`Organization ID: ${CONFIG.TEST_ORGANIZATION_ID}`);
  
  try {
    const result = await makeGraphQLRequest(`
      query GetOrganization($id: ID!) {
        getOrganization(id: $id) {
          id
          name
          owner
          stripeCustomerId
          subscriptionStatus
          billingPeriod
          activeUserCount
          purchasedLicenses
          subscriptionPeriodEnd
        }
      }
    `, { id: CONFIG.TEST_ORGANIZATION_ID });
    
    if (result.data && result.data.getOrganization) {
      const org = result.data.getOrganization;
      console.log('✅ Organization data retrieved successfully');
      console.log(`   Name: ${org.name || 'Not set'}`);
      console.log(`   Owner: ${org.owner || 'Not set'}`);
      console.log(`   Stripe Customer ID: ${org.stripeCustomerId ? '✅ Set' : '❌ Not set'}`);
      console.log(`   Subscription Status: ${org.subscriptionStatus || 'NONE'}`);
      console.log(`   Billing Period: ${org.billingPeriod || 'Not set'}`);
      console.log(`   Active Users: ${org.activeUserCount || 0}`);
      console.log(`   Purchased Licenses: ${org.purchasedLicenses || 0}`);
      
      return org;
    } else if (result.errors) {
      console.log('❌ GraphQL errors:', result.errors);
      return null;
    } else {
      console.log('❌ Organization not found or no data returned');
      console.log('Response:', JSON.stringify(result, null, 2));
      return null;
    }
  } catch (error) {
    console.log('❌ Error fetching organization:', error.message);
    return null;
  }
}

async function testInvoiceHistory() {
  console.log('\n📄 Testing invoice history access...');
  
  try {
    const result = await makeGraphQLRequest(`
      query ListInvoices($filter: ModelSubscriptionInvoiceFilterInput) {
        listSubscriptionInvoices(filter: $filter, limit: 5) {
          items {
            id
            stripeInvoiceId
            amount
            status
            billingPeriodStart
            billingPeriodEnd
            userCount
            pricePerUser
            isProrated
            createdAt
          }
        }
      }
    `, {
      filter: {
        organizationId: { eq: CONFIG.TEST_ORGANIZATION_ID }
      }
    });
    
    if (result.data && result.data.listSubscriptionInvoices) {
      const invoices = result.data.listSubscriptionInvoices.items;
      console.log(`✅ Invoice history retrieved: ${invoices.length} invoices found`);
      
      if (invoices.length > 0) {
        console.log('   Recent invoices:');
        invoices.forEach((invoice, index) => {
          console.log(`   ${index + 1}. ${invoice.stripeInvoiceId || 'No Stripe ID'} - $${invoice.amount} - ${invoice.status}`);
        });
      } else {
        console.log('   No invoices found for this organization');
      }
      
      return invoices;
    } else if (result.errors) {
      console.log('❌ GraphQL errors:', result.errors);
      return null;
    } else {
      console.log('❌ No invoice data returned');
      return null;
    }
  } catch (error) {
    console.log('❌ Error fetching invoices:', error.message);
    return null;
  }
}

async function testOrganizationMembers() {
  console.log('\n👥 Testing organization members access...');
  
  try {
    const result = await makeGraphQLRequest(`
      query ListMembers($filter: ModelOrganizationMemberFilterInput) {
        listOrganizationMembers(filter: $filter, limit: 10) {
          items {
            id
            email
            status
            role
            createdAt
          }
        }
      }
    `, {
      filter: {
        organizationID: { eq: CONFIG.TEST_ORGANIZATION_ID }
      }
    });
    
    if (result.data && result.data.listOrganizationMembers) {
      const members = result.data.listOrganizationMembers.items;
      console.log(`✅ Organization members retrieved: ${members.length} members found`);
      
      if (members.length > 0) {
        console.log('   Members:');
        members.forEach((member, index) => {
          console.log(`   ${index + 1}. ${member.email} - ${member.role} - ${member.status}`);
        });
      } else {
        console.log('   No members found for this organization');
      }
      
      return members;
    } else if (result.errors) {
      console.log('❌ GraphQL errors:', result.errors);
      return null;
    } else {
      console.log('❌ No member data returned');
      return null;
    }
  } catch (error) {
    console.log('❌ Error fetching members:', error.message);
    return null;
  }
}

async function runBasicTests() {
  console.log('🚀 Starting Basic Connection Tests for VibeStack Pro');
  console.log('=' .repeat(60));
  
  const results = {
    connectivity: false,
    organization: null,
    invoices: null,
    members: null,
    summary: {
      passed: 0,
      failed: 0
    }
  };
  
  // Test 1: Basic connectivity
  results.connectivity = await testBasicConnectivity();
  if (results.connectivity) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
    console.log('\n❌ Cannot proceed with other tests - GraphQL connection failed');
    return results;
  }
  
  // Test 2: Organization data
  results.organization = await testOrganizationData();
  if (results.organization) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }
  
  // Test 3: Invoice history
  results.invoices = await testInvoiceHistory();
  if (results.invoices !== null) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }
  
  // Test 4: Organization members
  results.members = await testOrganizationMembers();
  if (results.members !== null) {
    results.summary.passed++;
  } else {
    results.summary.failed++;
  }
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 BASIC TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${results.summary.passed}/4`);
  console.log(`❌ Failed: ${results.summary.failed}/4`);
  console.log(`📈 Success Rate: ${((results.summary.passed / 4) * 100).toFixed(1)}%`);
  
  if (results.organization) {
    console.log('\n📋 Organization Summary:');
    console.log(`   Status: ${results.organization.subscriptionStatus || 'No active subscription'}`);
    console.log(`   Users: ${results.organization.activeUserCount || 0} active, ${results.organization.purchasedLicenses || 0} licensed`);
    console.log(`   Stripe Setup: ${results.organization.stripeCustomerId ? 'Complete' : 'Incomplete'}`);
    
    if (results.invoices) {
      console.log(`   Invoice History: ${results.invoices.length} invoices`);
    }
    
    if (results.members) {
      console.log(`   Team Members: ${results.members.length} members`);
    }
  }
  
  // Recommendations
  console.log('\n💡 Next Steps:');
  if (!results.organization.stripeCustomerId) {
    console.log('   1. Set up Stripe customer for this organization');
  }
  if (!results.organization.subscriptionStatus || results.organization.subscriptionStatus === 'NONE') {
    console.log('   2. Create a subscription for testing');
  }
  console.log('   3. Set STRIPE_SECRET_KEY environment variable to run full payment tests');
  console.log('   4. Run: node quick-test-runner.js --all');
  
  return results;
}

// Run if executed directly
if (require.main === module) {
  runBasicTests().catch(console.error);
}

module.exports = { runBasicTests };