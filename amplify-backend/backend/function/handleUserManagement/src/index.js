/* Amplify Params - DO NOT EDIT
	ENV
	REGION
Amplify Params - DO NOT EDIT */

const { CognitoIdentityProviderClient, 
  ListUsersCommand, 
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminListGroupsForUserCommand,
  ListGroupsCommand
} = require("@aws-sdk/client-cognito-identity-provider");

const client = new CognitoIdentityProviderClient();
const USER_POOL_ID = process.env.AUTH_LFAPI_USERPOOLID || 'us-west-2_LLZTeB8Je';

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
};

// Helper function to decode JWT without verification
const decodeJWT = (token) => {
  try {
    // JWT has 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if necessary
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    // Decode base64
    const decoded = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Verify if the user is a Super Admin
const verifySuperAdmin = async (event) => {
  try {
    console.log('Headers:', JSON.stringify(event.headers, null, 2));
    
    // Get the authorization token from headers
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
      console.error('No authorization header found');
      return false;
    }
    
    // Decode the JWT token (without verification since Cognito already verified it)
    const decodedToken = decodeJWT(authHeader);
    
    if (!decodedToken) {
      console.error('Failed to decode token');
      return false;
    }
    
    console.log('Decoded token:', JSON.stringify(decodedToken, null, 2));
    
    // Check for groups in the token
    const groups = decodedToken['cognito:groups'] || [];
    console.log('User groups:', groups);
    
    const isSuperAdmin = groups.includes('SuperAdmin');
    console.log('Is Super Admin:', isSuperAdmin);
    
    return isSuperAdmin;
  } catch (error) {
    console.error('Error verifying super admin:', error);
    console.error('Error stack:', error.stack);
    return false;
  }
};

// List all users in the Cognito user pool
const listUsers = async () => {
  try {
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID
    });
    return await client.send(command);
  } catch (error) {
    console.error('Error listing users:', error);
    throw error;
  }
};

// Get user's group memberships
const getUserGroups = async (username) => {
  try {
    const command = new AdminListGroupsForUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: username
    });
    return await client.send(command);
  } catch (error) {
    console.error('Error getting user groups:', error);
    throw error;
  }
};

// Create a new user
const createUser = async (userData) => {
  try {
    const { email, password, firstName, lastName, isSuperAdmin } = userData;
    
    const command = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      TemporaryPassword: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'custom:first_name', Value: firstName },
        { Name: 'custom:last_name', Value: lastName }
      ]
    });
    
    const result = await client.send(command);
    
    // If user should be super admin, add them to the group
    if (isSuperAdmin) {
      await client.send(new AdminAddUserToGroupCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        GroupName: 'SuperAdmin'
      }));
    }
    
    return result;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Update user status (enable/disable)
const updateUserStatus = async (username, enable) => {
  try {
    const CommandClass = enable ? AdminEnableUserCommand : AdminDisableUserCommand;
    const command = new CommandClass({
      UserPoolId: USER_POOL_ID,
      Username: username
    });
    return await client.send(command);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  // Handle OPTIONS requests for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // First verify if the user is a Super Admin
    const isSuperAdmin = await verifySuperAdmin(event);
    console.log('SuperAdmin check result:', isSuperAdmin);
    
    if (!isSuperAdmin) {
      console.log('Authorization failed. Event details:', {
        headers: event.headers,
        claims: event.requestContext?.authorizer?.claims || event.requestContext?.authorizer?.jwt?.claims,
        requestContext: event.requestContext
      });
      
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Unauthorized. Super Admin access required.',
          debug: {
            headers: event.headers,
            requestContext: event.requestContext
          }
        })
      };
    }

    const method = event.httpMethod;
    const queryParams = event.queryStringParameters || {};
    const body = event.body ? JSON.parse(event.body) : {};
    
    let result;
    
    switch (method) {
      case 'GET':
        if (queryParams.action === 'listUsers') {
          result = await listUsers();
        } else if (queryParams.action === 'userGroups' && queryParams.username) {
          result = await getUserGroups(queryParams.username);
        } else {
          throw new Error('Invalid action or missing parameters');
        }
        break;
        
      case 'POST':
        if (body.action === 'createUser') {
          result = await createUser(body.userData);
        } else if (body.action === 'updateUserStatus') {
          result = await updateUserStatus(body.username, body.enable);
        } else {
          throw new Error('Invalid action or missing parameters');
        }
        break;
        
      default:
        throw new Error('Method not supported');
    }
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
};
