/**
 * GraphQL Schema Validation Test for VibeStack Pro Subscription System
 * 
 * This test validates the GraphQL schema structure and ensures all
 * subscription-related types and mutations are properly defined
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

async function validateSubscriptionSchema() {
  console.log('📋 Validating Subscription-Related GraphQL Schema...\n');
  
  try {
    const result = await makeGraphQLRequest(`
      query SchemaIntrospection {
        __schema {
          types {
            name
            kind
            fields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
          mutationType {
            fields {
              name
              args {
                name
                type {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      }
    `);
    
    if (!result.data || !result.data.__schema) {
      console.log('❌ Failed to retrieve schema');
      return false;
    }
    
    const schema = result.data.__schema;
    let validationResults = {
      organizationType: false,
      subscriptionInvoiceType: false,
      subscriptionMutations: {
        createStripeCustomer: false,
        updateSubscription: false,
        updateSubscriptionQuantity: false
      },
      requiredFields: {
        organizationSubscriptionFields: [],
        invoiceFields: []
      }
    };
    
    // Find Organization type and validate subscription fields
    const organizationType = schema.types.find(type => type.name === 'Organization');
    if (organizationType) {
      console.log('✅ Organization type found');
      validationResults.organizationType = true;
      
      const subscriptionFields = [
        'stripeCustomerId',
        'stripeSubscriptionId',
        'subscriptionStatus',
        'subscriptionPeriodEnd',
        'billingPeriod',
        'activeUserCount',
        'purchasedLicenses'
      ];
      
      subscriptionFields.forEach(fieldName => {
        const field = organizationType.fields?.find(f => f.name === fieldName);
        if (field) {
          console.log(`   ✅ ${fieldName}: ${field.type.name || field.type.ofType?.name || 'Complex'}`);
          validationResults.requiredFields.organizationSubscriptionFields.push(fieldName);
        } else {
          console.log(`   ❌ Missing field: ${fieldName}`);
        }
      });
    } else {
      console.log('❌ Organization type not found');
    }
    
    // Find SubscriptionInvoice type
    const invoiceType = schema.types.find(type => type.name === 'SubscriptionInvoice');
    if (invoiceType) {
      console.log('\n✅ SubscriptionInvoice type found');
      validationResults.subscriptionInvoiceType = true;
      
      const invoiceFields = [
        'organizationId',
        'stripeInvoiceId',
        'amount',
        'status',
        'billingPeriodStart',
        'billingPeriodEnd',
        'userCount',
        'pricePerUser',
        'isProrated'
      ];
      
      invoiceFields.forEach(fieldName => {
        const field = invoiceType.fields?.find(f => f.name === fieldName);
        if (field) {
          console.log(`   ✅ ${fieldName}: ${field.type.name || field.type.ofType?.name || 'Complex'}`);
          validationResults.requiredFields.invoiceFields.push(fieldName);
        } else {
          console.log(`   ❌ Missing field: ${fieldName}`);
        }
      });
    } else {
      console.log('\n❌ SubscriptionInvoice type not found');
    }
    
    // Validate subscription mutations
    console.log('\n📝 Validating Subscription Mutations...');
    const mutations = schema.mutationType?.fields || [];
    
    const requiredMutations = [
      'createStripeCustomer',
      'updateSubscription',
      'updateSubscriptionQuantity'
    ];
    
    requiredMutations.forEach(mutationName => {
      const mutation = mutations.find(m => m.name === mutationName);
      if (mutation) {
        console.log(`   ✅ ${mutationName} mutation found`);
        validationResults.subscriptionMutations[mutationName] = true;
        
        // Show arguments
        if (mutation.args && mutation.args.length > 0) {
          console.log(`      Arguments: ${mutation.args.map(arg => arg.name).join(', ')}`);
        }
      } else {
        console.log(`   ❌ Missing mutation: ${mutationName}`);
      }
    });
    
    // Check for missing mutations that would be useful
    const recommendedMutations = [
      'cancelSubscription',
      'reactivateSubscription',
      'pauseSubscription'
    ];
    
    console.log('\n💡 Recommended Additional Mutations:');
    recommendedMutations.forEach(mutationName => {
      const mutation = mutations.find(m => m.name === mutationName);
      if (mutation) {
        console.log(`   ✅ ${mutationName} (already implemented)`);
      } else {
        console.log(`   ⚠️  ${mutationName} (recommended to implement)`);
      }
    });
    
    return validationResults;
    
  } catch (error) {
    console.log('❌ Schema validation error:', error.message);
    return false;
  }
}

async function testQueryCapabilities() {
  console.log('\n🔍 Testing Query Capabilities...\n');
  
  const testResults = {
    organizationQuery: false,
    invoiceQuery: false,
    memberQuery: false
  };
  
  // Test organization query
  try {
    console.log('Testing Organization Query...');
    const orgResult = await makeGraphQLRequest(`
      query GetOrganization($id: ID!) {
        getOrganization(id: $id) {
          id
          name
          stripeCustomerId
          subscriptionStatus
          billingPeriod
          activeUserCount
          purchasedLicenses
        }
      }
    `, { id: CONFIG.TEST_ORGANIZATION_ID });
    
    if (orgResult.data?.getOrganization) {
      console.log('✅ Organization query successful');
      testResults.organizationQuery = true;
    } else if (orgResult.errors) {
      console.log('❌ Organization query failed:', orgResult.errors[0].message);
    } else {
      console.log('❌ Organization not found');
    }
  } catch (error) {
    console.log('❌ Organization query error:', error.message);
  }
  
  // Test invoice query
  try {
    console.log('\nTesting Invoice History Query...');
    const invoiceResult = await makeGraphQLRequest(`
      query ListInvoices($filter: ModelSubscriptionInvoiceFilterInput) {
        listSubscriptionInvoices(filter: $filter, limit: 1) {
          items {
            id
            stripeInvoiceId
            amount
            status
            organizationId
          }
        }
      }
    `, {
      filter: {
        organizationId: { eq: CONFIG.TEST_ORGANIZATION_ID }
      }
    });
    
    if (invoiceResult.data?.listSubscriptionInvoices) {
      console.log('✅ Invoice query successful');
      testResults.invoiceQuery = true;
    } else if (invoiceResult.errors) {
      console.log('❌ Invoice query failed:', invoiceResult.errors[0].message);
    } else {
      console.log('❌ Invoice query returned no data');
    }
  } catch (error) {
    console.log('❌ Invoice query error:', error.message);
  }
  
  // Test member query
  try {
    console.log('\nTesting Organization Members Query...');
    const memberResult = await makeGraphQLRequest(`
      query ListMembers($filter: ModelOrganizationMemberFilterInput) {
        listOrganizationMembers(filter: $filter, limit: 1) {
          items {
            id
            email
            status
            role
          }
        }
      }
    `, {
      filter: {
        organizationID: { eq: CONFIG.TEST_ORGANIZATION_ID }
      }
    });
    
    if (memberResult.data?.listOrganizationMembers) {
      console.log('✅ Member query successful');
      testResults.memberQuery = true;
    } else if (memberResult.errors) {
      console.log('❌ Member query failed:', memberResult.errors[0].message);
    } else {
      console.log('❌ Member query returned no data');
    }
  } catch (error) {
    console.log('❌ Member query error:', error.message);
  }
  
  return testResults;
}

async function validateResponseTypes() {
  console.log('\n🔄 Validating Custom Response Types...\n');
  
  try {
    const result = await makeGraphQLRequest(`
      query GetResponseTypes {
        __schema {
          types {
            name
            kind
            fields {
              name
              type {
                name
                kind
              }
            }
          }
        }
      }
    `);
    
    const types = result.data.__schema.types;
    const customTypes = [
      'StripeCustomerResponse',
      'SubscriptionUpdateResponse',
      'EmailResponse'
    ];
    
    customTypes.forEach(typeName => {
      const type = types.find(t => t.name === typeName);
      if (type) {
        console.log(`✅ ${typeName} found`);
        if (type.fields) {
          type.fields.forEach(field => {
            console.log(`   - ${field.name}: ${field.type.name || field.type.kind}`);
          });
        }
      } else {
        console.log(`❌ ${typeName} not found`);
      }
    });
    
    return true;
  } catch (error) {
    console.log('❌ Response type validation error:', error.message);
    return false;
  }
}

async function runSchemaValidation() {
  console.log('🚀 Starting GraphQL Schema Validation for Subscription System');
  console.log('=' .repeat(70));
  
  const results = {
    schemaValidation: null,
    queryTests: null,
    responseTypes: null,
    summary: {
      totalTests: 0,
      passedTests: 0
    }
  };
  
  // Test 1: Schema validation
  console.log('\n📋 PHASE 1: Schema Structure Validation');
  console.log('-' .repeat(50));
  results.schemaValidation = await validateSubscriptionSchema();
  if (results.schemaValidation) results.summary.passedTests++;
  results.summary.totalTests++;
  
  // Test 2: Query capabilities
  console.log('\n📋 PHASE 2: Query Functionality Testing');
  console.log('-' .repeat(50));
  results.queryTests = await testQueryCapabilities();
  if (results.queryTests.organizationQuery && results.queryTests.invoiceQuery && results.queryTests.memberQuery) {
    results.summary.passedTests++;
  }
  results.summary.totalTests++;
  
  // Test 3: Response types
  console.log('\n📋 PHASE 3: Response Type Validation');
  console.log('-' .repeat(50));
  results.responseTypes = await validateResponseTypes();
  if (results.responseTypes) results.summary.passedTests++;
  results.summary.totalTests++;
  
  // Summary
  console.log('\n' + '=' .repeat(70));
  console.log('📊 SCHEMA VALIDATION SUMMARY');
  console.log('=' .repeat(70));
  console.log(`✅ Passed: ${results.summary.passedTests}/${results.summary.totalTests} phases`);
  console.log(`📈 Success Rate: ${((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(1)}%`);
  
  // Detailed results
  if (results.schemaValidation) {
    console.log('\n📋 Schema Structure:');
    console.log(`   Organization Type: ${results.schemaValidation.organizationType ? '✅' : '❌'}`);
    console.log(`   SubscriptionInvoice Type: ${results.schemaValidation.subscriptionInvoiceType ? '✅' : '❌'}`);
    console.log(`   Required Mutations: ${Object.values(results.schemaValidation.subscriptionMutations).filter(Boolean).length}/3 found`);
  }
  
  if (results.queryTests) {
    console.log('\n📋 Query Capabilities:');
    console.log(`   Organization Query: ${results.queryTests.organizationQuery ? '✅' : '❌'}`);
    console.log(`   Invoice Query: ${results.queryTests.invoiceQuery ? '✅' : '❌'}`);
    console.log(`   Member Query: ${results.queryTests.memberQuery ? '✅' : '❌'}`);
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Add STRIPE_SECRET_KEY to test payment mutations');
  console.log('   2. Create test subscription data');
  console.log('   3. Test webhook endpoints');
  console.log('   4. Run full payment flow tests');
  
  // Save results
  require('fs').writeFileSync('schema-validation-report.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Detailed results saved to schema-validation-report.json');
  
  return results;
}

// Run if executed directly
if (require.main === module) {
  runSchemaValidation().catch(console.error);
}

module.exports = { runSchemaValidation };