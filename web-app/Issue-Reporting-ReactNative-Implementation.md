# Issue Reporting System - React Native Implementation Guide

## Overview
This document outlines the functionality and implementation requirements for the Issue Reporting system in React Native, using the existing AWS Amplify backend shared between web and mobile platforms.

## Features Summary
The issue reporting system provides:
- ✅ Create new issues/bug reports
- ✅ **Global visibility** - All users can see ALL issues from ALL organizations
- ✅ View issues with filtering (My Issues, All Issues, Open, Resolved)
- ✅ Real-time conversation threads with responses
- ✅ File attachments support (images, PDFs, documents)
- ✅ Issue categorization and priority management
- ✅ Status tracking (Open, In Progress, Resolved, Closed)
- ✅ Admin response capabilities
- ✅ Real-time updates via GraphQL subscriptions across all organizations

## Backend Integration

### GraphQL Schema
The system uses the following main entities:

#### Issue Entity
```typescript
interface Issue {
  id: string;
  title: string;
  description: string;
  category: 'BUG' | 'FEATURE_REQUEST' | 'TECHNICAL_SUPPORT' | 'GENERAL_INQUIRY' | 'FEEDBACK' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  attachments: string[];
  reporterEmail: string;
  reporterName: string;
  reporterID: string;
  organizationID: string;
  assignedToEmail?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  _version: number;
  _deleted?: boolean;
  _lastChangedAt: number;
}
```

#### IssueResponse Entity
```typescript
interface IssueResponse {
  id: string;
  message: string;
  isAdminResponse: boolean;
  responderEmail: string;
  responderName: string;
  responderID: string;
  attachments: string[];
  issueID: string;
  createdAt: string;
  updatedAt: string;
  _version: number;
  _deleted?: boolean;
  _lastChangedAt: number;
}
```

### Required GraphQL Operations

#### Queries
```graphql
# Import from existing GraphQL files
import { listIssues, listIssueResponses } from '../graphql/queries';
```

#### Mutations
```graphql
# Import from existing GraphQL files
import { createIssue, createIssueResponse, updateIssue } from '../graphql/mutations';
```

#### Subscriptions
```graphql
# Import from existing GraphQL files
import { onCreateIssue, onUpdateIssue, onCreateIssueResponse } from '../graphql/subscriptions';
```

## Required React Native Dependencies

```json
{
  "dependencies": {
    "@aws-amplify/api": "^5.x.x",
    "@aws-amplify/storage": "^5.x.x",
    "react-native-document-picker": "^8.x.x",
    "react-native-image-picker": "^4.x.x",
    "react-native-fs": "^2.x.x",
    "react-native-vector-icons": "^9.x.x"
  }
}
```

## Core Functionality Implementation

### 1. Issue Creation (Still Organization-Linked)
```typescript
const createNewIssue = async (issueData: {
  title: string;
  description: string;
  category: string;
  priority: string;
  attachments: string[];
}) => {
  try {
    const input = {
      title: issueData.title.trim(),
      description: issueData.description.trim(),
      category: issueData.category,
      priority: issueData.priority,
      status: 'OPEN',
      attachments: issueData.attachments || [],
      reporterEmail: userEmail,
      reporterName: `${firstName} ${lastName}`,
      reporterID: cognitoID,
      organizationID: activeOrgId // Issues are STILL created with organizationID for tracking
    };

    const result = await API.graphql({
      query: createIssue,
      variables: { input }
    });

    return result.data.createIssue;
  } catch (error) {
    console.error('Error creating issue:', error);
    throw error;
  }
};
```

**Important Note**: Issues are still created with the user's `organizationID` for administrative tracking and data organization purposes. However, once created, ALL users can view ALL issues regardless of which organization created them.

### 2. Issue Listing with Global Visibility
```typescript
const fetchIssues = async () => {
  try {
    // Fetch ALL issues from ALL organizations and users
    const response = await API.graphql({
      query: listIssues
      // No organizationID filter - shows global issues across all organizations
    });

    const fetchedIssues = response.data.listIssues.items
      .filter(issue => !issue._deleted)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return fetchedIssues;
  } catch (error) {
    console.error('Error fetching issues:', error);
    throw error;
  }
};

// Filter functions - All users can see all issues
const filterIssues = (issues: Issue[], filterType: string, userID: string) => {
  switch (filterType) {
    case 'my-issues':
      return issues.filter(issue => issue.reporterID === userID);
    case 'all-issues':
      return issues; // Shows ALL issues from ALL users and organizations
    case 'open':
      return issues.filter(issue => issue.status === 'OPEN');
    case 'resolved':
      return issues.filter(issue => 
        issue.status === 'RESOLVED' || issue.status === 'CLOSED'
      );
    default:
      return issues;
  }
};
```

### 3. File Upload Handling
```typescript
import DocumentPicker from 'react-native-document-picker';
import { Storage } from 'aws-amplify';

const handleFileUpload = async () => {
  try {
    const results = await DocumentPicker.pick({
      type: [
        DocumentPicker.types.images,
        DocumentPicker.types.pdf,
        DocumentPicker.types.doc,
        DocumentPicker.types.docx,
        DocumentPicker.types.plainText,
      ],
      allowMultiSelection: true,
    });

    const uploadPromises = results.map(async (file) => {
      const fileKey = `issue-attachments/${Date.now()}-${file.name}`;
      
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      await Storage.put(fileKey, blob, {
        contentType: file.type,
        level: 'public'
      });
      
      return fileKey;
    });

    const uploadedKeys = await Promise.all(uploadPromises);
    return uploadedKeys;
  } catch (error) {
    if (DocumentPicker.isCancel(error)) {
      return [];
    }
    console.error('Error uploading files:', error);
    throw error;
  }
};
```

### 4. Response/Comment System
```typescript
const addResponse = async (issueId: string, message: string, attachments: string[] = []) => {
  try {
    const responseData = {
      message: message.trim(),
      isAdminResponse: false,
      responderEmail: userEmail,
      responderName: `${firstName} ${lastName}`,
      responderID: cognitoID,
      issueID: issueId,
      attachments: attachments
    };

    const result = await API.graphql({
      query: createIssueResponse,
      variables: { input: responseData }
    });

    return result.data.createIssueResponse;
  } catch (error) {
    console.error('Error adding response:', error);
    throw error;
  }
};

const fetchIssueResponses = async (issueId: string) => {
  try {
    const response = await API.graphql({
      query: listIssueResponses,
      variables: {
        filter: {
          issueID: { eq: issueId }
        }
      }
    });

    const responses = response.data.listIssueResponses.items
      .filter(resp => !resp._deleted)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    return responses;
  } catch (error) {
    console.error('Error fetching responses:', error);
    throw error;
  }
};
```

### 5. Real-time Updates (Global Visibility)
```typescript
const setupSubscriptions = () => {
  // Subscribe to ALL new issues from ALL organizations
  const createIssueSubscription = API.graphql({
    query: onCreateIssue
    // No organizationID filter - receives all issues globally
  }).subscribe({
    next: ({ value }) => {
      const newIssue = value.data.onCreateIssue;
      setIssues(prev => [newIssue, ...prev]);
    }
  });

  // Subscribe to ALL issue updates from ALL organizations
  const updateIssueSubscription = API.graphql({
    query: onUpdateIssue
    // No organizationID filter - receives all updates globally
  }).subscribe({
    next: ({ value }) => {
      const updatedIssue = value.data.onUpdateIssue;
      setIssues(prev => prev.map(issue => 
        issue.id === updatedIssue.id ? updatedIssue : issue
      ));
    }
  });

  // Subscribe to new responses for any issue
  const responseSubscription = API.graphql({
    query: onCreateIssueResponse
  }).subscribe({
    next: ({ value }) => {
      const newResponse = value.data.onCreateIssueResponse;
      if (selectedIssue && newResponse.issueID === selectedIssue.id) {
        setResponses(prev => [...prev, newResponse]);
      }
    }
  });

  return () => {
    createIssueSubscription.unsubscribe();
    updateIssueSubscription.unsubscribe();
    responseSubscription.unsubscribe();
  };
};
```

### 6. File Display and Download
```typescript
import { Storage } from 'aws-amplify';
import RNFS from 'react-native-fs';

const getSignedUrl = async (fileKey: string) => {
  try {
    const signedUrl = await Storage.get(fileKey, { level: 'public' });
    return signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
};

const downloadFile = async (fileKey: string, fileName: string) => {
  try {
    const signedUrl = await getSignedUrl(fileKey);
    if (!signedUrl) return;

    const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
    
    const download = RNFS.downloadFile({
      fromUrl: signedUrl,
      toFile: downloadPath,
    });

    const result = await download.promise;
    
    if (result.statusCode === 200) {
      Alert.alert('Success', `File downloaded to ${downloadPath}`);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    Alert.alert('Error', 'Failed to download file');
  }
};
```

## UI Components Structure

### Main Screen Components
1. **IssueListScreen** - Main dashboard with tabs
2. **CreateIssueModal** - Form for creating new issues
3. **IssueDetailScreen** - Detailed view with conversation
4. **ResponseModal** - Add response/comment form

### Reusable Components
1. **IssueCard** - Individual issue display
2. **StatusBadge** - Status indicator with colors
3. **PriorityBadge** - Priority indicator
4. **CategoryBadge** - Category indicator
5. **AttachmentViewer** - File display component
6. **ConversationThread** - Response list component

## Constants and Configuration

```typescript
export const ISSUE_CATEGORIES = [
  { value: 'BUG', label: 'Bug Report', color: '#dc3545' },
  { value: 'FEATURE_REQUEST', label: 'Feature Request', color: '#0dcaf0' },
  { value: 'TECHNICAL_SUPPORT', label: 'Technical Support', color: '#ffc107' },
  { value: 'GENERAL_INQUIRY', label: 'General Inquiry', color: '#6c757d' },
  { value: 'FEEDBACK', label: 'Feedback', color: '#198754' },
  { value: 'OTHER', label: 'Other', color: '#212529' }
];

export const ISSUE_PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#198754' },
  { value: 'MEDIUM', label: 'Medium', color: '#ffc107' },
  { value: 'HIGH', label: 'High', color: '#dc3545' },
  { value: 'CRITICAL', label: 'Critical', color: '#212529' }
];

export const ISSUE_STATUSES = [
  { value: 'OPEN', label: 'Open', color: '#0d6efd', icon: 'exclamation-circle' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#ffc107', icon: 'clock' },
  { value: 'RESOLVED', label: 'Resolved', color: '#198754', icon: 'check-circle' },
  { value: 'CLOSED', label: 'Closed', color: '#6c757d', icon: 'times-circle' }
];
```

## Navigation Structure

```typescript
// React Navigation setup
const IssueStack = createStackNavigator();

function IssueStackNavigator() {
  return (
    <IssueStack.Navigator>
      <IssueStack.Screen 
        name="IssueList" 
        component={IssueListScreen}
        options={{ title: 'Report Issues (Bugs)' }}
      />
      <IssueStack.Screen 
        name="IssueDetail" 
        component={IssueDetailScreen}
        options={{ title: 'Issue Details' }}
      />
    </IssueStack.Navigator>
  );
}
```

## Error Handling

```typescript
const handleApiError = (error: any, operation: string) => {
  console.error(`Error during ${operation}:`, error);
  
  let message = `Failed to ${operation}`;
  
  if (error.errors && error.errors.length > 0) {
    message = error.errors[0].message;
  } else if (error.message) {
    message = error.message;
  }
  
  Alert.alert('Error', message);
};
```

## Security Considerations

1. **Authentication**: All operations require valid Cognito authentication
2. **Global Visibility**: All users can view all issues across all organizations (no organization filtering on read operations)
3. **Issue Creation**: Issues are STILL created with the user's organizationID for administrative tracking and reporting purposes
4. **Organization Tracking**: The organizationID field is maintained for:
   - Administrative analytics and reporting
   - Data organization and backup purposes
   - Potential future filtering features if needed
5. **Issue Modification**: Only issue creators and admins can modify/respond to issues
6. **File Upload**: Restricted file types and size limits
7. **Data Validation**: All inputs are validated before submission

## Performance Optimization

1. **Pagination**: Implement pagination for large issue lists
2. **Lazy Loading**: Load responses only when viewing issue details
3. **Caching**: Cache issue lists and use optimistic updates
4. **Image Compression**: Compress images before upload
5. **Subscription Management**: Properly unsubscribe from real-time updates

## Testing Strategy

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test GraphQL operations
3. **E2E Tests**: Test complete user workflows
4. **File Upload Tests**: Test various file types and sizes
5. **Real-time Tests**: Test subscription functionality

## Implementation Checklist

- [ ] Set up GraphQL operations (queries, mutations, subscriptions)
- [ ] Implement file upload/download functionality
- [ ] Create main issue list screen with filtering
- [ ] Build issue creation form
- [ ] Implement issue detail view with conversation thread
- [ ] Add real-time updates via subscriptions
- [ ] Style components according to design system
- [ ] Add error handling and loading states
- [ ] Implement offline support (optional)
- [ ] Add push notifications for new responses (optional)
- [ ] Test on both iOS and Android
- [ ] Performance optimization and memory management

## Notes for Development Team

1. The existing Amplify backend is fully configured and ready to use
2. All GraphQL operations are already defined in the web app
3. The data model is stable and tested in production
4. File storage uses AWS S3 with public access level
5. **Real-time subscriptions are GLOBAL** - no organization filtering for maximum visibility
6. **All users can see all issues** from all organizations for complete transparency
7. **Issue creation maintains organizationID** - this is crucial for data integrity and future analytics
8. The system supports both user and admin response types
9. Attachments support images, PDFs, and common document formats

## Implementation Summary

### What Changed:
- **Viewing**: Removed organization filtering on read operations (all users see all issues)
- **Creating**: Kept organization linking on write operations (issues still tagged with organizationID)
- **Real-time**: Global subscriptions for maximum visibility across all organizations

### Why This Approach:
- **Global transparency** for issue visibility and collaboration
- **Maintained data integrity** for administrative tracking
- **Preserved organizational context** for future features and analytics
- **Simplified user experience** while keeping backend data organized

This implementation provides **global visibility** across all organizations while maintaining organizational tracking for issue creation and administrative purposes.