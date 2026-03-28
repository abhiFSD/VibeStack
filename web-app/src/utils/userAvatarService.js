import { Auth, Storage, API } from 'aws-amplify';
import * as queries from '../graphql/queries';
import { getUserByCognitoID, getUserByEmail, updateUserProfileImage } from './userSync';

// Cache to store user avatar URLs by both email and userSub
const avatarCache = {
  byEmail: new Map(),
  byUserSub: new Map()
};

// Cache expiry time in milliseconds (15 minutes)
const CACHE_EXPIRY = 15 * 60 * 1000;

/**
 * Gets a user's avatar URL from their Cognito attributes
 * @param {Object} user - The Cognito user object
 * @returns {Promise<string|null>} - The signed URL for the user's avatar or null
 */
const getAvatarFromUser = async (user) => {
  try {
    if (!user || !user.attributes || !user.attributes['custom:image']) {
      return null;
    }

    const imageKey = user.attributes['custom:image'];
    const signedURL = await Storage.get(imageKey, { 
      level: 'public',
      validateObjectExistence: true,
      expires: 60 * 15 // 15 minutes expiry
    });
    
    return signedURL;
  } catch (error) {
    console.error('Error getting avatar from user:', error);
    return null;
  }
};

/**
 * Gets the userSub for an email from the organization member list
 * @param {string} email - The email to look up
 * @param {string} organizationID - The organization ID
 * @returns {Promise<string|null>} - The userSub or null if not found
 */
const getUserSubByEmail = async (email, organizationID) => {
  if (!email || !organizationID) return null;
  
  try {
    const response = await API.graphql({
      query: queries.listOrganizationMembers,
      variables: {
        filter: {
          email: { eq: email },
          organizationID: { eq: organizationID },
          status: { eq: "ACTIVE" },
          _deleted: { ne: true }
        }
      }
    });

    const members = response.data?.listOrganizationMembers?.items || [];
    if (members.length > 0) {
      return members[0].userSub;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting userSub by email:', error);
    return null;
  }
};

/**
 * Gets user information from userSub
 * @param {string} userSub - The user's sub from Cognito
 * @param {string} organizationID - The organization ID
 * @returns {Promise<Object|null>} - User information or null
 */
const getUserInfoByUserSub = async (userSub, organizationID) => {
  if (!userSub || !organizationID) return null;
  
  try {
    const response = await API.graphql({
      query: queries.listOrganizationMembers,
      variables: {
        filter: {
          userSub: { eq: userSub },
          organizationID: { eq: organizationID },
          status: { eq: "ACTIVE" },
          _deleted: { ne: true }
        }
      }
    });

    const members = response.data?.listOrganizationMembers?.items || [];
    if (members.length > 0) {
      return members[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user info by userSub:', error);
    return null;
  }
};

/**
 * Gets a user's avatar URL by their email
 * @param {string} email - The user's email
 * @param {string} organizationID - The organization ID
 * @returns {Promise<string|null>} - The signed URL for the user's avatar or null
 */
export const getUserAvatarByEmail = async (email, organizationID) => {
  // Check cache first
  const cacheKey = `${email}-${organizationID}`;
  const cached = avatarCache.byEmail.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY)) {
    return cached.url;
  }
  
  try {
    // First, try to get from User table
    const user = await getUserByEmail(email);
    if (user && user.profileImageUrl) {
      // Cache the result
      avatarCache.byEmail.set(cacheKey, {
        url: user.profileImageUrl,
        timestamp: Date.now()
      });
      return user.profileImageUrl;
    }
    
    // If not in User table, try the organization member method
    const userSub = await getUserSubByEmail(email, organizationID);
    if (!userSub) return null;
    
    // Now get the avatar using the userSub
    const avatar = await getUserAvatarByUserSub(userSub, organizationID);
    
    // Cache the result
    if (avatar) {
      avatarCache.byEmail.set(cacheKey, {
        url: avatar,
        timestamp: Date.now()
      });
    }
    
    return avatar;
  } catch (error) {
    console.error('Error getting avatar by email:', error);
    return null;
  }
};

/**
 * Gets a user's avatar URL by their userSub
 * @param {string} userSub - The user's sub from Cognito
 * @param {string} organizationID - The organization ID
 * @returns {Promise<string|null>} - The signed URL for the user's avatar or null
 */
export const getUserAvatarByUserSub = async (userSub, organizationID) => {
  // Check cache first
  const cacheKey = `${userSub}-${organizationID}`;
  const cached = avatarCache.byUserSub.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_EXPIRY)) {
    return cached.url;
  }
  
  try {
    // First, try to get from User table
    const user = await getUserByCognitoID(userSub);
    if (user && user.profileImageUrl) {
      // Cache the result
      avatarCache.byUserSub.set(cacheKey, {
        url: user.profileImageUrl,
        timestamp: Date.now()
      });
      return user.profileImageUrl;
    }
    
    // For current user, get from current session if not in User table
    let currentUserSub;
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      currentUserSub = currentUser.attributes.sub;
      
      // If this is the current user, get avatar from attributes directly
      if (userSub === currentUserSub) {
        const avatarUrl = await getAvatarFromUser(currentUser);
        
        if (avatarUrl) {
          // Cache the result
          avatarCache.byUserSub.set(cacheKey, {
            url: avatarUrl,
            timestamp: Date.now()
          });
        }
        
        return avatarUrl;
      }
    } catch (error) {
      // Error getting current user (likely not authenticated), continue with other methods
      console.log('No authenticated user found, using alternative avatar methods');
    }
    
    // Fallback to organization members if it has profile image
    const userInfo = await getUserInfoByUserSub(userSub, organizationID);
    if (userInfo && userInfo.profileImageUrl) {
      // Cache the result
      avatarCache.byUserSub.set(cacheKey, {
        url: userInfo.profileImageUrl,
        timestamp: Date.now()
      });
      
      return userInfo.profileImageUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting avatar by userSub:', error);
    return null;
  }
};

/**
 * Clear the avatar cache for a specific user
 * @param {string} userSub - The user's sub from Cognito
 * @param {string} email - The user's email
 * @param {string} organizationID - The organization ID
 */
export const clearUserAvatarCache = (userSub, email, organizationID) => {
  if (userSub && organizationID) {
    const subCacheKey = `${userSub}-${organizationID}`;
    avatarCache.byUserSub.delete(subCacheKey);
  }
  
  if (email && organizationID) {
    const emailCacheKey = `${email}-${organizationID}`;
    avatarCache.byEmail.delete(emailCacheKey);
  }
};

/**
 * Clear the entire avatar cache
 */
export const clearAllAvatarCache = () => {
  avatarCache.byEmail.clear();
  avatarCache.byUserSub.clear();
};

/**
 * Update the user's avatar in both Cognito and User table, then refresh the cache
 * @param {File} file - The image file to upload
 * @returns {Promise<string|null>} - The new avatar URL or null on error
 */
export const updateUserAvatar = async (file) => {
  if (!file) return null;
  
  try {
    // Use the centralized function to update both Cognito and the User table
    const signedURL = await updateUserProfileImage(file);
    
    // Clear all caches for this user
    const user = await Auth.currentAuthenticatedUser();
    const userSub = user.attributes.sub;
    const email = user.attributes.email;
    
    clearUserAvatarCache(userSub, email, null);
    
    return signedURL;
  } catch (error) {
    console.error('Error updating user avatar:', error);
    return null;
  }
}; 