# VibeStack™ Pro - Statement & Category System Documentation

## Overview

This document provides comprehensive details on how the VibeStack™ Pro application implements the Statement and Category system for lean methodology assessments. This documentation enables React Native developers to replicate the exact same functionality using the existing AWS Amplify backend.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Core Components](#core-components)
4. [Statement Assignment Workflow](#statement-assignment-workflow)
5. [Category Management](#category-management)
6. [Value Assignment System](#value-assignment-system)
7. [Default Statement Templates](#default-statement-templates)
8. [API Integration Examples](#api-integration-examples)
9. [Mobile Implementation Guide](#mobile-implementation-guide)
10. [Real-time Features](#real-time-features)
11. [Scoring System](#scoring-system)
12. [Best Practices](#best-practices)

## System Architecture

### Overview
The Statement and Category system in VibeStack™ Pro creates structured assessments for lean methodology tools. Users can create categories within reports and populate them with statements that are rated on a 1-5 scale for evaluation purposes.

### Key Technologies
- **Frontend**: React with AWS Amplify
- **Database**: GraphQL (AWS AppSync)
- **Storage**: AWS S3 for attachments
- **Authentication**: AWS Cognito
- **Real-time Updates**: GraphQL subscriptions
- **State Management**: React hooks + Context

### Data Hierarchy
```
Organization → Reports → Categories → Statements
```

## Database Schema

### Categories Model
```graphql
type Categories @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String
  reportID: ID! @index(name: "byReport")
  Statements: [Statements] @hasMany(indexName: "byCategories", fields: ["id"])
  orderIndex: Int
  assignees: [String]
  attachments: [String]
  description: String
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### Statements Model
```graphql
type Statements @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String
  value: Int                    # Rating value (1-5 scale)
  default: Boolean              # If true, available as template
  owner: String                 # Creator's user sub
  categoriesID: ID! @index(name: "byCategories")
  categoryName: String
  reportID: String
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### Report Model (Parent)
```graphql
type Report @model @auth(rules: [{allow: public}]) {
  id: ID!
  name: String
  type: String                  # Report type determines statement behavior
  user_sub: String
  ownerEmail: String
  ai_id: String
  Categories: [Categories] @hasMany(indexName: "byReport", fields: ["id"])
  # ... other fields
}
```

### Relationship Structure
- **Reports** contain multiple **Categories** (1:N)
- **Categories** contain multiple **Statements** (1:N)
- **Foreign Keys**: 
  - Categories link to Reports via `reportID`
  - Statements link to Categories via `categoriesID`

## Core Components

### 1. CategoryCard Component (`/src/components/reports/CategoryCard.js`)

**Purpose**: Main display component for individual categories with their statements

**Key Features:**
- Displays category title and metadata
- Lists all statements with value selection
- Shows calculated scores (total and average)
- Manages attachments and assignees
- Rich text description editing
- Real-time updates via GraphQL subscriptions

**Key Methods:**
```javascript
// Fetch statements for this category
const fetchStatements = async () => {
  const result = await API.graphql({
    query: queries.statementsByCategoriesID,
    variables: { categoriesID: category.id }
  });
  setStatements(result.data.statementsByCategoriesID.items);
};

// Handle value changes for statements
const handleValueChange = async (statement, newValue) => {
  await API.graphql({
    query: mutations.updateStatements,
    variables: {
      input: {
        id: statement.id,
        value: newValue,
        _version: statement._version
      }
    }
  });
};
```

**State Management:**
```javascript
const [statements, setStatements] = useState([]);
const [totalScore, setTotalScore] = useState(0);
const [averageScore, setAverageScore] = useState(0);
const [attachments, setAttachments] = useState([]);
const [assignees, setAssignees] = useState([]);
const [description, setDescription] = useState('');
```

### 2. StatementModal Component (`/src/components/reports/StatementModal.js`)

**Purpose**: Comprehensive statement management interface

**Key Features:**
- Two-tab interface: "Added Statements" and "Default Statements"
- Add/Edit/Delete functionality for statements
- Integration with static statement templates
- Bulk adding from predefined templates
- "Set as default" option for creating reusable statements

**Tab Structure:**
```javascript
const [tab, setTab] = useState('statements');

// Tab 1: Added Statements - Shows statements already in this category
// Tab 2: Default Statements - Shows template statements available to add
```

**Key Methods:**
```javascript
// Create new statement
const handleAdd = async (statementName, isDefault) => {
  const input = {
    name: statementName,
    value: 3, // Default value
    default: isDefault,
    owner: currentUserSub,
    categoriesID: categoryId,
    categoryName: categoryName,
    reportID: reportId
  };
  
  await API.graphql({
    query: mutations.createStatements,
    variables: { input }
  });
};

// Add template statement to category
const handleAddDefaultToCategory = async (defaultStatement) => {
  const input = {
    name: defaultStatement.name,
    value: 3,
    default: false,
    owner: currentUserSub,
    categoriesID: categoryId,
    categoryName: categoryName,
    reportID: reportId
  };
  
  await API.graphql({
    query: mutations.createStatements,
    variables: { input }
  });
};
```

### 3. CategoryList Component (`/src/components/reports/CategoryList.js`)

**Purpose**: Manages categories and coordinates statement interactions

**Key Features:**
- Drag-and-drop reordering
- Horizontal/vertical view toggle
- Category CRUD operations
- Default category templates per report type

## Statement Assignment Workflow

### Creating Custom Statements

#### Step-by-Step Process:
1. **User initiates**: Click "+" button on CategoryCard
2. **Modal opens**: StatementModal component appears
3. **Input statement**: User types statement text
4. **Set options**: 
   - Choose to mark as "default" (becomes template)
   - Statement automatically linked to category
5. **Create statement**: API call creates statement with:
   - `categoriesID`: Links to parent category
   - `value`: Default value of 3
   - `owner`: Current user's sub
   - `default`: Boolean flag for template use

#### GraphQL Mutation:
```javascript
const createStatementMutation = `
  mutation CreateStatements($input: CreateStatementsInput!) {
    createStatements(input: $input) {
      id
      name
      value
      default
      owner
      categoriesID
      categoryName
      reportID
      _version
    }
  }
`;
```

### Adding Template Statements

#### Three Sources of Templates:
1. **Static JSON Files**: Pre-defined industry standards
2. **User Defaults**: Previously created by current user
3. **Organization Defaults**: Created by other organization members

#### Template Integration Process:
```javascript
// Load static templates based on report type
const loadStaticTemplates = () => {
  const templateMap = {
    '5S Report': StaticData5s,
    'Gemba Walk Report': StaticDataGW,
    'Lean Assessment Report': StaticDataLOA,
    'Kaizen Project Report': StaticDataKaizen,
    'Leadership Report': StaticDataLeadership
  };
  
  const templates = templateMap[reportType] || [];
  return templates.filter(t => t.category_name === categoryName);
};

// Merge all template sources
const mergeTemplates = async () => {
  const [staticTemplates, userDefaults, orgDefaults] = await Promise.all([
    loadStaticTemplates(),
    fetchUserDefaultStatements(),
    fetchOrganizationDefaults()
  ]);
  
  // Combine and deduplicate
  const merged = [...staticTemplates, ...userDefaults, ...orgDefaults];
  const unique = merged.filter((template, index, self) => 
    index === self.findIndex(t => t.name === template.name)
  );
  
  return unique;
};
```

## Category Management

### Default Categories by Report Type

```javascript
const defaultCategories = {
  '5S Report': [
    'Sort', 'Set In Order', 'Shine', 'Standardize', 'Sustain', 'Safety'
  ],
  'Gemba Walk Report': [
    'Human Resources', 'Finance', 'Production', 'Quality'
  ],
  'Leadership Report': [
    'Continuous Improvement Project', 'Employee/Staff Meetings',
    'Performance Data Tracking', 'Improvement Culture',
    'Supplier Relationships', 'Customer Relationships'
  ],
  'Lean Assessment Report': [
    'Leadership', 'Customer Focus', 'Process Management',
    'Resource Management', 'Measurement Analysis'
  ],
  'Kaizen Project Report': [
    '(Prepare)', 'Planning', 'PDCA - Implementation', 'Follow-Up'
  ]
};
```

### Category Creation Workflow

```javascript
// Create category with default properties
const createCategory = async (categoryName, reportId, orderIndex) => {
  const input = {
    name: categoryName,
    reportID: reportId,
    orderIndex: orderIndex,
    assignees: [],
    attachments: [],
    description: ''
  };
  
  const result = await API.graphql({
    query: mutations.createCategories,
    variables: { input }
  });
  
  return result.data.createCategories;
};

// Auto-populate with default statements
const populateWithDefaults = async (categoryId, categoryName, reportType) => {
  const templates = await getTemplatesForCategory(categoryName, reportType);
  
  for (const template of templates) {
    await handleAddDefaultToCategory(template);
  }
};
```

## Value Assignment System

### Rating Scale Implementation

#### Standard Scale (1-5):
```javascript
const valueLabels = {
  1: 'Strongly Disagree',
  2: 'Disagree', 
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree'
};
```

#### Mistake Proofing Scale:
```javascript
const mistakeProofingScales = {
  potential: {
    1: 'Very Low',
    2: 'Low',
    3: 'Medium',
    4: 'High', 
    5: 'Very High'
  },
  consequences: {
    1: 'Insignificant',
    2: 'Minor',
    3: 'Moderate',
    4: 'Major',
    5: 'Catastrophic'
  }
};
```

#### 5 Whys Star System:
```javascript
// Uses star rating instead of 1-5 scale
const StarRating = ({ value, onChange }) => (
  <div className="star-rating">
    {[1, 2, 3, 4, 5].map(star => (
      <FontAwesomeIcon
        key={star}
        icon={star <= value ? faStar : faStarRegular}
        onClick={() => onChange(star)}
        className="star-button"
      />
    ))}
  </div>
);
```

### Value Update Process

```javascript
const ValueSelectionModal = ({ statement, onValueChange }) => {
  const [selectedValue, setSelectedValue] = useState(statement.value || 3);
  
  const handleSubmit = async () => {
    try {
      await API.graphql({
        query: mutations.updateStatements,
        variables: {
          input: {
            id: statement.id,
            value: selectedValue,
            _version: statement._version
          }
        }
      });
      
      onValueChange(statement, selectedValue);
    } catch (error) {
      console.error('Error updating statement value:', error);
    }
  };
  
  return (
    <Modal show onHide={onClose}>
      <Modal.Body>
        <div className="value-buttons">
          {[1, 2, 3, 4, 5].map(value => (
            <Button
              key={value}
              variant={selectedValue === value ? 'primary' : 'outline-primary'}
              onClick={() => setSelectedValue(value)}
            >
              {value} - {getValueLabel(value)}
            </Button>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
};
```

## Default Statement Templates

### Static Template Structure

#### Example from StaticData5s.json:
```json
[
  {
    "id": "783734hd33",
    "name": "The area is clear of excess equipment, paperwork, or other types of materials.",
    "category_name": "Sort",
    "value": 3,
    "static": true
  },
  {
    "id": "wrw23322rd", 
    "name": "The area looks organized.",
    "category_name": "Sort",
    "value": 3,
    "static": true
  }
]
```

### User-Created Defaults

#### Creating User Templates:
```javascript
const createUserDefault = async (statementName, categoryName) => {
  const user = await Auth.currentAuthenticatedUser();
  
  const input = {
    name: statementName,
    value: 3,
    default: true,        // Marks as template
    owner: user.attributes.sub,
    categoriesID: 'template', // Special ID for templates
    categoryName: categoryName
  };
  
  await API.graphql({
    query: mutations.createStatements,
    variables: { input }
  });
};
```

#### Fetching User Defaults:
```javascript
const fetchUserDefaults = async (categoryName, userSub) => {
  const result = await API.graphql({
    query: queries.listStatements,
    variables: {
      filter: {
        default: { eq: true },
        owner: { eq: userSub },
        categoryName: { eq: categoryName },
        _deleted: { ne: true }
      }
    }
  });
  
  return result.data.listStatements.items;
};
```

## API Integration Examples

### Complete Mobile Category Component

```jsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { API } from 'aws-amplify';

const MobileCategoryCard = ({ category, reportType }) => {
  const [statements, setStatements] = useState([]);
  const [totalScore, setTotalScore] = useState(0);
  const [averageScore, setAverageScore] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatements();
  }, [category.id]);

  const fetchStatements = async () => {
    try {
      const result = await API.graphql({
        query: `
          query StatementsByCategoriesID($categoriesID: ID!) {
            statementsByCategoriesID(categoriesID: $categoriesID) {
              items {
                id
                name
                value
                _version
              }
            }
          }
        `,
        variables: { categoriesID: category.id }
      });
      
      const statementsData = result.data.statementsByCategoriesID.items.filter(
        item => !item._deleted
      );
      
      setStatements(statementsData);
      calculateScores(statementsData);
    } catch (error) {
      console.error('Error fetching statements:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateScores = (statementsData) => {
    const validStatements = statementsData.filter(s => s.value && s.value > 0);
    
    if (validStatements.length > 0) {
      const total = validStatements.reduce((sum, statement) => sum + statement.value, 0);
      const average = total / validStatements.length;
      
      setTotalScore(total);
      setAverageScore(Math.round(average * 100) / 100);
    } else {
      setTotalScore(0);
      setAverageScore(0);
    }
  };

  const updateStatementValue = async (statement, newValue) => {
    try {
      await API.graphql({
        query: `
          mutation UpdateStatements($input: UpdateStatementsInput!) {
            updateStatements(input: $input) {
              id
              value
              _version
            }
          }
        `,
        variables: {
          input: {
            id: statement.id,
            value: newValue,
            _version: statement._version
          }
        }
      });
      
      // Update local state
      const updatedStatements = statements.map(s => 
        s.id === statement.id 
          ? { ...s, value: newValue, _version: s._version + 1 }
          : s
      );
      
      setStatements(updatedStatements);
      calculateScores(updatedStatements);
    } catch (error) {
      console.error('Error updating statement:', error);
      Alert.alert('Error', 'Failed to update statement value');
    }
  };

  const showValueSelector = (statement) => {
    const valueLabels = {
      1: 'Strongly Disagree',
      2: 'Disagree',
      3: 'Neutral', 
      4: 'Agree',
      5: 'Strongly Agree'
    };

    Alert.alert(
      'Select Value',
      statement.name,
      [
        ...Object.entries(valueLabels).map(([value, label]) => ({
          text: `${value} - ${label}`,
          onPress: () => updateStatementValue(statement, parseInt(value))
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const renderStatement = ({ item: statement }) => (
    <View style={styles.statementRow}>
      <Text style={styles.statementText} numberOfLines={0}>
        {statement.name}
      </Text>
      <TouchableOpacity
        style={[styles.valueButton, { backgroundColor: getValueColor(statement.value) }]}
        onPress={() => showValueSelector(statement)}
      >
        <Text style={styles.valueText}>{statement.value || 3}</Text>
      </TouchableOpacity>
    </View>
  );

  const getValueColor = (value) => {
    const colors = {
      1: '#dc3545', // Red
      2: '#fd7e14', // Orange  
      3: '#ffc107', // Yellow
      4: '#28a745', // Green
      5: '#007bff'  // Blue
    };
    return colors[value] || colors[3];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading statements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.categoryCard}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>{category.name}</Text>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            Total: {totalScore} | Avg: {averageScore}
          </Text>
        </View>
      </View>
      
      <FlatList
        data={statements}
        renderItem={renderStatement}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
      />
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => openStatementModal()}
      >
        <Text style={styles.addButtonText}>+ Add Statement</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  categoryCard: {
    backgroundColor: 'white',
    marginVertical: 8,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1
  },
  scoreContainer: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  scoreText: {
    fontSize: 12,
    color: '#6c757d'
  },
  statementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  statementText: {
    flex: 1,
    fontSize: 14,
    marginRight: 12
  },
  valueButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  valueText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  addButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#007bff',
    borderRadius: 4,
    alignItems: 'center'
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center'
  }
};

export default MobileCategoryCard;
```

### Mobile Statement Management Modal

```jsx
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Switch,
  Alert 
} from 'react-native';
import { API, Auth } from 'aws-amplify';

const MobileStatementModal = ({ 
  visible, 
  onClose, 
  categoryId, 
  categoryName, 
  reportId, 
  reportType,
  onStatementAdded 
}) => {
  const [activeTab, setActiveTab] = useState('added');
  const [statements, setStatements] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [newStatementText, setNewStatementText] = useState('');
  const [makeDefault, setMakeDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, categoryId]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchCategoryStatements(),
      fetchTemplateStatements()
    ]);
    setLoading(false);
  };

  const fetchCategoryStatements = async () => {
    try {
      const result = await API.graphql({
        query: `
          query StatementsByCategoriesID($categoriesID: ID!) {
            statementsByCategoriesID(categoriesID: $categoriesID) {
              items {
                id
                name
                value
                default
                _version
              }
            }
          }
        `,
        variables: { categoriesID: categoryId }
      });
      
      setStatements(result.data.statementsByCategoriesID.items.filter(
        item => !item._deleted
      ));
    } catch (error) {
      console.error('Error fetching statements:', error);
    }
  };

  const fetchTemplateStatements = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      // Fetch user's default statements
      const userDefaults = await API.graphql({
        query: `
          query ListStatements($filter: ModelStatementsFilterInput) {
            listStatements(filter: $filter) {
              items {
                id
                name
                owner
              }
            }
          }
        `,
        variables: {
          filter: {
            default: { eq: true },
            owner: { eq: user.attributes.sub },
            categoryName: { eq: categoryName },
            _deleted: { ne: true }
          }
        }
      });

      // Combine with static templates
      const staticTemplates = getStaticTemplates();
      const allTemplates = [
        ...staticTemplates,
        ...userDefaults.data.listStatements.items
      ];

      // Remove duplicates
      const uniqueTemplates = allTemplates.filter((template, index, self) =>
        index === self.findIndex(t => t.name === template.name)
      );

      setTemplates(uniqueTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const getStaticTemplates = () => {
    const staticData = {
      '5S Report': {
        'Sort': [
          'The area is clear of excess equipment, paperwork, or other types of materials.',
          'The area looks organized.',
          'The area is clear of excess personal items or is appropriately placed.'
        ]
      },
      'Lean Assessment Report': {
        'Leadership': [
          'Senior management actively participates in improvement activities',
          'Leadership provides clear vision and direction for improvement',
          'Management demonstrates commitment through resource allocation'
        ]
      }
      // Add more static templates as needed
    };

    const reportTemplates = staticData[reportType];
    const categoryTemplates = reportTemplates?.[categoryName] || [];
    
    return categoryTemplates.map((name, index) => ({
      id: `static_${index}`,
      name,
      static: true
    }));
  };

  const createStatement = async () => {
    if (!newStatementText.trim()) {
      Alert.alert('Error', 'Please enter a statement');
      return;
    }

    try {
      const user = await Auth.currentAuthenticatedUser();
      
      const input = {
        name: newStatementText.trim(),
        value: 3,
        default: makeDefault,
        owner: user.attributes.sub,
        categoriesID: categoryId,
        categoryName: categoryName,
        reportID: reportId
      };

      await API.graphql({
        query: `
          mutation CreateStatements($input: CreateStatementsInput!) {
            createStatements(input: $input) {
              id
              name
              value
              default
            }
          }
        `,
        variables: { input }
      });

      setNewStatementText('');
      setMakeDefault(false);
      await fetchCategoryStatements();
      onStatementAdded && onStatementAdded();
      
      Alert.alert('Success', 'Statement created successfully');
    } catch (error) {
      console.error('Error creating statement:', error);
      Alert.alert('Error', 'Failed to create statement');
    }
  };

  const addTemplateToCategory = async (template) => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      
      const input = {
        name: template.name,
        value: 3,
        default: false,
        owner: user.attributes.sub,
        categoriesID: categoryId,
        categoryName: categoryName,
        reportID: reportId
      };

      await API.graphql({
        query: `
          mutation CreateStatements($input: CreateStatementsInput!) {
            createStatements(input: $input) {
              id
            }
          }
        `,
        variables: { input }
      });

      await fetchCategoryStatements();
      onStatementAdded && onStatementAdded();
      
      Alert.alert('Success', 'Template added to category');
    } catch (error) {
      console.error('Error adding template:', error);
      Alert.alert('Error', 'Failed to add template');
    }
  };

  const deleteStatement = async (statement) => {
    Alert.alert(
      'Delete Statement',
      'Are you sure you want to delete this statement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await API.graphql({
                query: `
                  mutation DeleteStatements($input: DeleteStatementsInput!) {
                    deleteStatements(input: $input) {
                      id
                    }
                  }
                `,
                variables: {
                  input: {
                    id: statement.id,
                    _version: statement._version
                  }
                }
              });

              await fetchCategoryStatements();
              onStatementAdded && onStatementAdded();
            } catch (error) {
              console.error('Error deleting statement:', error);
              Alert.alert('Error', 'Failed to delete statement');
            }
          }
        }
      ]
    );
  };

  const renderAddedStatement = ({ item: statement }) => (
    <View style={styles.statementItem}>
      <Text style={styles.statementText} numberOfLines={0}>
        {statement.name}
      </Text>
      <View style={styles.statementActions}>
        <Text style={styles.valueText}>Value: {statement.value}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteStatement(statement)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTemplate = ({ item: template }) => (
    <View style={styles.templateItem}>
      <Text style={styles.templateText} numberOfLines={0}>
        {template.name}
      </Text>
      <TouchableOpacity
        style={styles.addTemplateButton}
        onPress={() => addTemplateToCategory(template)}
      >
        <Text style={styles.addTemplateButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Manage Statements</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'added' && styles.activeTab]}
            onPress={() => setActiveTab('added')}
          >
            <Text style={[styles.tabText, activeTab === 'added' && styles.activeTabText]}>
              Added Statements
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'templates' && styles.activeTab]}
            onPress={() => setActiveTab('templates')}
          >
            <Text style={[styles.tabText, activeTab === 'templates' && styles.activeTabText]}>
              Templates
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'added' && (
          <View style={styles.tabContent}>
            <View style={styles.addStatementContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter new statement..."
                value={newStatementText}
                onChangeText={setNewStatementText}
                multiline
              />
              <View style={styles.optionsRow}>
                <View style={styles.switchRow}>
                  <Text>Make Default Template</Text>
                  <Switch
                    value={makeDefault}
                    onValueChange={setMakeDefault}
                  />
                </View>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={createStatement}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={statements}
              renderItem={renderAddedStatement}
              keyExtractor={(item) => item.id}
              style={styles.statementsList}
            />
          </View>
        )}

        {activeTab === 'templates' && (
          <View style={styles.tabContent}>
            <FlatList
              data={templates}
              renderItem={renderTemplate}
              keyExtractor={(item) => item.id}
              style={styles.templatesList}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  closeButton: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: '600'
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center'
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff'
  },
  tabText: {
    fontSize: 16,
    color: '#6c757d'
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600'
  },
  tabContent: {
    flex: 1,
    padding: 16
  },
  addStatementContainer: {
    marginBottom: 20
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  createButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600'
  },
  statementItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginVertical: 4,
    borderRadius: 4
  },
  statementText: {
    fontSize: 14,
    marginBottom: 8
  },
  statementActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  valueText: {
    fontSize: 12,
    color: '#6c757d'
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  templateText: {
    flex: 1,
    fontSize: 14,
    marginRight: 12
  },
  addTemplateButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4
  },
  addTemplateButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  }
};

export default MobileStatementModal;
```

## Real-time Features

### GraphQL Subscriptions

The system uses real-time subscriptions to keep data synchronized across devices:

```javascript
// Subscribe to statement changes
const subscribeToStatementChanges = (categoryId) => {
  const subscription = API.graphql({
    query: `
      subscription OnUpdateStatements($categoriesID: ID!) {
        onUpdateStatements(categoriesID: $categoriesID) {
          id
          name
          value
          _version
        }
      }
    `,
    variables: { categoriesID: categoryId }
  }).subscribe({
    next: (data) => {
      const updatedStatement = data.value.data.onUpdateStatements;
      
      // Update local state
      setStatements(prev => prev.map(statement => 
        statement.id === updatedStatement.id 
          ? { ...statement, ...updatedStatement }
          : statement
      ));
    },
    error: (error) => {
      console.error('Subscription error:', error);
    }
  });
  
  return subscription;
};

// Subscribe to new statements
const subscribeToNewStatements = (categoryId) => {
  return API.graphql({
    query: `
      subscription OnCreateStatements($categoriesID: ID!) {
        onCreateStatements(categoriesID: $categoriesID) {
          id
          name
          value
          _version
        }
      }
    `,
    variables: { categoriesID: categoryId }
  }).subscribe({
    next: (data) => {
      const newStatement = data.value.data.onCreateStatements;
      setStatements(prev => [...prev, newStatement]);
    }
  });
};
```

## Scoring System

### Automatic Score Calculation

```javascript
// Calculate category scores
const calculateCategoryScores = (statements) => {
  // Filter out statements without values or with value 0
  const validStatements = statements.filter(s => s.value && s.value > 0);
  
  if (validStatements.length === 0) {
    return { total: 0, average: 0, count: 0 };
  }
  
  const total = validStatements.reduce((sum, statement) => sum + statement.value, 0);
  const average = total / validStatements.length;
  
  return {
    total,
    average: Math.round(average * 100) / 100,
    count: validStatements.length
  };
};

// Report-level scoring
const calculateReportScores = (categories) => {
  let totalScore = 0;
  let totalStatements = 0;
  
  categories.forEach(category => {
    const categoryScore = calculateCategoryScores(category.statements);
    totalScore += categoryScore.total;
    totalStatements += categoryScore.count;
  });
  
  return {
    totalScore,
    averageScore: totalStatements > 0 ? totalScore / totalStatements : 0,
    totalStatements
  };
};
```

### Score Display Components

```jsx
const ScoreDisplay = ({ total, average, count }) => (
  <View style={styles.scoreContainer}>
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>Total</Text>
      <Text style={styles.scoreValue}>{total}</Text>
    </View>
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>Average</Text>
      <Text style={styles.scoreValue}>{average}</Text>
    </View>
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>Count</Text>
      <Text style={styles.scoreValue}>{count}</Text>
    </View>
  </View>
);

const CategoryProgressBar = ({ score, maxScore }) => {
  const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
  
  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBackground}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${percentage}%` }
          ]} 
        />
      </View>
      <Text style={styles.progressText}>{percentage.toFixed(1)}%</Text>
    </View>
  );
};
```

## Best Practices

### 1. Performance Optimization

```javascript
// Batch statement creation
const createMultipleStatements = async (statementNames, categoryId) => {
  const user = await Auth.currentAuthenticatedUser();
  
  const promises = statementNames.map(name => 
    API.graphql({
      query: mutations.createStatements,
      variables: {
        input: {
          name,
          value: 3,
          default: false,
          owner: user.attributes.sub,
          categoriesID: categoryId,
          categoryName: categoryName,
          reportID: reportId
        }
      }
    })
  );
  
  return Promise.all(promises);
};

// Optimistic updates
const updateStatementValueOptimistic = (statementId, newValue) => {
  // Update UI immediately
  setStatements(prev => prev.map(s => 
    s.id === statementId 
      ? { ...s, value: newValue }
      : s
  ));
  
  // Then sync with server
  updateStatementValue(statementId, newValue).catch(error => {
    // Revert on error
    fetchStatements();
    Alert.alert('Error', 'Failed to update statement value');
  });
};
```

### 2. Error Handling

```javascript
// Robust error handling with retry
const createStatementWithRetry = async (input, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await API.graphql({
        query: mutations.createStatements,
        variables: { input }
      });
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};

// Version conflict resolution
const updateStatementWithConflictResolution = async (statement, updates) => {
  try {
    return await API.graphql({
      query: mutations.updateStatements,
      variables: {
        input: {
          id: statement.id,
          ...updates,
          _version: statement._version
        }
      }
    });
  } catch (error) {
    if (error.errors?.[0]?.errorType === 'ConditionalCheckFailedException') {
      // Refetch latest version and retry
      const latest = await fetchLatestStatement(statement.id);
      return updateStatementWithConflictResolution(latest, updates);
    }
    throw error;
  }
};
```

### 3. Offline Support

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache statements for offline viewing
const cacheStatements = async (categoryId, statements) => {
  try {
    await AsyncStorage.setItem(
      `statements_${categoryId}`,
      JSON.stringify({
        statements,
        timestamp: Date.now()
      })
    );
  } catch (error) {
    console.error('Error caching statements:', error);
  }
};

// Load cached statements when offline
const loadCachedStatements = async (categoryId) => {
  try {
    const cached = await AsyncStorage.getItem(`statements_${categoryId}`);
    if (cached) {
      const data = JSON.parse(cached);
      
      // Check if cache is less than 1 hour old
      if (Date.now() - data.timestamp < 60 * 60 * 1000) {
        return data.statements;
      }
    }
    return null;
  } catch (error) {
    console.error('Error loading cached statements:', error);
    return null;
  }
};

// Queue offline changes
const queueOfflineUpdate = async (action, data) => {
  try {
    const queue = await AsyncStorage.getItem('offline_queue');
    const existingQueue = queue ? JSON.parse(queue) : [];
    
    existingQueue.push({
      id: Date.now().toString(),
      action,
      data,
      timestamp: Date.now()
    });
    
    await AsyncStorage.setItem('offline_queue', JSON.stringify(existingQueue));
  } catch (error) {
    console.error('Error queuing offline update:', error);
  }
};
```

### 4. Data Validation

```javascript
// Validate statement input
const validateStatement = (statementText) => {
  const errors = [];
  
  if (!statementText.trim()) {
    errors.push('Statement text is required');
  }
  
  if (statementText.length > 500) {
    errors.push('Statement text cannot exceed 500 characters');
  }
  
  if (statementText.length < 10) {
    errors.push('Statement text must be at least 10 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate value range
const validateStatementValue = (value, reportType) => {
  const minValue = 1;
  const maxValue = 5;
  
  if (value < minValue || value > maxValue) {
    return {
      isValid: false,
      error: `Value must be between ${minValue} and ${maxValue}`
    };
  }
  
  return { isValid: true };
};
```

## Summary

The VibeStack™ Pro Statement and Category system provides a comprehensive framework for creating structured assessments across different lean methodology tools. The system features:

- **Hierarchical Data Structure**: Reports → Categories → Statements
- **Flexible Scoring**: 1-5 scale with report-specific interpretations
- **Template System**: Static JSON templates + user-created defaults
- **Real-time Collaboration**: GraphQL subscriptions for live updates
- **Rich Metadata**: Attachments, assignees, descriptions for categories
- **Mobile-Optimized**: Touch-friendly interfaces with gesture support
- **Offline Capabilities**: Caching and queue-based synchronization
- **Performance Focused**: Optimistic updates and batch operations

This system enables organizations to conduct thorough lean assessments with standardized statements while allowing customization for specific organizational needs. The mobile implementation can leverage the same AWS Amplify backend with identical data models and API endpoints.

---

*This documentation covers the complete Statement & Category system implementation in VibeStack™ Pro as of December 2024. React Native developers can use this guide to implement identical functionality using the existing AWS Amplify GraphQL backend.*