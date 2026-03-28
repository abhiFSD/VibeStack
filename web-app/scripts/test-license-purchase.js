const { API } = require('aws-amplify');
const AWS = require('aws-sdk');

// Configure Amplify
const amplifyConfig = {
  aws_project_region: 'us-west-2',
  aws_appsync_graphqlEndpoint: 'https://ah2gzx5zdrel3csp6obhtctgtu.appsync-api.us-west-2.amazonaws.com/graphql',
  aws_appsync_region: 'us-west-2',
  aws_appsync_authenticationType: 'API_KEY',
  aws_appsync_apiKey: 'YOUR_GRAPHQL_API_KEY_HERE'
};

require('aws-amplify').Amplify.configure(amplifyConfig);

// Test organization ID - replace with actual test organization ID
const TEST_ORGANIZATION_ID = 'test-org-id-here';

// GraphQL queries and mutations
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
      stripeSubscriptionId
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

class LicenseTestSuite {
  constructor(organizationId) {
    this.organizationId = organizationId;
    this.testResults = [];
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, data };
    console.log(`[${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    this.testResults.push(logEntry);
  }

  async getOrganizationData() {
    try {
      const result = await API.graphql({
        query: getOrganizationQuery,
        variables: { id: this.organizationId }
      });
      return result.data.getOrganization;
    } catch (error) {
      await this.log('ERROR: Failed to get organization data', error.message);
      throw error;
    }
  }

  async getInvoiceHistory() {
    try {
      const result = await API.graphql({
        query: listInvoicesQuery,
        variables: {
          filter: {
            organizationId: { eq: this.organizationId }
          }
        }
      });
      return result.data.listSubscriptionInvoices.items;
    } catch (error) {
      await this.log('ERROR: Failed to get invoice history', error.message);
      throw error;
    }
  }

  async testLicensePurchase(quantity, billingPeriod = 'MONTHLY') {
    await this.log(`\n=== TESTING LICENSE PURCHASE ===`);
    await this.log(`Quantity: ${quantity}, Billing Period: ${billingPeriod}`);

    try {
      // Get initial state
      const initialOrg = await this.getOrganizationData();
      const initialLicenses = initialOrg?.purchasedLicenses || 0;
      await this.log('Initial organization state', {
        purchasedLicenses: initialLicenses,
        stripeCustomerId: initialOrg?.stripeCustomerId,
        subscriptionStatus: initialOrg?.subscriptionStatus
      });

      // Get initial invoice count
      const initialInvoices = await this.getInvoiceHistory();
      await this.log(`Initial invoice count: ${initialInvoices.length}`);

      // Test the purchase
      await this.log(`Attempting to purchase ${quantity} licenses...`);
      const purchaseResult = await API.graphql({
        query: purchaseLicensesMutation,
        variables: {
          organizationId: this.organizationId,
          quantity: quantity,
          billingPeriod: billingPeriod
        }
      });

      const response = purchaseResult.data.purchaseLicenses;
      await this.log('Purchase response', response);

      if (!response.success) {
        await this.log('PURCHASE FAILED', response.error);
        return false;
      }

      // Verify the response data
      const expectedAmount = billingPeriod === 'MONTHLY' ? 2.98 * quantity : 32.00 * quantity;
      const amountMatch = Math.abs(response.totalAmount - expectedAmount) < 0.01;

      await this.log('Response verification', {
        requestedQuantity: quantity,
        returnedQuantity: response.licensesPurchased,
        quantityMatch: response.licensesPurchased === quantity,
        expectedAmount: expectedAmount,
        returnedAmount: response.totalAmount,
        amountMatch: amountMatch,
        hasClientSecret: !!response.clientSecret
      });

      // Wait a moment for potential webhook processing
      await this.log('Waiting 3 seconds for potential webhook processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Sync payment status
      await this.log('Syncing payment status...');
      const syncResult = await API.graphql({
        query: syncPaymentStatusMutation,
        variables: { organizationId: this.organizationId }
      });
      await this.log('Sync result', syncResult.data.syncPaymentStatus);

      // Check final state
      const finalOrg = await this.getOrganizationData();
      const finalLicenses = finalOrg?.purchasedLicenses || 0;
      
      const finalInvoices = await this.getInvoiceHistory();
      const newInvoices = finalInvoices.filter(inv => 
        !initialInvoices.some(initial => initial.id === inv.id)
      );

      await this.log('Final organization state', {
        purchasedLicenses: finalLicenses,
        licenseIncrease: finalLicenses - initialLicenses,
        subscriptionStatus: finalOrg?.subscriptionStatus
      });

      await this.log(`New invoices created: ${newInvoices.length}`);
      if (newInvoices.length > 0) {
        newInvoices.forEach((invoice, index) => {
          this.log(`New Invoice ${index + 1}`, {
            id: invoice.id,
            amount: invoice.amount,
            status: invoice.status,
            userCount: invoice.userCount,
            billingPeriod: invoice.billingPeriod,
            isProrated: invoice.isProrated
          });
        });
      }

      // Validate results
      const success = response.licensesPurchased === quantity && amountMatch;
      await this.log(`TEST RESULT: ${success ? 'PASSED' : 'FAILED'}`);

      return success;

    } catch (error) {
      await this.log('PURCHASE ERROR', error.message);
      return false;
    }
  }

  async runFullTestSuite() {
    await this.log('\n🚀 Starting License Purchase Test Suite');
    await this.log(`Testing Organization ID: ${this.organizationId}`);

    const testCases = [
      { quantity: 1, billingPeriod: 'MONTHLY' },
      { quantity: 3, billingPeriod: 'MONTHLY' },
      { quantity: 5, billingPeriod: 'YEARLY' },
      { quantity: 2, billingPeriod: 'YEARLY' },
      { quantity: 10, billingPeriod: 'MONTHLY' }
    ];

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      await this.log(`\n📋 Test Case ${i + 1}/${testCases.length}`);
      
      const result = await this.testLicensePurchase(testCase.quantity, testCase.billingPeriod);
      
      if (result) {
        passed++;
        await this.log(`✅ Test Case ${i + 1} PASSED`);
      } else {
        failed++;
        await this.log(`❌ Test Case ${i + 1} FAILED`);
      }

      // Wait between tests
      if (i < testCases.length - 1) {
        await this.log('Waiting 5 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    await this.log('\n📊 TEST SUITE SUMMARY');
    await this.log(`Total Tests: ${testCases.length}`);
    await this.log(`Passed: ${passed}`);
    await this.log(`Failed: ${failed}`);
    await this.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

    // Final invoice history
    await this.log('\n📋 Final Invoice History');
    const allInvoices = await this.getInvoiceHistory();
    await this.log(`Total Invoices: ${allInvoices.length}`);
    
    allInvoices.forEach((invoice, index) => {
      this.log(`Invoice ${index + 1}`, {
        amount: invoice.amount,
        status: invoice.status,
        userCount: invoice.userCount,
        billingPeriod: invoice.billingPeriod,
        date: invoice.createdAt
      });
    });

    return { passed, failed, total: testCases.length };
  }

  async saveTestResults() {
    const fs = require('fs');
    const filename = `license-test-results-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(this.testResults, null, 2));
    await this.log(`Test results saved to ${filename}`);
  }
}

// Main execution
async function main() {
  // You need to replace this with an actual organization ID from your database
  const organizationId = process.argv[2];
  
  if (!organizationId) {
    console.error('Usage: node test-license-purchase.js <organization-id>');
    console.error('Example: node test-license-purchase.js "123e4567-e89b-12d3-a456-426614174000"');
    process.exit(1);
  }

  const tester = new LicenseTestSuite(organizationId);
  
  try {
    // Verify organization exists first
    const org = await tester.getOrganizationData();
    if (!org) {
      console.error(`Organization ${organizationId} not found!`);
      process.exit(1);
    }

    await tester.log(`Found organization: ${org.name}`);
    
    // Run the test suite
    const results = await tester.runFullTestSuite();
    
    // Save results
    await tester.saveTestResults();
    
    console.log('\n🎉 Test suite completed!');
    process.exit(results.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = LicenseTestSuite;