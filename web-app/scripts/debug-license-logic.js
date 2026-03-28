// Debug license detection logic with real webhook data
const testWebhookData = {
  invoice: {
    id: "in_1S9C1VBrkA8Ed3JI39HBOo5M",
    billing_reason: "subscription_create",
    amount_paid: 298
  },
  subscription: {
    id: "sub_1S9C1VBrkA8Ed3JIh8iEykjz",
    items: {
      data: [{
        quantity: 1
      }]
    },
    metadata: {
      additional_licenses: '1',
      organization_id: '295a215f-df38-46b8-b1db-d48c1e336ca2',
      type: 'license_purchase'
    }
  },
  organization: {
    purchasedLicenses: 1
  }
};

function debugLicenseLogic(invoice, subscription, organization) {
  console.log('🔍 Debugging License Detection Logic\n');
  
  // Get the current quantity from the subscription
  const subscriptionQuantity = subscription && subscription.items && subscription.items.data && subscription.items.data[0] ? subscription.items.data[0].quantity : 1;
  console.log('1. Subscription quantity:', subscriptionQuantity);
  
  // Debug subscription metadata
  console.log('2. Subscription metadata:', subscription ? subscription.metadata : 'No subscription');
  console.log('3. Invoice billing reason:', invoice.billing_reason);
  
  // Check if this is a license purchase (multiple ways to detect)
  const condition1 = invoice.billing_reason === 'subscription_create';
  const condition2 = (subscription && subscription.metadata?.type === 'license_purchase');
  const condition3 = (subscription && subscription.metadata?.additional_licenses);
  
  console.log('\n4. License Purchase Detection:');
  console.log('   - billing_reason === "subscription_create":', condition1);
  console.log('   - metadata.type === "license_purchase":', condition2);
  console.log('   - metadata.additional_licenses exists:', condition3);
  
  const isLicensePurchase = condition1 || condition2 || condition3;
  console.log('   - Final isLicensePurchase result:', isLicensePurchase);
  
  let purchasedLicenses;
  let invoiceUserCount;
  let pricePerUser;
  
  if (isLicensePurchase) {
    // This is a new license purchase - ADD to existing licenses
    purchasedLicenses = (organization.purchasedLicenses || 0) + subscriptionQuantity;
    invoiceUserCount = subscriptionQuantity;
    pricePerUser = (invoice.amount_paid / 100) / subscriptionQuantity;
    console.log('\n🔥 LICENSE PURCHASE DETECTED - ADDING licenses:', { 
      existing: organization.purchasedLicenses || 0,
      adding: subscriptionQuantity,
      newTotal: purchasedLicenses, 
      invoiceUserCount,
      detectionMethod: (subscription && subscription.metadata?.type) ? 'metadata' : 'billing_reason'
    });
  } else {
    // Regular subscription renewal - ONLY replace if we're sure it's not a license purchase
    purchasedLicenses = subscriptionQuantity;
    invoiceUserCount = subscriptionQuantity;
    pricePerUser = (invoice.amount_paid / 100) / subscriptionQuantity;
    console.log('\n⚠️ SUBSCRIPTION RENEWAL - REPLACING licenses:', { 
      oldLicenses: organization.purchasedLicenses,
      newLicenses: purchasedLicenses, 
      invoiceUserCount 
    });
  }
  
  console.log('\n5. Final Calculation:');
  console.log('   - Organization will be updated to:', purchasedLicenses, 'licenses');
  console.log('   - Expected in UI: License count should go from', organization.purchasedLicenses, 'to', purchasedLicenses);
  
  return {
    isLicensePurchase,
    purchasedLicenses,
    invoiceUserCount,
    pricePerUser
  };
}

// Run the test
const result = debugLicenseLogic(
  testWebhookData.invoice,
  testWebhookData.subscription,
  testWebhookData.organization
);

console.log('\n📊 Test Result:', result);