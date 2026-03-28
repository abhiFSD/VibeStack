# Awards & Leaderboard System Documentation

This document provides comprehensive information about the Awards and Leaderboard functionality in VibeStack™ Pro, designed to help replicate the same system in the mobile app using the existing backend infrastructure.

## Table of Contents
- [System Overview](#system-overview)
- [Database Schema](#database-schema)
- [GraphQL API Reference](#graphql-api-reference)
- [Award System Implementation](#award-system-implementation)
- [Leaderboard System Implementation](#leaderboard-system-implementation)
- [Coin Economy](#coin-economy)
- [Mobile App Implementation Guide](#mobile-app-implementation-guide)

## System Overview

The Awards and Leaderboard system is a comprehensive gamification feature that:
- **Awards users with coins** for completing various activities (reports, quizzes, action items, etc.)
- **Tracks individual achievements** with a timeline view
- **Displays organization-wide leaderboards** ranking users by total coins earned
- **Integrates with a shop system** where users can spend earned coins
- **Supports multi-tenant organizations** with isolated data

### Key Features
- 🏆 **21+ Award Types**: From quiz completion to specific report types
- 🥇 **Visual Leaderboard**: Gold/Silver/Bronze rankings with avatars
- 💰 **Coin Economy**: Earn, spend, and track coin transactions
- 📱 **Real-time Updates**: GraphQL subscriptions for live updates
- 🔒 **Organization Isolation**: Awards and leaderboards are per-organization
- 📧 **Email Notifications**: Automatic award notifications

## Database Schema

### Primary Tables/Models

#### 1. Awards
Stores individual award instances granted to users.

```typescript
interface Awards {
  id: string;
  title: string;
  description: string;
  date: string; // ISO 8601 timestamp
  user_sub: string; // AWS Cognito User Sub ID
  tool_id?: string; // Optional reference to related entity
  type: AwardType;
  coins: number;
  organizationID: string;
  customType?: string; // For CUSTOM_ACHIEVEMENT awards
  createdAt: string;
  updatedAt: string;
  _version: number;
  _deleted?: boolean;
}
```

#### 2. AwardDefinitions
Defines award templates and coin values per organization.

```typescript
interface AwardDefinition {
  id: string;
  type: AwardType;
  customType?: string;
  coins: number;
  title: string;
  description: string;
  organizationID: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  _version: number;
  _deleted?: boolean;
}
```

#### 3. UserCoins
Tracks each user's available coin balance per organization.

```typescript
interface UserCoins {
  id: string;
  user_sub: string; // AWS Cognito User Sub ID
  total_coins: number; // Current available balance
  organizationID: string;
  createdAt: string;
  updatedAt: string;
  _version: number;
  _deleted?: boolean;
}
```

#### 4. UserPurchases
Tracks shop purchases to calculate spent coins.

```typescript
interface UserPurchase {
  id: string;
  shopItemID: string;
  user_sub: string;
  purchaseDate: string;
  organizationID: string;
  status: 'PENDING' | 'APPROVED' | 'DELIVERED' | 'REJECTED';
  approvedBy?: string;
  approvedDate?: string;
  deliveryNotes?: string;
  rejectionReason?: string;
  _version: number;
  _deleted?: boolean;
}
```

### Award Types

The system supports the following award types:

```typescript
enum AwardType {
  // General Activities
  'QUIZ_PERFECT' = 20,          // 100% quiz score
  'QUIZ_MASTERY' = 10,          // 80%+ quiz score
  'REPORT_COMPLETE' = 25,       // Generic report completion
  'PROJECT_COMPLETE' = 30,      // Project completion
  'ACTION_ITEM_COMPLETE' = 5,   // Action item completion
  'KPI_GOAL_ACHIEVED' = 25,     // KPI target reached
  
  // Specific Report Types (CUSTOM_ACHIEVEMENT)
  'CUSTOM_ACHIEVEMENT' = 20,    // With customType:
  // - '5S_COMPLETE'
  // - 'A3_COMPLETE'
  // - 'DMAIC_COMPLETE'
  // - 'GEMBA_COMPLETE'
  // - 'KAIZEN_COMPLETE'
  // - 'LEADERSHIP_COMPLETE'
  // - 'LEAN_ASSESSMENT_COMPLETE'
  // - 'MISTAKE_PROOFING_COMPLETE'
  // - 'PDCA_COMPLETE'
  // - 'STANDARD_WORK_COMPLETE'
  // - 'WASTE_WALK_COMPLETE'
  // - 'FIVE_WHYS_COMPLETE'
  // - 'BRAINSTORMING_COMPLETE'
  // - 'FISHBONE_COMPLETE'
  // - 'HISTOGRAM_COMPLETE'
  // - 'IMPACT_MAP_COMPLETE'
  // - 'PARETO_COMPLETE'
  // - 'RUN_CHART_COMPLETE'
  // - 'SCATTER_PLOT_COMPLETE'
  // - 'STAKEHOLDER_COMPLETE'
  
  // Special Activities
  'VSM_COMPLETE' = 25,          // Value Stream Mapping
  'HIGHLIGHT_ADDED' = 5,        // Added report highlight
  'CATEGORY_COMPLETE' = 10,     // Completed category in report
  'STATEMENT_COMPLETE' = 3,     // Completed statement in report
  'FEEDBACK_PROVIDED' = 5,      // Provided feedback
  'TEAM_COLLABORATION' = 15,    // Team collaboration
  'FIRST_LOGIN' = 10,           // First platform login
  'PROFILE_COMPLETE' = 15,      // Completed user profile
  'WEEKLY_GOALS_MET' = 20,      // Met weekly goals
  'MONTHLY_GOALS_MET' = 30,     // Met monthly goals
  'LEARNING_TIME_MILESTONE' = 5 // Active learning time
}
```

## GraphQL API Reference

### Queries

#### 1. List User Awards
```graphql
query ListAwards(
  $filter: ModelAwardsFilterInput
  $limit: Int
  $nextToken: String
) {
  listAwards(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      date
      description
      user_sub
      tool_id
      type
      coins
      organizationID
      customType
      createdAt
      updatedAt
    }
    nextToken
  }
}
```

**Example Usage:**
```javascript
const userAwards = await API.graphql({
  query: queries.listAwards,
  variables: {
    filter: {
      user_sub: { eq: userSub },
      organizationID: { eq: organizationId },
      _deleted: { ne: true }
    }
  }
});
```

#### 2. List User Coins
```graphql
query ListUserCoins(
  $filter: ModelUserCoinsFilterInput
  $limit: Int
  $nextToken: String
) {
  listUserCoins(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      user_sub
      total_coins
      organizationID
      _version
      createdAt
      updatedAt
    }
    nextToken
  }
}
```

#### 3. List Award Definitions
```graphql
query ListAwardDefinitions(
  $filter: ModelAwardDefinitionFilterInput
  $limit: Int
  $nextToken: String
) {
  listAwardDefinitions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      type
      customType
      coins
      title
      description
      organizationID
      isEnabled
      createdAt
      updatedAt
    }
    nextToken
  }
}
```

#### 4. List Organization Members
```graphql
query ListOrganizationMembers(
  $filter: ModelOrganizationMemberFilterInput
  $limit: Int
  $nextToken: String
) {
  listOrganizationMembers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      email
      userSub
      organizationID
      status
      role
      departmentID
      _deleted
    }
    nextToken
  }
}
```

#### 5. List User Purchases (for spent coins calculation)
```graphql
query ListUserPurchases(
  $filter: ModelUserPurchaseFilterInput
  $limit: Int
  $nextToken: String
) {
  listUserPurchases(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      shopItemID
      user_sub
      purchaseDate
      organizationID
      status
      _deleted
    }
    nextToken
  }
}
```

### Mutations

#### 1. Create Award
```graphql
mutation CreateAwards(
  $input: CreateAwardsInput!
  $condition: ModelAwardsConditionInput
) {
  createAwards(input: $input, condition: $condition) {
    id
    title
    date
    description
    user_sub
    tool_id
    type
    coins
    organizationID
    customType
    createdAt
    updatedAt
  }
}
```

#### 2. Create/Update User Coins
```graphql
mutation CreateUserCoins(
  $input: CreateUserCoinsInput!
  $condition: ModelUserCoinsConditionInput
) {
  createUserCoins(input: $input, condition: $condition) {
    id
    user_sub
    total_coins
    organizationID
    _version
    createdAt
    updatedAt
  }
}

mutation UpdateUserCoins(
  $input: UpdateUserCoinsInput!
  $condition: ModelUserCoinsConditionInput
) {
  updateUserCoins(input: $input, condition: $condition) {
    id
    user_sub
    total_coins
    organizationID
    _version
    createdAt
    updatedAt
  }
}
```

#### 3. Create Award Definition
```graphql
mutation CreateAwardDefinition(
  $input: CreateAwardDefinitionInput!
  $condition: ModelAwardDefinitionConditionInput
) {
  createAwardDefinition(input: $input, condition: $condition) {
    id
    type
    customType
    coins
    title
    description
    organizationID
    isEnabled
    createdAt
    updatedAt
  }
}
```

### Subscriptions

#### Real-time Award Updates
```graphql
subscription OnCreateAwards {
  onCreateAwards {
    id
    title
    date
    description
    user_sub
    tool_id
    type
    coins
    organizationID
    customType
    createdAt
    updatedAt
  }
}
```

## Award System Implementation

### 1. Award Creation Flow

```javascript
// Core function to add an award
export const addAward = async (
  awardType, 
  organizationId, 
  customTitle = null, 
  toolId = null, 
  customType = null, 
  userSub = null, 
  coinOverride = null
) => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    
    // Get award definition
    const awardDef = await getAwardDefinition(awardType, organizationId, customType);
    if (!awardDef) {
      console.error('Award definition not found for type:', awardType, customType);
      return false;
    }

    const awardRecipientSub = userSub || user.attributes.sub;
    const coinsToAward = coinOverride !== null ? coinOverride : awardDef.coins;

    // Create award record
    const awardInput = {
      title: customTitle || awardDef.title,
      description: awardDef.description,
      date: new Date().toISOString(),
      user_sub: awardRecipientSub,
      tool_id: toolId,
      type: awardType,
      coins: coinsToAward,
      organizationID: organizationId,
      customType: customType || null
    };

    const result = await API.graphql({
      query: mutations.createAwards,
      variables: { input: awardInput }
    });
    
    // Update user's coin balance
    await updateUserCoins(awardRecipientSub, coinsToAward, organizationId);
    
    // Show award animation if current user
    if (awardRecipientSub === user.attributes.sub && showAwardCallback) {
      showAwardCallback(coinsToAward);
    }
    
    // Send email notification
    const awardRecord = result.data.createAwards;
    const recipientEmail = await getUserEmailFromSub(awardRecipientSub, organizationId);
    if (recipientEmail) {
      await sendAwardEarnedNotification(awardRecord, recipientEmail, organizationId);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding award:', error);
    return false;
  }
};
```

### 2. Report Completion Awards

```javascript
export const handleReportCompleteAward = async (organizationId, reportType, userSub) => {
  const reportToAwardMap = {
    'Value Stream Mapping Report': 'VSM_COMPLETE',
    '5S Report': '5S_COMPLETE',
    'A3 Project Report': 'A3_COMPLETE',
    'DMAIC Report': 'DMAIC_COMPLETE',
    // ... other report types
  };

  if (reportType === 'Value Stream Mapping Report') {
    return await addAward('VSM_COMPLETE', organizationId, null, null, null, userSub);
  } else if (reportToAwardMap[reportType]) {
    return await addAward('CUSTOM_ACHIEVEMENT', organizationId, null, null, reportToAwardMap[reportType], userSub);
  }
  
  return false;
};
```

### 3. Coin Management

```javascript
export const updateUserCoins = async (userSub, coinsToAdd, organizationId) => {
  try {
    // Get current user coins
    const result = await API.graphql({
      query: queries.listUserCoins,
      variables: {
        filter: {
          user_sub: { eq: userSub },
          organizationID: { eq: organizationId }
        }
      }
    });

    const userCoins = result.data.listUserCoins.items.filter(item => !item._deleted)[0];

    if (userCoins) {
      // Update existing record
      const updateInput = {
        id: userCoins.id,
        total_coins: userCoins.total_coins + coinsToAdd,
        _version: userCoins._version
      };
      
      await API.graphql({
        query: mutations.updateUserCoins,
        variables: { input: updateInput }
      });
    } else {
      // Create new record
      const createInput = {
        user_sub: userSub,
        organizationID: organizationId,
        total_coins: coinsToAdd
      };
      
      await API.graphql({
        query: mutations.createUserCoins,
        variables: { input: createInput }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user coins:', error);
    return false;
  }
};
```

## Leaderboard System Implementation

### 1. Data Fetching Logic

The leaderboard aggregates data from multiple sources:

```javascript
const fetchLeaderboard = async () => {
  // 1. Get all organization members
  const membersResult = await API.graphql({
    query: queries.listOrganizationMembers,
    variables: {
      filter: {
        organizationID: { eq: activeOrganization.id },
        status: { eq: 'ACTIVE' },
        _deleted: { ne: true }
      }
    }
  });

  // 2. Get all user coins (available balances)
  const userCoinsResult = await API.graphql({
    query: queries.listUserCoins,
    variables: {
      filter: {
        organizationID: { eq: activeOrganization.id },
        _deleted: { ne: true }
      },
      limit: 1000
    }
  });

  // 3. Get all purchases (to calculate spent coins)
  const purchasesResult = await API.graphql({
    query: queries.listUserPurchases,
    variables: {
      filter: {
        organizationID: { eq: activeOrganization.id },
        status: { eq: 'DELIVERED' },
        _deleted: { ne: true }
      },
      limit: 1000
    }
  });

  // 4. Get shop items (for purchase prices)
  const shopItemsResult = await API.graphql({
    query: queries.listShopItems,
    variables: {
      filter: {
        organizationID: { eq: activeOrganization.id }
      },
      limit: 1000
    }
  });

  // Process and combine data...
};
```

### 2. Leaderboard Data Processing

```javascript
// Create leaderboard ranking logic
const processLeaderboardData = (members, userCoinsRecords, purchases, shopItems) => {
  // Create maps for efficient lookup
  const availableCoinsMap = {};
  userCoinsRecords.forEach(record => {
    if (record.user_sub && record.total_coins !== undefined) {
      availableCoinsMap[record.user_sub] = record.total_coins;
    }
  });

  const shopItemsMap = {};
  shopItems.forEach(item => {
    shopItemsMap[item.id] = item;
  });

  // Calculate spent coins per user
  const spentCoinsMap = {};
  purchases.forEach(purchase => {
    if (purchase.user_sub && purchase.shopItemID && shopItemsMap[purchase.shopItemID]) {
      const price = shopItemsMap[purchase.shopItemID].price || 0;
      spentCoinsMap[purchase.user_sub] = (spentCoinsMap[purchase.user_sub] || 0) + price;
    }
  });

  // Create leaderboard data
  const leaderboardData = members.map(member => {
    const available = availableCoinsMap[member.userSub] || 0;
    const spent = spentCoinsMap[member.userSub] || 0;
    const earned = available + spent; // Total earned = available + spent

    return {
      id: member.id,
      email: member.email,
      userSub: member.userSub,
      coinsEarned: earned,
      coinsAvailable: available,
      coinsSpent: spent,
      department: member.departmentID ? departmentsMap[member.departmentID] : null,
      firstName: null, // Fetch separately
      lastName: null,  // Fetch separately
    };
  });

  // Sort by total earned coins (highest first)
  return leaderboardData.sort((a, b) => b.coinsEarned - a.coinsEarned);
};
```

### 3. User Info Enhancement

```javascript
// Fetch user names in batches for performance
const enhanceWithUserInfo = async (leaderboardData) => {
  const batchSize = 10;
  const nonCurrentUsers = leaderboardData.filter(member => !member.isCurrentUser);
  
  for (let i = 0; i < nonCurrentUsers.length; i += batchSize) {
    const batch = nonCurrentUsers.slice(i, i + batchSize);
    
    await Promise.all(batch.map(async (member) => {
      try {
        if (member.userSub) {
          const userData = await getUserByCognitoID(member.userSub);
          if (userData) {
            member.firstName = userData.firstName;
            member.lastName = userData.lastName;
          }
        }
      } catch (error) {
        console.error(`Error fetching data for user ${member.email}:`, error);
      }
    }));
  }
  
  return leaderboardData;
};
```

## Coin Economy

### Coin Flow Overview

1. **Earning Coins**: Users earn coins through various activities
2. **Spending Coins**: Users can purchase items from the organization shop
3. **Balance Tracking**: System tracks available vs. spent coins
4. **Leaderboard Ranking**: Based on total coins earned (available + spent)

### Coin Values by Activity

| Activity | Base Coins | Notes |
|----------|------------|-------|
| Perfect Quiz (100%) | 20 | Quiz completion with perfect score |
| Quiz Mastery (80%+) | 10 | Quiz completion with good score |
| Report Completion | 20-25 | Varies by report type |
| Project Completion | 30 | Distributed to all project members |
| Action Item | 5 | Per completed action item |
| KPI Goal Achievement | 25 | When KPI target is met |
| First Login | 10 | One-time welcome bonus |
| Profile Completion | 15 | One-time setup bonus |
| Learning Time | 5 | Active learning milestones |

## Mobile App Implementation Guide

### 1. Required Dependencies

```json
{
  "dependencies": {
    "aws-amplify": "^4.x.x",
    "@aws-amplify/api": "^4.x.x",
    "@aws-amplify/auth": "^4.x.x"
  }
}
```

### 2. Basic Setup

```javascript
// Configure Amplify (same configuration as web app)
import Amplify, { API, Auth } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);
```

### 3. Awards Screen Implementation

```jsx
// Awards.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { API, Auth } from 'aws-amplify';
import * as queries from '../graphql/queries';

const AwardsScreen = ({ organizationId }) => {
  const [awards, setAwards] = useState([]);
  const [totalCoins, setTotalCoins] = useState(0);
  const [availableCoins, setAvailableCoins] = useState(0);
  const [spentCoins, setSpentCoins] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAwards = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      // Fetch user's awards
      const awardsResult = await API.graphql({
        query: queries.listAwards,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            organizationID: { eq: organizationId },
            _deleted: { ne: true }
          }
        }
      });

      const userAwards = awardsResult.data.listAwards.items;
      setAwards(userAwards.sort((a, b) => new Date(b.date) - new Date(a.date)));

      // Fetch available coins
      const coinsResult = await API.graphql({
        query: queries.listUserCoins,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            organizationID: { eq: organizationId }
          }
        }
      });

      const userCoins = coinsResult.data.listUserCoins.items[0];
      const available = userCoins ? userCoins.total_coins : 0;
      setAvailableCoins(available);

      // Fetch purchases to calculate spent coins
      const purchasesResult = await API.graphql({
        query: queries.listUserPurchases,
        variables: {
          filter: {
            user_sub: { eq: user.attributes.sub },
            organizationID: { eq: organizationId },
            status: { eq: 'DELIVERED' },
            _deleted: { ne: true }
          }
        }
      });

      // Calculate spent coins (need to fetch shop items for prices)
      const purchases = purchasesResult.data.listUserPurchases.items;
      let spent = 0;
      
      for (const purchase of purchases) {
        try {
          const itemResult = await API.graphql({
            query: queries.getShopItem,
            variables: { id: purchase.shopItemID }
          });
          const shopItem = itemResult.data.getShopItem;
          if (shopItem) {
            spent += shopItem.price || 0;
          }
        } catch (error) {
          console.error('Error fetching shop item:', error);
        }
      }
      
      setSpentCoins(spent);
      setTotalCoins(available + spent);
    } catch (error) {
      console.error('Error fetching awards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchAwards();
    }
  }, [organizationId]);

  const renderAward = ({ item }) => (
    <View style={styles.awardItem}>
      <View style={styles.awardHeader}>
        <Text style={styles.awardTitle}>{item.title}</Text>
        <Text style={styles.awardCoins}>{item.coins} coins</Text>
      </View>
      <Text style={styles.awardDescription}>{item.description}</Text>
      <Text style={styles.awardDate}>
        {new Date(item.date).toLocaleDateString()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{awards.length}</Text>
          <Text style={styles.statLabel}>Total Awards</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalCoins}</Text>
          <Text style={styles.statLabel}>Total Earned</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{availableCoins}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{spentCoins}</Text>
          <Text style={styles.statLabel}>Spent</Text>
        </View>
      </View>

      <FlatList
        data={awards}
        keyExtractor={(item) => item.id}
        renderItem={renderAward}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchAwards} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No awards yet!</Text>
            <Text style={styles.emptySubtext}>
              Complete activities to earn awards and coins
            </Text>
          </View>
        }
      />
    </View>
  );
};
```

### 4. Leaderboard Screen Implementation

```jsx
// Leaderboard.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image } from 'react-native';
import { API } from 'aws-amplify';
import * as queries from '../graphql/queries';

const LeaderboardScreen = ({ organizationId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      // Fetch organization members
      const membersResult = await API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
          filter: {
            organizationID: { eq: organizationId },
            status: { eq: 'ACTIVE' },
            _deleted: { ne: true }
          }
        }
      });

      // Fetch user coins
      const userCoinsResult = await API.graphql({
        query: queries.listUserCoins,
        variables: {
          filter: {
            organizationID: { eq: organizationId },
            _deleted: { ne: true }
          }
        }
      });

      // Fetch purchases
      const purchasesResult = await API.graphql({
        query: queries.listUserPurchases,
        variables: {
          filter: {
            organizationID: { eq: organizationId },
            status: { eq: 'DELIVERED' },
            _deleted: { ne: true }
          }
        }
      });

      // Process leaderboard data (similar to web implementation)
      const processedData = processLeaderboardData(
        membersResult.data.listOrganizationMembers.items,
        userCoinsResult.data.listUserCoins.items,
        purchasesResult.data.listUserPurchases.items
      );

      setLeaderboard(processedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLeaderboardItem = ({ item, index }) => (
    <View style={[
      styles.leaderboardItem,
      index < 3 && styles.topPerformer
    ]}>
      <View style={styles.rankContainer}>
        {index === 0 ? (
          <Text style={styles.goldRank}>🥇</Text>
        ) : index === 1 ? (
          <Text style={styles.silverRank}>🥈</Text>
        ) : index === 2 ? (
          <Text style={styles.bronzeRank}>🥉</Text>
        ) : (
          <Text style={styles.rank}>{index + 1}</Text>
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.firstName && item.lastName 
            ? `${item.firstName} ${item.lastName}` 
            : item.email}
        </Text>
        <View style={styles.coinsContainer}>
          <Text style={styles.coinsEarned}>
            Earned: {item.coinsEarned}
          </Text>
          <Text style={styles.coinsAvailable}>
            Available: {item.coinsAvailable}
          </Text>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    if (organizationId) {
      fetchLeaderboard();
    }
  }, [organizationId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      
      <FlatList
        data={leaderboard}
        keyExtractor={(item) => item.id}
        renderItem={renderLeaderboardItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
```

### 5. Award Creation Utilities

```javascript
// utils/awards.js
import { API, Auth } from 'aws-amplify';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

export const addAward = async (
  awardType, 
  organizationId, 
  customTitle = null, 
  toolId = null, 
  customType = null, 
  userSub = null
) => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    
    // Get award definition
    const awardDefsResult = await API.graphql({
      query: queries.listAwardDefinitions,
      variables: {
        filter: {
          type: { eq: awardType },
          organizationID: { eq: organizationId },
          isEnabled: { eq: true },
          ...(customType && { customType: { eq: customType } })
        }
      }
    });

    const awardDef = awardDefsResult.data.listAwardDefinitions.items[0];
    if (!awardDef) {
      console.error('Award definition not found');
      return false;
    }

    const awardRecipientSub = userSub || user.attributes.sub;

    // Create award
    const awardInput = {
      title: customTitle || awardDef.title,
      description: awardDef.description,
      date: new Date().toISOString(),
      user_sub: awardRecipientSub,
      tool_id: toolId,
      type: awardType,
      coins: awardDef.coins,
      organizationID: organizationId,
      customType: customType || null
    };

    const result = await API.graphql({
      query: mutations.createAwards,
      variables: { input: awardInput }
    });
    
    // Update user coins
    await updateUserCoins(awardRecipientSub, awardDef.coins, organizationId);
    
    return true;
  } catch (error) {
    console.error('Error adding award:', error);
    return false;
  }
};

export const updateUserCoins = async (userSub, coinsToAdd, organizationId) => {
  try {
    // Get current user coins
    const result = await API.graphql({
      query: queries.listUserCoins,
      variables: {
        filter: {
          user_sub: { eq: userSub },
          organizationID: { eq: organizationId }
        }
      }
    });

    const userCoins = result.data.listUserCoins.items.filter(item => !item._deleted)[0];

    if (userCoins) {
      // Update existing
      await API.graphql({
        query: mutations.updateUserCoins,
        variables: {
          input: {
            id: userCoins.id,
            total_coins: userCoins.total_coins + coinsToAdd,
            _version: userCoins._version
          }
        }
      });
    } else {
      // Create new
      await API.graphql({
        query: mutations.createUserCoins,
        variables: {
          input: {
            user_sub: userSub,
            organizationID: organizationId,
            total_coins: coinsToAdd
          }
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error updating user coins:', error);
    return false;
  }
};
```

### 6. Integration Examples

#### Report Completion Award
```javascript
// After a report is completed
const handleReportCompletion = async (reportType, organizationId) => {
  const reportToAwardMap = {
    '5S Report': '5S_COMPLETE',
    'Kaizen Project Report': 'KAIZEN_COMPLETE',
    // ... other mappings
  };

  const customType = reportToAwardMap[reportType];
  if (customType) {
    await addAward('CUSTOM_ACHIEVEMENT', organizationId, null, null, customType);
  }
};
```

#### Quiz Completion Award
```javascript
// After a quiz is completed
const handleQuizCompletion = async (quizScore, organizationId) => {
  if (quizScore === 100) {
    await addAward('QUIZ_PERFECT', organizationId);
  } else if (quizScore >= 80) {
    await addAward('QUIZ_MASTERY', organizationId);
  }
};
```

## Best Practices

### 1. Performance Optimization
- **Batch GraphQL requests** where possible
- **Use pagination** for large datasets
- **Implement caching** for frequently accessed data
- **Lazy load** user names in leaderboard

### 2. Error Handling
- Always wrap API calls in try-catch blocks
- Provide fallback values for missing data
- Log errors for debugging but don't crash the app

### 3. Real-time Updates
- Implement GraphQL subscriptions for live award notifications
- Use optimistic updates for better UX
- Handle network disconnections gracefully

### 4. Security
- Validate all inputs before making API calls
- Use organization-scoped filters for all queries
- Never expose sensitive user information

### 5. Testing
- Test with different organization configurations
- Test award creation edge cases
- Test leaderboard ranking accuracy
- Test with large datasets

## Conclusion

This documentation provides all the necessary information to implement the Awards and Leaderboard functionality in the mobile app using the same backend infrastructure as the web application. The system is designed to be scalable, secure, and engaging for users across all platforms.

For additional support or questions about specific implementation details, refer to the utility functions in the web application or consult the existing GraphQL schema documentation.