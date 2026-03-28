import { API, Auth } from 'aws-amplify';
import * as mutations from '../graphql/mutations';
import * as queries from '../graphql/queries';
import { getAwardDefinition, updateUserCoins } from './awardDefinitions';
import { sendAwardEarnedNotification, fetchEmailsByUserSubs } from './emailNotifications';

let showAwardCallback = null;

export const setAwardCallback = (callback) => {
  showAwardCallback = callback;
};

// Helper function for report completion award
export const handleReportCompleteAward = async (organizationId, reportType, userSub) => {
  try {
    // Validate organizationId
    if (!organizationId) {
      console.error('Organization ID is required for creating a report completion award');
      return false;
    }

    // If no userSub is provided, use the current authenticated user
    let awardUserSub = userSub;
    if (!awardUserSub) {
      const user = await Auth.currentAuthenticatedUser();
      awardUserSub = user.attributes.sub;
    }
    
    // Map report types to award types
    const reportToAwardMap = {
      'Value Stream Mapping Report': 'VSM_COMPLETE',
      '5S Report': '5S_COMPLETE',
      'A3 Project Report': 'A3_COMPLETE',
      'DMAIC Report': 'DMAIC_COMPLETE',
      'Gemba Walk Report': 'GEMBA_COMPLETE',
      'Kaizen Project Report': 'KAIZEN_COMPLETE',
      'Leadership Report': 'LEADERSHIP_COMPLETE',
      'Lean Assessment Report': 'LEAN_ASSESSMENT_COMPLETE',
      'Mistake Proofing Report': 'MISTAKE_PROOFING_COMPLETE',
      'PDCA Report': 'PDCA_COMPLETE',
      'Standard Work Report': 'STANDARD_WORK_COMPLETE',
      'Waste Walk Report': 'WASTE_WALK_COMPLETE',
      '5 Whys Report': 'FIVE_WHYS_COMPLETE',
      'Brainstorming Report': 'BRAINSTORMING_COMPLETE',
      'Fishbone Diagram Report': 'FISHBONE_COMPLETE',
      'Histogram Report': 'HISTOGRAM_COMPLETE',
      'Impact Map Report': 'IMPACT_MAP_COMPLETE',
      'Pareto Chart Report': 'PARETO_COMPLETE',
      'Run Chart Report': 'RUN_CHART_COMPLETE',
      'Scatter Plot Report': 'SCATTER_PLOT_COMPLETE',
      'Stakeholder Analysis Report': 'STAKEHOLDER_COMPLETE'
    };

    console.log('Creating award for report type:', reportType, 'with organization ID:', organizationId);

    if (reportType === 'Value Stream Mapping Report') {
      return await addAward('VSM_COMPLETE', organizationId, null, null, null, awardUserSub);
    } else if (reportToAwardMap[reportType]) {
      return await addAward('CUSTOM_ACHIEVEMENT', organizationId, null, null, reportToAwardMap[reportType], awardUserSub);
    } else {
      console.warn('No award definition found for report type:', reportType);
      return false;
    }
  } catch (error) {
    console.error('Error handling report complete award:', error);
    return false;
  }
};

// Helper function for VSM completion award
export const handleVSMCompleteAward = async (organizationId) => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    return await addAward('VSM_COMPLETE', organizationId, null, null);
  } catch (error) {
    console.error('Error handling VSM complete award:', error);
    return false;
  }
};

// Helper function for action item completion award
// Modified to accept the completed action item object
export const handleActionItemCompleteAward = async (organizationId, actionItem) => {
  try {
    if (!organizationId) {
      console.error('Organization ID is required for creating an action item completion award');
      return false;
    }

    // Get award definition first to ensure it exists
    const awardDef = await getAwardDefinition('ACTION_ITEM_COMPLETE', organizationId);
    if (!awardDef) {
      console.error('Award definition not found for ACTION_ITEM_COMPLETE');
      return false;
    }

    // Get current user's sub for animation check
    const currentUser = await Auth.currentAuthenticatedUser();
    const currentUserSub = currentUser.attributes.sub;

    // Combine assignees and creator into a unique set of recipients
    const assignees = actionItem.assignees || [];
    const recipients = new Set([...assignees]);
    
    // Always add the creator/owner
    if (actionItem.assignor) {
      recipients.add(actionItem.assignor);
    }
    if (actionItem.user_sub) {
      recipients.add(actionItem.user_sub);
    }

    // If no recipients at all (no assignees and no creator), log error and return
    if (recipients.size === 0) {
      console.error('No recipients found for action item award (no assignees and no creator)');
      return false;
    }

    let allAwardsSuccessful = true;

    // Grant award to each recipient
    for (const recipientSub of recipients) {
      if (!recipientSub) continue; // Skip if recipientSub is null/empty
      
      console.log(`Attempting to grant ACTION_ITEM_COMPLETE award to recipient: ${recipientSub}`);
      try {
        const awardInput = {
          title: awardDef.title,
          description: awardDef.description,
          date: new Date().toISOString(),
          user_sub: recipientSub,
          tool_id: actionItem.id,
          type: 'ACTION_ITEM_COMPLETE',
          coins: awardDef.coins,
          organizationID: organizationId
        };

        // Create the award
        const result = await API.graphql({
          query: mutations.createAwards,
          variables: { input: awardInput }
        });
        
        // Update user's coins
        await updateUserCoins(recipientSub, awardDef.coins, organizationId);
        
        // Show award animation if this is the current user
        if (recipientSub === currentUserSub && showAwardCallback) {
          console.log('Showing award animation for current user');
          showAwardCallback(awardDef.coins);
        }
        
        // Send award notification
        try {
          const recipientEmail = await getUserEmailFromSub(recipientSub, organizationId);
          if (recipientEmail) {
            await sendAwardEarnedNotification(result.data.createAwards, recipientEmail, organizationId);
            console.log(`Award notification sent to ${recipientEmail}`);
          }
        } catch (notificationError) {
          console.error(`Error sending award notification to recipient ${recipientSub}:`, notificationError);
          // Continue with other recipients even if notification fails
        }
      } catch (error) {
        console.error(`Failed to grant award to recipient ${recipientSub}:`, error);
        allAwardsSuccessful = false;
        // Continue with other recipients even if one fails
      }
    }
    
    return allAwardsSuccessful;

  } catch (error) {
    console.error('Error handling action item complete award:', error);
    return false;
  }
};

// Helper function for project completion award
export const handleProjectCompleteAward = async (organizationId, projectId) => {
  try {
    if (!organizationId) {
      console.error('Organization ID is required for creating a project completion award');
      return false;
    }

    if (!projectId) {
      console.error('Project ID is required for awarding project members');
      return false;
    }

    console.log('Creating project completion awards for project:', projectId, 'in organization:', organizationId);
    
    // Fetch the current authenticated user (the one completing the project)
    const currentUser = await Auth.currentAuthenticatedUser();
    const currentUserSub = currentUser.attributes.sub;
    
    // Fetch project members
    const projectResult = await API.graphql({
      query: queries.projectMembersByProjectID,
      variables: { projectID: projectId }
    });
    
    const projectMembers = projectResult.data.projectMembersByProjectID.items || [];
    console.log(`Found ${projectMembers.length} project members to award`);
    
    if (projectMembers.length === 0) {
      // If no members found, just award the current user
      console.log('No project members found, awarding only the current user');
      const result = await addAward('PROJECT_COMPLETE', organizationId, null, null, null, currentUserSub);
      return result;
    }

    // Create a set of unique user subs (to avoid duplicate awards)
    const memberSubs = new Set();
    
    // Add the current user (who's completing the project)
    memberSubs.add(currentUserSub);
    
    // Add all project members
    projectMembers.forEach(member => {
      if (member && member.userSub && !member._deleted) {
        memberSubs.add(member.userSub);
      }
    });
    
    console.log(`Awarding ${memberSubs.size} unique members for project completion`);
    
    // Award each member
    let allSuccessful = true;
    
    for (const userSub of memberSubs) {
      console.log(`Creating PROJECT_COMPLETE award for member: ${userSub}`);
      const success = await addAward('PROJECT_COMPLETE', organizationId, null, null, null, userSub);
      
      if (!success) {
        console.error(`Failed to award member: ${userSub}`);
        allSuccessful = false;
      }
    }
    
    return allSuccessful;
  } catch (error) {
    console.error('Error handling project complete award:', error);
    return false;
  }
};

// Helper function for KPI goal achievement award
export const handleKPIGoalAchievedAward = async (organizationId, projectId, kpiTitle) => {
  try {
    if (!organizationId || !projectId) {
      console.error('Organization ID and Project ID are required for creating KPI goal achievement awards');
      return false;
    }

    // Fetch project members
    const projectResult = await API.graphql({
      query: queries.projectMembersByProjectID,
      variables: { projectID: projectId }
    });

    const projectMembers = projectResult.data.projectMembersByProjectID.items;
    if (!projectMembers || projectMembers.length === 0) {
      console.error('No project members found');
      return false;
    }

    console.log(`Found ${projectMembers.length} project members to award`);

    // Create award for each project member
    const awardPromises = projectMembers
      .filter(member => !member._deleted) // Filter out deleted members
      .map(async (member) => {
        const customTitle = `KPI Goal Achieved: ${kpiTitle}`;
        return await addAward(
          'KPI_GOAL_ACHIEVED',
          organizationId,
          customTitle,
          null,
          null,
          member.userSub
        );
      });

    const results = await Promise.all(awardPromises);
    const allSuccessful = results.every(result => result === true);

    if (!allSuccessful) {
      console.warn('Some KPI goal achievement awards failed to create');
    }

    return allSuccessful;
  } catch (error) {
    console.error('Error handling KPI goal achievement award:', error);
    return false;
  }
};

// Helper function to get user email from user sub
const getUserEmailFromSub = async (userSub, organizationId) => {
  if (!userSub || !organizationId) {
    console.error('[getUserEmailFromSub] Missing userSub or organizationId');
    return null;
  }
  try {
    const emails = await fetchEmailsByUserSubs([userSub], organizationId);
    if (emails && emails.length > 0) {
      return emails[0]; // Return the first email found
    } else {
      console.warn(`[getUserEmailFromSub] Could not find email for userSub: ${userSub} in org: ${organizationId}`);
      return null;
    }
  } catch (error) {
    console.error('[getUserEmailFromSub] Error fetching email:', error);
    return null;
  }
};

export const addAward = async (awardType, organizationId, customTitle = null, toolId = null, customType = null, userSub = null, coinOverride = null) => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    
    // Ensure organizationID is included and not null
    if (!organizationId) {
      console.error('organizationID is required for creating an award');
      return false;
    }
    
    // Get award definition
    const awardDef = await getAwardDefinition(awardType, organizationId, customType);
    if (!awardDef) {
      console.error('Award definition not found for type:', awardType, customType);
      return false;
    }

    const awardRecipientSub = userSub || user.attributes.sub;
    const currentUserSub = user.attributes.sub;
    
    // Use coinOverride if provided, otherwise use award definition coins
    const coinsToAward = coinOverride !== null ? coinOverride : awardDef.coins;

    const awardInput = {
      title: customTitle || awardDef.title,
      description: awardDef.description,
      date: new Date().toISOString(),
      user_sub: awardRecipientSub,
      tool_id: toolId,
      type: awardType,
      coins: coinsToAward,
      organizationID: organizationId, // Ensure this is always set
      customType: customType || null
    };

    const result = await API.graphql({
      query: mutations.createAwards,
      variables: { input: awardInput }
    });
    
    // Update user's coins
    await updateUserCoins(awardRecipientSub, coinsToAward, organizationId);
    
    // Show award animation if this is the current user
    if (awardRecipientSub === currentUserSub && showAwardCallback) {
      console.log('Showing award animation for current user');
      showAwardCallback(coinsToAward);
    }
    
    // Optionally send email notification
    try {
      const awardRecord = result.data.createAwards;
      const recipientEmail = await getUserEmailFromSub(awardRecipientSub, organizationId);
      
      if (recipientEmail) {
        // Send the notification
        await sendAwardEarnedNotification(awardRecord, recipientEmail, organizationId);
      } else {
        console.warn(`[addAward] Could not get email for recipient ${awardRecipientSub}, skipping AWARD_EARNED notification.`);
      }
    } catch (emailError) {
      console.error('[addAward] Error sending award email notification:', emailError);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding award:', error);
    return false;
  }
};

export const getUnreadAwardsCount = async (organizationId) => {
  try {
    if (!organizationId) {
      console.warn('No organization ID provided for getting unread awards count');
      return 0;
    }

    const user = await Auth.currentAuthenticatedUser();
    
    // Get current date and date 24 hours ago
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    
    // Query awards for specific user and organization
    const result = await API.graphql({
      query: queries.listAwards,
      variables: {
        filter: {
          user_sub: { eq: user.attributes.sub },
          organizationID: { eq: organizationId },
          _deleted: { ne: true }
        }
      }
    });
    
    if (!result.data?.listAwards?.items) {
      console.warn('No awards data found in response');
      return 0;
    }

    // Filter awards from the last 24 hours
    const recentAwards = result.data.listAwards.items.filter(award => {
      const awardDate = award.date ? new Date(award.date) : 
                       award.createdAt ? new Date(award.createdAt) : null;
      
      if (!awardDate) {
        return false;
      }

      return awardDate >= oneDayAgo && awardDate <= now;
    });
    
    return recentAwards.length;
  } catch (error) {
    console.error('Error getting unread awards count:', error);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error('GraphQL Error:', err);
        console.error('Error path:', err.path);
        console.error('Error locations:', err.locations);
      });
    }
    return 0;
  }
};

/**
 * Handle report completion award
 * @param {string} userSub - The user's sub ID
 * @param {string} organizationID - The organization ID
 * @returns {Promise<void>}
 */
export const handleReportCompletionAward = async (userSub, organizationID) => {
  try {
    console.log('handleReportCompletionAward called with:', { userSub, organizationID });
    
    if (!userSub || !organizationID) {
      console.error('Missing required parameters for report completion award');
      return false;
    }
    
    // Get the REPORT_COMPLETE award definition
    const awardDefResponse = await API.graphql({
      query: queries.listAwardDefinitions,
      variables: {
        filter: {
          organizationID: { eq: organizationID },
          type: { eq: 'REPORT_COMPLETE' }
        },
        limit: 1000
      }
    });
    
    const awardDefinitions = awardDefResponse.data.listAwardDefinitions.items;
    console.log('Found award definitions:', awardDefinitions);
    
    if (awardDefinitions.length === 0) {
      console.log('Report completion award definition not found, creating default award');
      
      // First create a default award definition if it doesn't exist
      const defaultAwardDefInput = {
        type: 'REPORT_COMPLETE',
        coins: 10,
        title: 'Report Completion',
        description: 'Completed a report',
        organizationID: organizationID,
        isEnabled: true
      };
      
      console.log('Creating default award definition with input:', defaultAwardDefInput);
      
      try {
        const defaultAwardDef = await API.graphql({
          query: mutations.createAwardDefinition,
          variables: {
            input: defaultAwardDefInput
          }
        });
        
        const awardDef = defaultAwardDef.data.createAwardDefinition;
        console.log('Default award definition created successfully:', awardDef);
        
        // Now create the actual award for this user
        const awardInput = {
          title: awardDef.title,
          description: awardDef.description,
          date: new Date().toISOString(),
          user_sub: userSub,
          type: 'REPORT_COMPLETE',
          coins: awardDef.coins,
          organizationID: organizationID
        };
        
        const createAwardResult = await API.graphql({
          query: mutations.createAwards,
          variables: {
            input: awardInput
          }
        });
        
        const award = createAwardResult.data.createAwards;
        console.log('Award created for user:', award);
        
        // Update coins directly based on the award definition
        await updateUserCoins(userSub, award.coins || 10, organizationID);
        
        // Get user email for notification
        const userResponse = await API.graphql({
          query: queries.listOrganizationMembers,
          variables: {
            filter: {
              userSub: { eq: userSub },
              organizationID: { eq: organizationID }
            }
          }
        });
        
        const members = userResponse.data.listOrganizationMembers.items;
        console.log('Found organization members for notification:', members);
        
        if (members.length > 0) {
          const userEmail = members[0].email;
          await sendAwardEarnedNotification(award, userEmail, organizationID);
          console.log('Award notification sent to:', userEmail);
        } else {
          console.log('No members found to send award notification');
        }
        
        return true;
      } catch (creationError) {
        console.error('Error creating default award definition or award:', creationError);
        return false;
      }
    } else {
      const awardDef = awardDefinitions[0];
      console.log('Using existing award definition:', awardDef);
      
      if (awardDef.isEnabled !== false) {
        try {
          // Create the award for this user
          const awardInput = {
            title: awardDef.title,
            description: awardDef.description,
            date: new Date().toISOString(),
            user_sub: userSub,
            type: 'REPORT_COMPLETE',
            coins: awardDef.coins,
            organizationID: organizationID
          };
          
          console.log('Creating award with input:', awardInput);
          
          const createAwardResult = await API.graphql({
            query: mutations.createAwards,
            variables: {
              input: awardInput
            }
          });
          
          const award = createAwardResult.data.createAwards;
          console.log('Award created for user:', award);
          
          // Directly grant coins based on award definition
          console.log(`Granting ${awardDef.coins || 10} coins to user ${userSub}`);
          await updateUserCoins(userSub, awardDef.coins || 10, organizationID);
          
          // Get user email for notification
          const userResponse = await API.graphql({
            query: queries.listOrganizationMembers,
            variables: {
              filter: {
                userSub: { eq: userSub },
                organizationID: { eq: organizationID }
              }
            }
          });
          
          const members = userResponse.data.listOrganizationMembers.items;
          console.log('Found organization members for notification:', members);
          
          if (members.length > 0) {
            const userEmail = members[0].email;
            await sendAwardEarnedNotification(award, userEmail, organizationID);
            console.log('Award notification sent to:', userEmail);
          } else {
            console.log('No members found to send award notification');
          }
          
          return true;
        } catch (awardError) {
          console.error('Error creating award or sending notification:', awardError);
          return false;
        }
      } else {
        console.log('Report completion award is disabled');
        return false;
      }
    }
  } catch (error) {
    console.error('Error handling report completion award:', error);
    return false;
  }
}; 