import { ModelInit, MutableModel, __modelMeta__, ManagedIdentifier } from "@aws-amplify/datastore";
// @ts-ignore
import { LazyLoading, LazyLoadingDisabled, AsyncItem, AsyncCollection } from "@aws-amplify/datastore";

export enum AwardType {
  QUIZ_PERFECT = "QUIZ_PERFECT",
  QUIZ_MASTERY = "QUIZ_MASTERY",
  REPORT_COMPLETE = "REPORT_COMPLETE",
  PROJECT_COMPLETE = "PROJECT_COMPLETE",
  ACTION_ITEM_COMPLETE = "ACTION_ITEM_COMPLETE",
  HIGHLIGHT_ADDED = "HIGHLIGHT_ADDED",
  VSM_COMPLETE = "VSM_COMPLETE",
  CATEGORY_COMPLETE = "CATEGORY_COMPLETE",
  STATEMENT_COMPLETE = "STATEMENT_COMPLETE",
  FEEDBACK_PROVIDED = "FEEDBACK_PROVIDED",
  TEAM_COLLABORATION = "TEAM_COLLABORATION",
  FIRST_LOGIN = "FIRST_LOGIN",
  PROFILE_COMPLETE = "PROFILE_COMPLETE",
  WEEKLY_GOALS_MET = "WEEKLY_GOALS_MET",
  MONTHLY_GOALS_MET = "MONTHLY_GOALS_MET",
  CUSTOM_ACHIEVEMENT = "CUSTOM_ACHIEVEMENT",
  KPI_GOAL_ACHIEVED = "KPI_GOAL_ACHIEVED"
}

export enum EmailTemplateType {
  REPORT_CREATED = "REPORT_CREATED",
  REPORT_COMPLETED = "REPORT_COMPLETED",
  REPORT_MEMBER_ADDED = "REPORT_MEMBER_ADDED",
  REPORT_MEMBER_REMOVED = "REPORT_MEMBER_REMOVED",
  ACTION_ITEM_CREATED = "ACTION_ITEM_CREATED",
  ACTION_ITEM_ASSIGNED = "ACTION_ITEM_ASSIGNED",
  ACTION_ITEM_COMPLETED = "ACTION_ITEM_COMPLETED",
  ACTION_ITEM_STATUS_CHANGED = "ACTION_ITEM_STATUS_CHANGED",
  PROJECT_CREATED = "PROJECT_CREATED",
  PROJECT_COMPLETED = "PROJECT_COMPLETED",
  PROJECT_MEMBER_ADDED = "PROJECT_MEMBER_ADDED",
  PROJECT_MEMBER_REMOVED = "PROJECT_MEMBER_REMOVED",
  AWARD_EARNED = "AWARD_EARNED",
  CUSTOM_NOTIFICATION = "CUSTOM_NOTIFICATION"
}

export enum IssueStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED"
}

export enum IssuePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL"
}

export enum IssueCategory {
  BUG = "BUG",
  FEATURE_REQUEST = "FEATURE_REQUEST",
  TECHNICAL_SUPPORT = "TECHNICAL_SUPPORT",
  GENERAL_INQUIRY = "GENERAL_INQUIRY",
  FEEDBACK = "FEEDBACK",
  OTHER = "OTHER"
}

type EagerStripeCustomerResponse = {
  readonly success: boolean;
  readonly customerId?: string | null;
  readonly error?: string | null;
}

type LazyStripeCustomerResponse = {
  readonly success: boolean;
  readonly customerId?: string | null;
  readonly error?: string | null;
}

export declare type StripeCustomerResponse = LazyLoading extends LazyLoadingDisabled ? EagerStripeCustomerResponse : LazyStripeCustomerResponse

export declare const StripeCustomerResponse: (new (init: ModelInit<StripeCustomerResponse>) => StripeCustomerResponse)

type EagerSubscriptionUpdateResponse = {
  readonly success: boolean;
  readonly subscriptionId?: string | null;
  readonly clientSecret?: string | null;
  readonly proratedAmount?: number | null;
  readonly additionalLicenses?: number | null;
  readonly error?: string | null;
}

type LazySubscriptionUpdateResponse = {
  readonly success: boolean;
  readonly subscriptionId?: string | null;
  readonly clientSecret?: string | null;
  readonly proratedAmount?: number | null;
  readonly additionalLicenses?: number | null;
  readonly error?: string | null;
}

export declare type SubscriptionUpdateResponse = LazyLoading extends LazyLoadingDisabled ? EagerSubscriptionUpdateResponse : LazySubscriptionUpdateResponse

export declare const SubscriptionUpdateResponse: (new (init: ModelInit<SubscriptionUpdateResponse>) => SubscriptionUpdateResponse)

type EagerEmailResponse = {
  readonly success: boolean;
  readonly message?: string | null;
}

type LazyEmailResponse = {
  readonly success: boolean;
  readonly message?: string | null;
}

export declare type EmailResponse = LazyLoading extends LazyLoadingDisabled ? EagerEmailResponse : LazyEmailResponse

export declare const EmailResponse: (new (init: ModelInit<EmailResponse>) => EmailResponse)

type EagerVsm = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Vsm, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly process?: string | null;
  readonly informationFlow?: string | null;
  readonly kaizenProject?: string | null;
  readonly demandData?: string | null;
  readonly summaryData?: string | null;
  readonly reportID: string;
  readonly inventory?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyVsm = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Vsm, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly process?: string | null;
  readonly informationFlow?: string | null;
  readonly kaizenProject?: string | null;
  readonly demandData?: string | null;
  readonly summaryData?: string | null;
  readonly reportID: string;
  readonly inventory?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Vsm = LazyLoading extends LazyLoadingDisabled ? EagerVsm : LazyVsm

export declare const Vsm: (new (init: ModelInit<Vsm>) => Vsm) & {
  copyOf(source: Vsm, mutator: (draft: MutableModel<Vsm>) => MutableModel<Vsm> | void): Vsm;
}

type EagerChartData = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ChartData, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly text?: string | null;
  readonly textColor?: string | null;
  readonly posX?: string | null;
  readonly posY?: string | null;
  readonly reportID: string;
  readonly value?: string | null;
  readonly Description?: string | null;
  readonly date?: string | null;
  readonly orderIndex?: number | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyChartData = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ChartData, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly text?: string | null;
  readonly textColor?: string | null;
  readonly posX?: string | null;
  readonly posY?: string | null;
  readonly reportID: string;
  readonly value?: string | null;
  readonly Description?: string | null;
  readonly date?: string | null;
  readonly orderIndex?: number | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type ChartData = LazyLoading extends LazyLoadingDisabled ? EagerChartData : LazyChartData

export declare const ChartData: (new (init: ModelInit<ChartData>) => ChartData) & {
  copyOf(source: ChartData, mutator: (draft: MutableModel<ChartData>) => MutableModel<ChartData> | void): ChartData;
}

type EagerHighlights = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Highlights, 'id'>;
  };
  readonly id: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly images?: (string | null)[] | null;
  readonly assignees?: (string | null)[] | null;
  readonly reportID: string;
  readonly waste_type?: string | null;
  readonly createdAt: string;
  readonly updatedAt?: string | null;
}

type LazyHighlights = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Highlights, 'id'>;
  };
  readonly id: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly images?: (string | null)[] | null;
  readonly assignees?: (string | null)[] | null;
  readonly reportID: string;
  readonly waste_type?: string | null;
  readonly createdAt: string;
  readonly updatedAt?: string | null;
}

export declare type Highlights = LazyLoading extends LazyLoadingDisabled ? EagerHighlights : LazyHighlights

export declare const Highlights: (new (init: ModelInit<Highlights>) => Highlights) & {
  copyOf(source: Highlights, mutator: (draft: MutableModel<Highlights>) => MutableModel<Highlights> | void): Highlights;
}

type EagerEmailTemplate = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EmailTemplate, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly type: EmailTemplateType | keyof typeof EmailTemplateType;
  readonly subject: string;
  readonly htmlTemplate: string;
  readonly organizationID: string;
  readonly organization?: Organization | null;
  readonly isEnabled: boolean;
  readonly customType?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyEmailTemplate = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<EmailTemplate, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly type: EmailTemplateType | keyof typeof EmailTemplateType;
  readonly subject: string;
  readonly htmlTemplate: string;
  readonly organizationID: string;
  readonly organization: AsyncItem<Organization | undefined>;
  readonly isEnabled: boolean;
  readonly customType?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type EmailTemplate = LazyLoading extends LazyLoadingDisabled ? EagerEmailTemplate : LazyEmailTemplate

export declare const EmailTemplate: (new (init: ModelInit<EmailTemplate>) => EmailTemplate) & {
  copyOf(source: EmailTemplate, mutator: (draft: MutableModel<EmailTemplate>) => MutableModel<EmailTemplate> | void): EmailTemplate;
}

type EagerAwardDefinition = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AwardDefinition, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly type: AwardType | keyof typeof AwardType;
  readonly coins: number;
  readonly title: string;
  readonly description: string;
  readonly organizationID: string;
  readonly organization?: Organization | null;
  readonly isEnabled: boolean;
  readonly customType?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyAwardDefinition = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<AwardDefinition, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly type: AwardType | keyof typeof AwardType;
  readonly coins: number;
  readonly title: string;
  readonly description: string;
  readonly organizationID: string;
  readonly organization: AsyncItem<Organization | undefined>;
  readonly isEnabled: boolean;
  readonly customType?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type AwardDefinition = LazyLoading extends LazyLoadingDisabled ? EagerAwardDefinition : LazyAwardDefinition

export declare const AwardDefinition: (new (init: ModelInit<AwardDefinition>) => AwardDefinition) & {
  copyOf(source: AwardDefinition, mutator: (draft: MutableModel<AwardDefinition>) => MutableModel<AwardDefinition> | void): AwardDefinition;
}

type EagerAwards = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Awards, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly date?: string | null;
  readonly description?: string | null;
  readonly user_sub?: string | null;
  readonly tool_id?: string | null;
  readonly type?: AwardType | keyof typeof AwardType | null;
  readonly coins?: number | null;
  readonly organizationID: string;
  readonly customType?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyAwards = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Awards, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly title?: string | null;
  readonly date?: string | null;
  readonly description?: string | null;
  readonly user_sub?: string | null;
  readonly tool_id?: string | null;
  readonly type?: AwardType | keyof typeof AwardType | null;
  readonly coins?: number | null;
  readonly organizationID: string;
  readonly customType?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Awards = LazyLoading extends LazyLoadingDisabled ? EagerAwards : LazyAwards

export declare const Awards: (new (init: ModelInit<Awards>) => Awards) & {
  copyOf(source: Awards, mutator: (draft: MutableModel<Awards>) => MutableModel<Awards> | void): Awards;
}

type EagerUserCoins = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserCoins, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly user_sub: string;
  readonly total_coins: number;
  readonly organizationID: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUserCoins = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserCoins, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly user_sub: string;
  readonly total_coins: number;
  readonly organizationID: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UserCoins = LazyLoading extends LazyLoadingDisabled ? EagerUserCoins : LazyUserCoins

export declare const UserCoins: (new (init: ModelInit<UserCoins>) => UserCoins) & {
  copyOf(source: UserCoins, mutator: (draft: MutableModel<UserCoins>) => MutableModel<UserCoins> | void): UserCoins;
}

type EagerFeedback = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Feedback, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly content?: string | null;
  readonly user_sub?: string | null;
  readonly ratting?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyFeedback = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Feedback, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly content?: string | null;
  readonly user_sub?: string | null;
  readonly ratting?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Feedback = LazyLoading extends LazyLoadingDisabled ? EagerFeedback : LazyFeedback

export declare const Feedback: (new (init: ModelInit<Feedback>) => Feedback) & {
  copyOf(source: Feedback, mutator: (draft: MutableModel<Feedback>) => MutableModel<Feedback> | void): Feedback;
}

type EagerQuizzesResult = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<QuizzesResult, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly Correct?: string | null;
  readonly Incorrect?: string | null;
  readonly percentage?: string | null;
  readonly user_sub?: string | null;
  readonly tool_id?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyQuizzesResult = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<QuizzesResult, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly Correct?: string | null;
  readonly Incorrect?: string | null;
  readonly percentage?: string | null;
  readonly user_sub?: string | null;
  readonly tool_id?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type QuizzesResult = LazyLoading extends LazyLoadingDisabled ? EagerQuizzesResult : LazyQuizzesResult

export declare const QuizzesResult: (new (init: ModelInit<QuizzesResult>) => QuizzesResult) & {
  copyOf(source: QuizzesResult, mutator: (draft: MutableModel<QuizzesResult>) => MutableModel<QuizzesResult> | void): QuizzesResult;
}

type EagerActionItems = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ActionItems, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly note?: boolean | null;
  readonly description?: string | null;
  readonly title?: string | null;
  readonly duedate?: string | null;
  readonly status?: number | null;
  readonly assignor?: string | null;
  readonly assignees?: (string | null)[] | null;
  readonly attachments?: (string | null)[] | null;
  readonly reportID?: string | null;
  readonly user_sub?: string | null;
  readonly projectID?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyActionItems = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ActionItems, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly note?: boolean | null;
  readonly description?: string | null;
  readonly title?: string | null;
  readonly duedate?: string | null;
  readonly status?: number | null;
  readonly assignor?: string | null;
  readonly assignees?: (string | null)[] | null;
  readonly attachments?: (string | null)[] | null;
  readonly reportID?: string | null;
  readonly user_sub?: string | null;
  readonly projectID?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type ActionItems = LazyLoading extends LazyLoadingDisabled ? EagerActionItems : LazyActionItems

export declare const ActionItems: (new (init: ModelInit<ActionItems>) => ActionItems) & {
  copyOf(source: ActionItems, mutator: (draft: MutableModel<ActionItems>) => MutableModel<ActionItems> | void): ActionItems;
}

type EagerStatements = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Statements, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name?: string | null;
  readonly value?: number | null;
  readonly default?: boolean | null;
  readonly owner?: string | null;
  readonly categoriesID: string;
  readonly categoryName?: string | null;
  readonly reportID?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyStatements = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Statements, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name?: string | null;
  readonly value?: number | null;
  readonly default?: boolean | null;
  readonly owner?: string | null;
  readonly categoriesID: string;
  readonly categoryName?: string | null;
  readonly reportID?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Statements = LazyLoading extends LazyLoadingDisabled ? EagerStatements : LazyStatements

export declare const Statements: (new (init: ModelInit<Statements>) => Statements) & {
  copyOf(source: Statements, mutator: (draft: MutableModel<Statements>) => MutableModel<Statements> | void): Statements;
}

type EagerCategories = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Categories, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name?: string | null;
  readonly reportID: string;
  readonly Statements?: (Statements | null)[] | null;
  readonly orderIndex?: number | null;
  readonly assignees?: (string | null)[] | null;
  readonly attachments?: (string | null)[] | null;
  readonly description?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyCategories = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Categories, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name?: string | null;
  readonly reportID: string;
  readonly Statements: AsyncCollection<Statements>;
  readonly orderIndex?: number | null;
  readonly assignees?: (string | null)[] | null;
  readonly attachments?: (string | null)[] | null;
  readonly description?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type Categories = LazyLoading extends LazyLoadingDisabled ? EagerCategories : LazyCategories

export declare const Categories: (new (init: ModelInit<Categories>) => Categories) & {
  copyOf(source: Categories, mutator: (draft: MutableModel<Categories>) => MutableModel<Categories> | void): Categories;
}

type EagerReport = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Report, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name?: string | null;
  readonly type?: string | null;
  readonly user_sub?: string | null;
  readonly ownerEmail?: string | null;
  readonly ai_id?: string | null;
  readonly Categories?: (Categories | null)[] | null;
  readonly ActionItems?: (ActionItems | null)[] | null;
  readonly completed?: boolean | null;
  readonly Highlights?: (Highlights | null)[] | null;
  readonly ChartData?: (ChartData | null)[] | null;
  readonly bones?: number | null;
  readonly trend?: boolean | null;
  readonly target?: string | null;
  readonly media?: string | null;
  readonly Vsm?: Vsm | null;
  readonly xaxis?: string | null;
  readonly yaxis?: string | null;
  readonly organizationID?: string | null;
  readonly projectID?: string | null;
  readonly assignedMembers?: (string | null)[] | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly reportVsmId?: string | null;
}

type LazyReport = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Report, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name?: string | null;
  readonly type?: string | null;
  readonly user_sub?: string | null;
  readonly ownerEmail?: string | null;
  readonly ai_id?: string | null;
  readonly Categories: AsyncCollection<Categories>;
  readonly ActionItems: AsyncCollection<ActionItems>;
  readonly completed?: boolean | null;
  readonly Highlights: AsyncCollection<Highlights>;
  readonly ChartData: AsyncCollection<ChartData>;
  readonly bones?: number | null;
  readonly trend?: boolean | null;
  readonly target?: string | null;
  readonly media?: string | null;
  readonly Vsm: AsyncItem<Vsm | undefined>;
  readonly xaxis?: string | null;
  readonly yaxis?: string | null;
  readonly organizationID?: string | null;
  readonly projectID?: string | null;
  readonly assignedMembers?: (string | null)[] | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly reportVsmId?: string | null;
}

export declare type Report = LazyLoading extends LazyLoadingDisabled ? EagerReport : LazyReport

export declare const Report: (new (init: ModelInit<Report>) => Report) & {
  copyOf(source: Report, mutator: (draft: MutableModel<Report>) => MutableModel<Report> | void): Report;
}

type EagerOrganization = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Organization, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly additionalOwners?: (string | null)[] | null;
  readonly contactEmail?: string | null;
  readonly contactPhone?: string | null;
  readonly location?: string | null;
  readonly coordinates?: string | null;
  readonly logo?: string | null;
  readonly isActive?: boolean | null;
  readonly leaderboardEnabled?: boolean | null;
  readonly members?: (OrganizationMember | null)[] | null;
  readonly departments?: (Department | null)[] | null;
  readonly Reports?: (Report | null)[] | null;
  readonly Projects?: (Project | null)[] | null;
  readonly awards?: (AwardDefinition | null)[] | null;
  readonly emailTemplates?: (EmailTemplate | null)[] | null;
  readonly invoices?: (SubscriptionInvoice | null)[] | null;
  readonly shopItems?: (ShopItem | null)[] | null;
  readonly userPurchases?: (UserPurchase | null)[] | null;
  readonly stripeCustomerId?: string | null;
  readonly stripeSubscriptionId?: string | null;
  readonly stripeSubscriptionItemId?: string | null;
  readonly subscriptionStatus?: string | null;
  readonly subscriptionPeriodEnd?: string | null;
  readonly billingPeriod?: string | null;
  readonly activeUserCount?: number | null;
  readonly purchasedLicenses?: number | null;
  readonly aiDisabledUsers?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly learnings?: (Learning | null)[] | null;
}

type LazyOrganization = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Organization, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly owner: string;
  readonly additionalOwners?: (string | null)[] | null;
  readonly contactEmail?: string | null;
  readonly contactPhone?: string | null;
  readonly location?: string | null;
  readonly coordinates?: string | null;
  readonly logo?: string | null;
  readonly isActive?: boolean | null;
  readonly leaderboardEnabled?: boolean | null;
  readonly members: AsyncCollection<OrganizationMember>;
  readonly departments: AsyncCollection<Department>;
  readonly Reports: AsyncCollection<Report>;
  readonly Projects: AsyncCollection<Project>;
  readonly awards: AsyncCollection<AwardDefinition>;
  readonly emailTemplates: AsyncCollection<EmailTemplate>;
  readonly invoices: AsyncCollection<SubscriptionInvoice>;
  readonly shopItems: AsyncCollection<ShopItem>;
  readonly userPurchases: AsyncCollection<UserPurchase>;
  readonly stripeCustomerId?: string | null;
  readonly stripeSubscriptionId?: string | null;
  readonly stripeSubscriptionItemId?: string | null;
  readonly subscriptionStatus?: string | null;
  readonly subscriptionPeriodEnd?: string | null;
  readonly billingPeriod?: string | null;
  readonly activeUserCount?: number | null;
  readonly purchasedLicenses?: number | null;
  readonly aiDisabledUsers?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly learnings: AsyncCollection<Learning>;
}

export declare type Organization = LazyLoading extends LazyLoadingDisabled ? EagerOrganization : LazyOrganization

export declare const Organization: (new (init: ModelInit<Organization>) => Organization) & {
  copyOf(source: Organization, mutator: (draft: MutableModel<Organization>) => MutableModel<Organization> | void): Organization;
}

type EagerDepartment = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Department, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly organizationID: string;
  readonly organization?: Organization | null;
  readonly members?: (OrganizationMember | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyDepartment = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Department, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly organizationID: string;
  readonly organization: AsyncItem<Organization | undefined>;
  readonly members: AsyncCollection<OrganizationMember>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Department = LazyLoading extends LazyLoadingDisabled ? EagerDepartment : LazyDepartment

export declare const Department: (new (init: ModelInit<Department>) => Department) & {
  copyOf(source: Department, mutator: (draft: MutableModel<Department>) => MutableModel<Department> | void): Department;
}

type EagerOrganizationMember = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<OrganizationMember, 'id'>;
  };
  readonly id: string;
  readonly organizationID: string;
  readonly departmentID?: string | null;
  readonly department?: Department | null;
  readonly userSub: string;
  readonly email: string;
  readonly status: string;
  readonly role: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyOrganizationMember = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<OrganizationMember, 'id'>;
  };
  readonly id: string;
  readonly organizationID: string;
  readonly departmentID?: string | null;
  readonly department: AsyncItem<Department | undefined>;
  readonly userSub: string;
  readonly email: string;
  readonly status: string;
  readonly role: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type OrganizationMember = LazyLoading extends LazyLoadingDisabled ? EagerOrganizationMember : LazyOrganizationMember

export declare const OrganizationMember: (new (init: ModelInit<OrganizationMember>) => OrganizationMember) & {
  copyOf(source: OrganizationMember, mutator: (draft: MutableModel<OrganizationMember>) => MutableModel<OrganizationMember> | void): OrganizationMember;
}

type EagerProject = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Project, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly startDate: string;
  readonly endDate?: string | null;
  readonly status: string;
  readonly organizationID: string;
  readonly organization?: Organization | null;
  readonly members?: (ProjectMember | null)[] | null;
  readonly reports?: (Report | null)[] | null;
  readonly actionItems?: (ActionItems | null)[] | null;
  readonly kpis?: (KPI | null)[] | null;
  readonly tangibles?: (Tangible | null)[] | null;
  readonly intangibles?: (Intangible | null)[] | null;
  readonly owner?: string | null;
  readonly ownerEmail?: string | null;
  readonly attachments?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyProject = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Project, 'id'>;
  };
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly startDate: string;
  readonly endDate?: string | null;
  readonly status: string;
  readonly organizationID: string;
  readonly organization: AsyncItem<Organization | undefined>;
  readonly members: AsyncCollection<ProjectMember>;
  readonly reports: AsyncCollection<Report>;
  readonly actionItems: AsyncCollection<ActionItems>;
  readonly kpis: AsyncCollection<KPI>;
  readonly tangibles: AsyncCollection<Tangible>;
  readonly intangibles: AsyncCollection<Intangible>;
  readonly owner?: string | null;
  readonly ownerEmail?: string | null;
  readonly attachments?: (string | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Project = LazyLoading extends LazyLoadingDisabled ? EagerProject : LazyProject

export declare const Project: (new (init: ModelInit<Project>) => Project) & {
  copyOf(source: Project, mutator: (draft: MutableModel<Project>) => MutableModel<Project> | void): Project;
}

type EagerProjectMember = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ProjectMember, 'id'>;
  };
  readonly id: string;
  readonly projectID: string;
  readonly userSub: string;
  readonly role: string;
  readonly email: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyProjectMember = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ProjectMember, 'id'>;
  };
  readonly id: string;
  readonly projectID: string;
  readonly userSub: string;
  readonly role: string;
  readonly email: string;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type ProjectMember = LazyLoading extends LazyLoadingDisabled ? EagerProjectMember : LazyProjectMember

export declare const ProjectMember: (new (init: ModelInit<ProjectMember>) => ProjectMember) & {
  copyOf(source: ProjectMember, mutator: (draft: MutableModel<ProjectMember>) => MutableModel<ProjectMember> | void): ProjectMember;
}

type EagerKPI = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<KPI, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly xAxisLabel: string;
  readonly yAxisLabel: string;
  readonly trend: boolean;
  readonly target?: number | null;
  readonly startDate: string;
  readonly endDate: string;
  readonly projectID: string;
  readonly project?: Project | null;
  readonly kpiData?: (KPIData | null)[] | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyKPI = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<KPI, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly xAxisLabel: string;
  readonly yAxisLabel: string;
  readonly trend: boolean;
  readonly target?: number | null;
  readonly startDate: string;
  readonly endDate: string;
  readonly projectID: string;
  readonly project: AsyncItem<Project | undefined>;
  readonly kpiData: AsyncCollection<KPIData>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type KPI = LazyLoading extends LazyLoadingDisabled ? EagerKPI : LazyKPI

export declare const KPI: (new (init: ModelInit<KPI>) => KPI) & {
  copyOf(source: KPI, mutator: (draft: MutableModel<KPI>) => MutableModel<KPI> | void): KPI;
}

type EagerKPIData = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<KPIData, 'id'>;
  };
  readonly id: string;
  readonly kpiID: string;
  readonly xAxisValue?: string | null;
  readonly yAxisvalue?: number | null;
  readonly date: string;
  readonly description?: string | null;
  readonly orderIndex?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyKPIData = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<KPIData, 'id'>;
  };
  readonly id: string;
  readonly kpiID: string;
  readonly xAxisValue?: string | null;
  readonly yAxisvalue?: number | null;
  readonly date: string;
  readonly description?: string | null;
  readonly orderIndex?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type KPIData = LazyLoading extends LazyLoadingDisabled ? EagerKPIData : LazyKPIData

export declare const KPIData: (new (init: ModelInit<KPIData>) => KPIData) & {
  copyOf(source: KPIData, mutator: (draft: MutableModel<KPIData>) => MutableModel<KPIData> | void): KPIData;
}

type EagerQuiz = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Quiz, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly questions?: (Question | null)[] | null;
  readonly learningId: string;
  readonly learning?: Learning | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyQuiz = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Quiz, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly description?: string | null;
  readonly questions: AsyncCollection<Question>;
  readonly learningId: string;
  readonly learning: AsyncItem<Learning | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Quiz = LazyLoading extends LazyLoadingDisabled ? EagerQuiz : LazyQuiz

export declare const Quiz: (new (init: ModelInit<Quiz>) => Quiz) & {
  copyOf(source: Quiz, mutator: (draft: MutableModel<Quiz>) => MutableModel<Quiz> | void): Quiz;
}

type EagerQuestion = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Question, 'id'>;
  };
  readonly id: string;
  readonly content: string;
  readonly options: (string | null)[];
  readonly correctOption: number;
  readonly explanation?: string | null;
  readonly orderIndex?: number | null;
  readonly quizId: string;
  readonly quiz?: Quiz | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyQuestion = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Question, 'id'>;
  };
  readonly id: string;
  readonly content: string;
  readonly options: (string | null)[];
  readonly correctOption: number;
  readonly explanation?: string | null;
  readonly orderIndex?: number | null;
  readonly quizId: string;
  readonly quiz: AsyncItem<Quiz | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Question = LazyLoading extends LazyLoadingDisabled ? EagerQuestion : LazyQuestion

export declare const Question: (new (init: ModelInit<Question>) => Question) & {
  copyOf(source: Question, mutator: (draft: MutableModel<Question>) => MutableModel<Question> | void): Question;
}

type EagerPost = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Post, 'id'>;
  };
  readonly id: string;
  readonly content: string;
  readonly organizationId?: string | null;
  readonly isDefault?: boolean | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyPost = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Post, 'id'>;
  };
  readonly id: string;
  readonly content: string;
  readonly organizationId?: string | null;
  readonly isDefault?: boolean | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Post = LazyLoading extends LazyLoadingDisabled ? EagerPost : LazyPost

export declare const Post: (new (init: ModelInit<Post>) => Post) & {
  copyOf(source: Post, mutator: (draft: MutableModel<Post>) => MutableModel<Post> | void): Post;
}

type EagerLearning = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Learning, 'id'>;
  };
  readonly id: string;
  readonly orderIndex?: number | null;
  readonly title: string;
  readonly description?: string | null;
  readonly chapters?: (Chapter | null)[] | null;
  readonly quizzes?: (Quiz | null)[] | null;
  readonly learningProgress?: (LearningProgress | null)[] | null;
  readonly quizScore?: number | null;
  readonly quizStatementsCount?: number | null;
  readonly hasQuizTaken?: boolean | null;
  readonly isDefault?: boolean | null;
  readonly readTime?: string | null;
  readonly organizationID?: string | null;
  readonly organization?: Organization | null;
  readonly clonedFromID?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyLearning = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Learning, 'id'>;
  };
  readonly id: string;
  readonly orderIndex?: number | null;
  readonly title: string;
  readonly description?: string | null;
  readonly chapters: AsyncCollection<Chapter>;
  readonly quizzes: AsyncCollection<Quiz>;
  readonly learningProgress: AsyncCollection<LearningProgress>;
  readonly quizScore?: number | null;
  readonly quizStatementsCount?: number | null;
  readonly hasQuizTaken?: boolean | null;
  readonly isDefault?: boolean | null;
  readonly readTime?: string | null;
  readonly organizationID?: string | null;
  readonly organization: AsyncItem<Organization | undefined>;
  readonly clonedFromID?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Learning = LazyLoading extends LazyLoadingDisabled ? EagerLearning : LazyLearning

export declare const Learning: (new (init: ModelInit<Learning>) => Learning) & {
  copyOf(source: Learning, mutator: (draft: MutableModel<Learning>) => MutableModel<Learning> | void): Learning;
}

type EagerChapter = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Chapter, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly slug?: string | null;
  readonly position?: number | null;
  readonly postId?: string | null;
  readonly post?: Post | null;
  readonly learningId: string;
  readonly learning?: Learning | null;
  readonly sections?: (Section | null)[] | null;
  readonly organizationId?: string | null;
  readonly isDefault?: boolean | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyChapter = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Chapter, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly slug?: string | null;
  readonly position?: number | null;
  readonly postId?: string | null;
  readonly post: AsyncItem<Post | undefined>;
  readonly learningId: string;
  readonly learning: AsyncItem<Learning | undefined>;
  readonly sections: AsyncCollection<Section>;
  readonly organizationId?: string | null;
  readonly isDefault?: boolean | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Chapter = LazyLoading extends LazyLoadingDisabled ? EagerChapter : LazyChapter

export declare const Chapter: (new (init: ModelInit<Chapter>) => Chapter) & {
  copyOf(source: Chapter, mutator: (draft: MutableModel<Chapter>) => MutableModel<Chapter> | void): Chapter;
}

type EagerSection = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Section, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly slug?: string | null;
  readonly position?: number | null;
  readonly chapterId: string;
  readonly chapter?: Chapter | null;
  readonly subSections?: (SubSection | null)[] | null;
  readonly organizationId?: string | null;
  readonly postId?: string | null;
  readonly post?: Post | null;
  readonly isDefault?: boolean | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazySection = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Section, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly slug?: string | null;
  readonly position?: number | null;
  readonly chapterId: string;
  readonly chapter: AsyncItem<Chapter | undefined>;
  readonly subSections: AsyncCollection<SubSection>;
  readonly organizationId?: string | null;
  readonly postId?: string | null;
  readonly post: AsyncItem<Post | undefined>;
  readonly isDefault?: boolean | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Section = LazyLoading extends LazyLoadingDisabled ? EagerSection : LazySection

export declare const Section: (new (init: ModelInit<Section>) => Section) & {
  copyOf(source: Section, mutator: (draft: MutableModel<Section>) => MutableModel<Section> | void): Section;
}

type EagerSubSection = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<SubSection, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly slug?: string | null;
  readonly position?: number | null;
  readonly sectionId: string;
  readonly section?: Section | null;
  readonly postId?: string | null;
  readonly post?: Post | null;
  readonly organizationId?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazySubSection = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<SubSection, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly slug?: string | null;
  readonly position?: number | null;
  readonly sectionId: string;
  readonly section: AsyncItem<Section | undefined>;
  readonly postId?: string | null;
  readonly post: AsyncItem<Post | undefined>;
  readonly organizationId?: string | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type SubSection = LazyLoading extends LazyLoadingDisabled ? EagerSubSection : LazySubSection

export declare const SubSection: (new (init: ModelInit<SubSection>) => SubSection) & {
  copyOf(source: SubSection, mutator: (draft: MutableModel<SubSection>) => MutableModel<SubSection> | void): SubSection;
}

type EagerTangible = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Tangible, 'id'>;
  };
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly date: string;
  readonly projectID: string;
  readonly project?: Project | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyTangible = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Tangible, 'id'>;
  };
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly date: string;
  readonly projectID: string;
  readonly project: AsyncItem<Project | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Tangible = LazyLoading extends LazyLoadingDisabled ? EagerTangible : LazyTangible

export declare const Tangible: (new (init: ModelInit<Tangible>) => Tangible) & {
  copyOf(source: Tangible, mutator: (draft: MutableModel<Tangible>) => MutableModel<Tangible> | void): Tangible;
}

type EagerIntangible = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Intangible, 'id'>;
  };
  readonly id: string;
  readonly text: string;
  readonly projectID: string;
  readonly project?: Project | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyIntangible = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Intangible, 'id'>;
  };
  readonly id: string;
  readonly text: string;
  readonly projectID: string;
  readonly project: AsyncItem<Project | undefined>;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Intangible = LazyLoading extends LazyLoadingDisabled ? EagerIntangible : LazyIntangible

export declare const Intangible: (new (init: ModelInit<Intangible>) => Intangible) & {
  copyOf(source: Intangible, mutator: (draft: MutableModel<Intangible>) => MutableModel<Intangible> | void): Intangible;
}

type EagerSubscriptionInvoice = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<SubscriptionInvoice, 'id'>;
  };
  readonly id: string;
  readonly organizationId: string;
  readonly organization?: Organization | null;
  readonly stripeInvoiceId: string;
  readonly amount: number;
  readonly status: string;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
  readonly userCount: number;
  readonly pricePerUser: number;
  readonly billingPeriod: string;
  readonly hostedInvoiceUrl?: string | null;
  readonly invoicePdfUrl?: string | null;
  readonly isProrated: boolean;
  readonly proratedAmount?: number | null;
  readonly basePrice: number;
  readonly prorationDate?: string | null;
  readonly licenseChange?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazySubscriptionInvoice = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<SubscriptionInvoice, 'id'>;
  };
  readonly id: string;
  readonly organizationId: string;
  readonly organization: AsyncItem<Organization | undefined>;
  readonly stripeInvoiceId: string;
  readonly amount: number;
  readonly status: string;
  readonly billingPeriodStart: string;
  readonly billingPeriodEnd: string;
  readonly userCount: number;
  readonly pricePerUser: number;
  readonly billingPeriod: string;
  readonly hostedInvoiceUrl?: string | null;
  readonly invoicePdfUrl?: string | null;
  readonly isProrated: boolean;
  readonly proratedAmount?: number | null;
  readonly basePrice: number;
  readonly prorationDate?: string | null;
  readonly licenseChange?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type SubscriptionInvoice = LazyLoading extends LazyLoadingDisabled ? EagerSubscriptionInvoice : LazySubscriptionInvoice

export declare const SubscriptionInvoice: (new (init: ModelInit<SubscriptionInvoice>) => SubscriptionInvoice) & {
  copyOf(source: SubscriptionInvoice, mutator: (draft: MutableModel<SubscriptionInvoice>) => MutableModel<SubscriptionInvoice> | void): SubscriptionInvoice;
}

type EagerShopItem = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ShopItem, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly price: number;
  readonly image?: string | null;
  readonly isEnabled: boolean;
  readonly organizationID: string;
  readonly organization?: Organization | null;
  readonly type?: string | null;
  readonly purchases?: (UserPurchase | null)[] | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyShopItem = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<ShopItem, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly name: string;
  readonly description?: string | null;
  readonly price: number;
  readonly image?: string | null;
  readonly isEnabled: boolean;
  readonly organizationID: string;
  readonly organization: AsyncItem<Organization | undefined>;
  readonly type?: string | null;
  readonly purchases: AsyncCollection<UserPurchase>;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type ShopItem = LazyLoading extends LazyLoadingDisabled ? EagerShopItem : LazyShopItem

export declare const ShopItem: (new (init: ModelInit<ShopItem>) => ShopItem) & {
  copyOf(source: ShopItem, mutator: (draft: MutableModel<ShopItem>) => MutableModel<ShopItem> | void): ShopItem;
}

type EagerUserPurchase = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserPurchase, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly shopItemID: string;
  readonly shopItem?: ShopItem | null;
  readonly user_sub: string;
  readonly purchaseDate: string;
  readonly organizationID: string;
  readonly organization?: Organization | null;
  readonly status: string;
  readonly approvedBy?: string | null;
  readonly approvedDate?: string | null;
  readonly rejectionReason?: string | null;
  readonly deliveryNotes?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUserPurchase = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<UserPurchase, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly shopItemID: string;
  readonly shopItem: AsyncItem<ShopItem | undefined>;
  readonly user_sub: string;
  readonly purchaseDate: string;
  readonly organizationID: string;
  readonly organization: AsyncItem<Organization | undefined>;
  readonly status: string;
  readonly approvedBy?: string | null;
  readonly approvedDate?: string | null;
  readonly rejectionReason?: string | null;
  readonly deliveryNotes?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type UserPurchase = LazyLoading extends LazyLoadingDisabled ? EagerUserPurchase : LazyUserPurchase

export declare const UserPurchase: (new (init: ModelInit<UserPurchase>) => UserPurchase) & {
  copyOf(source: UserPurchase, mutator: (draft: MutableModel<UserPurchase>) => MutableModel<UserPurchase> | void): UserPurchase;
}

type EagerUser = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<User, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly cognitoID: string;
  readonly email: string;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly profileImageKey?: string | null;
  readonly profileImagePath?: string | null;
  readonly profileImageUrl?: string | null;
  readonly lastLogin?: string | null;
  readonly source?: string | null;
  readonly termsAccepted?: boolean | null;
  readonly termsAcceptedDate?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

type LazyUser = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<User, 'id'>;
    readOnlyFields: 'createdAt' | 'updatedAt';
  };
  readonly id: string;
  readonly cognitoID: string;
  readonly email: string;
  readonly firstName?: string | null;
  readonly lastName?: string | null;
  readonly profileImageKey?: string | null;
  readonly profileImagePath?: string | null;
  readonly profileImageUrl?: string | null;
  readonly lastLogin?: string | null;
  readonly source?: string | null;
  readonly termsAccepted?: boolean | null;
  readonly termsAcceptedDate?: string | null;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
  readonly createdAt?: string | null;
  readonly updatedAt?: string | null;
}

export declare type User = LazyLoading extends LazyLoadingDisabled ? EagerUser : LazyUser

export declare const User: (new (init: ModelInit<User>) => User) & {
  copyOf(source: User, mutator: (draft: MutableModel<User>) => MutableModel<User> | void): User;
}

type EagerIssue = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Issue, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: IssueCategory | keyof typeof IssueCategory;
  readonly priority: IssuePriority | keyof typeof IssuePriority;
  readonly status: IssueStatus | keyof typeof IssueStatus;
  readonly attachments?: (string | null)[] | null;
  readonly reporterEmail: string;
  readonly reporterName: string;
  readonly reporterID: string;
  readonly organizationID: string;
  readonly assignedToEmail?: string | null;
  readonly assignedToName?: string | null;
  readonly responses?: (IssueResponse | null)[] | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyIssue = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<Issue, 'id'>;
  };
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: IssueCategory | keyof typeof IssueCategory;
  readonly priority: IssuePriority | keyof typeof IssuePriority;
  readonly status: IssueStatus | keyof typeof IssueStatus;
  readonly attachments?: (string | null)[] | null;
  readonly reporterEmail: string;
  readonly reporterName: string;
  readonly reporterID: string;
  readonly organizationID: string;
  readonly assignedToEmail?: string | null;
  readonly assignedToName?: string | null;
  readonly responses: AsyncCollection<IssueResponse>;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type Issue = LazyLoading extends LazyLoadingDisabled ? EagerIssue : LazyIssue

export declare const Issue: (new (init: ModelInit<Issue>) => Issue) & {
  copyOf(source: Issue, mutator: (draft: MutableModel<Issue>) => MutableModel<Issue> | void): Issue;
}

type EagerIssueResponse = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<IssueResponse, 'id'>;
  };
  readonly id: string;
  readonly message: string;
  readonly isAdminResponse: boolean;
  readonly responderEmail: string;
  readonly responderName: string;
  readonly responderID: string;
  readonly attachments?: (string | null)[] | null;
  readonly issueID: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyIssueResponse = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<IssueResponse, 'id'>;
  };
  readonly id: string;
  readonly message: string;
  readonly isAdminResponse: boolean;
  readonly responderEmail: string;
  readonly responderName: string;
  readonly responderID: string;
  readonly attachments?: (string | null)[] | null;
  readonly issueID: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type IssueResponse = LazyLoading extends LazyLoadingDisabled ? EagerIssueResponse : LazyIssueResponse

export declare const IssueResponse: (new (init: ModelInit<IssueResponse>) => IssueResponse) & {
  copyOf(source: IssueResponse, mutator: (draft: MutableModel<IssueResponse>) => MutableModel<IssueResponse> | void): IssueResponse;
}

type EagerLearningSession = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<LearningSession, 'id'>;
  };
  readonly id: string;
  readonly userSub: string;
  readonly organizationID: string;
  readonly learningID: string;
  readonly startTime: string;
  readonly endTime?: string | null;
  readonly duration?: number | null;
  readonly sectionsViewed?: (string | null)[] | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyLearningSession = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<LearningSession, 'id'>;
  };
  readonly id: string;
  readonly userSub: string;
  readonly organizationID: string;
  readonly learningID: string;
  readonly startTime: string;
  readonly endTime?: string | null;
  readonly duration?: number | null;
  readonly sectionsViewed?: (string | null)[] | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type LearningSession = LazyLoading extends LazyLoadingDisabled ? EagerLearningSession : LazyLearningSession

export declare const LearningSession: (new (init: ModelInit<LearningSession>) => LearningSession) & {
  copyOf(source: LearningSession, mutator: (draft: MutableModel<LearningSession>) => MutableModel<LearningSession> | void): LearningSession;
}

type EagerLearningProgress = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<LearningProgress, 'id'>;
  };
  readonly id: string;
  readonly userSub: string;
  readonly organizationID: string;
  readonly learningID: string;
  readonly learning?: Learning | null;
  readonly chaptersCompleted?: (string | null)[] | null;
  readonly sectionsViewed?: (string | null)[] | null;
  readonly totalTimeSpent?: number | null;
  readonly lastAccessedAt?: string | null;
  readonly completionPercentage?: number | null;
  readonly firstAccessedAt?: string | null;
  readonly totalSessions?: number | null;
  readonly averageSessionDuration?: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazyLearningProgress = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<LearningProgress, 'id'>;
  };
  readonly id: string;
  readonly userSub: string;
  readonly organizationID: string;
  readonly learningID: string;
  readonly learning: AsyncItem<Learning | undefined>;
  readonly chaptersCompleted?: (string | null)[] | null;
  readonly sectionsViewed?: (string | null)[] | null;
  readonly totalTimeSpent?: number | null;
  readonly lastAccessedAt?: string | null;
  readonly completionPercentage?: number | null;
  readonly firstAccessedAt?: string | null;
  readonly totalSessions?: number | null;
  readonly averageSessionDuration?: number | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type LearningProgress = LazyLoading extends LazyLoadingDisabled ? EagerLearningProgress : LazyLearningProgress

export declare const LearningProgress: (new (init: ModelInit<LearningProgress>) => LearningProgress) & {
  copyOf(source: LearningProgress, mutator: (draft: MutableModel<LearningProgress>) => MutableModel<LearningProgress> | void): LearningProgress;
}

type EagerSectionInteraction = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<SectionInteraction, 'id'>;
  };
  readonly id: string;
  readonly userSub: string;
  readonly organizationID: string;
  readonly learningID: string;
  readonly chapterID: string;
  readonly sectionID: string;
  readonly timeSpent?: number | null;
  readonly viewCount?: number | null;
  readonly lastViewedAt: string;
  readonly firstViewedAt: string;
  readonly completed?: boolean | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

type LazySectionInteraction = {
  readonly [__modelMeta__]: {
    identifier: ManagedIdentifier<SectionInteraction, 'id'>;
  };
  readonly id: string;
  readonly userSub: string;
  readonly organizationID: string;
  readonly learningID: string;
  readonly chapterID: string;
  readonly sectionID: string;
  readonly timeSpent?: number | null;
  readonly viewCount?: number | null;
  readonly lastViewedAt: string;
  readonly firstViewedAt: string;
  readonly completed?: boolean | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly _version?: number | null;
  readonly _deleted?: boolean | null;
  readonly _lastChangedAt?: number | null;
}

export declare type SectionInteraction = LazyLoading extends LazyLoadingDisabled ? EagerSectionInteraction : LazySectionInteraction

export declare const SectionInteraction: (new (init: ModelInit<SectionInteraction>) => SectionInteraction) & {
  copyOf(source: SectionInteraction, mutator: (draft: MutableModel<SectionInteraction>) => MutableModel<SectionInteraction> | void): SectionInteraction;
}