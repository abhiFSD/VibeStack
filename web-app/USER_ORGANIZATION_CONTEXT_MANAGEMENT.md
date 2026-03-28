# User & Organization Context Management: GraphQL & Cognito Integration

## Overview

This document provides a comprehensive analysis of how VibeStack™ Pro manages user authentication, context, and multi-tenant organizational data through the integration of AWS Cognito, GraphQL, and React Context APIs. The system supports sophisticated multi-tenancy where users can belong to multiple organizations with proper data isolation and context switching.

---

## 🏗️ **Architecture Overview**

```
AWS Cognito (Authentication)
           ↓
    User Sync & Database Creation
           ↓
    React UserContext (User State)
           ↓
    OrganizationContext (Multi-Tenancy)
           ↓
    Organization Selection & Switching
           ↓
    Data Filtering & Access Control
           ↓
    Application Features & Reports
```

---

## 🔐 **AWS Cognito Integration**

### **Authentication Flow**
1. **User Login/Signup** → AWS Cognito User Pool
2. **Token Generation** → JWT tokens for API access
3. **User Attributes** → Custom attributes stored in Cognito
4. **Database Sync** → Cognito user synced to GraphQL User entity

### **Cognito Custom Attributes**
```javascript
// Custom attributes stored in Cognito
{
  "custom:first_name": "John",
  "custom:last_name": "Doe", 
  "custom:image": "profile-images/user_123.jpg", // S3 key for profile image
  "email": "john.doe@company.com",
  "sub": "123e4567-e89b-12d3-a456-426614174000" // Unique user identifier
}
```

### **User Sync Process**
**File**: `userSync.js` lines 11-100

```javascript
export const syncUserWithDatabase = async (cognitoUser, source = 'login') => {
    const cognitoID = cognitoUser.attributes.sub;
    const email = cognitoUser.attributes.email;
    
    // Extract custom attributes
    const firstName = cognitoUser.attributes['custom:first_name'] || '';
    const lastName = cognitoUser.attributes['custom:last_name'] || '';
    const profileImageKey = cognitoUser.attributes['custom:image'] || null;
    
    // Check if user exists in GraphQL database
    const existingUserResponse = await API.graphql({
        query: queries.listUsers,
        variables: {
            filter: {
                cognitoID: { eq: cognitoID }
            }
        },
        fetchPolicy: 'cache-and-network' // Force fresh query
    });

    const existingUser = existingUserResponse.data.listUsers.items.find(
        user => !user._deleted
    );
    
    if (existingUser) {
        // Update existing user with latest Cognito data
        const input = {
            id: existingUser.id,
            email,
            firstName,
            lastName,
            lastLogin: new Date().toISOString(),
            _version: existingUser._version
        };

        // Preserve terms acceptance
        if (existingUser.termsAccepted !== undefined) {
            input.termsAccepted = existingUser.termsAccepted;
        }
        
        // Update profile image if exists
        if (profileImageKey) {
            input.profileImageKey = profileImageKey;
            input.profileImagePath = `public/${profileImageKey}`;
        }

        return await API.graphql({
            query: mutations.updateUser,
            variables: { input }
        });
    } else {
        // Create new user in database
        return await createNewUser(cognitoUser, source);
    }
};
```

---

## 🗄️ **GraphQL Schema: User & Organization Entities**

### **User Entity Structure**
**File**: `schema.graphql` lines 680-696

```graphql
type User @model @auth(rules: [{allow: public}]) {
  id: ID!                          # GraphQL generated ID
  cognitoID: String! @index        # Links to Cognito user.sub (searchable)
  email: String!                   # User's email address
  firstName: String                # First name from Cognito custom attributes
  lastName: String                 # Last name from Cognito custom attributes
  profileImageKey: String          # S3 key for profile image
  profileImagePath: String         # Full S3 path for profile image
  profileImageUrl: String          # Signed URL for profile image (computed)
  lastLogin: AWSDateTime          # Last login timestamp
  source: String                  # Registration source (registration/invitation/login)
  termsAccepted: Boolean          # Whether user accepted terms
  termsAcceptedDate: AWSDateTime  # When terms were accepted
  _version: Int                   # Optimistic locking
  _deleted: Boolean               # Soft delete flag
  _lastChangedAt: AWSTimestamp    # Last modification timestamp
}
```

### **Organization Entity Structure**
**File**: `schema.graphql` lines 231-274

```graphql
type Organization @model @auth(rules: [{allow: public}]) {
  id: ID!                         # Unique organization identifier
  name: String!                   # Organization name
  owner: String!                  # Owner's Cognito user.sub
  additionalOwners: [String]      # Additional owners' user.subs
  contactEmail: String            # Organization contact email
  contactPhone: String            # Organization contact phone
  location: String                # Physical location
  coordinates: String             # GPS coordinates
  logo: String                    # S3 key for organization logo
  isActive: Boolean               # Currently active organization for owner
  leaderboardEnabled: Boolean     # Enable gamification features
  
  # Related entities
  members: [OrganizationMember] @hasMany(indexName: "byOrganization", fields: ["id"])
  departments: [Department] @hasMany(indexName: "byOrganization", fields: ["id"])
  Reports: [Report] @hasMany(indexName: "byOrganization", fields: ["id"])
  Projects: [Project] @hasMany(indexName: "byOrganization", fields: ["id"])
  awards: [AwardDefinition] @hasMany(indexName: "byOrganization", fields: ["id"])
  shopItems: [ShopItem] @hasMany(indexName: "byOrganization", fields: ["id"])
  
  # Subscription & billing
  stripeCustomerId: String
  stripeSubscriptionId: String
  stripeSubscriptionItemId: String
  subscriptionStatus: String      # "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED"
  subscriptionPeriodEnd: AWSDateTime
  billingPeriod: String          # "MONTHLY" | "YEARLY"
  activeUserCount: Int
  purchasedLicenses: Int
  
  # Learning system configuration
  aiDisabledUsers: [String]       # User.subs who cannot access AI
  learningCoinsPerInterval: Int   # Coins earned per interval (default: 5)
  learningCoinInterval: Int       # Interval in seconds (default: 300)
  learningMaxCoinsPerSession: Int # Max coins per session (default: 20)
  learningCoinsEnabled: Boolean   # Enable learning rewards (default: true)
  
  # Audit fields
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### **OrganizationMember Entity Structure**
**File**: `schema.graphql` lines 290-304

```graphql
type OrganizationMember @model @auth(rules: [{allow: public}]) {
  id: ID!                                    # Unique membership record ID
  organizationID: ID! @index(name: "byOrganization")  # Links to Organization
  departmentID: ID @index(name: "byDepartment")       # Optional department assignment
  department: Department @belongsTo(fields: ["departmentID"])
  userSub: String!                          # User's Cognito ID (user.sub)
  email: String!                            # User's email for easy reference
  status: String!                           # "PENDING" | "ACTIVE" 
  role: String!                             # "ADMIN" | "MEMBER"
  createdAt: AWSDateTime
  updatedAt: AWSDateTime
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

---

## 🔄 **User Context Management**

### **UserContext Provider Setup**
**File**: `UserContext.js` lines 10-82

```javascript
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);           // Cognito user object
    const [avatarUrl, setAvatarUrl] = useState(null); // S3 signed URL for profile image
    const [dbUser, setDbUser] = useState(null);       // GraphQL User entity
    const [termsAccepted, setTermsAccepted] = useState(false);

    const fetchUser = async () => {
        try {
            // Use checkpoint system to ensure user sync completes
            const checkpointResult = await ensureUserSyncCompleted(5, 2000);
            
            if (!checkpointResult.success) {
                console.error('User sync checkpoint failed completely');
                setUser(null);
                setAvatarUrl(null);
                setDbUser(null);
                setTermsAccepted(false);
                return;
            }
            
            const { cognitoUser, user: syncedUser } = checkpointResult;
            
            // Set database user
            setDbUser(syncedUser);
            
            // Set terms acceptance status
            setTermsAccepted(syncedUser?.termsAccepted || false);
            
            // Get profile image signed URL
            if (cognitoUser.attributes['custom:image']) {
                const signedURL = await getSignedImageUrl(cognitoUser.attributes['custom:image']);
                setAvatarUrl(signedURL);
            }
            
            setUser(cognitoUser);
            
        } catch (error) {
            console.error('Error in fetchUser:', error);
            // Clear all user data on error
            setUser(null);
            setAvatarUrl(null);
            setDbUser(null);
            setTermsAccepted(false);
        }
    };

    const clearUserData = () => {
        console.log('Clearing all user data and caches...');
        setUser(null);
        setAvatarUrl(null);
        setDbUser(null);
        setTermsAccepted(false);
        
        // Clear Amplify caches
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('amplify') || key.startsWith('aws') || 
                key.includes('user') || key.includes('auth')) {
                localStorage.removeItem(key);
            }
        });
    };
};
```

### **Profile Image Management**
**File**: `UserContext.js` lines 16-28, 121-145

```javascript
const getSignedImageUrl = async (imageKey) => {
    if (!imageKey) return null;
    try {
        return await Storage.get(imageKey, {
            level: 'public',
            validateObjectExistence: true,
            expires: 60 // Short expiration to prevent caching
        });
    } catch (error) {
        console.error('Error generating signed URL:', error);
        return null;
    }
};

const updateUserAvatar = async (forceNull = false) => {
    try {
        if (forceNull) {
            setAvatarUrl(null);
            return;
        }

        const user = await Auth.currentAuthenticatedUser();
        const imageKey = user.attributes['custom:image'];
        
        if (!imageKey) {
            setAvatarUrl(null);
            return;
        }

        const signedURL = await getSignedImageUrl(imageKey);
        setAvatarUrl(signedURL);
        
        // Sync with database to ensure consistency
        await syncUserWithDatabase(user);
    } catch (error) {
        console.error('Error updating avatar:', error);
        setAvatarUrl(null);
    }
};

// Auto-refresh signed URLs before expiration
useEffect(() => {
    if (user?.attributes['custom:image']) {
        const refreshInterval = setInterval(async () => {
            const signedURL = await getSignedImageUrl(user.attributes['custom:image']);
            setAvatarUrl(signedURL);
        }, 45 * 1000); // Refresh every 45 seconds (before 60-second expiration)
        
        return () => clearInterval(refreshInterval);
    }
}, [user]);
```

---

## 🏢 **Organization Context Management**

### **OrganizationContext Provider Setup**
**File**: `OrganizationContext.js` lines 8-144

```javascript
export const OrganizationProvider = ({ children }) => {
    const [activeOrganization, setActiveOrganization] = useState(() => {
        // Try to get the active organization from localStorage on initial load
        const storedOrg = localStorage.getItem('activeOrganization');
        return storedOrg ? JSON.parse(storedOrg) : null;
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Update localStorage whenever activeOrganization changes
    useEffect(() => {
        if (activeOrganization) {
            localStorage.setItem('activeOrganization', JSON.stringify(activeOrganization));
        } else {
            localStorage.removeItem('activeOrganization');
        }
    }, [activeOrganization]);

    const fetchUserOrganizations = async () => {
        try {
            setIsLoading(true);
            const user = await Auth.currentAuthenticatedUser();
            const userSub = user.attributes.sub;

            // Get organizations where user is a member
            const memberOrgsResponse = await API.graphql({
                query: queries.listOrganizationMembers,
                variables: {
                    filter: {
                        userSub: { eq: userSub }
                    }
                }
            });

            // Get organizations owned by user
            const ownedOrgsResponse = await API.graphql({
                query: queries.listOrganizations,
                variables: {
                    filter: {
                        owner: { eq: userSub }
                    }
                }
            });

            // Fetch full organization details for each membership
            const memberOrgs = await Promise.all(
                memberOrgsResponse.data.listOrganizationMembers.items
                    .filter(member => !member._deleted)
                    .map(async (member) => {
                        if (member.organizationID) {
                            const orgResponse = await API.graphql({
                                query: getOrganizationQuery,
                                variables: { id: member.organizationID }
                            });
                            return orgResponse.data.getOrganization;
                        }
                        return null;
                    })
            );

            const validMemberOrgs = memberOrgs.filter(org => org !== null && !org._deleted);
            const ownedOrgs = ownedOrgsResponse.data.listOrganizations.items.filter(org => !org._deleted);
            
            const allOrgs = [...validMemberOrgs, ...ownedOrgs];
            
            // Handle stored organization validation
            const storedOrg = localStorage.getItem('activeOrganization');
            if (storedOrg) {
                const parsedStoredOrg = JSON.parse(storedOrg);
                const isStoredOrgValid = allOrgs.some(org => org.id === parsedStoredOrg.id);
                if (isStoredOrgValid) {
                    const updatedOrg = allOrgs.find(org => org.id === parsedStoredOrg.id);
                    setActiveOrganization(updatedOrg);
                    return;
                } else {
                    localStorage.removeItem('activeOrganization');
                }
            }
            
            // Set active organization (prefer isActive=true, fallback to first)
            const activeOrg = allOrgs.find(org => org.isActive);
            if (activeOrg) {
                setActiveOrganization(activeOrg);
            } else if (allOrgs.length > 0 && !activeOrganization) {
                const firstOrg = allOrgs[0];
                await setOrganizationAsActive(firstOrg.id);
                setActiveOrganization(firstOrg);
            }
            
        } catch (error) {
            console.error('Error fetching organizations:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };
};
```

### **Organization Switching Logic**
**File**: `OrganizationContext.js` lines 146-178

```javascript
const setOrganizationAsActive = async (organizationId) => {
    try {
        // Deactivate currently active organization
        if (activeOrganization?.id) {
            await API.graphql({
                query: mutations.updateOrganization,
                variables: {
                    input: {
                        id: activeOrganization.id,
                        isActive: false,
                        _version: activeOrganization._version
                    }
                }
            });
        }

        // Activate new organization
        const result = await API.graphql({
            query: mutations.updateOrganization,
            variables: {
                input: {
                    id: organizationId,
                    isActive: true
                }
            }
        });

        return result.data.updateOrganization;
    } catch (error) {
        console.error('Error setting organization as active:', error);
        throw error;
    }
};

const updateActiveOrganization = async (organizationId) => {
    setIsLoading(true);
    try {
        await setOrganizationAsActive(organizationId);
        
        // Fetch updated organization data
        const result = await API.graphql({
            query: getOrganizationQuery,
            variables: { id: organizationId }
        });
        
        const org = result.data.getOrganization;
        setActiveOrganization(org);
    } catch (error) {
        console.error('Error updating active organization:', error);
        setError(error.message);
    } finally {
        setIsLoading(false);
    }
};
```

---

## 🔐 **Multi-Tenant Data Isolation**

### **Organization-Level Data Filtering**
All major entities include `organizationID` with proper indexing:

```graphql
# Example: Reports are isolated by organization
type Report @model @auth(rules: [{allow: public}]) {
  id: ID!
  organizationID: ID! @index(name: "byOrganization")
  # ... other fields
}

# Query pattern for organization-specific data
query ListReportsByOrganization($organizationID: ID!) {
  listReports(
    filter: { 
      organizationID: { eq: $organizationID },
      _deleted: { ne: true }
    }
  ) {
    items {
      id
      name
      type
      # ... other fields
    }
  }
}
```

### **Data Access Control Patterns**

#### **Report-Level Access Control**
```javascript
// All report queries include organization filter
const fetchReports = async () => {
    const result = await API.graphql({
        query: queries.listReports,
        variables: {
            filter: {
                organizationID: { eq: activeOrganization.id },
                _deleted: { ne: true }
            }
        }
    });
    return result.data.listReports.items;
};
```

#### **User Role-Based Access**
```javascript
// Check user role within organization
const getUserRole = (userSub, organizationId) => {
    return API.graphql({
        query: queries.listOrganizationMembers,
        variables: {
            filter: {
                userSub: { eq: userSub },
                organizationID: { eq: organizationId },
                _deleted: { ne: true }
            }
        }
    });
};

// Usage example
const member = await getUserRole(user.attributes.sub, activeOrganization.id);
const userRole = member.data.listOrganizationMembers.items[0]?.role; // "ADMIN" | "MEMBER"
```

---

## 💾 **State Persistence & Caching**

### **localStorage Management**
```javascript
// Active organization persistence
useEffect(() => {
    if (activeOrganization) {
        localStorage.setItem('activeOrganization', JSON.stringify(activeOrganization));
    } else {
        localStorage.removeItem('activeOrganization');
    }
}, [activeOrganization]);

// Validation on app load
const storedOrg = localStorage.getItem('activeOrganization');
if (storedOrg) {
    const parsedStoredOrg = JSON.parse(storedOrg);
    const isStoredOrgValid = allOrgs.some(org => org.id === parsedStoredOrg.id);
    if (!isStoredOrgValid) {
        localStorage.removeItem('activeOrganization');
    }
}
```

### **Cache Management**
```javascript
// Clear user-related caches on logout
const clearUserData = () => {
    // Clear React state
    setUser(null);
    setAvatarUrl(null);
    setDbUser(null);
    setTermsAccepted(false);
    
    // Clear browser storage
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('amplify') || key.startsWith('aws') || 
            key.includes('user') || key.includes('auth')) {
            localStorage.removeItem(key);
        }
    });
    
    Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('amplify') || key.startsWith('aws') || 
            key.includes('user') || key.includes('auth')) {
            sessionStorage.removeItem(key);
        }
    });
};
```

---

## 🔄 **Context Switching Flow**

### **Organization Switching Process**
```
1. User selects different organization from dropdown
           ↓
2. updateActiveOrganization(newOrgId) called
           ↓
3. Current org.isActive = false (database update)
           ↓
4. New org.isActive = true (database update)
           ↓
5. Fetch fresh organization data
           ↓
6. Update React state & localStorage
           ↓
7. All components re-render with new context
           ↓
8. Data re-fetches with new organizationID filter
```

### **User Session Flow**
```
1. User authenticates with Cognito
           ↓
2. syncUserWithDatabase() creates/updates User entity
           ↓
3. UserContext initializes with Cognito + DB user data
           ↓
4. fetchUserOrganizations() loads user's organizations
           ↓
5. OrganizationContext sets active organization
           ↓
6. Application renders with full context
           ↓
7. All subsequent API calls include organization filters
```

---

## 🎭 **Context Providers Hierarchy**

### **App-Level Provider Setup**
```javascript
function App() {
  return (
    <UserProvider>          {/* Provides: user, dbUser, avatarUrl, termsAccepted */}
      <OrganizationProvider>  {/* Provides: activeOrganization, switching logic */}
        <Router>
          <Routes>
            {/* All routes have access to both contexts */}
          </Routes>
        </Router>
      </OrganizationProvider>
    </UserProvider>
  );
}
```

### **Context Hook Usage**
```javascript
// In any component
import { useUser } from '../contexts/UserContext';
import { useOrganization } from '../contexts/OrganizationContext';

const MyComponent = () => {
    const { user, dbUser, avatarUrl, termsAccepted } = useUser();
    const { activeOrganization, updateActiveOrganization, isLoading } = useOrganization();
    
    // Component logic using both contexts
    const fetchMyData = async () => {
        const result = await API.graphql({
            query: queries.listReports,
            variables: {
                filter: {
                    user_sub: { eq: user.attributes.sub },
                    organizationID: { eq: activeOrganization.id }
                }
            }
        });
        return result.data.listReports.items;
    };
};
```

---

## 🛡️ **Security & Access Control**

### **Authentication Requirements**
```javascript
// All GraphQL operations require authentication
type Organization @model @auth(rules: [{allow: public}])

// In practice, "public" means authenticated users only
// due to Cognito JWT token requirements
```

### **Data Isolation Enforcement**
1. **Query Level**: All major queries include `organizationID` filter
2. **Component Level**: Contexts provide current organization automatically
3. **Server Level**: GraphQL schema enforces proper relationships
4. **Browser Level**: localStorage validates organization membership

### **Role-Based Features**
```javascript
// Example: Admin-only features
const isUserAdmin = (userRole) => userRole === 'ADMIN';

// Conditional rendering
{isUserAdmin(userRole) && (
    <AdminOnlyComponent />
)}

// API-level role checks
const canAccessFeature = async (userSub, organizationId, feature) => {
    const member = await getUserRole(userSub, organizationId);
    const role = member.data.listOrganizationMembers.items[0]?.role;
    
    return feature.requiredRole === 'MEMBER' || 
           (feature.requiredRole === 'ADMIN' && role === 'ADMIN');
};
```

---

## 🔄 **Subscription & Billing Integration**

### **Organization Subscription Management**
```javascript
// Trial expiration check
const isTrialExpired = (organization) => {
    if (!organization) return false;
    
    // If organization has purchased licenses, trial is not expired
    if (organization.purchasedLicenses > 0) return false;
    
    // Calculate days since creation
    const createdAt = new Date(organization.createdAt);
    const now = new Date();
    const daysDifference = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
    
    // Trial expires after 14 days with no licenses
    return daysDifference >= 14;
};

// License management requirement
const needsLicenseManagement = (organization) => {
    return isTrialExpired(organization);
};
```

### **Subscription Status Integration**
```javascript
// Organization subscription fields
{
    stripeCustomerId: "cus_xxxxxxxxx",
    stripeSubscriptionId: "sub_xxxxxxxxx", 
    subscriptionStatus: "ACTIVE", // "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED"
    subscriptionPeriodEnd: "2024-12-31T23:59:59.000Z",
    billingPeriod: "MONTHLY", // "MONTHLY" | "YEARLY"
    activeUserCount: 25,
    purchasedLicenses: 50
}
```

---

## 📊 **Performance Considerations**

### **Optimized Data Loading**
1. **Checkpoint System**: Ensures user sync completes before app initialization
2. **Cache-and-Network**: Force fresh queries for critical user data
3. **localStorage Persistence**: Reduces API calls for organization switching
4. **Signed URL Refresh**: Prevents image loading failures due to expiration

### **Memory Management**
1. **Context Cleanup**: Proper useEffect cleanup for subscriptions
2. **Storage Cleanup**: Clear caches on logout and context switching
3. **State Reset**: Complete state clearing on authentication failures

### **GraphQL Query Optimization**
1. **Indexed Queries**: Use `@index` for efficient organizationID filtering
2. **Minimal Field Selection**: Only fetch required fields in queries
3. **Batch Operations**: Group related queries where possible

---

## 🎯 **Key Integration Points**

### **With Lean Methodology Tools**
- All 22 tools inherit organization context automatically
- Reports, Projects, ActionItems all include `organizationID`
- Data filtering happens transparently at query level

### **With PDF Generation**
- Organization branding (logo, colors) applied to PDFs
- User context determines access rights for PDF generation
- Organization settings control PDF feature availability

### **With Real-Time Features**
- GraphQL subscriptions filtered by organization context
- User notifications respect organization membership
- Collaborative features limited to organization members

### **With Learning System**
- AI chat access controlled by `aiDisabledUsers` array
- Learning coins configuration per organization
- Progress tracking isolated by organization

---

## 📝 **Summary**

The User & Organization Context Management system provides:

- **Seamless Authentication**: Cognito integration with automatic database sync
- **Multi-Tenant Architecture**: Complete data isolation between organizations  
- **Context Switching**: Smooth organization switching with state persistence
- **Role-Based Access**: Admin/Member roles with appropriate feature restrictions
- **Real-Time Updates**: Live context synchronization across all components
- **Subscription Integration**: Built-in billing and license management
- **Security**: Comprehensive data access control and validation
- **Performance**: Optimized loading, caching, and memory management

This sophisticated context management system enables VibeStack™ Pro to serve multiple organizations seamlessly while maintaining strict data isolation and providing a smooth user experience across all organizational contexts.