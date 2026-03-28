// @ts-check
import { initSchema } from '@aws-amplify/datastore';
import { schema } from './schema';

const AwardType = {
  "QUIZ_PERFECT": "QUIZ_PERFECT",
  "QUIZ_MASTERY": "QUIZ_MASTERY",
  "REPORT_COMPLETE": "REPORT_COMPLETE",
  "PROJECT_COMPLETE": "PROJECT_COMPLETE",
  "ACTION_ITEM_COMPLETE": "ACTION_ITEM_COMPLETE",
  "HIGHLIGHT_ADDED": "HIGHLIGHT_ADDED",
  "VSM_COMPLETE": "VSM_COMPLETE",
  "CATEGORY_COMPLETE": "CATEGORY_COMPLETE",
  "STATEMENT_COMPLETE": "STATEMENT_COMPLETE",
  "FEEDBACK_PROVIDED": "FEEDBACK_PROVIDED",
  "TEAM_COLLABORATION": "TEAM_COLLABORATION",
  "FIRST_LOGIN": "FIRST_LOGIN",
  "PROFILE_COMPLETE": "PROFILE_COMPLETE",
  "WEEKLY_GOALS_MET": "WEEKLY_GOALS_MET",
  "MONTHLY_GOALS_MET": "MONTHLY_GOALS_MET",
  "CUSTOM_ACHIEVEMENT": "CUSTOM_ACHIEVEMENT",
  "KPI_GOAL_ACHIEVED": "KPI_GOAL_ACHIEVED"
};

const EmailTemplateType = {
  "REPORT_CREATED": "REPORT_CREATED",
  "REPORT_COMPLETED": "REPORT_COMPLETED",
  "REPORT_MEMBER_ADDED": "REPORT_MEMBER_ADDED",
  "REPORT_MEMBER_REMOVED": "REPORT_MEMBER_REMOVED",
  "ACTION_ITEM_CREATED": "ACTION_ITEM_CREATED",
  "ACTION_ITEM_ASSIGNED": "ACTION_ITEM_ASSIGNED",
  "ACTION_ITEM_COMPLETED": "ACTION_ITEM_COMPLETED",
  "ACTION_ITEM_STATUS_CHANGED": "ACTION_ITEM_STATUS_CHANGED",
  "PROJECT_CREATED": "PROJECT_CREATED",
  "PROJECT_COMPLETED": "PROJECT_COMPLETED",
  "PROJECT_MEMBER_ADDED": "PROJECT_MEMBER_ADDED",
  "PROJECT_MEMBER_REMOVED": "PROJECT_MEMBER_REMOVED",
  "AWARD_EARNED": "AWARD_EARNED",
  "CUSTOM_NOTIFICATION": "CUSTOM_NOTIFICATION"
};

const IssueStatus = {
  "OPEN": "OPEN",
  "IN_PROGRESS": "IN_PROGRESS",
  "RESOLVED": "RESOLVED",
  "CLOSED": "CLOSED"
};

const IssuePriority = {
  "LOW": "LOW",
  "MEDIUM": "MEDIUM",
  "HIGH": "HIGH",
  "CRITICAL": "CRITICAL"
};

const IssueCategory = {
  "BUG": "BUG",
  "FEATURE_REQUEST": "FEATURE_REQUEST",
  "TECHNICAL_SUPPORT": "TECHNICAL_SUPPORT",
  "GENERAL_INQUIRY": "GENERAL_INQUIRY",
  "FEEDBACK": "FEEDBACK",
  "OTHER": "OTHER"
};

const { Vsm, ChartData, Highlights, EmailTemplate, AwardDefinition, Awards, UserCoins, Feedback, QuizzesResult, ActionItems, Statements, Categories, Report, Organization, Department, OrganizationMember, Project, ProjectMember, KPI, KPIData, Quiz, Question, Post, Learning, Chapter, Section, SubSection, Tangible, Intangible, SubscriptionInvoice, ShopItem, UserPurchase, User, Issue, IssueResponse, LearningSession, LearningProgress, SectionInteraction, StripeCustomerResponse, SubscriptionUpdateResponse, EmailResponse } = initSchema(schema);

export {
  Vsm,
  ChartData,
  Highlights,
  EmailTemplate,
  AwardDefinition,
  Awards,
  UserCoins,
  Feedback,
  QuizzesResult,
  ActionItems,
  Statements,
  Categories,
  Report,
  Organization,
  Department,
  OrganizationMember,
  Project,
  ProjectMember,
  KPI,
  KPIData,
  Quiz,
  Question,
  Post,
  Learning,
  Chapter,
  Section,
  SubSection,
  Tangible,
  Intangible,
  SubscriptionInvoice,
  ShopItem,
  UserPurchase,
  User,
  Issue,
  IssueResponse,
  LearningSession,
  LearningProgress,
  SectionInteraction,
  AwardType,
  EmailTemplateType,
  IssueStatus,
  IssuePriority,
  IssueCategory,
  StripeCustomerResponse,
  SubscriptionUpdateResponse,
  EmailResponse
};