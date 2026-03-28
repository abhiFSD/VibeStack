import { API } from 'aws-amplify';
import * as queries from '../graphql/queries';

// Status mapping from numeric codes to readable status
export const statusMap = {
  0: 'To Do',
  1: 'In Progress',
  2: 'In Review',
  3: 'Done'
};

/**
 * Convert status number to readable text
 * @param {number} status - The status code
 * @returns {string} - Readable status text
 */
export const getStatusText = (status) => {
  return statusMap[status] || 'Unknown';
};

/**
 * Get color for status based on status number
 * @param {number} status - The status code
 * @returns {string} - Color for the status
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 0: return 'green';
    case 1: return 'orange';
    case 2: return 'blue';
    case 3: return 'lightgreen';
    default: return 'black';
  };
};

/**
 * Function to fetch emails for given user subscriptions
 * @param {Array<string>} userSubs - Array of user subscription IDs 
 * @param {string} organizationID - The organization ID
 * @returns {Promise<Map<string, string>>} - Map of user IDs to emails
 */
export const fetchUserEmails = async (userSubs, organizationID) => {
  if (!userSubs || userSubs.length === 0 || !organizationID) {
    return new Map();
  }
  
  try {
    console.log('Fetching emails for userSubs:', userSubs, 'organizationID:', organizationID);
    
    // First try to get from OrganizationMembers
    const filters = userSubs.map(sub => ({
      userSub: { eq: sub },
      organizationID: { eq: organizationID }
    }));

    const response = await API.graphql({
      query: queries.listOrganizationMembers,
      variables: {
        filter: {
          or: filters
        },
        limit: 100
      }
    });

    const members = response.data?.listOrganizationMembers?.items || [];
    
    // Create a map of userSub -> email
    const emailMap = new Map();
    members.forEach(member => {
      if (member.userSub && member.email) {
        emailMap.set(member.userSub, member.email);
      }
    });
    
    // For any missing emails, try to fetch from User table
    const membersWithoutEmails = userSubs.filter(sub => !emailMap.has(sub));
    
    if (membersWithoutEmails.length > 0) {
      console.log('Fetching from User table for:', membersWithoutEmails);
      
      // Create filters for User table (using cognitoID field)
      const userFilters = membersWithoutEmails.map(sub => ({
        cognitoID: { eq: sub }
      }));
      
      try {
        const userResponse = await API.graphql({
          query: queries.listUsers,
          variables: {
            filter: {
              or: userFilters
            },
            limit: 100
          }
        });
        
        const users = userResponse.data?.listUsers?.items || [];
        console.log('Found users:', users);
        
        users.forEach(user => {
          if (user.cognitoID && user.email) {
            emailMap.set(user.cognitoID, user.email);
          }
        });
      } catch (userError) {
        console.error('Error fetching from User table:', userError);
      }
    }
    
    console.log('Final email map:', Array.from(emailMap.entries()));
    
    return emailMap;
  } catch (error) {
    console.error('Error fetching user emails:', error);
    return new Map();
  }
};

/**
 * Format assignees list - convert user IDs to emails when possible
 * @param {Array<string>} assignees - List of assignee IDs
 * @param {Map<string, string>} emailMap - Map of user IDs to emails
 * @returns {string} - Formatted assignee string
 */
export const formatAssignees = (assignees, emailMap) => {
  if (!assignees || !assignees.length) return '';
  
  return assignees.map(id => {
    const email = emailMap.get(id);
    return email || id;
  }).join(', ');
}; 