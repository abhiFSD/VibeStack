import { API } from 'aws-amplify';
import * as mutations from '../graphql/mutations';

// Default email templates - these will be used as seed data for new organizations
export const DEFAULT_EMAIL_TEMPLATES = [
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

/**
 * Create default email templates for a new organization
 * @param {string} organizationID - The organization ID
 * @returns {Promise<boolean>} - Success status
 */
export const createDefaultEmailTemplates = async (organizationID) => {
  try {
    if (!organizationID) {
      console.error('Organization ID is required for creating default email templates');
      return false;
    }

    console.log(`Creating ${DEFAULT_EMAIL_TEMPLATES.length} default email templates for organization: ${organizationID}`);
    
    // Create each template
    const createPromises = DEFAULT_EMAIL_TEMPLATES.map(async (template) => {
      try {
        await API.graphql({
          query: mutations.createEmailTemplate,
          variables: {
            input: {
              ...template,
              organizationID
            }
          }
        });
        return true;
      } catch (error) {
        console.error(`Error creating template ${template.type}:`, error);
        return false;
      }
    });
    
    const results = await Promise.all(createPromises);
    const successCount = results.filter(result => result).length;
    
    console.log(`Successfully created ${successCount}/${DEFAULT_EMAIL_TEMPLATES.length} email templates`);
    
    return successCount > 0;
  } catch (error) {
    console.error('Error creating default email templates:', error);
    return false;
  }
};

/**
 * Get a specific email template for an organization
 * @param {string} type - The template type
 * @param {string} organizationID - The organization ID
 * @returns {Promise<Object|null>} - The template or null if not found
 */
export const getEmailTemplate = async (type, organizationID) => {
  try {
    if (!type || !organizationID) {
      console.error('Type and organization ID are required');
      return null;
    }
    
    const result = await API.graphql({
      query: `
        query GetEmailTemplate($filter: ModelEmailTemplateFilterInput) {
          listEmailTemplates(filter: $filter) {
            items {
              id
              type
              subject
              htmlTemplate
              isEnabled
              customType
            }
          }
        }
      `,
      variables: {
        filter: {
          type: { eq: type },
          organizationID: { eq: organizationID },
          isEnabled: { eq: true }
        }
      }
    });
    
    const templates = result.data.listEmailTemplates.items;
    if (templates && templates.length > 0) {
      return templates[0];
    }
    
    return null;
  } catch (error) {
    console.error('Error getting email template:', error);
    return null;
  }
}; 