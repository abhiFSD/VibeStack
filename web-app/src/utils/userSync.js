import { Auth, API, Storage } from 'aws-amplify';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

/**
 * Creates or updates a user record in the GraphQL database based on Cognito user information
 * @param {Object} cognitoUser - The Cognito user object
 * @param {string} source - The source of sync ('registration', 'invitation', 'login')
 * @returns {Promise<Object>} - The created or updated user object
 */
export const syncUserWithDatabase = async (cognitoUser, source = 'login') => {
  if (!cognitoUser) {
    console.error('syncUserWithDatabase: No cognito user provided');
    return null;
  }
  
  const cognitoID = cognitoUser.attributes.sub;
  const email = cognitoUser.attributes.email;
  
  if (!cognitoID || !email) {
    console.error('syncUserWithDatabase: Missing required attributes', { cognitoID, email });
    return null;
  }
  
  try {
    const firstName = cognitoUser.attributes['custom:first_name'] || '';
    const lastName = cognitoUser.attributes['custom:last_name'] || '';
    const profileImageKey = cognitoUser.attributes['custom:image'] || null;
    
    console.log(`syncUserWithDatabase: Starting sync for ${email} (${cognitoID}), source: ${source}`);
    
    // Check browser cache/storage for debugging
    console.log('🔍 Browser state check:', {
      localStorage_keys: Object.keys(localStorage).filter(k => k.includes('user') || k.includes('auth')),
      sessionStorage_keys: Object.keys(sessionStorage).filter(k => k.includes('user') || k.includes('auth'))
    });
    
    // Check if user already exists in our database - with cache bypass
    const existingUserResponse = await API.graphql({
      query: queries.listUsers,
      variables: {
        filter: {
          cognitoID: { eq: cognitoID }
        }
      },
      // Force fresh query
      fetchPolicy: 'cache-and-network'
    });

    const existingUser = existingUserResponse.data.listUsers.items.find(
      user => !user._deleted
    );
    
    console.log('syncUserWithDatabase - Found existing user:', {
      id: existingUser?.id,
      email: existingUser?.email,
      termsAccepted: existingUser?.termsAccepted,
      termsAcceptedDate: existingUser?.termsAcceptedDate
    });

    if (existingUser) {
      try {
        // Update existing user
        const input = {
          id: existingUser.id,
          email,
          firstName,
          lastName,
          lastLogin: new Date().toISOString(),
          _version: existingUser._version
        };

        // Preserve terms acceptance if it exists (including false values)
        if (existingUser.termsAccepted !== undefined && existingUser.termsAccepted !== null) {
          input.termsAccepted = existingUser.termsAccepted;
        }
        
        if (existingUser.termsAcceptedDate !== undefined && existingUser.termsAcceptedDate !== null) {
          input.termsAcceptedDate = existingUser.termsAcceptedDate;
        }

        // Only update image fields if they exist
        if (profileImageKey) {
          input.profileImageKey = profileImageKey;
          input.profileImagePath = `public/${profileImageKey}`;
        }

        const updatedUser = await API.graphql({
          query: mutations.updateUser,
          variables: { input }
        });

        console.log('✅ User updated successfully:', updatedUser.data.updateUser.id);
        return updatedUser.data.updateUser;
      } catch (updateError) {
        console.error('Error updating existing user:', updateError);
        // If update fails due to version conflict, try to refetch and retry once
        if (updateError.errors && updateError.errors[0]?.errorType === 'DynamoDB:ConditionalCheckFailedException') {
          console.log('Version conflict detected, refetching user...');
          return syncUserWithDatabase(cognitoUser, `${source}_retry`);
        }
        throw updateError;
      }
    } else {
      try {
        // Create new user - this happens during registration or invitation acceptance
        const input = {
          cognitoID,
          email,
          firstName,
          lastName,
          profileImageKey,
          profileImagePath: profileImageKey ? `public/${profileImageKey}` : null,
          lastLogin: new Date().toISOString(),
          source: source, // Track how the user was created
          termsAccepted: false // New users need to accept terms
        };

        console.log('Creating new user with input:', { ...input, profileImageKey: !!input.profileImageKey });

        const newUser = await API.graphql({
          query: mutations.createUser,
          variables: { input }
        });

        console.log('✅ New user created successfully:', newUser.data.createUser.id);
        
        // Wait a moment for eventual consistency
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return newUser.data.createUser;
      } catch (createError) {
        console.error('Error creating new user:', createError);
        // If user creation fails, it might be due to race condition - try to fetch existing user
        if (createError.errors && createError.errors[0]?.errorType === 'DynamoDB:ConditionalCheckFailedException') {
          console.log('User creation conflict, attempting to fetch existing user...');
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
          return syncUserWithDatabase(cognitoUser, `${source}_conflict_retry`);
        }
        throw createError;
      }
    }
  } catch (error) {
    console.error('Error syncing user with database:', error);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error('GraphQL Error:', err);
      });
    }
    return null;
  }
};

/**
 * Updates the user's profile image in both Cognito and the GraphQL database
 * @param {File} file - The image file to upload
 * @returns {Promise<Object|null>} - Object containing image key and path, or null
 */
export const updateUserProfileImage = async (file) => {
  if (!file) return null;
  
  try {
    // Get current user
    const cognitoUser = await Auth.currentAuthenticatedUser();
    const cognitoID = cognitoUser.attributes.sub;
    
    // Generate a unique filename to prevent collisions
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${cognitoID}-${Date.now()}.${fileExtension}`;
    
    // Upload the image to S3
    const result = await Storage.put(uniqueFileName, file, { 
      level: 'public',
      contentType: file.type
    });
    const imageKey = result.key;
    
    // Store the original file path
    const imagePath = `public/${imageKey}`;
    
    // Update Cognito attributes
    await Auth.updateUserAttributes(cognitoUser, {
      'custom:image': imageKey
    });

    // Find the user in our database
    const existingUserResponse = await API.graphql({
      query: queries.listUsers,
      variables: {
        filter: {
          cognitoID: { eq: cognitoID }
        }
      }
    });

    const existingUser = existingUserResponse.data.listUsers.items.find(
      user => !user._deleted
    );

    if (existingUser) {
      // Update the user in our database with both key and path
      await API.graphql({
        query: mutations.updateUser,
        variables: {
          input: {
            id: existingUser.id,
            profileImageKey: imageKey,
            profileImagePath: imagePath,
            _version: existingUser._version
          }
        }
      });
    }
    
    return {
      imageKey,
      imagePath
    };
  } catch (error) {
    console.error('Error updating user profile image:', error);
    return null;
  }
};

/**
 * Gets a user from the database by their Cognito ID
 * @param {string} cognitoID - The Cognito user ID
 * @returns {Promise<Object|null>} - The user object or null
 */
export const getUserByCognitoID = async (cognitoID) => {
  if (!cognitoID) return null;
  
  try {
    const userResponse = await API.graphql({
      query: queries.listUsers,
      variables: {
        filter: {
          cognitoID: { eq: cognitoID }
        }
      }
    });
    
    return userResponse.data.listUsers.items.find(user => !user._deleted) || null;
  } catch (error) {
    console.error('Error getting user by Cognito ID:', error);
    return null;
  }
};

/**
 * Gets a user from the database by their email
 * @param {string} email - The user's email
 * @returns {Promise<Object|null>} - The user object or null
 */
export const getUserByEmail = async (email) => {
  if (!email) return null;
  
  try {
    const userResponse = await API.graphql({
      query: queries.listUsers,
      variables: {
        filter: {
          email: { eq: email }
        }
      }
    });
    
    return userResponse.data.listUsers.items.find(user => !user._deleted) || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}; 