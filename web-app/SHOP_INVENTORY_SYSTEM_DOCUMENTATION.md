# VibeStack™ Pro - Shop & Inventory System Documentation

## Overview

This document provides comprehensive details on how the VibeStack™ Pro application implements the Shop and Inventory system on the user side, with AWS Amplify backend integration. This documentation enables React Native developers to replicate the exact same functionality using the existing Amplify backend.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Core Components](#core-components)
4. [Shop System Implementation](#shop-system-implementation)
5. [Inventory System Implementation](#inventory-system-implementation)
6. [Purchase Request Workflow](#purchase-request-workflow)
7. [Admin Management System](#admin-management-system)
8. [API Integration Examples](#api-integration-examples)
9. [Email Notification System](#email-notification-system)
10. [Image Management](#image-management)
11. [Mobile Implementation Guide](#mobile-implementation-guide)
12. [Error Handling & Edge Cases](#error-handling--edge-cases)
13. [Best Practices](#best-practices)

## System Architecture

### Overview
The Shop & Inventory system in VibeStack™ Pro uses a comprehensive approach that combines:
- **GraphQL Database**: Shop items, user purchases, and inventory management
- **AWS S3 Storage**: Product image storage with signed URLs
- **Coin-based Economy**: Integration with the awards system
- **Purchase Request Workflow**: Admin approval system
- **Email Notifications**: Purchase confirmations and status updates
- **Multi-tenant Support**: Organization-specific shops and inventories

### Key Technologies
- **Frontend**: React with AWS Amplify
- **Database**: GraphQL (AWS AppSync)
- **Storage**: AWS S3 with signed URLs for images
- **Authentication**: AWS Cognito
- **Email Service**: AWS SES via Lambda functions
- **State Management**: React Context + Local State

### User Flow Overview
```
1. User earns coins → 2. Browse shop → 3. Request purchase → 
4. Admin approval → 5. Coin deduction → 6. Item delivery → 
7. Item appears in inventory
```

## Database Schema

### ShopItem Model
```graphql
type ShopItem @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String!
  description: String
  price: Int!                    # Price in coins
  image: String                  # S3 key or external URL
  isEnabled: Boolean!            # Item availability
  organizationID: ID! @index(name: "byOrganization")
  organization: Organization @belongsTo(fields: ["organizationID"])
  type: String                   # "PRODUCT" | "HOLIDAY" | "TICKET" | "GIFT"
  purchases: [UserPurchase] @hasMany(indexName: "byShopItem", fields: ["id"])
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### UserPurchase Model
```graphql
type UserPurchase @model @auth(rules: [{allow: public}]) {
  id: ID!
  shopItemID: ID! @index(name: "byShopItem")
  shopItem: ShopItem @belongsTo(fields: ["shopItemID"])
  user_sub: String!              # Cognito user sub
  purchaseDate: AWSDateTime!
  organizationID: ID! @index(name: "byOrganization")
  organization: Organization @belongsTo(fields: ["organizationID"])
  status: String!                # "PENDING" | "APPROVED" | "REJECTED" | "DELIVERED"
  approvedBy: String             # Admin userSub who approved/rejected
  approvedDate: AWSDateTime
  rejectionReason: String
  deliveryNotes: String
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### UserCoins Model (from Awards System)
```graphql
type UserCoins @model @auth(rules: [{allow: public}]) {
  id: ID!
  user_sub: String!
  total_coins: Int!
  organizationID: ID! @index(name: "byOrganization")
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### Shop Item Types
```javascript
export const SHOP_ITEM_TYPES = {
  PRODUCT: 'PRODUCT',    // Physical products
  HOLIDAY: 'HOLIDAY',    // Holiday-themed items
  TICKET: 'TICKET',      // Event tickets/access
  GIFT: 'GIFT'          // Special gifts/rewards
};
```

### Purchase Status Flow
```javascript
const PURCHASE_STATUSES = {
  PENDING: 'PENDING',       // Awaiting admin approval
  APPROVED: 'APPROVED',     // Approved but not delivered (unused in current flow)
  REJECTED: 'REJECTED',     // Rejected by admin
  DELIVERED: 'DELIVERED'    // Approved and delivered (coins deducted)
};
```

## Core Components

### 1. UserShop Component (`/src/components/shop/UserShop.js`)

**Main shop interface for users to browse and purchase items.**

```jsx
import React from 'react';
import UserShop from '../components/shop/UserShop';

const ShopPage = () => {
  return <UserShop />;
};
```

**Key Features:**
- Displays all enabled shop items for the organization
- Shows user's current coin balance
- Handles purchase requests with confirmation modals
- Loads product images from S3 with signed URLs
- Shows ownership count for previously purchased items
- Real-time updates after purchases

### 2. UserInventory Component (`/src/components/shop/UserInventory.js`)

**Inventory interface showing user's delivered purchases.**

```jsx
import React from 'react';
import UserInventory from '../components/shop/UserInventory';

const InventoryPage = () => {
  return <UserInventory />;
};
```

**Key Features:**
- Displays only delivered purchases (status: 'DELIVERED')
- Shows product images, descriptions, and delivery notes
- Organized by purchase date
- Empty state handling

### 3. Shop Utility Service (`/src/utils/shop.js`)

**Core business logic for shop operations.**

**Key Functions:**
```javascript
// Get shop items for organization
const shopItems = await getShopItems(organizationId);

// Get user's purchases
const purchases = await getUserPurchases(organizationId);

// Request purchase (creates pending request)
const result = await purchaseItem(shopItemId, organizationId);

// Admin functions
const requests = await getPurchaseRequests(organizationId);
const result = await approvePurchaseRequest(purchaseId, approverSub, deliveryNotes);
const result = await rejectPurchaseRequest(purchaseId, approverSub, rejectionReason);
```

## Shop System Implementation

### Step-by-Step User Purchase Flow

#### 1. Loading Shop Items
```javascript
const UserShop = () => {
  const { activeOrganization } = useOrganization();
  const [shopItems, setShopItems] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [userPurchases, setUserPurchases] = useState([]);

  useEffect(() => {
    if (activeOrganization?.id) {
      loadShopData();
    }
  }, [activeOrganization]);

  const loadShopData = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const [items, purchases, coins] = await Promise.all([
        getShopItems(activeOrganization.id),
        getUserPurchases(activeOrganization.id),
        getUserCoins(user.attributes.sub, activeOrganization.id)
      ]);
      
      setShopItems(items);
      setUserPurchases(purchases);
      setUserCoins(coins);
    } catch (error) {
      console.error('Error loading shop data:', error);
    }
  };
};
```

#### 2. Displaying Shop Items
```jsx
const ShopItemCard = ({ item, userCoins, onPurchase }) => {
  const canPurchase = userCoins >= item.price && item.isEnabled;
  
  return (
    <Card className="shop-item-card">
      {item.image && (
        <Card.Img variant="top" src={getSignedImageUrl(item.image)} />
      )}
      <Card.Body>
        <Card.Title>{item.name}</Card.Title>
        <Card.Text>{item.description}</Card.Text>
        <div className="d-flex justify-content-between align-items-center">
          <Badge bg="warning">
            <FontAwesomeIcon icon={faCoins} /> {item.price} coins
          </Badge>
          <Button
            variant="primary"
            onClick={() => onPurchase(item)}
            disabled={!canPurchase}
          >
            Request Purchase
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};
```

#### 3. Purchase Request Submission
```javascript
const handlePurchaseConfirm = async () => {
  try {
    setIsPurchasing(true);
    
    // Submit purchase request
    const result = await purchaseItem(selectedItem.id, activeOrganization.id);
    
    if (result.success) {
      // Refresh shop data
      await loadShopData();
      
      // Close modal and show success message
      setShowPurchaseModal(false);
      setSuccessMessage(
        `Purchase request submitted for ${selectedItem.name}! ` +
        `You will receive an email confirmation and another notification ` +
        `once your request is reviewed by organization administrators.`
      );
    }
  } catch (error) {
    setPurchaseError(error.message || 'Failed to submit purchase request');
  } finally {
    setIsPurchasing(false);
  }
};
```

#### 4. GraphQL Purchase Request Creation
```javascript
export const purchaseItem = async (shopItemId, organizationId) => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    
    // Validate item availability and user coins
    const shopItem = await getShopItem(shopItemId);
    const userCoins = await getUserCoins(user.attributes.sub, organizationId);
    
    if (!shopItem.isEnabled) {
      throw new Error('Item not available for purchase');
    }
    
    if (userCoins < shopItem.price) {
      throw new Error('Insufficient coins');
    }

    // Create purchase request
    const purchaseInput = {
      shopItemID: shopItemId,
      user_sub: user.attributes.sub,
      purchaseDate: new Date().toISOString(),
      organizationID: organizationId,
      status: 'PENDING'
    };

    const result = await API.graphql({
      query: mutations.createUserPurchase,
      variables: { input: purchaseInput }
    });

    // Send notifications
    await sendPurchaseRequestNotification(
      result.data.createUserPurchase,
      shopItem,
      user.attributes.email,
      organizationId
    );

    return {
      success: true,
      purchaseRequest: result.data.createUserPurchase
    };
  } catch (error) {
    console.error('Error creating purchase request:', error);
    throw error;
  }
};
```

## Inventory System Implementation

### Loading User Inventory
```javascript
const UserInventory = () => {
  const { activeOrganization } = useOrganization();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeOrganization?.id) {
      loadPurchases();
    }
  }, [activeOrganization]);

  const loadPurchases = async () => {
    try {
      const userPurchases = await getUserPurchases(activeOrganization.id);
      
      // Only show delivered items in inventory
      const deliveredPurchases = userPurchases.filter(
        purchase => purchase.status === 'DELIVERED'
      );
      
      setPurchases(deliveredPurchases);
    } catch (error) {
      console.error('Error loading purchases:', error);
    } finally {
      setLoading(false);
    }
  };
};
```

### Inventory Item Display
```jsx
const InventoryItemCard = ({ purchase }) => {
  return (
    <Card className="inventory-item-card">
      {purchase.shopItem?.image && (
        <Card.Img
          variant="top"
          src={getSignedImageUrl(purchase.shopItem.image)}
          alt={purchase.shopItem.name}
        />
      )}
      <Card.Body>
        <Card.Title>{purchase.shopItem?.name}</Card.Title>
        <Card.Text>{purchase.shopItem?.description}</Card.Text>
        
        {purchase.deliveryNotes && (
          <div className="mb-3">
            <strong className="text-primary">Delivery Notes:</strong>
            <div className="mt-1 p-2 bg-light rounded">
              <small>{purchase.deliveryNotes}</small>
            </div>
          </div>
        )}
        
        <div className="d-flex justify-content-between align-items-center">
          <Badge bg="info">{purchase.shopItem?.type}</Badge>
          <small className="text-muted">
            <FontAwesomeIcon icon={faClock} className="me-1" />
            {formatDate(purchase.purchaseDate)}
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};
```

## Purchase Request Workflow

### Complete Purchase Lifecycle

#### 1. User Submits Request
```javascript
// User clicks "Request Purchase" button
const purchaseRequest = await purchaseItem(itemId, organizationId);

// Status: PENDING
// Coins: NOT deducted yet
// Notifications: User confirmation + Admin notification sent
```

#### 2. Admin Reviews Request
```javascript
// Admin views purchase requests
const requests = await getPurchaseRequests(organizationId, 'PENDING');

// Admin can approve or reject
const approval = await approvePurchaseRequest(
  purchaseId, 
  adminUserSub, 
  'Item delivered to your office'
);

// OR

const rejection = await rejectPurchaseRequest(
  purchaseId,
  adminUserSub,
  'Item temporarily out of stock'
);
```

#### 3. Approval Process
```javascript
export const approvePurchaseRequest = async (purchaseId, approverSub, deliveryNotes) => {
  try {
    // Get purchase and item details
    const purchase = await getUserPurchase(purchaseId);
    const shopItem = await getShopItem(purchase.shopItemID);
    
    // Verify user still has sufficient coins
    const userCoins = await getUserCoins(purchase.user_sub, purchase.organizationID);
    
    if (userCoins.total_coins < shopItem.price) {
      throw new Error('User has insufficient coins');
    }

    // Deduct coins
    const remainingCoins = userCoins.total_coins - shopItem.price;
    await updateUserCoins(userCoins.id, remainingCoins, userCoins._version);

    // Update purchase status to DELIVERED (skip APPROVED step)
    await updateUserPurchase({
      id: purchaseId,
      status: 'DELIVERED',
      approvedBy: approverSub,
      approvedDate: new Date().toISOString(),
      deliveryNotes: deliveryNotes,
      _version: purchase._version
    });

    // Send approval & delivery notification to user
    await sendPurchaseApprovalAndDeliveryNotification(
      purchase, 
      shopItem, 
      purchase.organizationID, 
      deliveryNotes
    );

    return { success: true, remainingCoins };
  } catch (error) {
    console.error('Error approving purchase:', error);
    throw error;
  }
};
```

#### 4. Rejection Process
```javascript
export const rejectPurchaseRequest = async (purchaseId, approverSub, rejectionReason) => {
  try {
    // Update purchase status
    await updateUserPurchase({
      id: purchaseId,
      status: 'REJECTED',
      approvedBy: approverSub,
      approvedDate: new Date().toISOString(),
      rejectionReason: rejectionReason
    });

    // Send rejection notification
    await sendPurchaseApprovalNotification(
      purchase, 
      shopItem, 
      purchase.organizationID, 
      false, 
      rejectionReason
    );

    return { success: true };
  } catch (error) {
    console.error('Error rejecting purchase:', error);
    throw error;
  }
};
```

## Admin Management System

### Shop Item Management
```javascript
// Create new shop item
const createShopItem = async (itemData, organizationId) => {
  const input = {
    name: itemData.name,
    description: itemData.description,
    price: parseInt(itemData.price),
    image: itemData.image, // S3 key or external URL
    type: itemData.type,
    organizationID: organizationId,
    isEnabled: true
  };

  const result = await API.graphql({
    query: mutations.createShopItem,
    variables: { input }
  });

  return result.data.createShopItem;
};

// Update shop item
const updateShopItem = async (itemId, updates) => {
  const input = {
    id: itemId,
    ...updates
  };

  const result = await API.graphql({
    query: mutations.updateShopItem,
    variables: { input }
  });

  return result.data.updateShopItem;
};
```

### Purchase Request Management
```javascript
// Get all purchase requests for organization
const getPurchaseRequests = async (organizationId, status = null) => {
  const filter = {
    organizationID: { eq: organizationId }
  };
  
  if (status) {
    filter.status = { eq: status };
  }

  const result = await API.graphql({
    query: queries.listUserPurchases,
    variables: { filter }
  });

  // Enrich with shop item and user details
  const requests = await Promise.all(
    result.data.listUserPurchases.items.map(async (request) => {
      const [shopItem, userEmail] = await Promise.all([
        getShopItem(request.shopItemID),
        getUserEmailFromSub(request.user_sub, organizationId)
      ]);

      return {
        ...request,
        shopItem,
        userEmail
      };
    })
  );

  return requests;
};
```

## API Integration Examples

### Complete Shop Integration for Mobile

#### React Native Shop Component
```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { API, Auth, Storage } from 'aws-amplify';

const MobileShop = ({ organizationId }) => {
  const [shopItems, setShopItems] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShopData();
  }, [organizationId]);

  const loadShopData = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      // Load shop items
      const itemsResult = await API.graphql({
        query: `
          query ListShopItems($filter: ModelShopItemFilterInput) {
            listShopItems(filter: $filter) {
              items {
                id
                name
                description
                price
                image
                type
                isEnabled
              }
            }
          }
        `,
        variables: {
          filter: {
            organizationID: { eq: organizationId },
            isEnabled: { eq: true }
          }
        }
      });

      // Load user coins
      const coinsResult = await API.graphql({
        query: `
          query ListUserCoins($filter: ModelUserCoinsFilterInput) {
            listUserCoins(filter: $filter) {
              items {
                total_coins
              }
            }
          }
        `,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            organizationID: { eq: organizationId }
          }
        }
      });

      setShopItems(itemsResult.data.listShopItems.items);
      setUserCoins(coinsResult.data.listUserCoins.items[0]?.total_coins || 0);
    } catch (error) {
      console.error('Error loading shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseRequest = async (item) => {
    if (userCoins < item.price) {
      Alert.alert('Insufficient Coins', 'You do not have enough coins for this purchase.');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Request to purchase ${item.name} for ${item.price} coins?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => submitPurchaseRequest(item) }
      ]
    );
  };

  const submitPurchaseRequest = async (item) => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      const result = await API.graphql({
        query: `
          mutation CreateUserPurchase($input: CreateUserPurchaseInput!) {
            createUserPurchase(input: $input) {
              id
              status
              purchaseDate
            }
          }
        `,
        variables: {
          input: {
            shopItemID: item.id,
            user_sub: user.attributes.sub,
            purchaseDate: new Date().toISOString(),
            organizationID: organizationId,
            status: 'PENDING'
          }
        }
      });

      Alert.alert(
        'Purchase Request Submitted',
        'Your request has been submitted and is pending approval from administrators.'
      );

      // Optionally send notification (implement sendPurchaseRequestNotification)
    } catch (error) {
      console.error('Error submitting purchase request:', error);
      Alert.alert('Error', 'Failed to submit purchase request. Please try again.');
    }
  };

  const getSignedImageUrl = async (imageKey) => {
    if (!imageKey || !imageKey.startsWith('shop-items/')) {
      return imageKey; // Return direct URL for external images
    }

    try {
      const signedUrl = await Storage.get(imageKey, {
        level: 'public',
        expires: 60 * 60 // 1 hour
      });
      return signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  };

  const renderShopItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Image 
        source={{ uri: getSignedImageUrl(item.image) }} 
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <View style={styles.itemFooter}>
          <Text style={styles.itemPrice}>🪙 {item.price} coins</Text>
          <TouchableOpacity
            style={[
              styles.purchaseButton,
              userCoins < item.price && styles.purchaseButtonDisabled
            ]}
            onPress={() => handlePurchaseRequest(item)}
            disabled={userCoins < item.price}
          >
            <Text style={styles.purchaseButtonText}>Request Purchase</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.coinBalance}>🪙 {userCoins} coins</Text>
      </View>
      
      <FlatList
        data={shopItems}
        renderItem={renderShopItem}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadShopData}
      />
    </View>
  );
};
```

#### React Native Inventory Component
```jsx
const MobileInventory = ({ organizationId }) => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, [organizationId]);

  const loadInventory = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();

      // Get delivered purchases
      const result = await API.graphql({
        query: `
          query ListUserPurchases($filter: ModelUserPurchaseFilterInput) {
            listUserPurchases(filter: $filter) {
              items {
                id
                purchaseDate
                status
                deliveryNotes
                shopItemID
              }
            }
          }
        `,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            organizationID: { eq: organizationId },
            status: { eq: 'DELIVERED' }
          }
        }
      });

      // Get shop item details for each purchase
      const inventoryWithItems = await Promise.all(
        result.data.listUserPurchases.items.map(async (purchase) => {
          const itemResult = await API.graphql({
            query: `
              query GetShopItem($id: ID!) {
                getShopItem(id: $id) {
                  id
                  name
                  description
                  image
                  type
                }
              }
            `,
            variables: { id: purchase.shopItemID }
          });

          return {
            ...purchase,
            shopItem: itemResult.data.getShopItem
          };
        })
      );

      setInventory(inventoryWithItems);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderInventoryItem = ({ item }) => (
    <View style={styles.inventoryCard}>
      <Image 
        source={{ uri: getSignedImageUrl(item.shopItem?.image) }} 
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.shopItem?.name}</Text>
        <Text style={styles.itemDescription}>{item.shopItem?.description}</Text>
        
        {item.deliveryNotes && (
          <View style={styles.deliveryNotes}>
            <Text style={styles.deliveryNotesTitle}>Delivery Notes:</Text>
            <Text style={styles.deliveryNotesText}>{item.deliveryNotes}</Text>
          </View>
        )}
        
        <Text style={styles.purchaseDate}>
          Purchased: {new Date(item.purchaseDate).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Inventory</Text>
      
      {inventory.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No items in your inventory yet</Text>
          <Text style={styles.emptyStateSubtext}>Visit the shop to purchase items!</Text>
        </View>
      ) : (
        <FlatList
          data={inventory}
          renderItem={renderInventoryItem}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={loadInventory}
        />
      )}
    </View>
  );
};
```

## Email Notification System

### Purchase Request Notifications

#### User Confirmation Email
```javascript
const sendPurchaseRequestConfirmationToUser = async (purchase, shopItem, userEmail, organizationId) => {
  const notificationData = {
    subject: `Purchase Request Submitted: ${shopItem.name}`,
    title: `Purchase Request Confirmation`,
    message: `
      <p>Your purchase request has been submitted successfully!</p>
      <p><strong>Request Details:</strong></p>
      <ul>
        <li><strong>Item:</strong> ${shopItem.name}</li>
        <li><strong>Description:</strong> ${shopItem.description}</li>
        <li><strong>Price:</strong> ${shopItem.price} coins</li>
        <li><strong>Status:</strong> Pending Approval</li>
      </ul>
      <p>You will receive an email notification once your request has been reviewed.</p>
      <p><strong>Note:</strong> Your coins will only be deducted once the request is approved.</p>
    `,
    actionURL: 'VibeStack://shop',
    actionText: 'View Shop'
  };

  return await sendEmailNotification({
    type: 'CUSTOM_NOTIFICATION',
    to: userEmail,
    data: notificationData,
    organizationID: organizationId
  });
};
```

#### Admin Notification Email
```javascript
const sendPurchaseRequestNotification = async (purchase, shopItem, userEmail, organizationId) => {
  // Get admin emails
  const adminEmails = await getOrganizationAdminEmails(organizationId);

  const notificationData = {
    subject: `Shop Purchase Request: ${shopItem.name}`,
    title: `Shop Purchase Request`,
    message: `
      <p><strong>Purchase Request Details:</strong></p>
      <ul>
        <li><strong>User:</strong> ${userEmail}</li>
        <li><strong>Item:</strong> ${shopItem.name}</li>
        <li><strong>Type:</strong> ${shopItem.type}</li>
        <li><strong>Price:</strong> ${shopItem.price} coins</li>
        <li><strong>Status:</strong> Pending Approval</li>
      </ul>
      <p>Please review and approve/reject this request.</p>
    `,
    actionURL: 'VibeStack://admin/shop/requests',
    actionText: 'Review Purchase Requests'
  };

  return await sendEmailNotification({
    type: 'CUSTOM_NOTIFICATION',
    to: adminEmails,
    data: notificationData,
    organizationID: organizationId
  });
};
```

#### Approval/Rejection Notifications
```javascript
const sendPurchaseApprovalAndDeliveryNotification = async (purchase, shopItem, organizationId, deliveryNotes) => {
  const userEmail = await getUserEmailFromSub(purchase.user_sub, organizationId);

  const notificationData = {
    subject: `Purchase Approved & Delivered: ${shopItem.name}`,
    title: `Purchase Approved & Delivered`,
    message: `
      <p>Great news! Your purchase request has been approved and delivered!</p>
      <p><strong>Purchase Details:</strong></p>
      <ul>
        <li><strong>Item:</strong> ${shopItem.name}</li>
        <li><strong>Price:</strong> ${shopItem.price} coins</li>
        ${deliveryNotes ? `<li><strong>Delivery Notes:</strong> ${deliveryNotes}</li>` : ''}
      </ul>
      <p>Your coins have been deducted and the item is now in your inventory!</p>
    `,
    actionURL: 'VibeStack://inventory',
    actionText: 'View My Inventory'
  };

  return await sendEmailNotification({
    type: 'CUSTOM_NOTIFICATION',
    to: userEmail,
    data: notificationData,
    organizationID: organizationId
  });
};
```

## Image Management

### S3 Image Storage
```javascript
// Upload shop item image
const uploadShopItemImage = async (imageFile, organizationId) => {
  try {
    // Compress image for optimal storage
    const compressedFile = await compressImage(imageFile, {
      quality: 0.8,
      maxWidth: 800,
      maxHeight: 800
    });

    // Generate unique filename
    const fileExtension = compressedFile.name.split('.').pop();
    const uniqueFileName = `shop-items/${organizationId}/${Date.now()}.${fileExtension}`;

    // Upload to S3
    const result = await Storage.put(uniqueFileName, compressedFile, {
      level: 'public',
      contentType: compressedFile.type
    });

    return result.key; // Return S3 key for database storage
  } catch (error) {
    console.error('Error uploading shop item image:', error);
    throw error;
  }
};

// Get signed URL for display
const getShopItemImageUrl = async (imageKey) => {
  if (!imageKey) return null;

  // If it's an S3 key, generate signed URL
  if (imageKey.startsWith('shop-items/')) {
    try {
      const signedUrl = await Storage.get(imageKey, {
        level: 'public',
        expires: 60 * 60 // 1 hour
      });
      return signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  }

  // Return direct URL for external images
  return imageKey;
};
```

### Mobile Image Handling
```javascript
// React Native image picker and upload
import { launchImageLibrary } from 'react-native-image-picker';

const selectAndUploadImage = async (organizationId) => {
  return new Promise((resolve, reject) => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800
      },
      async (response) => {
        if (response.didCancel || response.errorCode) {
          reject(new Error('Image selection cancelled or failed'));
          return;
        }

        try {
          const asset = response.assets[0];
          
          // Convert to blob for Amplify Storage
          const blob = await fetch(asset.uri).then(r => r.blob());
          
          // Upload to S3
          const uniqueFileName = `shop-items/${organizationId}/${Date.now()}.jpg`;
          const result = await Storage.put(uniqueFileName, blob, {
            level: 'public',
            contentType: 'image/jpeg'
          });

          resolve(result.key);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};
```

## Mobile Implementation Guide

### Required Dependencies
```json
{
  "dependencies": {
    "aws-amplify": "^5.x.x",
    "react-native-image-picker": "^5.x.x",
    "@react-native-async-storage/async-storage": "^1.x.x"
  }
}
```

### Navigation Structure
```javascript
// React Navigation setup
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

const ShopTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="Shop" 
      component={MobileShop}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="shopping-cart" size={size} color={color} />
        )
      }}
    />
    <Tab.Screen 
      name="Inventory" 
      component={MobileInventory}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="package" size={size} color={color} />
        )
      }}
    />
  </Tab.Navigator>
);
```

### State Management
```javascript
// React Context for shop state
const ShopContext = createContext();

export const ShopProvider = ({ children, organizationId }) => {
  const [shopItems, setShopItems] = useState([]);
  const [userCoins, setUserCoins] = useState(0);
  const [userPurchases, setUserPurchases] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshShopData = async () => {
    setLoading(true);
    try {
      const [items, purchases, coins] = await Promise.all([
        getShopItems(organizationId),
        getUserPurchases(organizationId),
        getUserCoins(organizationId)
      ]);
      
      setShopItems(items);
      setUserPurchases(purchases);
      setUserCoins(coins);
    } catch (error) {
      console.error('Error refreshing shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitPurchaseRequest = async (itemId) => {
    try {
      await purchaseItem(itemId, organizationId);
      await refreshShopData(); // Refresh after purchase
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    shopItems,
    userCoins,
    userPurchases,
    loading,
    refreshShopData,
    submitPurchaseRequest
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within ShopProvider');
  }
  return context;
};
```

### Offline Support
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache shop data for offline viewing
const cacheShopData = async (shopItems, userCoins, organizationId) => {
  try {
    const cacheData = {
      shopItems,
      userCoins,
      timestamp: Date.now(),
      organizationId
    };
    
    await AsyncStorage.setItem(
      `shop_cache_${organizationId}`,
      JSON.stringify(cacheData)
    );
  } catch (error) {
    console.error('Error caching shop data:', error);
  }
};

// Load cached data when offline
const loadCachedShopData = async (organizationId) => {
  try {
    const cached = await AsyncStorage.getItem(`shop_cache_${organizationId}`);
    if (cached) {
      const data = JSON.parse(cached);
      
      // Check if cache is less than 1 hour old
      if (Date.now() - data.timestamp < 60 * 60 * 1000) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading cached shop data:', error);
    return null;
  }
};
```

## Error Handling & Edge Cases

### Common Error Scenarios

#### 1. Insufficient Coins
```javascript
const handleInsufficientCoins = (userCoins, itemPrice) => {
  const coinsNeeded = itemPrice - userCoins;
  
  Alert.alert(
    'Insufficient Coins',
    `You need ${coinsNeeded} more coins to purchase this item. ` +
    `Complete more activities to earn coins!`,
    [
      { text: 'OK', style: 'default' },
      { text: 'View Activities', onPress: () => navigateToActivities() }
    ]
  );
};
```

#### 2. Item Unavailable
```javascript
const handleItemUnavailable = (item) => {
  Alert.alert(
    'Item Unavailable',
    `${item.name} is currently unavailable for purchase. ` +
    `Please try again later or contact your administrator.`
  );
};
```

#### 3. Network Errors
```javascript
const handleNetworkError = async (operation, fallback) => {
  try {
    return await operation();
  } catch (error) {
    if (error.message.includes('Network')) {
      // Try fallback (cached data)
      const cachedData = await fallback();
      if (cachedData) {
        return cachedData;
      }
    }
    throw error;
  }
};
```

#### 4. Purchase Request Failures
```javascript
const retryPurchaseRequest = async (itemId, organizationId, maxRetries = 3) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await purchaseItem(itemId, organizationId);
    } catch (error) {
      lastError = error;
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw lastError;
};
```

### Validation Helpers
```javascript
// Validate purchase request
const validatePurchaseRequest = (item, userCoins) => {
  const errors = [];
  
  if (!item.isEnabled) {
    errors.push('Item is not available for purchase');
  }
  
  if (userCoins < item.price) {
    errors.push(`Insufficient coins. Need ${item.price}, have ${userCoins}`);
  }
  
  if (!item.name || !item.price) {
    errors.push('Invalid item data');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate shop item data
const validateShopItem = (itemData) => {
  const errors = [];
  
  if (!itemData.name?.trim()) {
    errors.push('Item name is required');
  }
  
  if (!itemData.price || itemData.price <= 0) {
    errors.push('Valid price is required');
  }
  
  if (!Object.values(SHOP_ITEM_TYPES).includes(itemData.type)) {
    errors.push('Valid item type is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## Best Practices

### 1. Performance Optimization
```javascript
// Batch image loading
const loadImagesInBatch = async (items, batchSize = 5) => {
  const batches = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  const imageUrls = {};
  
  for (const batch of batches) {
    const promises = batch.map(async (item) => {
      if (item.image) {
        try {
          const url = await getSignedImageUrl(item.image);
          return { id: item.id, url };
        } catch (error) {
          console.error(`Error loading image for ${item.id}:`, error);
          return { id: item.id, url: null };
        }
      }
      return { id: item.id, url: null };
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ id, url }) => {
      if (url) imageUrls[id] = url;
    });
  }
  
  return imageUrls;
};

// Optimize React Native FlatList
const renderShopItem = useCallback(({ item }) => (
  <ShopItemCard item={item} onPurchase={handlePurchaseRequest} />
), [handlePurchaseRequest]);

const getItemLayout = useCallback((data, index) => ({
  length: ITEM_HEIGHT,
  offset: ITEM_HEIGHT * index,
  index,
}), []);
```

### 2. Security Considerations
```javascript
// Validate user permissions
const validateUserAccess = async (userSub, organizationId) => {
  try {
    const memberResult = await API.graphql({
      query: queries.listOrganizationMembers,
      variables: {
        filter: {
          userSub: { eq: userSub },
          organizationID: { eq: organizationId },
          status: { eq: 'ACTIVE' }
        }
      }
    });
    
    return memberResult.data.listOrganizationMembers.items.length > 0;
  } catch (error) {
    console.error('Error validating user access:', error);
    return false;
  }
};

// Sanitize user input
const sanitizeShopItemData = (input) => {
  return {
    name: input.name?.trim().substring(0, 100),
    description: input.description?.trim().substring(0, 500),
    price: Math.max(0, parseInt(input.price) || 0),
    type: Object.values(SHOP_ITEM_TYPES).includes(input.type) 
      ? input.type 
      : SHOP_ITEM_TYPES.PRODUCT
  };
};
```

### 3. User Experience Best Practices
```javascript
// Loading states
const ShopItemCard = ({ item, loading }) => {
  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <View style={styles.imagePlaceholder} />
        <View style={styles.textPlaceholder} />
      </View>
    );
  }
  
  return <ActualShopItemCard item={item} />;
};

// Optimistic updates
const optimisticPurchaseRequest = async (item) => {
  // Immediately update UI
  setUserCoins(prev => prev - item.price);
  setPurchaseRequests(prev => [...prev, {
    id: 'temp-' + Date.now(),
    shopItem: item,
    status: 'PENDING',
    purchaseDate: new Date().toISOString()
  }]);
  
  try {
    const result = await purchaseItem(item.id, organizationId);
    // Update with real data
    refreshShopData();
  } catch (error) {
    // Revert optimistic update
    setUserCoins(prev => prev + item.price);
    setPurchaseRequests(prev => prev.filter(p => !p.id.startsWith('temp-')));
    throw error;
  }
};

// Progressive image loading
const ProgressiveImage = ({ source, placeholder, style }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  return (
    <View style={style}>
      {!loaded && !error && (
        <Image source={placeholder} style={style} />
      )}
      <Image
        source={source}
        style={[style, !loaded && { opacity: 0 }]}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </View>
  );
};
```

### 4. Data Consistency
```javascript
// Ensure data consistency across components
const useShopDataSync = (organizationId) => {
  const [lastSync, setLastSync] = useState(0);
  
  const syncShopData = useCallback(async () => {
    const now = Date.now();
    
    // Only sync if last sync was more than 30 seconds ago
    if (now - lastSync < 30000) {
      return;
    }
    
    try {
      await refreshShopData();
      setLastSync(now);
    } catch (error) {
      console.error('Error syncing shop data:', error);
    }
  }, [lastSync, refreshShopData]);
  
  // Auto-sync when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        syncShopData();
      }
    });
    
    return () => subscription?.remove();
  }, [syncShopData]);
  
  return { syncShopData, lastSync };
};
```

---

## Summary

The VibeStack™ Pro Shop & Inventory system provides a comprehensive coin-based marketplace with:

- **Multi-tenant Architecture**: Organization-specific shops and inventories
- **Complete Purchase Workflow**: Request → Admin Approval → Coin Deduction → Delivery
- **Rich Image Support**: S3 storage with signed URLs and compression
- **Email Notifications**: Purchase confirmations, approvals, and deliveries  
- **Admin Management**: Full CRUD operations for shop items and purchase requests
- **Mobile-Ready APIs**: All backend functionality accessible via GraphQL
- **Performance Optimized**: Caching, batch loading, and offline support
- **Security Focused**: Input validation, access control, and data sanitization

This system integrates seamlessly with the existing awards and coin economy, providing users with meaningful ways to spend their earned coins while giving organizations control over their internal marketplace.

---

*This documentation covers the complete Shop & Inventory system implementation in VibeStack™ Pro as of December 2024. The React Native mobile app can replicate this exact functionality using the same AWS Amplify backend and GraphQL API.*