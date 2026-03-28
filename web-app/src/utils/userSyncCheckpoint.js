import { Auth, API } from 'aws-amplify';
import * as queries from '../graphql/queries';
import { syncUserWithDatabase } from './userSync';

/**
 * Ensures user is properly synced in GraphQL database before proceeding
 * This is a checkpoint function to prevent race conditions
 */
export const ensureUserSyncCompleted = async (maxAttempts = 5, delayMs = 2000) => {
  console.log('🔄 Starting user sync checkpoint...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📍 Checkpoint attempt ${attempt}/${maxAttempts}`);
      
      // Get current Cognito user
      const cognitoUser = await Auth.currentAuthenticatedUser({ 
        bypassCache: true,
        forceRefresh: true 
      });
      
      if (!cognitoUser) {
        throw new Error('No authenticated Cognito user found');
      }
      
      const cognitoID = cognitoUser.attributes.sub;
      const email = cognitoUser.attributes.email;
      
      console.log(`🔍 Checking for user in GraphQL: ${email} (${cognitoID})`);
      
      // Check if user exists in GraphQL database
      const userCheckResponse = await API.graphql({
        query: queries.listUsers,
        variables: {
          filter: {
            cognitoID: { eq: cognitoID }
          }
        },
        fetchPolicy: 'network-only' // Always fetch from network, not cache
      });
      
      const existingUser = userCheckResponse.data.listUsers.items.find(
        user => !user._deleted
      );
      
      if (existingUser) {
        console.log('✅ User sync checkpoint PASSED - User found in GraphQL');
        return {
          success: true,
          user: existingUser,
          cognitoUser,
          attempt
        };
      }
      
      console.log(`❌ User not found in GraphQL, attempting sync...`);
      
      // Try to sync the user
      const syncedUser = await syncUserWithDatabase(cognitoUser, `checkpoint_attempt_${attempt}`);
      
      if (syncedUser) {
        console.log('✅ User sync checkpoint PASSED - User created successfully');
        return {
          success: true,
          user: syncedUser,
          cognitoUser,
          attempt
        };
      }
      
      console.log(`⚠️ Sync attempt ${attempt} failed, waiting ${delayMs}ms before retry...`);
      
      // Wait before next attempt
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      
    } catch (error) {
      console.error(`❌ Checkpoint attempt ${attempt} failed:`, error);
      
      // Wait before next attempt
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  console.error('🚨 User sync checkpoint FAILED after all attempts');
  return {
    success: false,
    user: null,
    cognitoUser: null,
    attempt: maxAttempts
  };
};

/**
 * Ensures user exists and is ready for organization creation
 * This checkpoint verifies the user record is stable before organization operations
 */
export const ensureUserReadyForOrganization = async (maxAttempts = 3, delayMs = 1000) => {
  console.log('🏢 Starting organization readiness checkpoint...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📍 Organization readiness check ${attempt}/${maxAttempts}`);
      
      const result = await ensureUserSyncCompleted(2, 1000); // Quick check
      
      if (!result.success) {
        console.log(`⚠️ User sync not ready, attempt ${attempt}`);
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        
        return {
          success: false,
          message: 'User sync not completed after all attempts'
        };
      }
      
      // Additional validation - ensure user record is complete
      const user = result.user;
      if (!user.id || !user.cognitoID || !user.email) {
        console.log(`⚠️ User record incomplete, attempt ${attempt}`, {
          hasId: !!user.id,
          hasCognitoID: !!user.cognitoID,
          hasEmail: !!user.email
        });
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
          continue;
        }
        
        return {
          success: false,
          message: 'User record is incomplete'
        };
      }
      
      console.log('✅ Organization readiness checkpoint PASSED');
      return {
        success: true,
        user: result.user,
        cognitoUser: result.cognitoUser,
        attempt
      };
      
    } catch (error) {
      console.error(`❌ Organization readiness check ${attempt} failed:`, error);
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  console.error('🚨 Organization readiness checkpoint FAILED');
  return {
    success: false,
    message: 'Organization readiness check failed after all attempts'
  };
};

/**
 * Wait for GraphQL operation to propagate (eventual consistency)
 */
export const waitForPropagation = async (delayMs = 1500) => {
  console.log(`⏳ Waiting ${delayMs}ms for GraphQL propagation...`);
  await new Promise(resolve => setTimeout(resolve, delayMs));
};