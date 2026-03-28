# Payment & Token System Documentation: API Tokens, Coins & Subscription Management

## Overview

This document provides comprehensive documentation of VibeStack™ Pro's payment and token ecosystem, which includes subscription licensing, learning coin rewards, internal shop system, and comprehensive transaction tracking. The system supports multiple payment types: subscription licenses (Stripe integration), learning coins (gamification rewards), and shop purchases (coin-based internal economy).

---

## 🏗️ **System Architecture Overview**

```
Stripe Payment Gateway
           ↓
    Subscription Management (Licenses)
           ↓
    Learning Coin System (Rewards/API Tokens)
           ↓
    Internal Shop System (Coin Spending)
           ↓
    Purchase History & Transaction Tracking
           ↓
    Invoice Management & Billing
```

---

## 💳 **Payment System Types**

### **1. Subscription Payments (License Management)**
- **Purpose**: Organization-level subscription licensing  
- **Payment Method**: Stripe integration
- **Billing**: Monthly/Yearly recurring
- **Units**: Per-user licenses

### **2. Learning Coins (API Token System)**
- **Purpose**: User rewards and API token purchasing
- **Earning Method**: Automated rewards for activities
- **Usage**: Internal shop purchases, API access
- **Units**: Coins (integer values)

### **3. Internal Shop Purchases**
- **Purpose**: Digital goods and rewards marketplace
- **Payment Method**: Learning coins only
- **Approval**: Admin-approved purchase workflow
- **Items**: Badges, avatars, themes, digital rewards

---

## 🗄️ **GraphQL Schema: Payment & Token Entities**

### **UserCoins Entity** (API Token Balance)
**File**: `schema.graphql` lines 126-134

```graphql
type UserCoins @model @auth(rules: [{allow: public}]) {
  id: ID!                              # Unique balance record ID
  user_sub: String!                    # User's Cognito ID (userSub)
  total_coins: Int!                    # Current coin balance (API tokens available)
  organizationID: ID! @index(name: "byOrganization")  # Organization context
  _version: Int                        # Optimistic locking
  _deleted: Boolean                    # Soft delete flag
  _lastChangedAt: AWSTimestamp         # Last modification timestamp
}
```

### **Awards Entity** (Coin Transaction History)
**File**: `schema.graphql` lines 110-124

```graphql
type Awards @model @auth(rules: [{allow: public}]) {
  id: ID!                              # Unique transaction ID
  title: String                        # Award title/description
  date: String                         # Transaction date
  description: String                  # Transaction details
  user_sub: String                     # Recipient's Cognito ID
  tool_id: String                      # Tool/source of award
  type: AwardType                      # Award category (see enum below)
  coins: Int                           # Coins awarded/deducted
  organizationID: ID! @index(name: "byOrganization")  # Organization context
  customType: String                   # Custom award type
  _version: Int                        # Version control
  _deleted: Boolean                    # Soft delete
  _lastChangedAt: AWSTimestamp         # Audit timestamp
}
```

### **AwardType Enum** (Transaction Categories)
**File**: `schema.graphql` lines 43-62

```graphql
enum AwardType {
  QUIZ_PERFECT                         # Perfect quiz completion
  QUIZ_MASTERY                         # Quiz mastery achievement
  REPORT_COMPLETE                      # Report completion
  PROJECT_COMPLETE                     # Project completion
  ACTION_ITEM_COMPLETE                 # Action item completion
  HIGHLIGHT_ADDED                      # Adding highlights/observations
  VSM_COMPLETE                         # Value Stream Mapping completion
  CATEGORY_COMPLETE                    # Category assessment completion
  STATEMENT_COMPLETE                   # Statement completion
  FEEDBACK_PROVIDED                    # Providing feedback
  TEAM_COLLABORATION                   # Team collaboration activities
  FIRST_LOGIN                          # First-time user login
  PROFILE_COMPLETE                     # Profile completion
  WEEKLY_GOALS_MET                     # Weekly goal achievement
  MONTHLY_GOALS_MET                    # Monthly goal achievement
  CUSTOM_ACHIEVEMENT                   # Custom organization achievements
  KPI_GOAL_ACHIEVED                    # KPI goal achievement
  LEARNING_TIME_MILESTONE              # Learning time milestones
}
```

### **AwardDefinition Entity** (Coin Reward Rules)
**File**: `schema.graphql` lines 95-108

```graphql
type AwardDefinition @model @auth(rules: [{allow: public}]) {
  id: ID!                              # Unique definition ID
  type: AwardType!                     # Award type from enum
  coins: Int!                          # Coins to award for this type
  title: String!                       # Award display title
  description: String!                 # Award description
  organizationID: ID! @index(name: "byOrganization")  # Organization-specific rules
  organization: Organization @belongsTo(fields: ["organizationID"])
  isEnabled: Boolean!                  # Whether this award is active
  customType: String                   # Custom award identifier
  _version: Int                        # Version control
  _deleted: Boolean                    # Soft delete
  _lastChangedAt: AWSTimestamp         # Audit timestamp
}
```

---

## 🛒 **Internal Shop System Schema**

### **ShopItem Entity** (Digital Marketplace)
**File**: `schema.graphql` lines 585-599

```graphql
type ShopItem @model @auth(rules: [{allow: public}]) {
  id: ID!                              # Unique item ID
  name: String!                        # Item name/title
  description: String                  # Item description
  price: Int!                          # Price in coins
  image: String                        # S3 key for item image
  isEnabled: Boolean!                  # Whether item is available for purchase
  organizationID: ID! @index(name: "byOrganization")  # Organization-specific items
  organization: Organization @belongsTo(fields: ["organizationID"])
  type: String                         # Item category: "BADGE", "AVATAR", "THEME"
  purchases: [UserPurchase] @hasMany(indexName: "byShopItem", fields: ["id"])
  _version: Int                        # Version control
  _deleted: Boolean                    # Soft delete
  _lastChangedAt: AWSTimestamp         # Audit timestamp
}
```

### **UserPurchase Entity** (Purchase Transaction History)
**File**: `schema.graphql` lines 601-617

```graphql
type UserPurchase @model @auth(rules: [{allow: public}]) {
  id: ID!                              # Unique purchase ID
  shopItemID: ID! @index(name: "byShopItem")          # Links to purchased item
  shopItem: ShopItem @belongsTo(fields: ["shopItemID"])
  user_sub: String!                    # Purchaser's Cognito ID
  purchaseDate: AWSDateTime!           # Purchase timestamp
  organizationID: ID! @index(name: "byOrganization")  # Organization context
  organization: Organization @belongsTo(fields: ["organizationID"])
  status: String!                      # "PENDING" | "APPROVED" | "REJECTED" | "DELIVERED"
  approvedBy: String                   # Admin user_sub who approved/rejected
  approvedDate: AWSDateTime            # Admin action timestamp
  rejectionReason: String              # Reason for rejection (if rejected)
  deliveryNotes: String                # Delivery details/notes
  _version: Int                        # Version control
  _deleted: Boolean                    # Soft delete
  _lastChangedAt: AWSTimestamp         # Audit timestamp
}
```

---

## 💰 **Subscription Management Schema**

### **SubscriptionInvoice Entity** (Billing History)
**File**: `schema.graphql` lines 556-583

```graphql
type SubscriptionInvoice @model @auth(rules: [
  { allow: owner },
  { allow: public }
]) {
  id: ID!                              # Unique invoice ID
  organizationId: ID! @index(name: "byOrganization")   # Organization being billed
  organization: Organization @belongsTo(fields: ["organizationId"])
  stripeInvoiceId: String!             # Stripe invoice identifier
  amount: Float!                       # Total invoice amount
  status: String!                      # "PAID" | "UNPAID" | "FAILED"
  billingPeriodStart: AWSDateTime!     # Billing period start date
  billingPeriodEnd: AWSDateTime!       # Billing period end date
  userCount: Int!                      # Number of licensed users
  pricePerUser: Float!                 # Cost per user for this period
  billingPeriod: String!               # "MONTHLY" | "YEARLY"
  hostedInvoiceUrl: String             # Stripe hosted invoice URL
  invoicePdfUrl: String                # PDF download URL
  isProrated: Boolean!                 # Whether this is a prorated invoice
  proratedAmount: Float                # Prorated amount (if applicable)
  basePrice: Float!                    # Base subscription price
  prorationDate: AWSDateTime           # Date of proration event
  licenseChange: Int                   # License count change (+/- licenses)
  createdAt: AWSDateTime               # Invoice creation date
  updatedAt: AWSDateTime               # Last update date
  _version: Int                        # Version control
  _deleted: Boolean                    # Soft delete
  _lastChangedAt: AWSTimestamp         # Audit timestamp
}
```

### **Organization Subscription Fields**
**File**: `schema.graphql` lines 254-262

```graphql
# Within Organization entity
stripeCustomerId: String               # Stripe customer ID
stripeSubscriptionId: String           # Active subscription ID
stripeSubscriptionItemId: String       # Subscription item ID for quantity changes
subscriptionStatus: String             # "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED"
subscriptionPeriodEnd: AWSDateTime     # Current period end date
billingPeriod: String                  # "MONTHLY" | "YEARLY"
activeUserCount: Int                   # Current active users
purchasedLicenses: Int                 # Total purchased licenses
```

---

## 🔄 **API Endpoints & Mutations**

### **Payment-Related GraphQL Mutations**
**File**: `schema.graphql` lines 620-636

```graphql
type Mutation {
  # Stripe customer creation
  createStripeCustomer(organization: ID!): StripeCustomerResponse 
    @function(name: "createStripeCustomer-${env}")
  
  # Subscription management
  updateSubscription(
    organizationId: ID!, 
    billingPeriod: String!
  ): SubscriptionUpdateResponse 
    @function(name: "handleSubscribe-${env}")
  
  # License quantity changes
  updateSubscriptionQuantity(
    organizationId: ID!,
    newQuantity: Int!
  ): SubscriptionUpdateResponse 
    @function(name: "handleSubscribe-${env}")
  
  # License purchases
  purchaseLicenses(
    organizationId: ID!,
    quantity: Int!,
    billingPeriod: String!
  ): LicensePurchaseResponse 
    @function(name: "handleSubscribe-${env}")
  
  # Payment status synchronization
  syncPaymentStatus(organizationId: ID!): PaymentSyncResponse 
    @function(name: "handleSubscribe-${env}")
  
  # Email notifications
  sendEmail(input: SendEmailInput!): EmailResponse 
    @function(name: "notificationEmail-${env}")
}
```

### **Response Types**
```graphql
type StripeCustomerResponse {
  success: Boolean!                    # Operation success status
  customerId: String                   # Stripe customer ID
  error: String                        # Error message (if failed)
}

type SubscriptionUpdateResponse {
  success: Boolean!                    # Operation success status
  subscriptionId: String               # Stripe subscription ID
  clientSecret: String                 # Payment intent client secret
  proratedAmount: Float                # Prorated amount for changes
  additionalLicenses: Int              # Additional licenses added
  # ... additional response fields
}

type LicensePurchaseResponse {
  success: Boolean!                    # Purchase success status
  subscriptionId: String               # Created/updated subscription ID
  invoiceId: String                    # Stripe invoice ID
  amount: Float                        # Total purchase amount
  error: String                        # Error message (if failed)
}

type PaymentSyncResponse {
  success: Boolean!                    # Sync success status
  organizationId: String               # Organization ID processed
  message: String                      # Success message
  error: String                        # Error message (if failed)
}
```

---

## 🎯 **Learning Coin System (API Token Economy)**

### **Organization-Level Coin Configuration**
**File**: `schema.graphql` lines 263-266

```graphql
# Within Organization entity
learningCoinsPerInterval: Int          # Coins earned per interval (default: 5)
learningCoinInterval: Int              # Interval in seconds (default: 300 = 5 minutes)
learningMaxCoinsPerSession: Int        # Maximum coins per session (default: 20)
learningCoinsEnabled: Boolean          # Enable/disable coin rewards (default: true)
```

### **Coin Earning Mechanisms**

#### **Activity-Based Rewards**
```javascript
// Automatic coin awards for user activities
const awardTypes = {
  QUIZ_PERFECT: { coins: 50, description: "Perfect quiz score" },
  REPORT_COMPLETE: { coins: 100, description: "Completed lean methodology report" },
  ACTION_ITEM_COMPLETE: { coins: 25, description: "Completed action item" },
  VSM_COMPLETE: { coins: 150, description: "Completed Value Stream Mapping" },
  HIGHLIGHT_ADDED: { coins: 15, description: "Added highlight/observation" },
  FIRST_LOGIN: { coins: 20, description: "First login bonus" },
  PROFILE_COMPLETE: { coins: 30, description: "Completed user profile" }
};
```

#### **Time-Based Learning Rewards**
```javascript
// Coins earned during learning activities
const learningRewards = {
  interval: 300,              // 5 minutes
  coinsPerInterval: 5,        // 5 coins every 5 minutes
  maxPerSession: 20,          // Maximum 20 coins per learning session
  resetPeriod: 86400          // 24 hours between session resets
};
```

### **Coin Balance Management**

#### **Get User Coin Balance**
**File**: `awardDefinitions.js`

```javascript
export const getUserCoins = async (userSub, organizationID) => {
    try {
        const result = await API.graphql({
            query: queries.listUserCoins,
            variables: {
                filter: {
                    user_sub: { eq: userSub },
                    organizationID: { eq: organizationID },
                    _deleted: { ne: true }
                }
            }
        });
        
        const userCoins = result.data.listUserCoins.items[0];
        return userCoins ? userCoins.total_coins : 0;
    } catch (error) {
        console.error('Error fetching user coins:', error);
        return 0;
    }
};
```

#### **Award Coins for Activities**
```javascript
export const awardCoins = async (userSub, organizationID, awardType, customCoins = null) => {
    try {
        // Get award definition for this organization and type
        const awardDef = await getAwardDefinition(organizationID, awardType);
        const coinsToAward = customCoins || awardDef?.coins || 0;
        
        if (coinsToAward <= 0) return;
        
        // Create award record (transaction history)
        await API.graphql({
            query: mutations.createAwards,
            variables: {
                input: {
                    user_sub: userSub,
                    organizationID: organizationID,
                    type: awardType,
                    coins: coinsToAward,
                    title: awardDef.title,
                    description: awardDef.description,
                    date: new Date().toISOString()
                }
            }
        });
        
        // Update user's total coin balance
        await updateUserCoins(userSub, organizationID, coinsToAward);
        
    } catch (error) {
        console.error('Error awarding coins:', error);
    }
};
```

#### **Deduct Coins for Purchases**
```javascript
export const deductCoins = async (userSub, organizationID, amount, description) => {
    try {
        // Create deduction record (negative coins)
        await API.graphql({
            query: mutations.createAwards,
            variables: {
                input: {
                    user_sub: userSub,
                    organizationID: organizationID,
                    type: 'CUSTOM_ACHIEVEMENT',
                    coins: -amount,
                    title: 'Shop Purchase',
                    description: description,
                    date: new Date().toISOString()
                }
            }
        });
        
        // Update user's total coin balance
        await updateUserCoins(userSub, organizationID, -amount);
        
    } catch (error) {
        console.error('Error deducting coins:', error);
        throw error;
    }
};
```

---

## 🛒 **Internal Shop System Operations**

### **Shop Item Management**

#### **Get Shop Items**
**File**: `shop.js` lines 8-32

```javascript
export const getShopItems = async (organizationId) => {
    try {
        const result = await API.graphql({
            query: queries.listShopItems,
            variables: {
                filter: {
                    organizationID: { eq: organizationId }
                }
            }
        });
        
        // Filter out deleted items (keep both enabled and disabled for admin visibility)
        const filteredItems = result.data.listShopItems.items.filter(item => !item._deleted);
        
        return filteredItems;
    } catch (error) {
        console.error('Error fetching shop items:', error);
        return [];
    }
};
```

#### **Purchase Item (Coin-Based)**
**File**: `shop.js` lines 85-150

```javascript
export const purchaseItem = async (shopItemId, organizationId) => {
    try {
        const user = await Auth.currentAuthenticatedUser();
        
        // Get shop item details
        const itemResult = await API.graphql({
            query: queries.getShopItem,
            variables: { id: shopItemId }
        });
        const shopItem = itemResult.data.getShopItem;
        
        if (!shopItem || !shopItem.isEnabled) {
            throw new Error('Item is not available for purchase');
        }
        
        // Check user's coin balance
        const userCoins = await getUserCoins(user.attributes.sub, organizationId);
        if (userCoins < shopItem.price) {
            throw new Error(`Insufficient coins. You have ${userCoins} coins but need ${shopItem.price} coins.`);
        }
        
        // Create purchase request (PENDING status)
        const purchaseResult = await API.graphql({
            query: mutations.createUserPurchase,
            variables: {
                input: {
                    shopItemID: shopItemId,
                    user_sub: user.attributes.sub,
                    organizationID: organizationId,
                    status: 'PENDING',
                    purchaseDate: new Date().toISOString()
                }
            }
        });
        
        // Deduct coins immediately (will be refunded if rejected)
        await deductCoins(
            user.attributes.sub, 
            organizationId, 
            shopItem.price, 
            `Purchase: ${shopItem.name}`
        );
        
        // Send notification email to organization admins
        await sendPurchaseNotificationToAdmins(purchaseResult.data.createUserPurchase, shopItem);
        
        return { success: true, purchase: purchaseResult.data.createUserPurchase };
        
    } catch (error) {
        console.error('Error purchasing item:', error);
        throw error;
    }
};
```

### **Purchase Approval Workflow**

#### **Admin Approval Process**
```javascript
export const approvePurchase = async (purchaseId, adminUserSub, deliveryNotes = '') => {
    try {
        // Get purchase details
        const purchase = await API.graphql({
            query: queries.getUserPurchase,
            variables: { id: purchaseId }
        });
        
        const purchaseData = purchase.data.getUserPurchase;
        
        // Update purchase status to APPROVED
        await API.graphql({
            query: mutations.updateUserPurchase,
            variables: {
                input: {
                    id: purchaseId,
                    status: 'APPROVED',
                    approvedBy: adminUserSub,
                    approvedDate: new Date().toISOString(),
                    deliveryNotes: deliveryNotes,
                    _version: purchaseData._version
                }
            }
        });
        
        // Send approval notification to user
        await sendPurchaseApprovalNotification(purchaseData, true, deliveryNotes);
        
        return { success: true };
        
    } catch (error) {
        console.error('Error approving purchase:', error);
        throw error;
    }
};

export const rejectPurchase = async (purchaseId, adminUserSub, rejectionReason) => {
    try {
        // Get purchase details
        const purchase = await API.graphql({
            query: queries.getUserPurchase,
            variables: { id: purchaseId }
        });
        
        const purchaseData = purchase.data.getUserPurchase;
        
        // Get shop item for refund amount
        const shopItem = await API.graphql({
            query: queries.getShopItem,
            variables: { id: purchaseData.shopItemID }
        });
        
        // Refund coins to user
        await awardCoins(
            purchaseData.user_sub,
            purchaseData.organizationID,
            'CUSTOM_ACHIEVEMENT',
            shopItem.data.getShopItem.price
        );
        
        // Update purchase status to REJECTED
        await API.graphql({
            query: mutations.updateUserPurchase,
            variables: {
                input: {
                    id: purchaseId,
                    status: 'REJECTED',
                    approvedBy: adminUserSub,
                    approvedDate: new Date().toISOString(),
                    rejectionReason: rejectionReason,
                    _version: purchaseData._version
                }
            }
        });
        
        // Send rejection notification to user
        await sendPurchaseApprovalNotification(purchaseData, false, rejectionReason);
        
        return { success: true };
        
    } catch (error) {
        console.error('Error rejecting purchase:', error);
        throw error;
    }
};
```

---

## 💳 **Stripe Integration & Subscription Management**

### **Payment Modal Integration**
**File**: `PaymentModal.js` lines 14-91

```javascript
const CheckoutForm = ({ onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { activeOrganization } = useOrganization();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            setErrorMessage('Payment system not initialized properly');
            return;
        }

        setIsProcessing(true);
        setErrorMessage('');

        try {
            // Confirm payment with Stripe
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: window.location.origin + '/organization-management',
                },
                redirect: 'if_required'
            });

            if (error) {
                console.error('Payment confirmation error:', error);
                setErrorMessage(error.message || 'An error occurred while processing your payment');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                console.log('Payment succeeded:', paymentIntent);
                
                // Sync payment status with backend
                if (activeOrganization?.id) {
                    try {
                        const syncResult = await API.graphql({
                            query: `
                                mutation SyncPaymentStatus($organizationId: ID!) {
                                    syncPaymentStatus(organizationId: $organizationId) {
                                        success
                                        organizationId
                                        message
                                        error
                                    }
                                }
                            `,
                            variables: {
                                organizationId: activeOrganization.id
                            }
                        });
                        
                        if (syncResult.data.syncPaymentStatus.success) {
                            console.log('Payment status synced successfully');
                        }
                    } catch (syncError) {
                        console.error('Error syncing payment status:', syncError);
                    }
                }
                
                onSuccess();
                setTimeout(() => {
                    window.location.reload();
                }, 1500); // Give sync time to complete
            }
        } catch (err) {
            console.error('Payment processing error:', err);
            setErrorMessage(err.message || 'An unexpected error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            {errorMessage && (
                <Alert variant="danger" className="mt-3">
                    {errorMessage}
                </Alert>
            )}
            <Button 
                type="submit"
                variant="primary" 
                className="w-100 mt-3"
                disabled={!stripe || isProcessing}
            >
                {isProcessing ? (
                    <><Spinner animation="border" size="sm" /> Processing...</>
                ) : (
                    'Pay Now'
                )}
            </Button>
        </form>
    );
};
```

### **Subscription Operations**

#### **Create Stripe Customer**
```javascript
// GraphQL Mutation
mutation CreateStripeCustomer($organization: ID!) {
    createStripeCustomer(organization: $organization) {
        success
        customerId
        error
    }
}

// Usage
const createCustomer = async (organizationId) => {
    const result = await API.graphql({
        query: mutations.createStripeCustomer,
        variables: { organization: organizationId }
    });
    return result.data.createStripeCustomer;
};
```

#### **Purchase Licenses**
```javascript
// GraphQL Mutation
mutation PurchaseLicenses($organizationId: ID!, $quantity: Int!, $billingPeriod: String!) {
    purchaseLicenses(
        organizationId: $organizationId,
        quantity: $quantity,
        billingPeriod: $billingPeriod
    ) {
        success
        subscriptionId
        invoiceId
        amount
        error
    }
}

// Usage
const purchaseLicenses = async (organizationId, quantity, billingPeriod) => {
    const result = await API.graphql({
        query: mutations.purchaseLicenses,
        variables: {
            organizationId,
            quantity,
            billingPeriod // "MONTHLY" or "YEARLY"
        }
    });
    return result.data.purchaseLicenses;
};
```

#### **Update Subscription Quantity**
```javascript
// GraphQL Mutation
mutation UpdateSubscriptionQuantity($organizationId: ID!, $newQuantity: Int!) {
    updateSubscriptionQuantity(
        organizationId: $organizationId,
        newQuantity: $newQuantity
    ) {
        success
        subscriptionId
        proratedAmount
        additionalLicenses
        error
    }
}

// Usage for scaling licenses up/down
const updateLicenses = async (organizationId, newQuantity) => {
    const result = await API.graphql({
        query: mutations.updateSubscriptionQuantity,
        variables: {
            organizationId,
            newQuantity
        }
    });
    return result.data.updateSubscriptionQuantity;
};
```

---

## 📊 **Transaction History & Tracking**

### **User Transaction History (Coins)**

#### **Get User Award History**
```javascript
export const getUserAwardHistory = async (userSub, organizationID, limit = 100) => {
    try {
        const result = await API.graphql({
            query: queries.listAwards,
            variables: {
                filter: {
                    user_sub: { eq: userSub },
                    organizationID: { eq: organizationID },
                    _deleted: { ne: true }
                },
                limit: limit
            }
        });
        
        // Sort by date (newest first)
        const awards = result.data.listAwards.items.sort((a, b) => 
            new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
        );
        
        return awards;
    } catch (error) {
        console.error('Error fetching award history:', error);
        return [];
    }
};
```

#### **Get Purchase History**
```javascript
export const getUserPurchaseHistory = async (userSub, organizationID) => {
    try {
        const result = await API.graphql({
            query: queries.listUserPurchases,
            variables: {
                filter: {
                    user_sub: { eq: userSub },
                    organizationID: { eq: organizationID },
                    _deleted: { ne: true }
                }
            }
        });
        
        // Fetch shop item details for each purchase
        const purchasesWithItems = await Promise.all(
            result.data.listUserPurchases.items.map(async (purchase) => {
                const itemResult = await API.graphql({
                    query: queries.getShopItem,
                    variables: { id: purchase.shopItemID }
                });
                
                return {
                    ...purchase,
                    shopItem: itemResult.data.getShopItem
                };
            })
        );
        
        // Sort by purchase date (newest first)
        return purchasesWithItems.sort((a, b) => 
            new Date(b.purchaseDate) - new Date(a.purchaseDate)
        );
        
    } catch (error) {
        console.error('Error fetching purchase history:', error);
        return [];
    }
};
```

### **Organization Transaction History**

#### **Get Organization Invoice History**
```javascript
export const getOrganizationInvoices = async (organizationId) => {
    try {
        const result = await API.graphql({
            query: queries.listSubscriptionInvoices,
            variables: {
                filter: {
                    organizationId: { eq: organizationId },
                    _deleted: { ne: true }
                }
            }
        });
        
        // Sort by billing period (newest first)
        const invoices = result.data.listSubscriptionInvoices.items.sort((a, b) => 
            new Date(b.billingPeriodStart) - new Date(a.billingPeriodStart)
        );
        
        return invoices;
    } catch (error) {
        console.error('Error fetching organization invoices:', error);
        return [];
    }
};
```

#### **Get Organization Shop Analytics**
```javascript
export const getOrganizationShopAnalytics = async (organizationId) => {
    try {
        // Get all shop purchases for the organization
        const purchasesResult = await API.graphql({
            query: queries.listUserPurchases,
            variables: {
                filter: {
                    organizationID: { eq: organizationId },
                    _deleted: { ne: true }
                }
            }
        });
        
        const purchases = purchasesResult.data.listUserPurchases.items;
        
        // Calculate analytics
        const analytics = {
            totalPurchases: purchases.length,
            pendingApproval: purchases.filter(p => p.status === 'PENDING').length,
            approvedPurchases: purchases.filter(p => p.status === 'APPROVED').length,
            rejectedPurchases: purchases.filter(p => p.status === 'REJECTED').length,
            deliveredItems: purchases.filter(p => p.status === 'DELIVERED').length,
            totalCoinsSpent: 0,
            topItems: {}
        };
        
        // Calculate total coins spent and popular items
        for (const purchase of purchases) {
            if (purchase.shopItem) {
                analytics.totalCoinsSpent += purchase.shopItem.price;
                
                if (!analytics.topItems[purchase.shopItemID]) {
                    analytics.topItems[purchase.shopItemID] = {
                        name: purchase.shopItem.name,
                        count: 0,
                        totalCoins: 0
                    };
                }
                
                analytics.topItems[purchase.shopItemID].count++;
                analytics.topItems[purchase.shopItemID].totalCoins += purchase.shopItem.price;
            }
        }
        
        return analytics;
        
    } catch (error) {
        console.error('Error fetching shop analytics:', error);
        return null;
    }
};
```

---

## 🎮 **Gamification & Token Economy Balance**

### **Coin Economy Balance Monitoring**

#### **Organization Coin Distribution**
```javascript
export const getOrganizationCoinDistribution = async (organizationId) => {
    try {
        // Get all user coins in organization
        const coinsResult = await API.graphql({
            query: queries.listUserCoins,
            variables: {
                filter: {
                    organizationID: { eq: organizationId },
                    _deleted: { ne: true }
                }
            }
        });
        
        const userCoins = coinsResult.data.listUserCoins.items;
        
        // Calculate distribution statistics
        const totalCoins = userCoins.reduce((sum, user) => sum + user.total_coins, 0);
        const averageCoins = totalCoins / userCoins.length;
        const maxCoins = Math.max(...userCoins.map(user => user.total_coins));
        const minCoins = Math.min(...userCoins.map(user => user.total_coins));
        
        return {
            totalUsers: userCoins.length,
            totalCoins,
            averageCoins: Math.round(averageCoins),
            maxCoins,
            minCoins,
            distribution: userCoins
        };
        
    } catch (error) {
        console.error('Error fetching coin distribution:', error);
        return null;
    }
};
```

#### **Activity-Based Coin Tracking**
```javascript
export const getActivityCoinReport = async (organizationId, timeRange = 30) => {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);
        
        const result = await API.graphql({
            query: queries.listAwards,
            variables: {
                filter: {
                    organizationID: { eq: organizationId },
                    date: { gt: startDate.toISOString() },
                    _deleted: { ne: true }
                }
            }
        });
        
        const awards = result.data.listAwards.items;
        
        // Group by activity type
        const activityBreakdown = {};
        let totalCoinsAwarded = 0;
        
        awards.forEach(award => {
            if (award.coins > 0) { // Only count positive coin awards
                const type = award.type || 'UNKNOWN';
                
                if (!activityBreakdown[type]) {
                    activityBreakdown[type] = {
                        count: 0,
                        totalCoins: 0,
                        avgCoins: 0
                    };
                }
                
                activityBreakdown[type].count++;
                activityBreakdown[type].totalCoins += award.coins;
                totalCoinsAwarded += award.coins;
            }
        });
        
        // Calculate averages
        Object.keys(activityBreakdown).forEach(type => {
            const activity = activityBreakdown[type];
            activity.avgCoins = Math.round(activity.totalCoins / activity.count);
        });
        
        return {
            timeRange,
            totalCoinsAwarded,
            totalActivities: awards.filter(a => a.coins > 0).length,
            activityBreakdown
        };
        
    } catch (error) {
        console.error('Error fetching activity coin report:', error);
        return null;
    }
};
```

---

## 📱 **API Token Balance & Usage Display**

### **User Dashboard Token Display**
```javascript
// Component: TokenBalanceCard.js
const TokenBalanceCard = () => {
    const { user } = useUser();
    const { activeOrganization } = useOrganization();
    const [tokenBalance, setTokenBalance] = useState(0);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && activeOrganization) {
            loadTokenData();
        }
    }, [user, activeOrganization]);

    const loadTokenData = async () => {
        try {
            setLoading(true);
            
            // Get current token balance
            const balance = await getUserCoins(user.attributes.sub, activeOrganization.id);
            setTokenBalance(balance);
            
            // Get recent transactions (last 10)
            const transactions = await getUserAwardHistory(user.attributes.sub, activeOrganization.id, 10);
            setRecentTransactions(transactions);
            
        } catch (error) {
            console.error('Error loading token data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTransaction = (transaction) => {
        const isCredit = transaction.coins > 0;
        return {
            type: isCredit ? 'credit' : 'debit',
            amount: Math.abs(transaction.coins),
            description: transaction.title || transaction.description,
            date: new Date(transaction.date || transaction.createdAt).toLocaleDateString(),
            category: transaction.type
        };
    };

    return (
        <Card>
            <Card.Header>
                <Row className="align-items-center">
                    <Col>
                        <h5><FontAwesomeIcon icon={faCoins} className="me-2" />API Tokens</h5>
                    </Col>
                    <Col xs="auto">
                        <Badge bg="primary" className="fs-6">
                            {tokenBalance} tokens
                        </Badge>
                    </Col>
                </Row>
            </Card.Header>
            
            <Card.Body>
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" size="sm" />
                    </div>
                ) : (
                    <>
                        <div className="mb-3">
                            <small className="text-muted">
                                Earn tokens by completing reports, quizzes, and collaborative activities.
                                Use tokens to purchase digital rewards in the shop.
                            </small>
                        </div>
                        
                        <h6>Recent Transactions</h6>
                        {recentTransactions.length === 0 ? (
                            <p className="text-muted">No transactions yet</p>
                        ) : (
                            <div className="transaction-list">
                                {recentTransactions.slice(0, 5).map((transaction, index) => {
                                    const formatted = formatTransaction(transaction);
                                    return (
                                        <div key={index} className="d-flex justify-content-between py-2 border-bottom">
                                            <div>
                                                <small className="fw-bold">{formatted.description}</small>
                                                <br />
                                                <small className="text-muted">{formatted.date}</small>
                                            </div>
                                            <div className="text-end">
                                                <span className={`fw-bold ${formatted.type === 'credit' ? 'text-success' : 'text-danger'}`}>
                                                    {formatted.type === 'credit' ? '+' : '-'}{formatted.amount}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        
                        <div className="text-center mt-3">
                            <Button variant="outline-primary" size="sm" onClick={() => navigate('/shop')}>
                                Visit Shop
                            </Button>
                            <Button variant="outline-secondary" size="sm" className="ms-2" onClick={() => navigate('/transaction-history')}>
                                View All Transactions
                            </Button>
                        </div>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};
```

---

## 📋 **Summary**

The VibeStack™ Pro Payment & Token System provides:

### **🏗️ Multi-Layered Payment Architecture**
- **Subscription Management**: Stripe-powered license billing with prorated adjustments
- **Learning Coins**: Gamified reward system for user engagement and API token economy  
- **Internal Shop**: Coin-based marketplace with admin approval workflow
- **Comprehensive Tracking**: Full transaction history and analytics

### **💰 Token Economy Features**
- **Automated Rewards**: Activity-based coin earning (reports, quizzes, collaboration)
- **Time-Based Learning**: Interval-based coin rewards during learning sessions
- **Flexible Spending**: Internal shop with digital goods and customizable items
- **Balance Management**: Real-time balance tracking with transaction history

### **🔐 Enterprise Payment Features**
- **Stripe Integration**: Secure payment processing with webhooks
- **Prorated Billing**: Automatic proration for license changes
- **Invoice Management**: Complete billing history with PDF downloads
- **Multi-Tenant Isolation**: Organization-specific payment and token data

### **📊 Analytics & Reporting**
- **Coin Distribution**: Organization-wide token economics analysis
- **Activity Tracking**: Detailed breakdown of earning patterns
- **Purchase Analytics**: Shop performance and popular items tracking
- **Billing History**: Complete subscription and invoice tracking

This comprehensive system enables organizations to manage licensing, engage users through gamification, provide internal rewards marketplace, and maintain complete financial transparency across all payment and token transactions.
