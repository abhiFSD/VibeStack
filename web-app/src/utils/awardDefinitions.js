import { API, Auth } from 'aws-amplify';
import * as mutations from '../graphql/mutations';
import * as queries from '../graphql/queries';

// Default award definitions
export const DEFAULT_AWARD_DEFINITIONS = [
  {
    type: 'QUIZ_PERFECT',
    coins: 20,
    title: 'Perfect Quiz Score',
    description: 'Achieved a perfect score of 100% in a quiz',
    isEnabled: true
  },
  {
    type: 'QUIZ_MASTERY',
    coins: 10,
    title: 'Quiz Mastery',
    description: 'Achieved mastery level in a quiz (80% or better)',
    isEnabled: true
  },
  {
    type: 'REPORT_COMPLETE',
    coins: 25,
    title: 'Report Completed',
    description: 'Successfully completed a report',
    isEnabled: true
  },
  {
    type: 'PROJECT_COMPLETE',
    coins: 30,
    title: 'Project Milestone',
    description: 'Successfully completed a project',
    isEnabled: true
  },
  {
    type: 'ACTION_ITEM_COMPLETE',
    coins: 5,
    title: 'Action Item Completed',
    description: 'Successfully completed an action item',
    isEnabled: true
  },
  {
    type: 'VSM_COMPLETE',
    coins: 25,
    title: 'VSM Completed',
    description: 'Successfully completed a Value Stream Map',
    isEnabled: true
  },
  {
    type: 'HIGHLIGHT_ADDED',
    coins: 5,
    title: 'Highlight Added',
    description: 'Added a highlight to a report',
    isEnabled: true
  },
  {
    type: 'CATEGORY_COMPLETE',
    coins: 10,
    title: 'Category Completed',
    description: 'Completed all statements in a category',
    isEnabled: true
  },
  {
    type: 'STATEMENT_COMPLETE',
    coins: 3,
    title: 'Statement Completed',
    description: 'Completed a statement in a report',
    isEnabled: true
  },
  {
    type: 'FEEDBACK_PROVIDED',
    coins: 5,
    title: 'Feedback Provider',
    description: 'Provided valuable feedback',
    isEnabled: true
  },
  {
    type: 'TEAM_COLLABORATION',
    coins: 15,
    title: 'Team Collaborator',
    description: 'Collaborated effectively with team members',
    isEnabled: true
  },
  {
    type: 'FIRST_LOGIN',
    coins: 10,
    title: 'First Login',
    description: 'Logged in to the platform for the first time',
    isEnabled: true
  },
  {
    type: 'PROFILE_COMPLETE',
    coins: 15,
    title: 'Profile Completed',
    description: 'Completed your user profile information',
    isEnabled: true
  },
  {
    type: 'WEEKLY_GOALS_MET',
    coins: 20,
    title: 'Weekly Goals Achieved',
    description: 'Successfully met your weekly goals',
    isEnabled: true
  },
  {
    type: 'MONTHLY_GOALS_MET',
    coins: 30,
    title: 'Monthly Goals Achieved',
    description: 'Successfully met your monthly goals',
    isEnabled: true
  },
  // Report completion awards using CUSTOM_ACHIEVEMENT type
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: '5S_COMPLETE',
    coins: 20,
    title: '5S Report Completed',
    description: 'Successfully completed a 5S Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'A3_COMPLETE',
    coins: 20,
    title: 'A3 Project Report Completed',
    description: 'Successfully completed an A3 Project Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'DMAIC_COMPLETE',
    coins: 20,
    title: 'DMAIC Report Completed',
    description: 'Successfully completed a DMAIC Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'GEMBA_COMPLETE',
    coins: 20,
    title: 'Gemba Walk Report Completed',
    description: 'Successfully completed a Gemba Walk Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'KAIZEN_COMPLETE',
    coins: 20,
    title: 'Kaizen Project Report Completed',
    description: 'Successfully completed a Kaizen Project Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'LEADERSHIP_COMPLETE',
    coins: 20,
    title: 'Leadership Report Completed',
    description: 'Successfully completed a Leadership Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'LEAN_ASSESSMENT_COMPLETE',
    coins: 20,
    title: 'Lean Assessment Report Completed',
    description: 'Successfully completed a Lean Assessment Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'MISTAKE_PROOFING_COMPLETE',
    coins: 20,
    title: 'Mistake Proofing Report Completed',
    description: 'Successfully completed a Mistake Proofing Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'PDCA_COMPLETE',
    coins: 20,
    title: 'PDCA Report Completed',
    description: 'Successfully completed a PDCA Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'STANDARD_WORK_COMPLETE',
    coins: 20,
    title: 'Standard Work Report Completed',
    description: 'Successfully completed a Standard Work Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'WASTE_WALK_COMPLETE',
    coins: 20,
    title: 'Waste Walk Report Completed',
    description: 'Successfully completed a Waste Walk Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'FIVE_WHYS_COMPLETE',
    coins: 20,
    title: '5 Whys Report Completed',
    description: 'Successfully completed a 5 Whys Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'BRAINSTORMING_COMPLETE',
    coins: 20,
    title: 'Brainstorming Report Completed',
    description: 'Successfully completed a Brainstorming Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'FISHBONE_COMPLETE',
    coins: 20,
    title: 'Fishbone Diagram Report Completed',
    description: 'Successfully completed a Fishbone Diagram Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'HISTOGRAM_COMPLETE',
    coins: 20,
    title: 'Histogram Report Completed',
    description: 'Successfully completed a Histogram Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'IMPACT_MAP_COMPLETE',
    coins: 20,
    title: 'Impact Map Report Completed',
    description: 'Successfully completed an Impact Map Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'PARETO_COMPLETE',
    coins: 20,
    title: 'Pareto Chart Report Completed',
    description: 'Successfully completed a Pareto Chart Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'RUN_CHART_COMPLETE',
    coins: 20,
    title: 'Run Chart Report Completed',
    description: 'Successfully completed a Run Chart Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'SCATTER_PLOT_COMPLETE',
    coins: 20,
    title: 'Scatter Plot Report Completed',
    description: 'Successfully completed a Scatter Plot Report',
    isEnabled: true
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'STAKEHOLDER_COMPLETE',
    coins: 20,
    title: 'Stakeholder Analysis Report Completed',
    description: 'Successfully completed a Stakeholder Analysis Report',
    isEnabled: true
  },
  {
    type: 'KPI_GOAL_ACHIEVED',
    coins: 25,
    title: 'KPI Goal Achieved',
    description: 'Successfully achieved a KPI goal target',
    isEnabled: true
  },
  {
    type: 'LEARNING_TIME_MILESTONE',
    coins: 5,
    title: 'Active Learning Time',
    description: 'Earned coins for active learning time',
    isEnabled: true
  }
];

// Initialize award definitions in the database
export const initializeAwardDefinitions = async (organizationId) => {
  try {
    // Check if definitions already exist for this organization
    const existingDefs = await API.graphql({
      query: queries.listAwardDefinitions,
      variables: {
        filter: {
          organizationID: { eq: organizationId }
        },
        limit: 1000
      }
    });

    if (existingDefs.data.listAwardDefinitions.items.length === 0) {
      console.log('No award definitions found for organization. Creating defaults...');
      // Create default definitions
      await Promise.all(
        DEFAULT_AWARD_DEFINITIONS.map(def =>
          API.graphql({
            query: mutations.createAwardDefinition,
            variables: { 
              input: {
                ...def,
                organizationID: organizationId,
                isEnabled: true
              } 
            }
          })
        )
      );
      console.log('Default award definitions created successfully');
    }
  } catch (error) {
    console.error('Error initializing award definitions:', error);
  }
};

// Get award definition by type for specific organization
export const getAwardDefinition = async (type, organizationId, customType = null) => {
  try {
    let filter = {
      type: { eq: type },
      organizationID: { eq: organizationId },
      isEnabled: { eq: true }
    };

    // If it's a custom achievement, also filter by customType
    if (type === 'CUSTOM_ACHIEVEMENT' && customType) {
      filter.customType = { eq: customType };
    }

    const result = await API.graphql({
      query: queries.listAwardDefinitions,
      variables: { 
        filter,
        limit: 1000
      }
    });

    return result.data.listAwardDefinitions.items[0];
  } catch (error) {
    console.error('Error getting award definition:', error);
    return null;
  }
};

// Update user's total coins
export const updateUserCoins = async (userSub, coinsToAdd, organizationId) => {
  try {
    console.log(`Updating coins for user ${userSub} in org ${organizationId}: adding ${coinsToAdd} coins`);
    
    // Get current user's coins for this organization
    const result = await API.graphql({
      query: queries.listUserCoins,
      variables: {
        filter: {
          user_sub: { eq: userSub },
          organizationID: { eq: organizationId }
        }
      }
    });

    const userCoinsItems = result.data.listUserCoins.items;
    console.log('Found user coins records:', userCoinsItems);
    
    // Filter out any deleted items
    const userCoins = userCoinsItems.filter(item => !item._deleted)[0];

    if (userCoins) {
      console.log(`Updating existing user coins record: ${userCoins.id} with current total: ${userCoins.total_coins}`);
      // Update existing user coins
      const updateInput = {
        id: userCoins.id,
        total_coins: userCoins.total_coins + coinsToAdd,
        _version: userCoins._version
      };
      
      console.log('Update input:', updateInput);
      
      try {
        const updateResult = await API.graphql({
          query: mutations.updateUserCoins,
          variables: {
            input: updateInput
          }
        });
        
        console.log('UserCoins update result:', updateResult.data.updateUserCoins);
        return true;
      } catch (updateError) {
        console.error('Error updating user coins:', updateError);
        return false;
      }
    } else {
      console.log(`Creating new user coins record for user ${userSub} with initial ${coinsToAdd} coins`);
      // Create new user coins record
      const createInput = {
        user_sub: userSub,
        organizationID: organizationId,
        total_coins: coinsToAdd
      };
      
      console.log('Create input:', createInput);
      
      try {
        const createResult = await API.graphql({
          query: mutations.createUserCoins,
          variables: {
            input: createInput
          }
        });
        
        console.log('UserCoins create result:', createResult.data.createUserCoins);
        return true;
      } catch (createError) {
        console.error('Error creating user coins:', createError);
        return false;
      }
    }
  } catch (error) {
    console.error('Error updating user coins:', error);
    return false;
  }
};

// Get user's total coins
export const getUserCoins = async (userId, organizationId) => {
  try {
    const result = await API.graphql({
      query: queries.listUserCoins,
      variables: {
        filter: {
          user_sub: { eq: userId },
          organizationID: { eq: organizationId }
        }
      }
    });

    const userCoins = result.data.listUserCoins.items[0];
    return userCoins ? userCoins.total_coins : 0;
  } catch (error) {
    console.error('Error getting user coins:', error);
    return 0;
  }
};

// Force create all award definitions for a specific organization
// This is useful for fixing missing award definitions
export const forceCreateAllAwardDefinitions = async (organizationId) => {
  try {
    console.log(`Force creating all award definitions for organization ${organizationId}...`);
    
    // Get existing award definitions to avoid duplicates
    const existingDefs = await API.graphql({
      query: queries.listAwardDefinitions,
      variables: {
        filter: {
          organizationID: { eq: organizationId }
        },
        limit: 1000
      }
    });
    
    // Create a map of existing award definitions by type and customType
    const existingMap = new Map();
    existingDefs.data.listAwardDefinitions.items.forEach(def => {
      const key = def.type + (def.customType ? `-${def.customType}` : '');
      existingMap.set(key, def);
    });
    
    console.log(`Found ${existingMap.size} existing award definitions`);
    
    // Create any missing award definitions
    let createdCount = 0;
    for (const def of DEFAULT_AWARD_DEFINITIONS) {
      const key = def.type + (def.customType ? `-${def.customType}` : '');
      
      if (!existingMap.has(key)) {
        console.log(`Creating missing award definition: ${def.type}${def.customType ? ` (${def.customType})` : ''} - ${def.title}`);
        
        try {
          const result = await API.graphql({
            query: mutations.createAwardDefinition,
            variables: { 
              input: {
                ...def,
                organizationID: organizationId,
                isEnabled: true
              } 
            }
          });
          
          console.log(`Successfully created award definition: ${result.data.createAwardDefinition.id}`);
          createdCount++;
        } catch (error) {
          console.error(`Error creating award definition ${def.type}:`, error);
        }
      } else {
        console.log(`Award definition already exists: ${def.type}${def.customType ? ` (${def.customType})` : ''}`);
      }
    }
    
    console.log(`Created ${createdCount} new award definitions`);
    return { success: true, created: createdCount };
  } catch (error) {
    console.error('Error force creating award definitions:', error);
    return { success: false, error: error.message };
  }
}; 