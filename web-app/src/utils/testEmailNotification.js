import { API, Auth } from 'aws-amplify';
import { sendEmailNotification, sendReportCreatedNotification, sendReportMemberAddedNotification } from './emailNotifications';

/**
 * Test function to send a direct email notification for debugging
 * @param {string} organizationID - The organization ID to use for template lookup
 * @returns {Promise<boolean>} - Success status
 */
export const testEmailSending = async (organizationID, recipientEmail) => {
  try {
    console.log('Testing email sending function...');
    
    if (!organizationID) {
      console.error('No organization ID provided for test');
      return false;
    }

    if (!recipientEmail) {
      // Get current user email if not specified
      const user = await Auth.currentAuthenticatedUser();
      recipientEmail = user.attributes.email;
      console.log(`Using current user email: ${recipientEmail}`);
    }
    
    // Try direct API call to /notification-email endpoint
    const response = await API.post('apifetchdata', '/notification-email', {
      body: {
        to: recipientEmail,
        template: 'REPORT_CREATED', // Use the REPORT_CREATED template
        data: {
          reportName: 'Test Report',
          reportURL: window.location.origin + '/reports',
          reportType: 'Test Type'
        },
        organizationID: organizationID
      }
    });
    
    console.log('API response:', response);
    return true;
  } catch (error) {
    console.error('Error in test email sending:', error);
    // Log more detailed error information for debugging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    return false;
  }
};

/**
 * Test function that will verify the entire flow for both notification types
 */
export const testFullReportNotificationFlow = async (organizationID) => {
  try {
    console.log('Testing full report notification flow...');
    
    if (!organizationID) {
      console.error('No organization ID provided for test');
      return false;
    }
    
    // Get current user
    const user = await Auth.currentAuthenticatedUser();
    const userEmail = user.attributes.email;
    const userSub = user.attributes.sub;
    
    // Create a mock report
    const mockReport = {
      id: 'test-report-id-' + Date.now(),
      name: 'Test Report ' + new Date().toISOString(),
      type: 'Test Report Type',
      user_sub: userSub
    };
    
    console.log('Mock report:', mockReport);
    
    // Test report created notification
    console.log('Testing report created notification...');
    const createdResult = await sendReportCreatedNotification(mockReport, organizationID);
    console.log('Report created notification result:', createdResult);
    
    // Test report member added notification
    console.log('Testing report member added notification...');
    const memberAddedResult = await sendReportMemberAddedNotification(mockReport, [userSub], organizationID);
    console.log('Report member added notification result:', memberAddedResult);
    
    return true;
  } catch (error) {
    console.error('Error in test notification flow:', error);
    return false;
  }
}; 