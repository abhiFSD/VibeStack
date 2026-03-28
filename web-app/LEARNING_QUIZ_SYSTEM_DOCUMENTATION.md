# Learning & Quiz System Documentation

## Overview

The VibeStack™ Pro Learning & Quiz System provides a comprehensive educational platform with structured learning content and interactive quizzes. This document outlines the complete implementation for replicating this functionality in any app connected to the same AWS Amplify backend.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Data Models & Schema](#data-models--schema)
3. [Learning System](#learning-system)
4. [Quiz System](#quiz-system)
5. [Award System Integration](#award-system-integration)
6. [Frontend Components](#frontend-components)
7. [API Integration](#api-integration)
8. [Implementation Guide](#implementation-guide)

## System Architecture

The system is built on AWS Amplify with the following components:

- **Frontend**: React components for learning content and quiz interaction
- **Backend**: GraphQL API with AWS AppSync
- **Database**: DynamoDB tables managed by Amplify
- **Authentication**: AWS Cognito with multi-organization support
- **File Storage**: AWS S3 for content attachments

## Data Models & Schema

### Core Entities

#### Learning
```graphql
type Learning @model @auth(rules: [{allow: public}]) {
  id: ID!
  orderIndex: Int
  title: String!
  description: String
  chapters: [Chapter] @hasMany(indexName: "byLearning", fields: ["id"])
  quizzes: [Quiz] @hasMany(indexName: "byLearning", fields: ["id"])
  quizScore: Float
  quizStatementsCount: Int
  hasQuizTaken: Boolean
  isDefault: Boolean
  readTime: String
  organizationID: ID @index(name: "byOrganization")
  organization: Organization @belongsTo(fields: ["organizationID"])
  clonedFromID: ID  # ID of the original learning this was cloned from
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
}
```

#### Chapter
```graphql
type Chapter @model @auth(rules: [{allow: public}]) {
  id: ID!
  title: String!
  slug: String
  position: Int
  postId: ID
  post: Post @hasOne(fields: ["postId"])
  learningId: ID! @index(name: "byLearning", sortKeyFields: ["position"])
  learning: Learning @belongsTo(fields: ["learningId"])
  sections: [Section] @hasMany(indexName: "byChapter", fields: ["id"])
  organizationId: ID @index(name: "byOrganization")
  isDefault: Boolean
}
```

#### Section
```graphql
type Section @model @auth(rules: [{allow: public}]) {
  id: ID!
  title: String!
  slug: String
  position: Int
  chapterId: ID! @index(name: "byChapter", sortKeyFields: ["position"])
  chapter: Chapter @belongsTo(fields: ["chapterId"])
  subSections: [SubSection] @hasMany(indexName: "bySection", fields: ["id"])
  organizationId: ID @index(name: "byOrganization")
  postId: ID
  post: Post @hasOne(fields: ["postId"])
  isDefault: Boolean
}
```

#### SubSection
```graphql
type SubSection @model @auth(rules: [{allow: public}]) {
  id: ID!
  title: String!
  slug: String
  position: Int
  sectionId: ID! @index(name: "bySection", sortKeyFields: ["position"])
  section: Section @belongsTo(fields: ["sectionId"])
  postId: ID
  post: Post @hasOne(fields: ["postId"])
  organizationId: ID @index(name: "byOrganization")
}
```

#### Quiz
```graphql
type Quiz @model @auth(rules: [{allow: public}]) {
  id: ID!
  title: String!
  description: String
  questions: [Question] @hasMany(indexName: "byQuiz", fields: ["id"])
  learningId: ID! @index(name: "byLearning")
  learning: Learning @belongsTo(fields: ["learningId"])
}
```

#### Question
```graphql
type Question @model @auth(rules: [{allow: public}]) {
  id: ID!
  content: String!
  options: [String]!
  correctOption: Int!
  explanation: String
  orderIndex: Int
  quizId: ID! @index(name: "byQuiz")
  quiz: Quiz @belongsTo(fields: ["quizId"])
}
```

#### QuizzesResult
```graphql
type QuizzesResult @model @auth(rules: [{allow: public}]) {
  id: ID!
  Correct: String
  Incorrect: String
  percentage: String
  user_sub: String
  tool_id: String  # This is the Quiz ID
}
```

#### Post
```graphql
type Post @model @auth(rules: [{allow: public}]) {
  id: ID!
  content: String!
  organizationId: ID @index(name: "byOrganization")
  isDefault: Boolean
}
```

## Learning System

### Learning Organization Structure

The learning system uses a hierarchical structure:

```
Learning Module
├── Chapter 1
│   ├── Section 1.1
│   │   ├── SubSection 1.1.1
│   │   └── SubSection 1.1.2
│   └── Section 1.2
└── Chapter 2
    └── Section 2.1
```

### Multi-Tenant Learning Support

The system supports both:
- **Default (Global) Learnings**: `isDefault: true, organizationID: null`
- **Organization-Specific Learnings**: `isDefault: false, organizationID: <org-id>`

Organizations can clone default learnings to create customized versions using the `clonedFromID` field.

### Learning Display Logic

#### Fetching Learnings
```javascript
// Fetch both organization-specific and default learnings
const [orgLearningsResponse, defaultLearningsResponse] = await Promise.all([
  // Organization learnings
  API.graphql({
    query: queries.listLearnings,
    variables: {
      filter: {
        organizationID: { eq: activeOrganization.id },
        _deleted: { ne: true }
      }
    }
  }),
  
  // Default learnings
  API.graphql({
    query: queries.listLearnings,
    variables: {
      filter: {
        isDefault: { eq: true },
        _deleted: { ne: true }
      }
    }
  })
]);

// Combine and filter to avoid duplicates
const orgLearnings = orgLearningsResponse.data.listLearnings.items;
const defaultLearnings = defaultLearningsResponse.data.listLearnings.items;

// Create a set of cloned learning IDs
const clonedLearningIds = new Set(
  orgLearnings.map(learning => learning.clonedFromID).filter(Boolean)
);

// Combine org learnings with uncloned default learnings
const learningItems = [
  ...orgLearnings,
  ...defaultLearnings.filter(learning => !clonedLearningIds.has(learning.id))
];
```

#### Grouping Logic
Learnings are grouped by:
1. **Organizational Status**: Organization-specific vs Global
2. **Tool Type**: Based on matching with `tools.json` configuration

```javascript
const groupedLearnings = {
  'Your Organization\'s Lean Tools': [],
  'Your Organization\'s Quality Tools': [],
  'Your Organization\'s Other Modules': [],
  'Global Lean Tools': [],
  'Global Quality Tools': [],
  'Global Other Modules': []
};
```

### Learning Content Structure

Each learning module contains rich HTML content stored in `Post` entities:
- Chapters can have associated posts
- Sections can have associated posts
- SubSections can have associated posts

The content supports:
- Rich text formatting
- Images and media
- Tables and lists
- Code blocks
- Blockquotes

## Quiz System

### Quiz Structure

Each Learning module can have multiple quizzes. Quizzes contain questions with:
- Multiple choice options (stored as array)
- Correct answer index (0-based)
- Optional explanations
- Order indexing for consistent display

### Quiz Taking Flow

#### 1. Quiz Initialization
```javascript
// Fetch quiz data
const quizData = await API.graphql({
  query: queries.getQuiz,
  variables: { id: quizId }
});

// Fetch questions separately
const questionsData = await API.graphql({
  query: queries.questionsByQuizId,
  variables: {
    quizId: quizId,
    filter: { _deleted: { ne: true } }
  }
});

// Sort questions by orderIndex, fallback to createdAt
const sortedQuestions = questions.sort((a, b) => {
  if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
    return a.orderIndex - b.orderIndex;
  }
  return new Date(a.createdAt) - new Date(b.createdAt);
});
```

#### 2. Question Display
Questions are displayed one at a time with:
- Progress indicator
- Multiple choice options
- Submit button (disabled until option selected)
- Immediate feedback after submission
- Optional explanation display

#### 3. Answer Tracking
```javascript
const [answers, setAnswers] = useState({});
const [submittedQuestions, setSubmittedQuestions] = useState({});

const handleAnswer = (questionId, selectedOption) => {
  setAnswers({
    ...answers,
    [questionId]: selectedOption
  });
};
```

#### 4. Quiz Completion & Scoring
```javascript
const submitQuizResult = async () => {
  const correctAnswers = questions.reduce((count, question) => {
    return count + (answers[question.id] === question.correctOption ? 1 : 0);
  }, 0);

  const percentage = Math.round((correctAnswers / questions.length) * 100);

  // Save quiz result
  const quizResultInput = {
    Correct: correctAnswers.toString(),
    Incorrect: (questions.length - correctAnswers).toString(),
    percentage: percentage.toString(),
    tool_id: quizId, // ⚠️ Important: Uses Quiz ID as tool_id
    user_sub: userSub
  };

  await API.graphql({
    query: mutations.createQuizzesResult,
    variables: { input: quizResultInput }
  });

  // Update learning progress
  await API.graphql({
    query: mutations.updateLearning,
    variables: {
      input: {
        id: learningId,
        quizScore: percentage,
        hasQuizTaken: true
      }
    }
  });
};
```

### Quiz Results Management

#### Fetching User Results
```javascript
const fetchQuizResults = async () => {
  const { attributes } = await Auth.currentAuthenticatedUser();
  const userSub = attributes.sub;

  const results = await API.graphql({
    query: queries.listQuizzesResults,
    variables: {
      filter: {
        user_sub: { eq: userSub }
      }
    }
  });

  // Create a map of quiz ID to latest result
  const resultMap = {};
  results.data.listQuizzesResults.items.forEach(result => {
    if (!result._deleted) {
      const quizId = result.tool_id; // tool_id contains the quiz ID
      if (!resultMap[quizId] || new Date(result.createdAt) > new Date(resultMap[quizId].createdAt)) {
        resultMap[quizId] = result;
      }
    }
  });

  return resultMap;
};
```

#### Progress Calculation
```javascript
const calculateLearningProgress = (learningId) => {
  const quizzes = quizzesByLearning[learningId] || [];
  let totalProgress = 0;
  let completedQuizzes = 0;

  quizzes.forEach(quiz => {
    const result = quizResults[quiz.id];
    if (result) {
      totalProgress += parseInt(result.percentage);
      completedQuizzes++;
    }
  });

  return {
    progress: completedQuizzes > 0 ? Math.round(totalProgress / completedQuizzes) : 0,
    hasQuizTaken: completedQuizzes > 0
  };
};
```

## Award System Integration

### Quiz Completion Awards

The system automatically awards users based on quiz performance:

#### Award Types
```javascript
// Perfect Score (100%)
if (percentage === 100) {
  await addAward('QUIZ_PERFECT', activeOrganization?.id, null, quizId);
}

// Mastery (70%+)
else if (percentage >= 70) {
  await addAward('QUIZ_MASTERY', activeOrganization?.id, null, quizId);
}
```

#### Award Data Structure
```javascript
const awardInput = {
  title: awardDef.title,
  description: awardDef.description,
  date: new Date().toISOString(),
  user_sub: userSub,
  tool_id: quizId,
  type: 'QUIZ_PERFECT' | 'QUIZ_MASTERY',
  coins: awardDef.coins,
  organizationID: organizationId
};
```

#### Coin System Integration
Awards automatically update user coins:
```javascript
await updateUserCoins(userSub, awardDef.coins, organizationId);
```

## Frontend Components

### Key Components for Implementation

#### 1. LearningList Component
- **Purpose**: Display all available learning modules
- **Features**: 
  - Multi-tenant learning display
  - Progress tracking
  - Organization-specific grouping
  - Clone functionality for default learnings
- **File**: `src/components/Learning/LearningList.js`

#### 2. LearningView Component
- **Purpose**: Display learning content in readable format
- **Features**:
  - Hierarchical navigation
  - Rich content rendering
  - Download functionality
  - Responsive design
- **File**: `src/components/Learning/LearningView.js`

#### 3. QuizList Component
- **Purpose**: Display quizzes for a learning module
- **Features**:
  - Quiz progress tracking
  - Question count display
  - Management controls (for admins)
- **File**: `src/components/Learning/QuizList.js`

#### 4. QuizTake Component
- **Purpose**: Interactive quiz taking interface
- **Features**:
  - Question-by-question navigation
  - Immediate feedback
  - Progress tracking
  - Results summary
  - Award integration
- **File**: `src/components/Learning/QuizTake.js`

### Component Dependencies

All components require:
- AWS Amplify SDK
- React Router for navigation
- React Bootstrap for UI
- Organization Context for multi-tenancy
- Award Context for gamification

## API Integration

### Essential GraphQL Operations

#### Learning Operations
```javascript
// List learnings with filters
const learnings = await API.graphql({
  query: queries.listLearnings,
  variables: {
    filter: {
      organizationID: { eq: organizationId },
      _deleted: { ne: true }
    }
  }
});

// Get learning with nested content
const learning = await API.graphql({
  query: queries.getLearning,
  variables: { id: learningId }
});

// Get chapters with sections
const chapters = await API.graphql({
  query: queries.chaptersByLearningIdAndPosition,
  variables: { 
    learningId: learningId,
    sortDirection: 'ASC'
  }
});
```

#### Quiz Operations
```javascript
// List quizzes for learning
const quizzes = await API.graphql({
  query: queries.listQuizzes,
  variables: {
    filter: {
      learningId: { eq: learningId },
      _deleted: { ne: true }
    }
  }
});

// Get quiz questions
const questions = await API.graphql({
  query: queries.questionsByQuizId,
  variables: {
    quizId: quizId,
    filter: { _deleted: { ne: true } }
  }
});

// Create quiz result
const result = await API.graphql({
  query: mutations.createQuizzesResult,
  variables: {
    input: {
      Correct: correctCount.toString(),
      Incorrect: incorrectCount.toString(),
      percentage: percentage.toString(),
      tool_id: quizId,
      user_sub: userSub
    }
  }
});
```

#### Content Operations
```javascript
// Get post content
const post = await API.graphql({
  query: queries.getPost,
  variables: { id: postId }
});

// Get sections for chapter
const sections = await API.graphql({
  query: queries.sectionsByChapterIdAndPosition,
  variables: { 
    chapterId: chapterId,
    sortDirection: 'ASC'
  }
});
```

## Implementation Guide

### Step 1: Schema Setup

Ensure your Amplify GraphQL schema includes all the models above. Key considerations:
- Use proper indexing for performance
- Implement soft delete with `_deleted` field
- Support multi-tenancy with `organizationID` fields

### Step 2: Authentication & Context

Implement organization context for multi-tenant support:
```javascript
const { activeOrganization } = useOrganization();
```

### Step 3: Core Components

Implement the four main components:
1. `LearningList` - Entry point for learnings
2. `LearningView` - Content display
3. `QuizList` - Quiz selection
4. `QuizTake` - Interactive quiz interface

### Step 4: Routing Setup

Configure routes for the learning system:
```javascript
// In your router
<Route path="/learning" element={<LearningList />} />
<Route path="/learning/:learningId/view" element={<LearningView />} />
<Route path="/learning/:learningId/quizzes" element={<QuizList />} />
<Route path="/learning/:learningId/quiz/:quizId/take" element={<QuizTake />} />
```

### Step 5: Award System Integration

Connect to your award system:
```javascript
import { addAward } from '../utils/awards';
import { useAward } from '../contexts/AwardContext';

// In quiz completion
if (percentage >= 70) {
  await addAward('QUIZ_MASTERY', organizationId, null, quizId);
}
```

### Step 6: Styling & UI

Use consistent styling with your app:
- React Bootstrap components
- Responsive design patterns
- Progress indicators
- Loading states

## Key Data Relationships

### Critical ID Mappings

1. **Quiz Results**: `tool_id` field stores the Quiz ID (not learning ID)
2. **User Identification**: Always use `user_sub` from Cognito
3. **Organization Filtering**: Include `organizationID` in all relevant queries
4. **Content Hierarchy**: Learning → Chapter → Section → SubSection → Post

### Performance Considerations

1. **Lazy Loading**: Load content hierarchically as needed
2. **Caching**: Cache quiz results and progress calculations
3. **Pagination**: Use for large learning lists
4. **Indexing**: Leverage GSI indexes for efficient queries

## Security & Permissions

### Data Access Rules

- All models use `@auth(rules: [{allow: public}])` for simplicity
- Implement business logic filtering in components
- Organization-level data isolation through filtering
- User-specific data (quiz results) filtered by `user_sub`

### Administrative Functions

For user-only apps, exclude:
- Learning creation/editing
- Quiz creation/editing
- Content management
- Organization administration

## Testing & Validation

### Key Test Scenarios

1. **Learning Display**: Verify proper grouping and filtering
2. **Quiz Taking**: Test question flow and scoring
3. **Progress Tracking**: Validate score calculations
4. **Award Integration**: Confirm award generation
5. **Multi-tenancy**: Test organization isolation

### Data Validation

- Ensure quiz results use correct `tool_id` (quiz ID)
- Verify organization filtering works correctly
- Test progress calculations across multiple quizzes
- Validate award system integration

This documentation provides everything needed to implement the complete learning and quiz system in any app connected to the same AWS Amplify backend. The system is designed for scalability, multi-tenancy, and rich educational content delivery.