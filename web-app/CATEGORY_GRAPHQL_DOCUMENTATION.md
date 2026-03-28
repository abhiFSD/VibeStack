# Category System GraphQL Documentation for Mobile Development

## Overview
This document details the GraphQL queries and mutations used in the web application for fetching and managing categories in reports (especially 5S Reports). The mobile application should implement the same queries to ensure consistency with the web version.

## Key GraphQL Queries

### 1. Fetching Categories for a Report

**Query: `listCategories`**

```graphql
query ListCategories(
  $filter: ModelCategoriesFilterInput
  $limit: Int
  $nextToken: String
) {
  listCategories(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      name
      reportID
      orderIndex
      assignees
      attachments
      description
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
```

**Usage in Web App (Report5s.js):**
```javascript
const categoriesResult = await API.graphql({
  query: queries.listCategories,
  variables: {
    filter: { 
      reportID: { eq: reportId },
      _deleted: { ne: true }
    },
    limit: 1000
  }
});

// Process the response
const categories = categoriesResult.data.listCategories.items
  .filter(item => item && !item._deleted)
  .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
```

**Important Notes:**
- Always filter by `reportID` to get categories for a specific report
- Filter out deleted items with `_deleted: { ne: true }`
- Set a high limit (1000) to ensure all categories are fetched
- Sort categories by `orderIndex` for correct display order

### 2. Fetching Statements for a Category

**Query: `statementsByCategoriesID`**

```graphql
query StatementsByCategoriesID(
  $categoriesID: ID!
  $sortDirection: ModelSortDirection
  $filter: ModelStatementsFilterInput
  $limit: Int
  $nextToken: String
) {
  statementsByCategoriesID(
    categoriesID: $categoriesID
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      name
      value
      default
      owner
      categoriesID
      categoryName
      reportID
      _version
      _deleted
      _lastChangedAt
      createdAt
      updatedAt
      __typename
    }
    nextToken
    __typename
  }
}
```

**Usage in Web App (CategoryCard.js:269):**
```javascript
const result = await API.graphql({
  query: queries.statementsByCategoriesID,
  variables: {
    categoriesID: category.id,
    filter: { 
      _deleted: { ne: true },
      default: { ne: true }  // Filter out default statements
    }
  }
});

const fetchedStatements = result.data.statementsByCategoriesID.items;
```

**Important Notes:**
- Use `categoriesID` to fetch statements for a specific category
- Filter out deleted statements with `_deleted: { ne: true }`
- Filter out default statements with `default: { ne: true }`
- Statements have a `value` field (1-5) representing the rating/score

## Key GraphQL Mutations

### 1. Creating a Category

**Mutation: `createCategories`**

```javascript
const newCategory = {
  name: "Category Name",
  reportID: reportId,
  orderIndex: highestOrderIndex + 1,  // Maintain order
  description: '',
  assignees: [],
  attachments: []
};

await API.graphql({
  query: mutations.createCategories,
  variables: { input: newCategory }
});
```

### 2. Updating a Category

**Mutation: `updateCategories`**

```javascript
await API.graphql({
  query: mutations.updateCategories,
  variables: {
    input: {
      id: category.id,
      name: updatedName,
      description: updatedDescription,
      assignees: updatedAssignees,
      attachments: updatedAttachments,
      _version: category._version  // Required for conflict resolution
    }
  }
});
```

### 3. Creating Statements

**Mutation: `createStatements`**

```javascript
const newStatement = {
  name: "Statement Name",
  value: 3,  // Default value (1-5 scale)
  categoriesID: category.id,
  categoryName: category.name,
  default: false,
  reportID: reportId  // Optional but recommended
};

await API.graphql({
  query: mutations.createStatements,
  variables: { input: newStatement }
});
```

### 4. Updating Statement Values

**Mutation: `updateStatements`**

```javascript
await API.graphql({
  query: mutations.updateStatements,
  variables: {
    input: {
      id: statement.id,
      value: newValue,  // 1-5 scale
      _version: statement._version
    }
  }
});
```

## Real-time Subscriptions

The web app uses GraphQL subscriptions for real-time updates. Mobile should implement these for a consistent experience:

### Statement Creation Subscription
```graphql
subscription OnCreateStatements($filter: ModelSubscriptionStatementsFilterInput) {
  onCreateStatements(filter: $filter) {
    id
    name
    value
    default
    owner
    categoriesID
    categoryName
    reportID
    _version
    _deleted
    _lastChangedAt
    createdAt
    updatedAt
  }
}
```

**Usage:**
```javascript
API.graphql({
  query: subscriptionQuery,
  variables: { 
    filter: { 
      categoriesID: { eq: category.id },
      _deleted: { ne: true },
      default: { ne: true }
    }
  }
}).subscribe({
  next: ({ provider, value }) => {
    const newStatement = value.data.onCreateStatements;
    // Update UI with new statement
  }
});
```

## Data Models

### Category Model
```typescript
interface Category {
  id: string;
  name: string;
  reportID: string;
  orderIndex: number;
  description?: string;
  assignees?: string[];
  attachments?: string[];
  _version: number;
  _deleted?: boolean;
  _lastChangedAt?: number;
  createdAt: string;
  updatedAt: string;
}
```

### Statement Model
```typescript
interface Statement {
  id: string;
  name: string;
  value: number;  // 1-5 scale
  default: boolean;
  owner?: string;
  categoriesID: string;
  categoryName?: string;
  reportID?: string;
  _version: number;
  _deleted?: boolean;
  _lastChangedAt?: number;
  createdAt: string;
  updatedAt: string;
}
```

## Value Scale Mappings

### Standard 5S Report Scale
- 5: "Strongly Agree"
- 4: "Agree"
- 3: "Neutral"
- 2: "Disagree"
- 1: "Strongly Disagree"

### Mistake Proofing Report - Potential Score
- 5: "Excellent Chance"
- 4: "Good Chance"
- 3: "50 / 50"
- 2: "Rarely"
- 1: "Very Unlikely"

### Mistake Proofing Report - Consequences Score
- 5: "Most Severe"
- 4: "Severe"
- 3: "Moderate"
- 2: "Some Risk"
- 1: "Little Risk"

## Special Report Type Behaviors

### 5S Report
- Categories typically include: Sort, Set In Order, Shine, Standardize, Sustain, Safety
- Each category can have multiple statements
- Statements are scored on a 1-5 scale
- Total and average scores are calculated per category

### Mistake Proofing Report
- Auto-creates two statements when a category is added:
  - "Potential Score"
  - "Consequences Score"
- Uses special value mappings (see above)

### 5 Whys Report
- Uses star rating system (value = 0 indicates root cause)
- Different UI behavior for statement values

## Implementation Checklist for Mobile

- [ ] Implement `listCategories` query with proper filtering
- [ ] Implement `statementsByCategoriesID` query
- [ ] Sort categories by `orderIndex`
- [ ] Filter out deleted items (`_deleted: { ne: true }`)
- [ ] Filter out default statements (`default: { ne: true }`)
- [ ] Implement create/update/delete mutations for categories
- [ ] Implement create/update/delete mutations for statements
- [ ] Always include `_version` field in update mutations
- [ ] Implement real-time subscriptions for collaborative features
- [ ] Handle value scale mappings based on report type
- [ ] Calculate total and average scores for assessment-type reports
- [ ] Special handling for Mistake Proofing Report (auto-create statements)

## Testing Recommendations

1. Test with reports that have no categories
2. Test with reports that have many categories (20+)
3. Test category reordering (orderIndex updates)
4. Test statement value updates and score calculations
5. Test real-time updates between web and mobile
6. Test conflict resolution with `_version` field
7. Test filtering of deleted items
8. Test pagination with `nextToken` if needed

## Contact for Questions

If you have questions about the implementation, refer to these key files in the web codebase:
- `/src/components/reports/CategoryCard.js` - Category display and statement management
- `/src/components/reports/CategoryList.js` - Category listing and management
- `/src/components/reports/Report5s.js` - 5S Report implementation
- `/src/graphql/queries.js` - All GraphQL queries
- `/src/graphql/mutations.js` - All GraphQL mutations
- `/src/graphql/subscriptions.js` - All GraphQL subscriptions