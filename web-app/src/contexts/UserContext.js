import React, { createContext, useContext, useEffect, useState } from 'react';
import { Auth, Storage } from 'aws-amplify';
import { syncUserWithDatabase } from '../utils/userSync';
import { ensureUserSyncCompleted } from '../utils/userSyncCheckpoint';

// Create a context
const UserContext = createContext();

// Create a Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

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

  const fetchUser = async () => {
    try {
      console.log('🚀 Starting comprehensive user fetch with checkpoint system...');
      
      // Use checkpoint system to ensure user sync completes
      const checkpointResult = await ensureUserSyncCompleted(5, 2000);
      
      if (!checkpointResult.success) {
        console.error('🚨 User sync checkpoint failed completely');
        setUser(null);
        setAvatarUrl(null);
        setDbUser(null);
        setTermsAccepted(false);
        return;
      }
      
      const { cognitoUser, user: syncedUser } = checkpointResult;
      
      setDbUser(syncedUser);
      
      // Set terms acceptance status
      if (syncedUser && syncedUser.termsAccepted) {
        setTermsAccepted(syncedUser.termsAccepted);
      } else {
        setTermsAccepted(false);
      }
      
      // Get avatar URL if profile image exists
      if (cognitoUser.attributes['custom:image']) {
        const signedURL = await getSignedImageUrl(cognitoUser.attributes['custom:image']);
        setAvatarUrl(signedURL);
      } else {
        setAvatarUrl(null);
      }
      
      setUser(cognitoUser);
      
      // Log success for debugging
      console.log('✅ User fetch completed with checkpoint system:', {
        cognitoUser: cognitoUser.attributes.sub,
        dbUser: syncedUser?.id,
        termsAccepted: syncedUser?.termsAccepted,
        checkpointAttempts: checkpointResult.attempt
      });
      
    } catch (error) {
      console.error('❌ Error in fetchUser with checkpoint system:', error);
      setUser(null);
      setAvatarUrl(null);
      setDbUser(null);
      setTermsAccepted(false);
    }
  };

  const clearUserData = () => {
    console.log('🧹 Clearing all user data and caches...');
    setUser(null);
    setAvatarUrl(null);
    setDbUser(null);
    setTermsAccepted(false);
    
    // Clear any cached GraphQL queries
    if (window.localStorage) {
      // Clear Amplify cache
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('amplify') || key.startsWith('aws') || key.includes('user') || key.includes('auth')) {
          console.log('Clearing localStorage key:', key);
          localStorage.removeItem(key);
        }
      });
    }
    
    // Clear session storage as well
    if (window.sessionStorage) {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('amplify') || key.startsWith('aws') || key.includes('user') || key.includes('auth')) {
          console.log('Clearing sessionStorage key:', key);
          sessionStorage.removeItem(key);
        }
      });
    }
  };

  useEffect(() => {
    // Add debug info about initial load
    console.log('🚀 UserContext mounting, checking for existing auth state...');
    console.log('Browser storage keys:', Object.keys(localStorage).filter(k => k.includes('amplify') || k.includes('aws')));
    
    fetchUser();
  }, []);

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
      
      // Also sync with our database to ensure consistency
      await syncUserWithDatabase(user);
    } catch (error) {
      console.error('Error updating avatar:', error);
      setAvatarUrl(null);
    }
  };

  // Refresh signed URL periodically before expiration
  useEffect(() => {
    if (user?.attributes['custom:image']) {
      const refreshInterval = setInterval(async () => {
        const signedURL = await getSignedImageUrl(user.attributes['custom:image']);
        setAvatarUrl(signedURL);
      }, 45 * 1000); // Refresh every 45 seconds (before 60-second expiration)
      
      return () => clearInterval(refreshInterval);
    }
  }, [user]);

  const updateTermsAccepted = (accepted) => {
    setTermsAccepted(accepted);
    // Also update the dbUser state if it exists
    if (dbUser) {
      setDbUser({
        ...dbUser,
        termsAccepted: accepted,
        termsAcceptedDate: accepted ? new Date().toISOString() : null
      });
    }
  };

  // Force complete app reset - useful for debugging signup issues
  const forceAppReset = () => {
    console.log('🚨 FORCE APP RESET - Clearing everything');
    
    // Clear all state
    clearUserData();
    
    // Clear all localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear IndexedDB if it exists (some browsers use this for Amplify)
    if (window.indexedDB) {
      console.log('Attempting to clear IndexedDB...');
    }
    
    console.log('✅ App reset complete - please refresh page');
  };

  const value = {
    user,
    dbUser,
    avatarUrl,
    termsAccepted,
    updateUserAvatar,
    fetchUser,
    clearUserData,
    updateTermsAccepted,
    getSignedImageUrl, // Expose this function for other components
    forceAppReset // For debugging
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// Create a custom hook to use the context
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext; 