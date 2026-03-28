import { API, Auth } from 'aws-amplify';
import * as mutations from '../graphql/mutations';
import * as queries from '../graphql/queries';
import { getEmailTemplate } from './emailTemplates';

// Function to fetch emails for given user subscriptions
export const fetchEmailsByUserSubs = async (userSubs, organizationID) => {
  if (!userSubs || userSubs.length === 0 || !organizationID) {
    return [];
  }
  try {
    // Create a filter for each user sub
    const filters = userSubs.map(sub => ({
      userSub: { eq: sub },
      organizationID: { eq: organizationID },
      _deleted: { ne: true } // Exclude deleted members
    }));

    // Fetch members matching any of the filters
    const response = await API.graphql({
      query: queries.listOrganizationMembers,
      variables: {
        filter: {
          or: filters,
          status: { eq: "ACTIVE" } // Only include active members
        }
      }
    });

    const members = response.data?.listOrganizationMembers?.items || [];
    // Return only the email addresses
    return members.map(member => member.email).filter(Boolean);
  } catch (error) {
    console.error('Error fetching emails by user subs:', error);
    return []; // Return empty array on error
  }
};

// Simple template renderer to replace Handlebars
const renderTemplate = (templateString, data) => {
  try {
    if (!templateString) return '';
    
    // Simple template system - replace {{placeholders}} with data
    let processedTemplate = templateString;
    
    // Handle conditionals {{#if var}}content{{/if}}
    processedTemplate = processedTemplate.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
      return data[key] ? content : '';
    });
    
    // Replace variables {{var}}
    processedTemplate = processedTemplate.replace(/{{(\w+)}}/g, (match, key) => {
      return data[key] !== undefined ? data[key] : match;
    });
    
    return processedTemplate;
  } catch (error) {
    console.error('Error rendering template:', error);
    return '';
  }
};

/**
 * Sends an email notification for a specific event
 * @param {Object} params - Notification parameters
 * @param {string} params.type - Email template type
 * @param {string} params.to - Recipient email (or array of emails)
 * @param {Object} params.data - Data for template placeholders
 * @param {string} params.organizationID - Organization ID
 * @returns {Promise<boolean>} - Success status
 */
export const sendEmailNotification = async ({ type, to, data, organizationID }) => {
  try {
    console.log('sendEmailNotification called with:', {
      type,
      to: Array.isArray(to) ? `${to.length} recipients: ${to.join(', ')}` : to,
      data,
      organizationID
    });
    
    if (!type || !to || !data || !organizationID) {
      console.error('Missing required parameters for email notification', { type, to, data, organizationID });
      return false;
    }

    // Special handling for REPORT_COMPLETED type
    if (type === 'REPORT_COMPLETED') {
      console.log('Processing REPORT_COMPLETED notification with detailed logging');
      
      if (Array.isArray(to) && to.length === 0) {
        console.error('Email recipients array is empty for REPORT_COMPLETED notification');
        return false;
      }
      
      if (!Array.isArray(to) && !to) {
        console.error('No valid email recipient for REPORT_COMPLETED notification');
        return false;
      }
      
      console.log('Report completion notification data:', {
        reportName: data.reportName,
        reportType: data.reportType,
        reportURL: data.reportURL
      });
    }
    
    console.log(`Sending ${type} notification to ${Array.isArray(to) ? to.join(', ') : to}`);
    
    // The backend handles template lookup and validation, so we'll skip frontend checks
    // and let the backend determine if the template exists and is enabled
    console.log(`Proceeding to send ${type} notification - backend will handle template validation`);
    
    // Send the notification
    try {
      const response = await API.post('apifetchdata', '/notification-email', {
        body: {
          to,
          template: type,
          data,
          organizationID
        }
      });
      
      console.log(`${type} notification sent successfully:`, response);
      return true;
    } catch (sendError) {
      console.error(`Error sending ${type} notification:`, sendError);
      
      // If it's a report completion notification, try a fallback method
      if (type === 'REPORT_COMPLETED') {
        try {
          console.log('Attempting fallback direct email for REPORT_COMPLETED notification');
          
          // Create a simple HTML email
          const subject = `Report "${data.reportName}" has been completed`;
          const htmlBody = `
            <html>
            <body>
              <h1>Report Completed</h1>
              <p>The report <strong>${data.reportName}</strong> has been marked as complete.</p>
              <p>Type: ${data.reportType || 'Not specified'}</p>
              <p><a href="${data.reportURL}">View Report</a></p>
            </body>
            </html>
          `;
          
          // For each recipient
          const recipients = Array.isArray(to) ? to : [to];
          let sentCount = 0;
          
          for (const recipient of recipients) {
            try {
              const result = await API.graphql({
                query: mutations.sendEmail,
                variables: {
                  input: {
                    to: recipient,
                    subject: subject,
                    html: htmlBody,
                    organizationID
                  }
                }
              });
              
              if (result.data.sendEmail.success) {
                sentCount++;
              }
            } catch (emailErr) {
              console.error(`Failed to send fallback email to ${recipient}:`, emailErr);
            }
          }
          
          console.log(`Fallback method: sent ${sentCount}/${recipients.length} emails`);
          return sentCount > 0;
        } catch (fallbackError) {
          console.error('Error sending fallback email notification:', fallbackError);
          return false;
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error in sendEmailNotification:', error);
    return false;
  }
};

/**
 * Send a direct email notification with rendered HTML
 * @param {string} recipientEmail - The recipient's email
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML body content
 * @param {string} organizationID - The organization ID
 * @returns {Promise<boolean>} - Success status
 */
export const sendDirectEmailNotification = async (recipientEmail, subject, htmlBody, organizationID) => {
  try {
    if (!recipientEmail || !subject || !htmlBody || !organizationID) {
      console.error('Missing required parameters for sending direct email notification');
      return false;
    }

    const result = await API.graphql({
      query: mutations.sendEmail,
      variables: {
        input: {
          to: recipientEmail,
          subject: subject,
          html: htmlBody,
          organizationID
        }
      }
    });

    return result.data.sendEmail;
  } catch (error) {
    console.error('Error sending direct email notification:', error);
    return false;
  }
};

/**
 * Sends notification when report is created
 */
export const sendReportCreatedNotification = async (report, organizationID) => {
  try {
    // Validate required data
    if (!report || !report.id || !report.name || !organizationID) {
      console.error('Missing report data for notification');
      return false;
    }

    // Get current user/creator email
    const user = await Auth.currentAuthenticatedUser();
    const creatorEmail = user.attributes.email;
    
    // Get organization members to notify (admins/managers + creator)
    const membersResponse = await API.graphql({
      query: `
        query GetOrganizationMembers($organizationID: ID!) {
          organizationMembersByOrganizationID(organizationID: $organizationID) {
            items {
              id
              email
              role
            }
          }
        }
      `,
      variables: { organizationID }
    });
    
    const members = membersResponse.data.organizationMembersByOrganizationID.items;
    
    // Filter to admin/manager roles
    const adminManagerEmails = members
      .filter(member => member.role === 'ADMIN' || member.role === 'MANAGER')
      .map(member => member.email);
    
    // Ensure creator is always notified, even if they're not an admin/manager
    const recipientsToNotify = [...new Set([creatorEmail, ...adminManagerEmails])];
    
    if (recipientsToNotify.length === 0) {
      console.log('No recipients to notify');
      return true;
    }
    
    // Prepare notification data
    const notificationData = {
      reportName: report.name,
      reportURL: `${window.location.origin}/report/${report.id}`,
      reportType: report.type
    };
    
    return await sendEmailNotification({
      type: 'REPORT_CREATED',
      to: recipientsToNotify,
      data: notificationData,
      organizationID
    });
  } catch (error) {
    console.error('Error sending report created notification:', error);
    return false;
  }
};

/**
 * Sends notification when members are added to a report
 */
export const sendReportMemberAddedNotification = async (report, newMemberSubs, organizationID) => {
  try {
    console.log('sendReportMemberAddedNotification called with:', {
      reportId: report?.id,
      reportName: report?.name,
      newMemberSubs,
      organizationID
    });
    
    // Validate required data
    if (!report || !report.id || !report.name || !newMemberSubs || !newMemberSubs.length || !organizationID) {
      console.error('Missing data for report member added notification');
      return false;
    }
    
    console.log('Getting emails for members:', newMemberSubs);
    
    // Use the centralized helper function to get emails
    const validEmails = await fetchEmailsByUserSubs(newMemberSubs, organizationID);
    
    console.log('Valid member emails:', validEmails);
    
    if (validEmails.length === 0) {
      console.log('No valid emails found for added members');
      return true;
    }
    
    // Prepare notification data
    const notificationData = {
      reportName: report.name,
      reportURL: `${window.location.origin}/report/${report.id}`,
      reportType: report.type
    };
    
    console.log('Sending notification to members with data:', {
      type: 'REPORT_MEMBER_ADDED',
      to: validEmails,
      notificationData
    });
    
    return await sendEmailNotification({
      type: 'REPORT_MEMBER_ADDED',
      to: validEmails,
      data: notificationData,
      organizationID
    });
  } catch (error) {
    console.error('Error sending report member added notification:', error);
    return false;
  }
};

/**
 * Sends notification when report is completed
 */
export const sendReportCompletedNotification = async (report, organizationID) => {
  try {
    console.log('sendReportCompletedNotification called with:', {
      reportId: report?.id,
      reportName: report?.name,
      organizationID
    });
    
    // Validate required data
    if (!report || !report.id || !report.name || !organizationID) {
      console.error('Missing report data for notification');
      return false;
    }
    
    // Get all recipients: assigned members and report creator
    const assignedMembers = report.assignedMembers || [];
    const recipientSubs = [...new Set([report.user_sub, ...assignedMembers])];
    
    console.log('Recipients to notify:', recipientSubs.length, 'unique members');
    
    if (recipientSubs.length === 0) {
      console.log('No recipients to notify');
      return true;
    }
    
    // Get emails for all recipients
    const recipientEmails = await Promise.all(
      recipientSubs.map(async (userSub) => {
        if (!userSub) return null;
        
        try {
          const userResponse = await API.graphql({
            query: `
              query GetUserEmail($filter: ModelOrganizationMemberFilterInput) {
                listOrganizationMembers(filter: $filter) {
                  items {
                    email
                  }
                }
              }
            `,
            variables: { 
              filter: { 
                organizationID: { eq: organizationID },
                user_sub: { eq: userSub }
              } 
            }
          });
          
          const items = userResponse.data.listOrganizationMembers.items;
          return items.length > 0 ? items[0].email : null;
        } catch (err) {
          console.error(`Error getting email for user ${userSub}:`, err);
          return null;
        }
      })
    );
    
    // Filter out null emails
    const validEmails = recipientEmails.filter(email => email !== null);
    console.log('Valid recipient emails:', validEmails);
    
    if (validEmails.length === 0) {
      console.log('No valid emails found for recipients');
      return true;
    }
    
    // Check if we have the email template for REPORT_COMPLETED
    try {
      const templateExists = await API.graphql({
        query: `
          query GetEmailTemplate($filter: ModelEmailTemplateFilterInput) {
            listEmailTemplates(filter: $filter) {
              items {
                id
                type
                isEnabled
                subject
              }
            }
          }
        `,
        variables: { 
          filter: { 
            organizationID: { eq: organizationID },
            type: { eq: 'REPORT_COMPLETED' }
          } 
        }
      });
      
      const templates = templateExists.data.listEmailTemplates.items;
      console.log(`Found ${templates.length} REPORT_COMPLETED templates:`, templates);
      
      if (templates.length === 0) {
        console.warn('No REPORT_COMPLETED template found. Creating a default notification.');
      }
    } catch (err) {
      console.error('Error checking REPORT_COMPLETED template existence:', err);
    }
    
    // Prepare notification data
    const notificationData = {
      reportName: report.name,
      reportURL: `${window.location.origin}/report/${report.id}`,
      reportType: report.type
    };
    
    console.log('Sending notification with data:', notificationData);
    
    return await sendEmailNotification({
      type: 'REPORT_COMPLETED',
      to: validEmails,
      data: notificationData,
      organizationID
    });
  } catch (error) {
    console.error('Error sending report completed notification:', error);
    return false;
  }
};

/**
 * Sends notification when award is earned
 */
export const sendAwardEarnedNotification = async (award, userEmail, organizationID) => {
  try {
    // Validate required data
    if (!award || !award.title || !userEmail || !organizationID) {
      console.error('Missing data for award earned notification');
      return false;
    }

    // Prepare notification data
    const notificationData = {
      awardTitle: award.title,
      awardDescription: award.description || '',
      awardCoins: award.coins || 0,
      awardsURL: `${window.location.origin}/awards`
    };
    
    return await sendEmailNotification({
      type: 'AWARD_EARNED',
      to: userEmail,
      data: notificationData,
      organizationID
    });
  } catch (error) {
    console.error('Error sending award earned notification:', error);
    return false;
  }
};

/**
 * Sends notification when an action item is created
 */
export const sendActionItemCreatedNotification = async (actionItem, organizationID) => {
  try {
    // Validate required data
    if (!actionItem || !actionItem.id || !actionItem.title || !organizationID) {
      console.error('Missing action item data for notification');
      return false;
    }

    // First, get assignees
    const assignees = actionItem.assignees || [];
    
    // Get creator/assignor - this should always be present
    const creatorSub = actionItem.assignor;
    if (!creatorSub) {
      console.error('No creator/assignor found for action item');
      return false;
    }

    // Get creator's email
    const creatorEmail = await fetchEmailsByUserSubs([creatorSub], organizationID);
    if (!creatorEmail || creatorEmail.length === 0) {
      console.error('Could not find email for creator:', creatorSub);
      return false;
    }

    // Prepare notification data
    const notificationData = {
      actionItemTitle: actionItem.title,
      actionItemDescription: actionItem.description || '',
      actionItemDueDate: actionItem.duedate ? new Date(actionItem.duedate).toLocaleDateString() : 'Not specified',
      actionItemURL: `${window.location.origin}${actionItem.reportID ? '/report/' + actionItem.reportID : (actionItem.projectID ? '/project/' + actionItem.projectID : '/action-items')}`,
      actionItemsURL: `${window.location.origin}/action-items`
    };

    // Always send creation notification to creator
    await sendEmailNotification({
      type: 'ACTION_ITEM_CREATED',
      to: creatorEmail[0],
      data: notificationData,
      organizationID
    });

    // If there are assignees, send them the assigned notification
    if (assignees.length > 0) {
      const assigneeEmails = await fetchEmailsByUserSubs(assignees, organizationID);
      if (assigneeEmails.length > 0) {
        await sendEmailNotification({
          type: 'ACTION_ITEM_ASSIGNED',
          to: assigneeEmails,
          data: notificationData,
          organizationID
        });
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending action item created notification:', error);
    return false;
  }
};

/**
 * Send ACTION_ITEM_STATUS_CHANGED notification
 * @param {Object} actionItem - The updated action item
 * @param {number} newStatus - The new status code
 * @param {string} organizationID - The organization ID
 */
export const sendActionItemStatusChangedNotification = async (actionItem, newStatus, organizationID) => {
  if (!actionItem || !organizationID) return;
  console.log(`Preparing ACTION_ITEM_STATUS_CHANGED notification for Action Item ID: ${actionItem.id}, New Status: ${newStatus}`);

  const creatorSub = actionItem.assignor;
  const assigneeSubs = actionItem.assignees || [];
  const recipientsSubs = [...new Set([creatorSub, ...assigneeSubs])].filter(Boolean);

  if (recipientsSubs.length === 0) {
    console.log('No recipients found for status change notification.');
    return;
  }

  try {
    const recipientEmails = await fetchEmailsByUserSubs(recipientsSubs, organizationID);

    if (recipientEmails.length > 0) {
      const statusMap = { 0: 'To Do', 1: 'In Progress', 2: 'In Review', 3: 'Done' };
      const specificActionItemURL = `${window.location.origin}${actionItem.reportID ? '/report/' + actionItem.reportID : (actionItem.projectID ? '/project/' + actionItem.projectID : '/action-items')}`;
      const generalActionItemsURL = `${window.location.origin}/action-items`;
      const notificationData = {
        actionItemTitle: actionItem.title,
        actionItemDescription: actionItem.description || 'No description',
        actionItemDueDate: actionItem.duedate ? new Date(actionItem.duedate).toLocaleDateString() : 'N/A',
        actionItemURL: specificActionItemURL,
        actionItemsURL: generalActionItemsURL,
        status: statusMap[newStatus] || `Status ${newStatus}`
      };

      console.log(`Sending ACTION_ITEM_STATUS_CHANGED to: ${recipientEmails.join(', ')}`);
      await sendEmailNotification({
        type: 'ACTION_ITEM_STATUS_CHANGED',
        to: recipientEmails,
        data: notificationData,
        organizationID
      });
      console.log('Action item status changed notification sent successfully.');
    } else {
      console.warn(`Could not find emails for status change recipients: ${recipientsSubs.join(', ')}`);
    }
  } catch (error) {
    console.error('Error sending action item status changed notification:', error);
  }
};

/**
 * Send ACTION_ITEM_COMPLETED notification
 * @param {Object} actionItem - The completed action item
 * @param {string} organizationID - The organization ID
 */
export const sendActionItemCompletedNotification = async (actionItem, organizationID) => {
  if (!actionItem || !organizationID) return;
  console.log(`Preparing ACTION_ITEM_COMPLETED notification for Action Item ID: ${actionItem.id}`);

  const creatorSub = actionItem.assignor;
  const assigneeSubs = actionItem.assignees || [];
  const recipientsSubs = [...new Set([creatorSub, ...assigneeSubs])].filter(Boolean);

  if (recipientsSubs.length === 0) {
    console.log('No recipients found for completed notification.');
    return;
  }

  try {
    const recipientEmails = await fetchEmailsByUserSubs(recipientsSubs, organizationID);

    if (recipientEmails.length > 0) {
      const specificActionItemURL = `${window.location.origin}${actionItem.reportID ? '/report/' + actionItem.reportID : (actionItem.projectID ? '/project/' + actionItem.projectID : '/action-items')}`;
      const generalActionItemsURL = `${window.location.origin}/action-items`;
      const notificationData = {
        actionItemTitle: actionItem.title,
        actionItemDescription: actionItem.description || 'No description',
        actionItemDueDate: actionItem.duedate ? new Date(actionItem.duedate).toLocaleDateString() : 'N/A',
        actionItemURL: specificActionItemURL,
        actionItemsURL: generalActionItemsURL
      };

      console.log(`Sending ACTION_ITEM_COMPLETED to: ${recipientEmails.join(', ')}`);
      await sendEmailNotification({
        type: 'ACTION_ITEM_COMPLETED',
        to: recipientEmails,
        data: notificationData,
        organizationID
      });
      console.log('Action item completed notification sent successfully.');
    } else {
      console.warn(`Could not find emails for completed notification recipients: ${recipientsSubs.join(', ')}`);
    }
  } catch (error) {
    console.error('Error sending action item completed notification:', error);
  }
};

/**
 * Send notification when a user is invited to an organization
 * @param {string} organizationName - The organization name
 * @param {string} inviteURL - The invite URL
 * @param {string} recipientEmail - Recipient email
 * @param {string} organizationID - The organization ID
 * @returns {Promise<boolean>} - Success status
 */
/**
 * Get recipient emails for a report
 * @param {string} reportID - The report ID
 * @returns {Promise<Array<string>>} - Array of email addresses
 */
export const getReportRecipientEmails = async (reportID) => {
  try {
    if (!reportID) {
      return [];
    }
    
    // Get the report details
    const result = await API.graphql({
      query: queries.getReport,
      variables: { id: reportID }
    });
    
    if (!result.data.getReport) {
      return [];
    }
    
    const report = result.data.getReport;
    const emails = [];
    
    // Add creator email
    if (report.creatorEmail) {
      emails.push(report.creatorEmail);
    }
    
    // Add assignee emails if they exist
    if (report.assignedTo && report.assignedTo.length > 0) {
      // Assuming assignedTo is an array of email addresses
      emails.push(...report.assignedTo);
    }
    
    return [...new Set(emails)]; // Remove duplicates
  } catch (error) {
    console.error('Error getting report recipient emails:', error);
    return [];
  }
};

/**
 * Sends notification when project is created
 */
export const sendProjectCreatedNotification = async (project, organizationID) => {
  try {
    // Validate required data
    if (!project || !project.id || !project.name || !organizationID) {
      console.error('Missing project data for notification');
      return false;
    }

    const user = await Auth.currentAuthenticatedUser();
    const creatorSub = user.attributes.sub; // Use sub for consistency

    // Fetch organization members to find admins
    const membersResponse = await API.graphql({
      query: queries.listOrganizationMembers,
      variables: {
        filter: {
          organizationID: { eq: organizationID },
          role: { eq: 'ADMIN' }, // Filter for ADMIN role
          status: { eq: 'ACTIVE' },
          _deleted: { ne: true }
        }
      }
    });
    
    const adminSubs = membersResponse.data.listOrganizationMembers.items.map(m => m.userSub);
    
    // Combine creator and admin subs, ensuring uniqueness
    const recipientSubs = [...new Set([creatorSub, ...adminSubs])].filter(Boolean);
    
    if (recipientSubs.length === 0) {
      console.log('No recipients (creator or admins) found for project creation notification.');
      return true;
    }

    // Fetch emails for all recipients
    const recipientEmails = await fetchEmailsByUserSubs(recipientSubs, organizationID);

    if (recipientEmails.length === 0) {
      console.log('No valid emails found for project creation recipients.');
      return true;
    }
    
    // Prepare notification data
    const notificationData = {
      projectName: project.name,
      projectURL: `${window.location.origin}/project/${project.id}`,
      projectDescription: project.description || ''
    };
    
    return await sendEmailNotification({
      type: 'PROJECT_CREATED',
      to: recipientEmails, // Send to combined list
      data: notificationData,
      organizationID
    });
  } catch (error) {
    console.error('Error sending project created notification:', error);
    return false;
  }
};

/**
 * Sends notification when members are added to a project
 */
export const sendProjectMemberAddedNotification = async (project, newMemberSubs, organizationID) => {
  try {
    // Validate required data
    if (!project || !project.id || !project.name || !newMemberSubs || !newMemberSubs.length || !organizationID) {
      console.error('Missing data for project member added notification');
      return false;
    }
    // Add detailed log here
    console.log('[sendProjectMemberAddedNotification] Received data:', { 
      projectId: project?.id, 
      projectName: project?.name, 
      newMemberSubs, 
      organizationID 
    });
    
    // Use the centralized helper function to get emails
    console.log('[sendProjectMemberAddedNotification] Fetching emails for subs:', newMemberSubs);
    const validEmails = await fetchEmailsByUserSubs(newMemberSubs, organizationID);
    console.log('[sendProjectMemberAddedNotification] Fetched emails:', validEmails);
    
    if (validEmails.length === 0) {
      console.log('[sendProjectMemberAddedNotification] No valid emails found for added members. Skipping send.');
      return true;
    }
    
    // Prepare notification data
    const notificationData = {
      projectName: project.name,
      projectURL: `${window.location.origin}/project/${project.id}`,
      projectDescription: project.description || ''
    };
    console.log('[sendProjectMemberAddedNotification] Prepared notification data:', notificationData);
    
    // Add log before calling the core sender
    console.log(`[sendProjectMemberAddedNotification] Calling sendEmailNotification for type PROJECT_MEMBER_ADDED to: ${validEmails.join(', ')}`);
    return await sendEmailNotification({
      type: 'PROJECT_MEMBER_ADDED',
      to: validEmails,
      data: notificationData,
      organizationID
    });
  } catch (error) {
    console.error('Error sending project member added notification:', error);
    return false;
  }
};

/**
 * Sends notification when project is completed
 */
export const sendProjectCompletedNotification = async (project, organizationID) => {
  // Add log at the very beginning
  console.log('[sendProjectCompletedNotification] Received project data:', JSON.stringify(project));
  try {
    // Validate required data
    if (!project || !project.id || !project.name || !organizationID) {
      console.error('Missing project data for notification');
      return false;
    }
    
    // Get all recipients: project members and creator
    // Correctly access the members array via .items and map to userSub
    const memberItems = project.members?.items || [];
    const memberSubs = memberItems.map(item => item.userSub).filter(Boolean); 
    const creatorSub = project.user_sub;
    
    // Combine creator and member subs, ensuring uniqueness
    const recipientSubs = [...new Set([creatorSub, ...memberSubs])].filter(Boolean);
    
    if (recipientSubs.length === 0) {
      console.log('No recipients to notify');
      return true;
    }
    
    // Get emails for all recipients using the centralized helper
    console.log(`[sendProjectCompletedNotification] Fetching emails for recipient subs: ${recipientSubs.join(', ')}`);
    const validEmails = await fetchEmailsByUserSubs(recipientSubs, organizationID);
    console.log(`[sendProjectCompletedNotification] Fetched emails: ${validEmails.join(', ')}`);

    if (validEmails.length === 0) {
      console.log('[sendProjectCompletedNotification] No valid emails found for recipients. Skipping send.');
      return true;
    }
    
    // Prepare notification data
    const notificationData = {
      projectName: project.name,
      projectURL: `${window.location.origin}/project/${project.id}`,
      projectDescription: project.description || ''
    };
    
    return await sendEmailNotification({
      type: 'PROJECT_COMPLETED',
      to: validEmails,
      data: notificationData,
      organizationID
    });
  } catch (error) {
    console.error('Error sending project completed notification:', error);
    return false;
  }
}; 