import { Auth } from 'aws-amplify';

export const checkIsSuperAdmin = async () => {
  try {
    const currentSession = await Auth.currentSession();
    const groups = currentSession.getAccessToken().payload['cognito:groups'] || [];
    return groups.includes('SuperAdmin');
  } catch (error) {
    console.error('Error checking super admin status:', error);
    return false;
  }
};

export const getCurrentUserGroups = async () => {
  try {
    const currentSession = await Auth.currentSession();
    return currentSession.getAccessToken().payload['cognito:groups'] || [];
  } catch (error) {
    console.error('Error getting user groups:', error);
    return [];
  }
}; 