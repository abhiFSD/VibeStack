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

const listOrganizationsQuery = `
  query ListOrganizations($limit: Int) {
    listOrganizations(limit: $limit) {
      items {
        id
        name
        owner
        purchasedLicenses
        stripeCustomerId
        subscriptionStatus
        activeUserCount
      }
    }
  }
`;

async function getTestOrganizations() {
  try {
    console.log('🔍 Fetching organizations for testing...');
    
    const result = await API.graphql({
      query: listOrganizationsQuery,
      variables: { limit: 10 }
    });
    
    const organizations = result.data.listOrganizations.items;
    
    if (organizations.length === 0) {
      console.log('❌ No organizations found!');
      return;
    }
    
    console.log(`\n📋 Found ${organizations.length} organizations:\n`);
    
    organizations.forEach((org, index) => {
      console.log(`${index + 1}. ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Owner: ${org.owner}`);
      console.log(`   Purchased Licenses: ${org.purchasedLicenses || 0}`);
      console.log(`   Active Users: ${org.activeUserCount || 0}`);
      console.log(`   Stripe Customer: ${org.stripeCustomerId ? 'Yes' : 'No'}`);
      console.log(`   Subscription Status: ${org.subscriptionStatus || 'None'}`);
      console.log('');
    });
    
    // Suggest the first organization for testing
    const testOrg = organizations[0];
    console.log(`💡 To test with "${testOrg.name}", run:`);
    console.log(`   node quick-license-test.js "${testOrg.id}" 3 MONTHLY`);
    console.log('');
    console.log(`📝 Or run multiple tests:`);
    console.log(`   node quick-license-test.js "${testOrg.id}"`);
    
  } catch (error) {
    console.error('❌ Error fetching organizations:', error.message);
    console.error('Full error:', error);
  }
}

getTestOrganizations();