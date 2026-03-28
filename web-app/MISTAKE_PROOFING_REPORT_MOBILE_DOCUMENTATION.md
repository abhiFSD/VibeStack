# Mistake Proofing Report - Mobile Implementation Guide

## Overview
This document specifically covers the Mistake Proofing Report implementation details that are **different** from standard reports. The mobile app must replicate these exact behaviors to match the web application.

## Key Differences from Standard Reports

### 1. Category Creation with Auto-Statements
When a new category is created for a Mistake Proofing Report, the system **automatically creates two statements**:

**Location in Web Code**: `CategoryList.js:162-186`

```javascript
if (reportType === "Mistake Proofing Report") {
  const statementsToAdd = [
    {
      name: "Potential Score",
      value: 3,  // Default value
      categoriesID: savedCategory.id,
      categoryName: savedCategory.name,
      default: false,
    },
    {
      name: "Consequences Score", 
      value: 3,  // Default value
      categoriesID: savedCategory.id,
      categoryName: savedCategory.name,
      default: false
    },
  ];

  // Create both statements automatically
  for (const statement of statementsToAdd) {
    await API.graphql({
      query: mutations.createStatements,
      variables: { input: statement }
    });
  }
}
```

**Mobile Implementation**: After successfully creating a category with `createCategories` mutation, immediately create these two statements using the `createStatements` mutation.

### 2. UI Label Changes

**Categories are called "Potential Failure"** instead of "Categories":
- Web Code: `CategoryList.js:480-481`
- Display: "Total X Potential Failure" instead of "Total X Categories"
- Add dialogs should say "Add Potential Failure" instead of "Add Category"

### 3. No Custom Statement Addition

**CRITICAL**: Mistake Proofing Report **does not allow** adding custom statements.
- Web Code: `CategoryCard.js:696` - The "Add Statement" button is hidden
- Only the two auto-created statements ("Potential Score" and "Consequences Score") are allowed
- Users can only edit the values of these two statements, not add new ones

### 4. Special Statement Display

Each statement type has **descriptive help text** and **custom value mappings**:

#### Potential Score Statement
- **Help Text**: "How likely is it that this failure will happen?"
- **Value Mapping** (Web Code: `CategoryCard.js:305-319`):
```javascript
const PotenScore = (value) => {
  switch (value) {
    case 5: return "Excellent Chance";
    case 4: return "Good Chance"; 
    case 3: return "50 / 50";
    case 2: return "Rarely";
    case 1: return "Very Unlikely";
    default: return "Select Value";
  }
};
```

#### Consequences Score Statement  
- **Help Text**: "How severe would the impact be if this failure occurred?"
- **Value Mapping** (Web Code: `CategoryCard.js:321-335`):
```javascript
const ConseScore = (value) => {
  switch (value) {
    case 5: return "Most Severe";
    case 4: return "Severe";
    case 3: return "Moderate"; 
    case 2: return "Some Risk";
    case 1: return "Little Risk";
    default: return "Select Value";
  }
};
```

### 5. Statement Rendering Logic

**Location**: `CategoryCard.js:411-440`

```javascript
// Display help text under statement name
{statement.name === "Potential Score" && reportType === "Mistake Proofing Report" && (
  <div className="text-muted small mt-1">
    How likely is it that this failure will happen?
  </div>
)}
{statement.name === "Consequences Score" && reportType === "Mistake Proofing Report" && (
  <div className="text-muted small mt-1">
    How severe would the impact be if this failure occurred?
  </div>
)}

// Use custom value display
{statement.name === "Potential Score" && reportType === "Mistake Proofing Report"
  ? PotenScore(statement.value)
  : statement.name === "Consequences Score" && reportType === "Mistake Proofing Report"
  ? ConseScore(statement.value)
  : valueToName(statement.value)}
```

### 6. Value Selection Modal

**Location**: `CategoryCard.js:891-930`

The value selection dropdown shows different options based on statement type:

```javascript
{currentStatement?.name === "Potential Score" ? (
  <>
    <option value={5}>Excellent Chance</option>
    <option value={4}>Good Chance</option>
    <option value={3}>50 / 50</option>
    <option value={2}>Rarely</option>
    <option value={1}>Very Unlikely</option>
  </>
) : currentStatement?.name === "Consequences Score" ? (
  <>
    <option value={5}>Most Severe</option>
    <option value={4}>Severe</option>
    <option value={3}>Moderate</option>
    <option value={2}>Some Risk</option>
    <option value={1}>Little Risk</option>
  </>
) : (
  // Standard 5S scale for other reports
  <>
    <option value={5}>Strongly Agree</option>
    <option value={4}>Agree</option>
    <option value={3}>Neutral</option>
    <option value={2}>Disagree</option>
    <option value={1}>Strongly Disagree</option>
  </>
)}
```

### 7. Score Calculations

Mistake Proofing Report **includes both statements in score calculations** like 5S Report:
- Web Code: `CategoryCard.js:56` - Includes `reportType === 'Mistake Proofing Report'`
- Both "Potential Score" and "Consequences Score" are included in total/average
- Filters statements with `s.value && s.value > 0` (no root cause logic, just valid values)
- Shows "Total: X" and "Avg: X.XX" badges in category header

## Root Cause Functionality

**IMPORTANT**: Mistake Proofing Report does **NOT** have root cause functionality.
- Root cause logic (`statement.value === 0`) is **ONLY** for "5 Whys Report"
- Mistake Proofing Report uses values 1-5 only
- No star rating system
- No "root cause" marking

## Testing Scenarios for Mobile

1. **Create Category**: Verify two statements are auto-created with default value 3
2. **Statement Values**: Test both statement types show correct value mappings
3. **Help Text**: Verify help text appears under statement names
4. **No Add Statement**: Confirm "Add Statement" button is not shown
5. **Score Calculation**: Verify total and average scores are calculated and displayed
6. **Value Selection**: Test dropdown shows correct options for each statement type
7. **Category Label**: Confirm UI shows "Potential Failure" not "Categories"

## GraphQL Mutations Needed

**Category Creation** (same as other reports):
```javascript
await API.graphql({
  query: mutations.createCategories,
  variables: { 
    input: {
      name: categoryName,
      reportID: reportId,
      orderIndex: nextOrderIndex,
      description: '',
      assignees: [],
      attachments: []
    }
  }
});
```

**Auto-Statement Creation** (after category creation):
```javascript
const statements = [
  {
    name: "Potential Score",
    value: 3,
    categoriesID: newCategoryId,
    categoryName: categoryName,
    default: false
  },
  {
    name: "Consequences Score", 
    value: 3,
    categoriesID: newCategoryId,
    categoryName: categoryName,
    default: false
  }
];

for (const statement of statements) {
  await API.graphql({
    query: mutations.createStatements,
    variables: { input: statement }
  });
}
```

## Mobile Implementation Checklist

- [ ] Auto-create "Potential Score" and "Consequences Score" when category is created
- [ ] Hide "Add Statement" button/functionality 
- [ ] Use "Potential Failure" label instead of "Categories"
- [ ] Implement `PotenScore()` and `ConseScore()` value mapping functions
- [ ] Show help text under each statement type
- [ ] Use correct dropdown options in value selection
- [ ] Include both statements in score calculations (total/average)
- [ ] Display score badges in category headers
- [ ] Test all scenarios listed above

## File References in Web Codebase

- **CategoryList.js:162-186** - Auto-statement creation logic
- **CategoryCard.js:411-440** - Statement rendering with help text
- **CategoryCard.js:435-439** - Custom value display logic  
- **CategoryCard.js:891-930** - Value selection modal options
- **CategoryCard.js:56** - Score calculation inclusion
- **CategoryCard.js:696** - Hidden "Add Statement" button
- **CategoryList.js:480-481** - "Potential Failure" label