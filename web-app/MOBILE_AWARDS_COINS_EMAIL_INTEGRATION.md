# VibeStack™ Pro Mobile App - Awards, Coins & Email Integration Guide

## Overview

This comprehensive guide provides React Native developers with everything needed to implement the exact same awards, coins, and email notification system used in the VibeStack™ Pro web application. The mobile app should connect to the same AWS Amplify backend and replicate all award triggers, coin allocations, and email notifications.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [GraphQL Schema Models](#graphql-schema-models)
3. [Award System](#award-system)
4. [Coin Management](#coin-management)
5. [Email Notification System](#email-notification-system)
6. [Implementation Examples](#implementation-examples)
7. [Backend Lambda Functions](#backend-lambda-functions)
8. [Award Triggers & Events](#award-triggers--events)
9. [Mobile-Specific Considerations](#mobile-specific-considerations)
10. [Testing Guidelines](#testing-guidelines)

## System Architecture

### Backend Infrastructure
- **Database**: AWS AppSync GraphQL + MySQL (via Lambda)
- **Authentication**: AWS Cognito with multi-organization support
- **Email Service**: AWS SES via Lambda functions
- **File Storage**: AWS S3 for attachments
- **Functions**: 12+ Lambda functions for business logic

### Key Principles
- **Multi-tenant**: Organization-based data isolation
- **Real-time**: GraphQL subscriptions for live updates
- **Gamification**: Comprehensive coin-based reward system
- **Email Templates**: Customizable per organization
- **Security**: Role-based access control (Admin, User, Super Admin)

## GraphQL Schema Models

### Awards Model
```graphql
type Awards @model @auth(rules: [{allow: public}]) {
  id: ID!
  title: String
  date: String
  description: String
  user_sub: String
  tool_id: String
  type: AwardType
  coins: Int
  organizationID: ID! @index(name: "byOrganization")
  customType: String
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### Award Types Enum
```graphql
enum AwardType {
  QUIZ_PERFECT
  QUIZ_MASTERY
  REPORT_COMPLETE
  PROJECT_COMPLETE
  ACTION_ITEM_COMPLETE
  HIGHLIGHT_ADDED
  VSM_COMPLETE
  CATEGORY_COMPLETE
  STATEMENT_COMPLETE
  FEEDBACK_PROVIDED
  TEAM_COLLABORATION
  FIRST_LOGIN
  PROFILE_COMPLETE
  WEEKLY_GOALS_MET
  MONTHLY_GOALS_MET
  CUSTOM_ACHIEVEMENT
  KPI_GOAL_ACHIEVED
}
```

### User Coins Model
```graphql
type UserCoins @model @auth(rules: [{allow: public}]) {
  id: ID!
  user_sub: String!
  total_coins: Int!
  organizationID: ID! @index(name: "byOrganization")
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### Award Definitions Model
```graphql
type AwardDefinition @model @auth(rules: [{allow: public}]) {
  id: ID!
  type: AwardType!
  coins: Int!
  title: String!
  description: String!
  organizationID: ID! @index(name: "byOrganization")
  organization: Organization @belongsTo(fields: ["organizationID"])
  isEnabled: Boolean!
  customType: String
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### Email Template Model
```graphql
type EmailTemplate @model @auth(rules: [{allow: public}]) {
  id: ID!
  type: EmailTemplateType!
  subject: String!
  htmlTemplate: String!
  organizationID: ID! @index(name: "byOrganization")
  organization: Organization @belongsTo(fields: ["organizationID"])
  isEnabled: Boolean!
  customType: String
  _version: Int
  _deleted: Boolean
  _lastChangedAt: AWSTimestamp
}
```

### Email Template Types
```graphql
enum EmailTemplateType {
  REPORT_CREATED
  REPORT_COMPLETED
  REPORT_MEMBER_ADDED
  REPORT_MEMBER_REMOVED
  ACTION_ITEM_CREATED
  ACTION_ITEM_ASSIGNED
  ACTION_ITEM_COMPLETED
  ACTION_ITEM_STATUS_CHANGED
  PROJECT_CREATED
  PROJECT_COMPLETED
  PROJECT_MEMBER_ADDED
  PROJECT_MEMBER_REMOVED
  AWARD_EARNED
  CUSTOM_NOTIFICATION
}
```

## Award System

### Default Award Definitions

All organizations start with these default award definitions:

```javascript
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
    description: 'Achieved mastery level in a quiz',
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
    type: 'KPI_GOAL_ACHIEVED',
    coins: 25,
    title: 'KPI Goal Achieved',
    description: 'Successfully achieved a KPI goal target',
    isEnabled: true
  }
];

// Report-specific awards using CUSTOM_ACHIEVEMENT type
const REPORT_AWARDS = [
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: '5S_COMPLETE',
    coins: 20,
    title: '5S Report Completed',
    description: 'Successfully completed a 5S Report'
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'A3_COMPLETE',
    coins: 20,
    title: 'A3 Project Report Completed',
    description: 'Successfully completed an A3 Project Report'
  },
  {
    type: 'CUSTOM_ACHIEVEMENT',
    customType: 'DMAIC_COMPLETE',
    coins: 20,
    title: 'DMAIC Report Completed',
    description: 'Successfully completed a DMAIC Report'
  },
  // ... (continues for all 21 report types)
];
```

### Award Triggers & Implementation

#### 1. Report Completion Awards

**Trigger**: When user marks a report as "completed"

```javascript
// Example implementation in React Native
const handleReportCompletion = async (reportId, reportType) => {
  try {
    // Update report status
    await updateReport({
      id: reportId,
      completed: true
    });
    
    // Trigger award
    await handleReportCompleteAward(organizationId, reportType, userSub);
    
    // Send email notification
    await sendReportCompletedNotification(report, organizationId);
  } catch (error) {
    console.error('Error completing report:', error);
  }
};

// Award mapping function
const getAwardTypeForReport = (reportType) => {
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
  
  return reportToAwardMap[reportType];
};
```

#### 2. Action Item Completion Awards

**Trigger**: When action item status changes to "Done" (status: 3)

```javascript
const handleActionItemCompletion = async (actionItem, organizationId) => {
  try {
    // Update action item status
    await updateActionItem({
      id: actionItem.id,
      status: 3 // Done
    });
    
    // Award ALL participants (assignees + creator)
    const recipients = new Set([
      ...actionItem.assignees,
      actionItem.assignor,
      actionItem.user_sub
    ].filter(Boolean));
    
    for (const recipientSub of recipients) {
      await createAward({
        type: 'ACTION_ITEM_COMPLETE',
        user_sub: recipientSub,
        tool_id: actionItem.id,
        organizationID: organizationId
      });
      
      await updateUserCoins(recipientSub, 5, organizationId);
    }
    
    // Send completion notification
    await sendActionItemCompletedNotification(actionItem, organizationId);
  } catch (error) {
    console.error('Error completing action item:', error);
  }
};
```

#### 3. Quiz Completion Awards

**Trigger**: When user completes a quiz

```javascript
const handleQuizCompletion = async (quizResult, organizationId) => {
  const percentage = parseInt(quizResult.percentage);
  let awardType = null;
  
  if (percentage === 100) {
    awardType = 'QUIZ_PERFECT'; // 20 coins
  } else if (percentage >= 80) {
    awardType = 'QUIZ_MASTERY'; // 10 coins
  }
  
  if (awardType) {
    await createAward({
      type: awardType,
      user_sub: quizResult.user_sub,
      tool_id: quizResult.tool_id,
      organizationID: organizationId
    });
  }
};
```

#### 4. Project Completion Awards

**Trigger**: When project status changes to "COMPLETED"

```javascript
const handleProjectCompletion = async (projectId, organizationId) => {
  try {
    // Get all project members
    const projectMembers = await getProjectMembers(projectId);
    const currentUser = await getCurrentUser();
    
    // Award all members including current user
    const allMembers = new Set([
      currentUser.sub,
      ...projectMembers.map(m => m.userSub)
    ]);
    
    for (const memberSub of allMembers) {
      await createAward({
        type: 'PROJECT_COMPLETE',
        user_sub: memberSub,
        tool_id: projectId,
        organizationID: organizationId
      });
      
      await updateUserCoins(memberSub, 30, organizationId);
    }
    
    // Send notification
    await sendProjectCompletedNotification(project, organizationId);
  } catch (error) {
    console.error('Error completing project:', error);
  }
};
```

#### 5. First Login Award

**Trigger**: On user's first successful login

```javascript
const handleFirstLogin = async (userSub, organizationId) => {
  // Check if user already has FIRST_LOGIN award
  const existingAward = await checkExistingAward(userSub, 'FIRST_LOGIN', organizationId);
  
  if (!existingAward) {
    await createAward({
      type: 'FIRST_LOGIN',
      user_sub: userSub,
      organizationID: organizationId
    });
    
    await updateUserCoins(userSub, 10, organizationId);
  }
};
```

#### 6. KPI Goal Achievement Awards

**Trigger**: When KPI data point meets or exceeds target

```javascript
const handleKPIGoalAchievement = async (kpiId, projectId, organizationId) => {
  try {
    // Get project members
    const projectMembers = await getProjectMembers(projectId);
    const kpiData = await getKPI(kpiId);
    
    // Award all project members
    for (const member of projectMembers) {
      await createAward({
        type: 'KPI_GOAL_ACHIEVED',
        user_sub: member.userSub,
        tool_id: kpiId,
        organizationID: organizationId,
        title: `KPI Goal Achieved: ${kpiData.title}`
      });
      
      await updateUserCoins(member.userSub, 25, organizationId);
    }
  } catch (error) {
    console.error('Error awarding KPI achievement:', error);
  }
};
```

## Coin Management

### Core Functions

#### Update User Coins
```javascript
const updateUserCoins = async (userSub, coinsToAdd, organizationId) => {
  try {
    // Get current coins
    const result = await API.graphql({
      query: listUserCoins,
      variables: {
        filter: {
          user_sub: { eq: userSub },
          organizationID: { eq: organizationId }
        }
      }
    });
    
    const userCoins = result.data.listUserCoins.items
      .filter(item => !item._deleted)[0];
    
    if (userCoins) {
      // Update existing record
      await API.graphql({
        query: updateUserCoins,
        variables: {
          input: {
            id: userCoins.id,
            total_coins: userCoins.total_coins + coinsToAdd,
            _version: userCoins._version
          }
        }
      });
    } else {
      // Create new record
      await API.graphql({
        query: createUserCoins,
        variables: {
          input: {
            user_sub: userSub,
            organizationID: organizationId,
            total_coins: coinsToAdd
          }
        }
      });
    }
  } catch (error) {
    console.error('Error updating user coins:', error);
  }
};
```

#### Get User Coins
```javascript
const getUserCoins = async (userSub, organizationId) => {
  try {
    const result = await API.graphql({
      query: listUserCoins,
      variables: {
        filter: {
          user_sub: { eq: userSub },
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
```

## Email Notification System

### Core Email Function

```javascript
const sendEmailNotification = async ({ type, to, data, organizationID }) => {
  try {
    // Primary: Use notificationEmail Lambda with custom templates
    const response = await API.post('apifetchdata', '/notification-email', {
      body: {
        to,
        template: type,
        data,
        organizationID
      }
    });
    
    return response.success;
  } catch (error) {
    console.error(`Error sending ${type} notification:`, error);
    
    // Fallback: Use GraphQL sendEmail mutation for direct emails
    try {
      const fallbackResponse = await API.graphql({
        query: mutations.sendEmail,
        variables: {
          input: {
            to: Array.isArray(to) ? to[0] : to,
            subject: `${type} Notification`,
            html: createFallbackHtml(type, data),
            organizationID
          }
        }
      });
      
      return fallbackResponse.data.sendEmail.success;
    } catch (fallbackError) {
      console.error('Fallback email also failed:', fallbackError);
      return false;
    }
  }
};

// Helper function for fallback email HTML
const createFallbackHtml = (type, data) => {
  switch (type) {
    case 'AWARD_EARNED':
      return `
        <h2>Congratulations!</h2>
        <p>You have earned an award: ${data.awardTitle}</p>
        <p>${data.awardDescription}</p>
        <p>Coins earned: ${data.awardCoins}</p>
      `;
    case 'REPORT_COMPLETED':
      return `
        <h2>Report Completed</h2>
        <p>The report "${data.reportName}" has been completed.</p>
        <p><a href="${data.reportURL}">View Report</a></p>
      `;
    default:
      return `<p>Notification: ${type}</p>`;
  }
};
```

### Email Template Variables

Each email template supports the following variables:

#### Report Notifications
```javascript
const reportData = {
  reportName: report.name,
  reportURL: `${APP_URL}/report/${report.id}`,
  reportType: report.type
};
```

#### Action Item Notifications
```javascript
const actionItemData = {
  actionItemTitle: actionItem.title,
  actionItemDescription: actionItem.description,
  actionItemDueDate: new Date(actionItem.duedate).toLocaleDateString(),
  actionItemURL: `${APP_URL}/action-item/${actionItem.id}`
};
```

#### Project Notifications
```javascript
const projectData = {
  projectName: project.name,
  projectURL: `${APP_URL}/project/${project.id}`,
  projectDescription: project.description
};
```

#### Award Notifications
```javascript
const awardData = {
  awardTitle: award.title,
  awardDescription: award.description,
  awardCoins: award.coins,
  awardsURL: `${APP_URL}/awards`
};
```

### Default Email Templates

Organizations are initialized with these email templates:

```javascript
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
    `
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
    `
  }
  // ... additional templates
];
```

## Implementation Examples

### Complete Award Flow Example

```javascript
// Example: Complete report and trigger all necessary actions
const completeReport = async (reportId) => {
  try {
    const currentUser = await Auth.currentAuthenticatedUser();
    const userSub = currentUser.attributes.sub;
    
    // 1. Get report details
    const reportResult = await API.graphql({
      query: getReport,
      variables: { id: reportId }
    });
    
    const report = reportResult.data.getReport;
    
    // 2. Update report as completed
    await API.graphql({
      query: updateReport,
      variables: {
        input: {
          id: reportId,
          completed: true,
          _version: report._version
        }
      }
    });
    
    // 3. Get award definition
    const awardType = getAwardTypeForReport(report.type);
    let awardDefResult;
    
    if (report.type === 'Value Stream Mapping Report') {
      awardDefResult = await API.graphql({
        query: listAwardDefinitions,
        variables: {
          filter: {
            type: { eq: 'VSM_COMPLETE' },
            organizationID: { eq: report.organizationID },
            isEnabled: { eq: true }
          }
        }
      });
    } else if (awardType) {
      awardDefResult = await API.graphql({
        query: listAwardDefinitions,
        variables: {
          filter: {
            type: { eq: 'CUSTOM_ACHIEVEMENT' },
            customType: { eq: awardType },
            organizationID: { eq: report.organizationID },
            isEnabled: { eq: true }
          }
        }
      });
    }
    
    if (awardDefResult?.data.listAwardDefinitions.items.length > 0) {
      const awardDef = awardDefResult.data.listAwardDefinitions.items[0];
      
      // 4. Create award record
      const awardResult = await API.graphql({
        query: createAwards,
        variables: {
          input: {
            title: awardDef.title,
            description: awardDef.description,
            date: new Date().toISOString(),
            user_sub: userSub,
            tool_id: reportId,
            type: awardDef.type,
            coins: awardDef.coins,
            organizationID: report.organizationID,
            customType: awardDef.customType
          }
        }
      });
      
      // 5. Update user coins
      await updateUserCoins(userSub, awardDef.coins, report.organizationID);
      
      // 6. Show award animation (mobile equivalent)
      showAwardModal(awardDef.coins);
      
      // 7. Send award notification email
      const userEmail = await getUserEmail(userSub, report.organizationID);
      if (userEmail) {
        await sendEmailNotification({
          type: 'AWARD_EARNED',
          to: userEmail,
          data: {
            awardTitle: awardDef.title,
            awardDescription: awardDef.description,
            awardCoins: awardDef.coins,
            awardsURL: 'VibeStack://awards'
          },
          organizationID: report.organizationID
        });
      }
    }
    
    // 8. Send report completion notification
    const assignedMembers = report.assignedMembers || [];
    const recipientSubs = [...new Set([userSub, ...assignedMembers])];
    
    if (recipientSubs.length > 0) {
      const recipientEmails = await fetchEmailsByUserSubs(recipientSubs, report.organizationID);
      
      if (recipientEmails.length > 0) {
        await sendEmailNotification({
          type: 'REPORT_COMPLETED',
          to: recipientEmails,
          data: {
            reportName: report.name,
            reportURL: `VibeStack://report/${report.id}`,
            reportType: report.type
          },
          organizationID: report.organizationID
        });
      }
    }
    
  } catch (error) {
    console.error('Error completing report:', error);
    throw error;
  }
};
```

### Mobile Award Animation

```jsx
// React Native award modal component
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Animated } from 'react-native';
import LottieView from 'lottie-react-native';

const AwardModal = ({ visible, coins, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
      
      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    }
  }, [visible]);
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.content,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Text style={styles.title}>Congratulations! 🎉</Text>
          <LottieView
            source={require('./assets/award.json')}
            autoPlay
            loop
            style={styles.animation}
          />
          <Text style={styles.message}>You've earned an award!</Text>
          <Text style={styles.coins}>🪙 {coins} coins earned!</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};
```

## Backend Lambda Functions

### Key Lambda Functions to Leverage

1. **notificationEmail** - Primary template-based email system with custom email templates
2. **emailService** - Legacy report assignment emails (simple HTML)
3. **External PDF API** - PDF generation via external service (not Lambda-based)

### Lambda Function Endpoints

```javascript
// Primary notification email endpoint (with custom templates)
POST /notification-email
Body: {
  to: string | string[],
  template: EmailTemplateType,
  data: object,
  organizationID: string
}

// Legacy email service endpoint
POST /sendEmail
Body: {
  to: string,
  subject: string,
  html: string,
  organizationID: string
}

// GraphQL direct email mutation (fallback)
mutation SendEmail {
  sendEmail(input: {
    to: string,
    subject: string,
    html: string,
    organizationID: string
  }) {
    success
    message
  }
}
```

### Email System Architecture

The current email system uses a **hierarchical approach**:

1. **Primary**: `notificationEmail` Lambda function with database-driven custom templates
2. **Fallback**: GraphQL `sendEmail` mutation for direct emails when templates fail
3. **Legacy**: `emailService` Lambda for simple report assignments

### Custom Email Templates for Feedback

Instead of the old `emailFeedback` Lambda function, the system now uses:

```javascript
// Feedback notification using custom templates
const sendFeedbackNotification = async (feedback, organizationID) => {
  const notificationData = {
    feedbackContent: feedback.content,
    feedbackRating: feedback.rating,
    userEmail: feedback.userEmail,
    feedbackDate: new Date().toLocaleDateString()
  };
  
  // Uses custom CUSTOM_NOTIFICATION template
  await sendEmailNotification({
    type: 'CUSTOM_NOTIFICATION',
    to: 'admin@organization.com',
    data: notificationData,
    organizationID
  });
};
```

## Mobile-Specific Considerations

### Deep Linking
Use custom URL schemes for email links:
```javascript
const mobileUrls = {
  report: 'VibeStack://report/{reportId}',
  project: 'VibeStack://project/{projectId}', 
  awards: 'VibeStack://awards',
  actionItems: 'VibeStack://action-items'
};
```

### Push Notifications
Consider implementing push notifications alongside email:
```javascript
const sendNotification = async (userSub, title, body, data) => {
  // Use Firebase, AWS SNS, or similar
  await sendPushNotification({
    to: userSub,
    title,
    body,
    data
  });
};
```

### Offline Support
Cache awards and coins for offline viewing:
```javascript
const cacheUserData = async (userSub, organizationId) => {
  const awards = await getUserAwards(userSub, organizationId);
  const coins = await getUserCoins(userSub, organizationId);
  
  await AsyncStorage.setItem(`awards_${userSub}`, JSON.stringify(awards));
  await AsyncStorage.setItem(`coins_${userSub}`, coins.toString());
};
```

### Local Notifications
Show local notifications for offline award achievements:
```javascript
import PushNotification from 'react-native-push-notification';

const showLocalAwardNotification = (coins) => {
  PushNotification.localNotification({
    title: "Award Earned! 🎉",
    message: `You earned ${coins} coins!`,
    playSound: true,
    soundName: 'default',
  });
};
```

## Testing Guidelines

### Award Testing Checklist

1. **Report Completion Awards**
   - [ ] Test each of the 21 report types
   - [ ] Verify correct coin amounts (20 coins for most, 25 for VSM)
   - [ ] Check email notifications sent
   - [ ] Confirm award appears in user's award list

2. **Action Item Awards** 
   - [ ] Test with single assignee
   - [ ] Test with multiple assignees  
   - [ ] Test with creator only
   - [ ] Verify all participants receive awards
   - [ ] Check 5 coins awarded per person

3. **Project Awards**
   - [ ] Test with project members
   - [ ] Test with project lead only
   - [ ] Verify 30 coins awarded per member
   - [ ] Check email notifications

4. **Quiz Awards**
   - [ ] Test 100% score (20 coins)
   - [ ] Test 80-99% score (10 coins)
   - [ ] Test below 80% (no award)

5. **Email Notifications**
   - [ ] Test all email template types
   - [ ] Verify template variables are replaced
   - [ ] Check organization-specific templates
   - [ ] Test with multiple recipients
   - [ ] Verify deep links work in mobile

6. **Coin Management**
   - [ ] Test coin balance updates
   - [ ] Test with new users (creating coin record)
   - [ ] Test with existing users (updating coin record)
   - [ ] Verify organization isolation

### Test Data Setup

```javascript
// Create test organization with all award definitions
const setupTestOrganization = async () => {
  const org = await createOrganization({
    name: 'Test Organization',
    owner: 'test-user-sub'
  });
  
  await initializeAwardDefinitions(org.id);
  await createDefaultEmailTemplates(org.id);
  
  return org;
};

// Create test users with different roles
const setupTestUsers = async (organizationId) => {
  const users = [
    { role: 'ADMIN', email: 'admin@test.com' },
    { role: 'USER', email: 'user1@test.com' },
    { role: 'USER', email: 'user2@test.com' }
  ];
  
  for (const user of users) {
    await createOrganizationMember({
      organizationID: organizationId,
      email: user.email,
      role: user.role,
      status: 'ACTIVE'
    });
  }
};
```

### Manual Testing Scenarios

1. **Complete Report Flow**
   ```
   1. Create new report
   2. Add content/data  
   3. Mark as completed
   4. Verify award popup
   5. Check coin balance increased
   6. Confirm email sent
   ```

2. **Action Item Flow**
   ```
   1. Create action item with assignees
   2. Change status to "Done"
   3. Verify all assignees + creator get awards
   4. Check completion emails sent
   ```

3. **Multi-Organization Testing**
   ```
   1. User belongs to 2+ organizations
   2. Complete activities in each org
   3. Verify awards/coins isolated per org
   4. Check correct email templates used
   ```

## Summary

This guide provides everything needed to implement the complete awards, coins, and email notification system in the React Native mobile app. The key points are:

1. **Use the same AWS Amplify backend** - no changes needed
2. **Implement identical award triggers** - same events, same coin amounts
3. **Leverage existing Lambda functions** - especially for email notifications
4. **Maintain organization isolation** - critical for multi-tenant architecture
5. **Add mobile-specific enhancements** - deep linking, push notifications, offline support

The mobile app should provide the exact same gamification experience as the web app, ensuring users receive consistent rewards and notifications regardless of platform.

---

*This documentation is based on the VibeStack™ Pro React web application codebase as of December 2024. For the most current implementation details, refer to the web application source code.*