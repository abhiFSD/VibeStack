# VibeStack™ Pro - User Avatar System Documentation

## Overview

This document provides comprehensive details on how the VibeStack™ Pro application loads, processes, and displays user avatar images from the GraphQL User table using various user identifiers (user ID, email, userSub, etc.).

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Core Components](#core-components)
4. [Avatar Loading Process](#avatar-loading-process)
5. [Implementation Examples](#implementation-examples)
6. [Caching Strategy](#caching-strategy)
7. [Error Handling & Fallbacks](#error-handling--fallbacks)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

## System Architecture

### Overview
The user avatar system in VibeStack™ Pro uses a multi-layered approach that combines:
- **GraphQL User Table**: Primary storage for user profile data
- **AWS S3 Storage**: Image file storage with signed URLs
- **AWS Cognito**: Authentication and user attributes
- **Organization Context**: Multi-tenant avatar management
- **Caching Layer**: Performance optimization

### Key Technologies
- **Frontend**: React with AWS Amplify
- **Database**: GraphQL (AWS AppSync)
- **Storage**: AWS S3 with signed URLs
- **Authentication**: AWS Cognito
- **State Management**: React Context

## Database Schema

### User Model (GraphQL)
```graphql
type User @model @auth(rules: [{allow: public}]) {
  id: ID!
  cognitoID: String! @index
  email: String!
  firstName: String
  lastName: String
  profileImageKey: String        # S3 storage key for the image file
  profileImagePath: String       # Full S3 path (public/[key])
  profileImageUrl: String        # Cached signed URL (optional)
  lastLogin: AWSDateTime
  source: String
  termsAccepted: Boolean
  termsAcceptedDate: AWSDateTime
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### Organization Member Model
```graphql
type OrganizationMember @model @auth(rules: [{allow: public}]) {
  id: ID!
  organizationID: ID! @index(name: "byOrganization")
  userSub: String!               # Links to User.cognitoID
  email: String!
  status: String!                # "PENDING" | "ACTIVE"
  role: String!                  # "ADMIN" | "MEMBER"
  # ... other fields
}
```

## Core Components

### 1. UserAvatar Component (`/src/components/shared/UserAvatar.js`)

**Primary component for displaying user avatars throughout the application.**

```jsx
import UserAvatar from '../shared/UserAvatar';

// Usage examples
<UserAvatar 
  email="user@example.com" 
  organizationID={organizationId}
  size={40} 
/>

<UserAvatar 
  userSub="cognito-user-sub-id"
  organizationID={organizationId}
  size={60}
  isOwner={true}
/>
```

**Props:**
- `email` (string): User's email address
- `userSub` (string): User's Cognito sub ID
- `organizationID` (string): Organization context
- `size` (number): Avatar size in pixels (default: 30)
- `customColor` (string): Background color for initials fallback
- `isOwner` (boolean): Show owner badge
- `tooltipLabel` (string): Custom tooltip text
- `className` (string): Additional CSS classes
- `style` (object): Additional inline styles
- `squareStyle` (boolean): Square vs circular display

### 2. User Avatar Service (`/src/utils/userAvatarService.js`)

**Service layer for avatar URL generation and caching.**

**Key Functions:**
```javascript
// Get avatar by email
const avatarUrl = await getUserAvatarByEmail(email, organizationID);

// Get avatar by userSub
const avatarUrl = await getUserAvatarByUserSub(userSub, organizationID);

// Update user avatar
const newAvatarUrl = await updateUserAvatar(imageFile);

// Clear cache
clearUserAvatarCache(userSub, email, organizationID);
```

### 3. User Sync Service (`/src/utils/userSync.js`)

**Handles synchronization between Cognito and GraphQL database.**

**Key Functions:**
```javascript
// Sync user data from Cognito to database
const user = await syncUserWithDatabase(cognitoUser, 'login');

// Get user by Cognito ID
const user = await getUserByCognitoID(cognitoID);

// Get user by email
const user = await getUserByEmail(email);

// Update profile image
const result = await updateUserProfileImage(imageFile);
```

## Avatar Loading Process

### Step-by-Step Flow

#### 1. Initial Avatar Request
```javascript
// Component renders with user identifier
<UserAvatar email="user@example.com" organizationID="org-123" />
```

#### 2. UserAvatar Component Processing
```javascript
useEffect(() => {
  const fetchUserDataAndAvatar = async () => {
    // Step 1: Fetch user data from database
    let user = null;
    if (userSub) {
      user = await getUserByCognitoID(userSub);
    }
    if (!user && email) {
      user = await getUserByEmail(email);
    }
    
    // Step 2: Generate signed URL if profileImageKey exists
    if (user && user.profileImageKey) {
      try {
        const signedURL = await Storage.get(user.profileImageKey, {
          level: 'public',
          validateObjectExistence: true,
          expires: 60 * 15 // 15-minute expiry
        });
        setAvatarUrl(signedURL);
      } catch (error) {
        // Fallback to initials or default avatar
      }
    }
  };
  
  fetchUserDataAndAvatar();
}, [email, userSub, organizationID]);
```

#### 3. Database Query Execution

**Query by Email:**
```javascript
const userResponse = await API.graphql({
  query: queries.listUsers,
  variables: {
    filter: {
      email: { eq: email }
    }
  }
});
```

**Query by Cognito ID:**
```javascript
const userResponse = await API.graphql({
  query: queries.listUsers,
  variables: {
    filter: {
      cognitoID: { eq: cognitoID }
    }
  }
});
```

#### 4. S3 Signed URL Generation
```javascript
// If profileImageKey exists in database
const signedURL = await Storage.get(user.profileImageKey, {
  level: 'public',
  validateObjectExistence: true,
  expires: 60 * 15 // 15 minutes
});
```

#### 5. Avatar Display with Fallbacks
```javascript
const renderAvatar = () => {
  if (loading) {
    return <Spinner />;
  }
  
  if (avatarUrl) {
    return <img src={avatarUrl} alt="User Avatar" />;
  }
  
  if (email) {
    return getInitials(email); // e.g., "JD" for john.doe@email.com
  }
  
  return <FontAwesomeIcon icon={faUserCircle} />;
};
```

## Implementation Examples

### Basic Avatar Display
```jsx
import React from 'react';
import UserAvatar from '../shared/UserAvatar';

const UserCard = ({ user, organizationId }) => {
  return (
    <div className="user-card">
      <UserAvatar 
        email={user.email}
        organizationID={organizationId}
        size={50}
        tooltipLabel={`${user.firstName} ${user.lastName}`}
      />
      <div className="user-info">
        <h4>{user.firstName} {user.lastName}</h4>
        <p>{user.email}</p>
      </div>
    </div>
  );
};
```

### Avatar in Action Items
```jsx
const ActionItemCard = ({ actionItem, organizationId }) => {
  return (
    <Card>
      <Card.Body>
        <div className="assignees">
          {actionItem.assignees?.map((assigneeEmail, index) => (
            <UserAvatar
              key={index}
              email={assigneeEmail}
              organizationID={organizationId}
              size={30}
              className="me-2"
            />
          ))}
        </div>
        <h5>{actionItem.title}</h5>
        <p>{actionItem.description}</p>
      </Card.Body>
    </Card>
  );
};
```

### Avatar with Owner Badge
```jsx
const OrganizationOwner = ({ owner, organizationId }) => {
  return (
    <div className="owner-display">
      <UserAvatar 
        email={owner.email}
        organizationID={organizationId}
        size={60}
        isOwner={true}
        customColor="#00897b"
      />
      <p>Organization Owner</p>
    </div>
  );
};
```

### Loading Avatar by UserSub
```jsx
const ReportAssignees = ({ assignedMembers, organizationId }) => {
  return (
    <div className="assignees-list">
      {assignedMembers.map((userSub, index) => (
        <UserAvatar
          key={index}
          userSub={userSub}
          organizationID={organizationId}
          size={35}
          className="assignee-avatar"
        />
      ))}
    </div>
  );
};
```

### Dynamic Avatar Updates
```jsx
const ProfileImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { updateUserAvatar } = useUser();

  const handleFileUpload = async (file) => {
    setUploading(true);
    try {
      // Upload and update profile image
      await updateUserProfileImage(file);
      
      // Refresh avatar in context
      await updateUserAvatar();
      
      console.log('Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading profile image:', error);
    }
    setUploading(false);
  };

  return (
    <div className="profile-upload">
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        disabled={uploading}
      />
      {uploading && <Spinner />}
    </div>
  );
};
```

## Caching Strategy

### Avatar URL Cache
The system implements a two-level caching strategy:

#### 1. Memory Cache (15-minute expiry)
```javascript
const avatarCache = {
  byEmail: new Map(),
  byUserSub: new Map()
};

const CACHE_EXPIRY = 15 * 60 * 1000; // 15 minutes

// Cache structure
{
  url: "https://s3.amazonaws.com/signed-url...",
  timestamp: 1640995200000
}
```

#### 2. Component-Level Cache
```javascript
// UserAvatar component maintains state
const [avatarUrl, setAvatarUrl] = useState(null);
const [userData, setUserData] = useState(null);

// Cache persists for component lifecycle
useEffect(() => {
  // Only re-fetch if dependencies change
}, [email, userSub, organizationID]);
```

### Cache Management
```javascript
// Clear specific user cache
clearUserAvatarCache(userSub, email, organizationID);

// Clear all cache (on logout)
clearAllAvatarCache();

// Automatic cache invalidation on profile update
const updateUserAvatar = async (file) => {
  const result = await updateUserProfileImage(file);
  clearUserAvatarCache(userSub, email, organizationID);
  return result;
};
```

## Error Handling & Fallbacks

### Fallback Hierarchy
1. **Primary**: Signed URL from S3 storage
2. **Secondary**: Cognito custom attributes
3. **Tertiary**: User initials from email
4. **Final**: Default user icon

### Error Scenarios & Handling

#### 1. Database User Not Found
```javascript
if (!user && email) {
  // Fallback to organization member lookup
  const userSub = await getUserSubByEmail(email, organizationID);
  if (userSub) {
    user = await getUserByCognitoID(userSub);
  }
}
```

#### 2. S3 Image Not Found
```javascript
try {
  const signedURL = await Storage.get(user.profileImageKey, {
    level: 'public',
    validateObjectExistence: true,
    expires: 60 * 15
  });
  setAvatarUrl(signedURL);
} catch (storageError) {
  console.error('S3 image not found:', storageError);
  // Falls back to initials or default icon
}
```

#### 3. Network Errors
```javascript
try {
  const user = await getUserByEmail(email);
} catch (networkError) {
  console.error('Network error fetching user:', networkError);
  // Component shows loading state or default avatar
}
```

#### 4. Invalid Organization Context
```javascript
const fetchAvatar = async () => {
  if (!organizationID) {
    console.warn('No organization context for avatar');
    return null;
  }
  // Proceed with organization-scoped lookup
};
```

### Loading States
```jsx
const renderAvatar = () => {
  if (loading) {
    return (
      <div className="spinner-grow spinner-grow-sm text-light">
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }
  
  // ... rest of rendering logic
};
```

## Best Practices

### 1. Always Provide Organization Context
```jsx
// ✅ Good
<UserAvatar 
  email="user@example.com" 
  organizationID={activeOrganization.id}
/>

// ❌ Bad
<UserAvatar email="user@example.com" />
```

### 2. Handle Both Email and UserSub
```jsx
// ✅ Flexible component usage
<UserAvatar 
  userSub={actionItem.assignor}
  organizationID={organizationId}
/>

<UserAvatar 
  email={member.email}
  organizationID={organizationId}
/>
```

### 3. Implement Proper Error Boundaries
```jsx
const SafeUserAvatar = ({ email, ...props }) => {
  try {
    return <UserAvatar email={email} {...props} />;
  } catch (error) {
    console.error('Avatar rendering error:', error);
    return <DefaultAvatar />;
  }
};
```

### 4. Optimize for Performance
```jsx
// ✅ Memoize when possible
const MemoizedUserAvatar = React.memo(UserAvatar);

// ✅ Batch avatar requests
const avatarPromises = users.map(user => 
  getUserAvatarByEmail(user.email, organizationId)
);
const avatars = await Promise.all(avatarPromises);
```

### 5. Clear Cache on Profile Updates
```jsx
const handleProfileUpdate = async (newImageFile) => {
  // Update profile image
  await updateUserProfileImage(newImageFile);
  
  // Clear relevant caches
  clearUserAvatarCache(userSub, email, organizationId);
  
  // Refresh UI
  await refreshUserData();
};
```

## Common Integration Patterns

### 1. User Lists with Avatars
```jsx
const UserList = ({ users, organizationId }) => {
  return (
    <Table>
      <tbody>
        {users.map(user => (
          <tr key={user.id}>
            <td>
              <div className="d-flex align-items-center">
                <UserAvatar 
                  email={user.email}
                  organizationID={organizationId}
                  size={35}
                  className="me-3"
                />
                <div>
                  <strong>{user.firstName} {user.lastName}</strong>
                  <div className="text-muted">{user.email}</div>
                </div>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};
```

### 2. Comments with User Avatars
```jsx
const CommentSection = ({ comments, organizationId }) => {
  return (
    <div className="comments">
      {comments.map(comment => (
        <div key={comment.id} className="comment">
          <UserAvatar 
            userSub={comment.authorSub}
            organizationID={organizationId}
            size={40}
          />
          <div className="comment-content">
            <p>{comment.text}</p>
            <small>{comment.createdAt}</small>
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 3. Navigation with Current User Avatar
```jsx
const Navigation = () => {
  const { user } = useUser();
  const { activeOrganization } = useOrganization();

  return (
    <Navbar>
      <Nav>
        <NavDropdown 
          title={
            <UserAvatar 
              userSub={user?.attributes?.sub}
              organizationID={activeOrganization?.id}
              size={30}
            />
          }
        >
          <NavDropdown.Item href="/profile">Profile</NavDropdown.Item>
          <NavDropdown.Item onClick={handleSignOut}>Sign Out</NavDropdown.Item>
        </NavDropdown>
      </Nav>
    </Navbar>
  );
};
```

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Avatars Not Loading
**Symptoms**: Default icons showing instead of user images
**Diagnosis**:
```javascript
// Check if user exists in database
const user = await getUserByEmail(email);
console.log('User found:', user);

// Check if profileImageKey is set
console.log('Profile image key:', user?.profileImageKey);

// Test S3 access
try {
  const signedUrl = await Storage.get(user.profileImageKey, { level: 'public' });
  console.log('Signed URL generated:', signedUrl);
} catch (error) {
  console.error('S3 access error:', error);
}
```

**Solutions**:
- Verify user exists in GraphQL User table
- Check `profileImageKey` field is populated
- Confirm S3 permissions are correct
- Validate organization context is provided

#### Issue 2: Stale Avatar Cache
**Symptoms**: Old avatars showing after profile updates
**Solution**:
```javascript
// Force cache refresh after profile update
const handleProfileImageUpdate = async (file) => {
  await updateUserProfileImage(file);
  
  // Clear all caches for this user
  clearUserAvatarCache(userSub, email, organizationId);
  
  // Force component re-render
  window.location.reload(); // or use state management
};
```

#### Issue 3: Organization Context Missing
**Symptoms**: Avatars not loading in multi-tenant scenarios
**Solution**:
```javascript
// Always pass organization context
const { activeOrganization } = useOrganization();

<UserAvatar 
  email={user.email}
  organizationID={activeOrganization?.id} // ✅ Always provide
/>
```

#### Issue 4: Performance Issues with Many Avatars
**Symptoms**: Slow loading when displaying user lists
**Solutions**:
```javascript
// 1. Implement virtualization for large lists
import { FixedSizeList as List } from 'react-window';

// 2. Batch avatar requests
const loadAvatarsBatch = async (users) => {
  const promises = users.map(user => 
    getUserAvatarByEmail(user.email, organizationId)
  );
  return Promise.all(promises);
};

// 3. Use React.memo for UserAvatar components
const MemoizedUserAvatar = React.memo(UserAvatar);
```

### Debug Utilities

#### Avatar Debug Component
```jsx
const AvatarDebugger = ({ email, userSub, organizationId }) => {
  const [debugInfo, setDebugInfo] = useState({});

  const runDiagnostics = async () => {
    const info = {};
    
    // Check user in database
    if (email) {
      info.userByEmail = await getUserByEmail(email);
    }
    if (userSub) {
      info.userBySub = await getUserByCognitoID(userSub);
    }
    
    // Check organization membership
    info.orgMember = await getUserInfoByUserSub(userSub, organizationId);
    
    // Check cache status
    info.cacheByEmail = avatarCache.byEmail.get(`${email}-${organizationId}`);
    info.cacheByUserSub = avatarCache.byUserSub.get(`${userSub}-${organizationId}`);
    
    setDebugInfo(info);
  };

  return (
    <div className="avatar-debugger">
      <Button onClick={runDiagnostics}>Run Avatar Diagnostics</Button>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
};
```

#### Console Debugging
```javascript
// Enable detailed avatar logging
localStorage.setItem('AVATAR_DEBUG', 'true');

// In UserAvatar component
const debug = localStorage.getItem('AVATAR_DEBUG') === 'true';
if (debug) {
  console.log('Avatar fetch attempt:', { email, userSub, organizationID });
  console.log('User data retrieved:', userData);
  console.log('Final avatar URL:', avatarUrl);
}
```

## Performance Optimization

### Lazy Loading
```jsx
// Only load avatar when component is visible
import { useInView } from 'react-intersection-observer';

const LazyUserAvatar = (props) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div ref={ref}>
      {inView ? <UserAvatar {...props} /> : <PlaceholderAvatar />}
    </div>
  );
};
```

### Preloading Strategy
```javascript
// Preload avatars for likely-to-be-viewed users
const preloadUserAvatars = async (users, organizationId) => {
  const preloadPromises = users.slice(0, 10).map(user => 
    getUserAvatarByEmail(user.email, organizationId)
  );
  
  // Don't await - just trigger the cache warming
  Promise.all(preloadPromises).catch(console.error);
};
```

### Image Compression
```javascript
// Compress images before upload
import { compressImage } from '../utils/imageUtils';

const handleImageUpload = async (file) => {
  const compressedFile = await compressImage(file, { 
    quality: 0.5, 
    maxWidth: 800, 
    maxHeight: 800 
  });
  
  return updateUserProfileImage(compressedFile);
};
```

## Security Considerations

### Signed URL Security
- **15-minute expiry** prevents long-term URL exposure
- **Validation** ensures files exist before signing
- **Public level** allows organization-wide access
- **CORS policies** restrict cross-origin access

### Data Privacy
- **Organization isolation** prevents cross-tenant data access
- **User consent** required for profile image uploads
- **Deletion handling** removes images when users are deleted

### Access Control
```javascript
// Verify user access to organization before loading avatar
const hasAccess = await verifyUserOrganizationAccess(userSub, organizationId);
if (!hasAccess) {
  return null; // Don't load avatar for unauthorized access
}
```

---

## Summary

The VibeStack™ Pro user avatar system provides a robust, scalable solution for loading and displaying user profile images with:

- **Multi-source lookup**: Email, userSub, Cognito ID
- **Intelligent caching**: 15-minute expiry with automatic refresh
- **Graceful fallbacks**: Initials, default icons
- **Organization context**: Multi-tenant support
- **Performance optimization**: Batching, memoization, lazy loading
- **Security**: Signed URLs, access control, data isolation

This system ensures consistent, performant avatar display across all application components while maintaining data security and user privacy.

---

*This documentation covers the complete user avatar system implementation in VibeStack™ Pro as of December 2024. For the most current implementation details, refer to the source code in the specified component files.*