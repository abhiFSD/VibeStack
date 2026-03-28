/* Amplify Params - DO NOT EDIT
	ENV
	REGION
	GRAPHQL_ENDPOINT
	API_KEY
Amplify Params - DO NOT EDIT */

/**
 * @fileoverview Award and Email Template Setup Lambda Function
 * Automatically creates all award definitions and email templates for new organizations
 */

const https = require('https');

// Environment variables
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT;
const API_KEY = process.env.API_KEY;

// Default award definitions (36 total) - EXACT copy from src/utils/awardDefinitions.js
const DEFAULT_AWARD_DEFINITIONS = [
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

// Default email templates (14 total) - EXACT copy from src/utils/emailTemplates.js
const DEFAULT_EMAIL_TEMPLATES = [
  {
    type: 'REPORT_CREATED',
    subject: 'New Report Created: {{reportName}}',
    htmlTemplate: `
      <h2>New Report Created</h2>
      <p>A new report "{{reportName}}" has been created.</p>
      <a href="{{reportURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Report
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{reportURL}}</p>
    `,
    isEnabled: true
  },
  {
    type: 'REPORT_COMPLETED',
    subject: 'Report Completed: {{reportName}}',
    htmlTemplate: `
      <h2>Report Completed</h2>
      <p>The report "{{reportName}}" has been marked as completed.</p>
      <a href="{{reportURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Report
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{reportURL}}</p>
    `,
    isEnabled: true
  },
  {
    type: 'REPORT_MEMBER_ADDED',
    subject: 'You have been added to report: {{reportName}}',
    htmlTemplate: `
      <h2>Report Assignment</h2>
      <p>You have been added to the report "{{reportName}}".</p>
      <a href="{{reportURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Report
      </a>
      <p>If you can't click the button, copy and paste this URL into your browser:</p>
      <p>{{reportURL}}</p>
    `,
    isEnabled: true
  },
  {
    type: 'REPORT_MEMBER_REMOVED',
    subject: 'You have been removed from report: {{reportName}}',
    htmlTemplate: `
      <h2>Report Access Update</h2>
      <p>You have been removed from the report "{{reportName}}".</p>
      <p>If you believe this is a mistake, please contact your administrator.</p>
    `,
    isEnabled: true
  },
  {
    type: 'ACTION_ITEM_CREATED',
    subject: 'New Action Item Created: {{actionItemTitle}}',
    htmlTemplate: `
      <h2>New Action Item Created</h2>
      <p>A new action item "{{actionItemTitle}}" has been created.</p>
      <p><strong>Description:</strong> {{actionItemDescription}}</p>
      <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
      <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Action Item
      </a>
    `,
    isEnabled: true
  },
  {
    type: 'ACTION_ITEM_ASSIGNED',
    subject: 'Action Item Assigned: {{actionItemTitle}}',
    htmlTemplate: `
      <h2>Action Item Assigned</h2>
      <p>You have been assigned to the action item "{{actionItemTitle}}".</p>
      <p><strong>Description:</strong> {{actionItemDescription}}</p>
      <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
      <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Action Item
      </a>
    `,
    isEnabled: true
  },
  {
    type: 'ACTION_ITEM_COMPLETED',
    subject: 'Action Item Completed: {{actionItemTitle}}',
    htmlTemplate: `
      <h2>Action Item Completed</h2>
      <p>The action item "{{actionItemTitle}}" has been marked as completed.</p>
      <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Action Item
      </a>
    `,
    isEnabled: true
  },
  {
    type: 'ACTION_ITEM_STATUS_CHANGED',
    subject: 'Action Item Status Updated: {{actionItemTitle}}',
    htmlTemplate: `
      <h2>Action Item Status Updated</h2>
      <p>The status of the action item "{{actionItemTitle}}" has been updated.</p>
      <p><strong>Previous Status:</strong> {{oldStatus}}</p>
      <p><strong>New Status:</strong> {{newStatus}}</p>
      <p><strong>Description:</strong> {{actionItemDescription}}</p>
      <p><strong>Due Date:</strong> {{actionItemDueDate}}</p>
      <a href="{{actionItemURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Action Item
      </a>
    `,
    isEnabled: true
  },
  {
    type: 'PROJECT_CREATED',
    subject: 'New Project Created: {{projectName}}',
    htmlTemplate: `
      <h2>New Project Created</h2>
      <p>A new project "{{projectName}}" has been created.</p>
      <a href="{{projectURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Project
      </a>
    `,
    isEnabled: true
  },
  {
    type: 'PROJECT_COMPLETED',
    subject: 'Project Completed: {{projectName}}',
    htmlTemplate: `
      <h2>Project Completed</h2>
      <p>The project "{{projectName}}" has been marked as completed.</p>
      <a href="{{projectURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Project
      </a>
    `,
    isEnabled: true
  },
  {
    type: 'PROJECT_MEMBER_ADDED',
    subject: 'You\'ve been added to project: {{projectName}}',
    htmlTemplate: `
      <h2>Project Access Granted</h2>
      <p>You have been added as a member to the project "{{projectName}}".</p>
      <p>You can now access and collaborate on this project.</p>
      <a href="{{projectURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Project
      </a>
    `,
    isEnabled: true
  },
  {
    type: 'PROJECT_MEMBER_REMOVED',
    subject: 'Removed from project: {{projectName}}',
    htmlTemplate: `
      <h2>Project Access Removed</h2>
      <p>You have been removed from the project "{{projectName}}".</p>
      <p>You no longer have access to this project and its resources.</p>
    `,
    isEnabled: true
  },
  {
    type: 'AWARD_EARNED',
    subject: 'You Earned an Award: {{awardTitle}}',
    htmlTemplate: `
      <h2>Congratulations!</h2>
      <p>You have earned the "{{awardTitle}}" award.</p>
      <p>{{awardDescription}}</p>
      <p>This award earned you <strong>{{awardCoins}} coins</strong>.</p>
      <a href="{{awardsURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          View Your Awards
      </a>
    `,
    isEnabled: true
  },
  {
    type: 'CUSTOM_NOTIFICATION',
    subject: '{{subject}}',
    htmlTemplate: `
      <h2>{{title}}</h2>
      <p>{{message}}</p>
      {{#if actionURL}}
      <a href="{{actionURL}}" style="padding: 10px 20px; background-color: #00897b; color: white; text-decoration: none; border-radius: 5px;">
          {{actionText}}
      </a>
      {{/if}}
    `,
    isEnabled: true
  }
];

// GraphQL mutations
const CREATE_AWARD_DEFINITION = `
  mutation CreateAwardDefinition($input: CreateAwardDefinitionInput!) {
    createAwardDefinition(input: $input) {
      id
      type
      title
      description
      coins
      isEnabled
      organizationID
    }
  }
`;

const CREATE_EMAIL_TEMPLATE = `
  mutation CreateEmailTemplate($input: CreateEmailTemplateInput!) {
    createEmailTemplate(input: $input) {
      id
      type
      subject
      htmlTemplate
      isEnabled
      organizationID
    }
  }
`;

// Helper function to make GraphQL requests
const makeGraphQLRequest = async (query, variables) => {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify({
      query: query,
      variables: variables
    });

    const url = new URL(GRAPHQL_ENDPOINT);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => data += chunk);
      response.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData.errors) {
            console.error('GraphQL errors:', parsedData.errors);
            reject(new Error(parsedData.errors[0].message));
          } else {
            resolve(parsedData);
          }
        } catch (error) {
          console.error('Parse error:', error);
          reject(error);
        }
      });
    });

    request.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });
    
    request.write(requestBody);
    request.end();
  });
};

// Create all award definitions for an organization
const createAwardDefinitions = async (organizationId) => {
  console.log(`Creating ${DEFAULT_AWARD_DEFINITIONS.length} award definitions for organization ${organizationId}`);
  
  const results = [];
  const errors = [];

  for (const award of DEFAULT_AWARD_DEFINITIONS) {
    try {
      const input = {
        ...award,
        organizationID: organizationId
      };

      const result = await makeGraphQLRequest(CREATE_AWARD_DEFINITION, { input });
      results.push(result.data.createAwardDefinition);
      console.log(`✓ Created award definition: ${award.title}`);
    } catch (error) {
      console.error(`✗ Failed to create award definition ${award.title}:`, error.message);
      errors.push({
        award: award.title,
        error: error.message
      });
    }
  }

  return {
    success: errors.length === 0,
    created: results.length,
    total: DEFAULT_AWARD_DEFINITIONS.length,
    errors: errors
  };
};

// Create all email templates for an organization
const createEmailTemplates = async (organizationId) => {
  console.log(`Creating ${DEFAULT_EMAIL_TEMPLATES.length} email templates for organization ${organizationId}`);
  
  const results = [];
  const errors = [];

  for (const template of DEFAULT_EMAIL_TEMPLATES) {
    try {
      const input = {
        ...template,
        organizationID: organizationId
      };

      const result = await makeGraphQLRequest(CREATE_EMAIL_TEMPLATE, { input });
      results.push(result.data.createEmailTemplate);
      console.log(`✓ Created email template: ${template.type}`);
    } catch (error) {
      console.error(`✗ Failed to create email template ${template.type}:`, error.message);
      errors.push({
        template: template.type,
        error: error.message
      });
    }
  }

  return {
    success: errors.length === 0,
    created: results.length,
    total: DEFAULT_EMAIL_TEMPLATES.length,
    errors: errors
  };
};

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  
  // CORS headers for all responses
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
  };
  
  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'CORS preflight successful' })
    };
  }
  
  try {
    // Parse body if it's a string
    let organizationId;
    if (event.body) {
      const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      organizationId = body.organizationId;
    } else {
      organizationId = event.organizationId || event.arguments?.organizationId;
    }
    
    if (!organizationId) {
      console.error('No organization ID provided');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Organization ID is required'
        })
      };
    }

    console.log(`Setting up templates for organization: ${organizationId}`);

    // Create award definitions and email templates in parallel
    const [awardResults, emailResults] = await Promise.all([
      createAwardDefinitions(organizationId),
      createEmailTemplates(organizationId)
    ]);

    const response = {
      success: awardResults.success && emailResults.success,
      organizationId: organizationId,
      awards: awardResults,
      emailTemplates: emailResults,
      summary: {
        totalAwardsCreated: awardResults.created,
        totalEmailTemplatesCreated: emailResults.created,
        totalErrors: awardResults.errors.length + emailResults.errors.length
      }
    };

    console.log('Setup completed:', JSON.stringify(response, null, 2));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Critical error in handler:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      })
    };
  }
};
