# VibeStack™ Pro - Technical Stack Documentation

## Frontend Technologies

### Core Framework
- **React 18.2.0** - Component-based UI with Hooks and functional components
- **Create React App 5.0.1** - Zero-config build setup with webpack, Babel, ESLint
- **React Router DOM 6.11.1** - Declarative routing with nested route support

### UI Framework & Styling  
- **React Bootstrap 2.10.8** - Bootstrap components rebuilt for React
- **Bootstrap 5.3.3** - Responsive grid system and utility classes
- **Custom Theme CSS** - `/styles/theme.css` for brand-specific styling
- **FontAwesome 6.7.2** - Comprehensive icon sets (solid, regular, brands)
- **React Icons 5.5.0** - Popular icon libraries as React components

### State Management Architecture
- **React Context API** - Multiple context providers for different domains:
  - `UserContext` - Authentication state and user profile
  - `OrganizationContext` - Multi-tenant organization switching
  - `ToolContext` - Lean tool configurations
  - `AwardContext` - Gamification and rewards
  - `AdminContext` - Administrative features
  - `TutorialContext` - User onboarding
  - `ActionItemsContext` - Task management
- **AWS Amplify DataStore 4.3.0** - Offline-first data sync with conflict resolution

### Data Visualization Libraries
- **Chart.js 4.4.8** with **React-ChartJS-2 5.3.0** - Interactive charts (bar, line, pie, radar, pareto)
- **Victory 36.9.2** - Composable React components for data viz
- **D3-Scale 4.0.2** - Mathematical scales for data mapping
- **React Simple Maps 3.0.0** - SVG maps for geographic data

### Form Management
- **Formik 2.4.6** - Form state management with validation hooks
- **Yup 1.6.1** - Object schema validation with custom error messages

### Rich Text Editing
- **React Quill 2.0.0** - Full-featured WYSIWYG editor (actively used in 8 components)
- **@tinymce/tinymce-react 5.1.1** & **tinymce 7.5.1** - Alternative editor (included but not actively used)
- **React Markdown 10.1.0** - Markdown to JSX conversion

### PDF Generation Pipeline
- **jsPDF 2.5.1** - Client-side PDF generation
- **html2pdf.js 0.10.1** - HTML/CSS to PDF conversion
- **html2canvas 1.4.1** - DOM screenshot capability
- **dom-to-image 2.6.0** - DOM node to image conversion

### Drag & Drop Interactions
- **@hello-pangea/dnd 17.0.0** - Accessible drag and drop (maintained fork of react-beautiful-dnd)
- **React Beautiful DnD 13.1.1** - Legacy drag and drop (still referenced)
- **React Draggable 4.4.6** - Make any component draggable

### UI Components & Interactions
- **React Datepicker 8.1.0** - Customizable date/time picker
- **React Calendar 5.1.0** - Full calendar component
- **React Select 5.10.1** - Searchable, async select inputs
- **React Color 2.19.3** - Color picker components
- **React Joyride 2.9.3** - Product tours and onboarding
- **Lottie React 2.4.1** - After Effects animations
- **@react-hook/mouse-position 4.1.3** - Mouse tracking hook

## Backend Technologies

### AWS Infrastructure
- **AWS Amplify** - Full-stack development platform
- **AWS CloudFormation** - Infrastructure as Code deployment
- **Region**: us-west-2

### Authentication & Authorization
- **AWS Cognito User Pools**
  - User Pool ID: `us-west-2_LLZTeB8Je`
  - Identity Pool ID: `us-west-2:47c5af52-e963-4349-80fe-4c7752709099`
  - Username attributes: Email
  - MFA: OFF (SMS capability available)
  - Password policy: 8 character minimum
  - Verification: Email-based

### API Architecture
- **AWS AppSync** - Managed GraphQL service
  - Endpoint: `ah2gzx5zdrel3csp6obhtctgtu.appsync-api.us-west-2.amazonaws.com`
  - Authentication modes: API Key (primary), Cognito User Pools, AWS IAM
  - Real-time subscriptions enabled
  - API Key expiration: 365 days
- **AWS API Gateway** - REST API for Lambda functions
  - Endpoint: `ht6jio0xrb.execute-api.us-west-2.amazonaws.com/prod`

### Lambda Functions (14 Active Functions)
1. **generatePDF2325** - Advanced PDF generation with Python layers
2. **handleStripeWebhook** - Stripe webhook event processing (v14.5.0)
3. **fetchDataFromMySQL** - MySQL database queries for learning content
4. **emailService** - AWS SES email delivery service
5. **notificationEmail** - GraphQL-triggered email notifications
6. **handleUserManagement** - User lifecycle operations
7. **createStripeCustomer** - Stripe customer creation
8. **handleSubscribe** - Subscription checkout sessions
9. **handleOrganizationInvite** - Organization invitation workflow
10. **awardEmailMutatuon** - Award notification emails
11. **fetchAllQuizzes** - Quiz data retrieval
12. **emailFeedback** - Feedback submission emails
13. **generatePDFEmail** - PDF generation with email delivery
14. **cancelSubscription** - Subscription cancellation logic

### Database Architecture
- **Primary Database**: GraphQL models via AppSync (DynamoDB backend)
  - 40+ data models including: User, Organization, Report, Project, KPI, etc.
  - Optimistic concurrency with `_version` fields
  - Soft deletes with `_deleted` flags
  - Conflict resolution with `_lastChangedAt` timestamps
- **Secondary Database**: MySQL on AWS RDS
  - Host: `VibeStack.cek0uljrzoho.us-west-2.rds.amazonaws.com`
  - Database: `VibeStack`
  - Used for: Learning content (chapters, sections, posts)

### Storage Services
- **AWS S3 Bucket**: `lf-api-storage-2b19a34bccf91-prod`
  - Public/private file uploads
  - Attachment storage
  - Generated PDF storage
  - User avatars and images

### Payment Infrastructure
- **Stripe Integration**
  - SDK Version: 17.6.0 (frontend), 14.5.0 (Lambda)
  - Webhook handling for subscription events
  - Customer portal integration
  - Billing periods: Monthly and Yearly
  - Multi-license support

### Email Services
- **AWS SES** (Simple Email Service)
  - Region: us-west-2
  - Template-based emails
  - Transactional notifications

## Development & Build Tools

### Runtime Environment
- **Node.js 18.20.5** (via NVM)
- **npm** - Package management
- **Build Memory**: 4GB allocated (`--max-old-space-size=4096`)

### Build Configuration
- **React Scripts 5.0.1** - CRA build tooling
- **Webpack** - Module bundling (via CRA)
- **Babel** - JavaScript transpilation
- **ESLint** - Code linting (react-app preset)

### Testing Libraries
- **@testing-library/react 13.4.0** - React component testing
- **@testing-library/jest-dom 5.16.5** - DOM matchers
- **@testing-library/user-event 13.5.0** - User interaction simulation
- **Jest** - Test runner (via CRA)

### Development Dependencies
- **ini 1.3.5** - Config file parsing
- **inquirer 6.5.1** - Interactive CLI prompts

## Third-Party Services & Integrations

### Payment Processing
- **Stripe.js 5.10.0** & **React Stripe.js 3.4.0**
  - Customer management
  - Subscription billing
  - Invoice history
  - Webhook events processing

### Maps & Location Services
- **@react-google-maps/api 2.20.6** - Google Maps React components
- **@googlemaps/js-api-loader 1.16.8** - Dynamic maps loading
- **react-google-autocomplete 2.7.4** - Place autocomplete

### AWS SDK Integration
- **aws-amplify 5.2.1** - Amplify JS library
- **@aws-amplify/ui-react 4.6.4** - Amplify UI components
- **aws-sdk 2.1692.0** - AWS service integration
- **@aws-sdk/client-cognito-identity-provider 3.768.0** - Cognito operations
- **@aws-sdk/credential-providers 3.768.0** - AWS credentials

### Utilities
- **Axios 1.9.0** - Promise-based HTTP client
- **Lodash 4.17.21** - Utility functions
- **date-fns 4.1.0** & **Luxon 3.5.0** - Date manipulation
- **Web Vitals 2.1.4** - Core Web Vitals monitoring

## Application Architecture

### Multi-Tenant Architecture
- **Organization-based isolation** - Strict data segregation
- **Multiple organization support** - Users can belong to multiple orgs
- **Organization selector** - Context switching UI
- **Role hierarchy**: Super Admin > Admin > User

### Data Models (40+ GraphQL Types)
Key entities include:
- Core: User, Organization, Department, OrganizationMember
- Reports: Report, Categories, Statements, Highlights
- Projects: Project, ProjectMember, Tangible, Intangible
- Lean Tools: Vsm, ChartData, ActionItems
- Learning: Learning, Chapter, Section, SubSection, Quiz
- Gamification: Awards, AwardDefinition, UserCoins
- Commerce: SubscriptionInvoice, ShopItem, UserPurchase
- Support: Issue, IssueResponse, Feedback

### Real-time Features
- **GraphQL Subscriptions** - Live data updates
- **Optimistic UI** - Immediate feedback
- **Conflict Resolution** - Version-based merging
- **Collaborative Editing** - Multiple users per report

### Component Structure
```
/src/components/
├── screens/         # Page-level components
├── reports/         # 21+ lean methodology tools
├── shared/          # Reusable UI components
├── auth/            # Authentication flows
├── organization/    # Org management
├── shop/            # Internal rewards store
├── Learning/        # Training modules
├── Project/         # Project management
├── analytics/       # Data visualization
└── subscription/    # Payment UI
```

## Deployment Pipeline

### Hosting Infrastructure
- **AWS Amplify Console** - Continuous deployment
- **Git-based workflow** - Push to deploy
- **Branch deployments** - Multiple environments

### Build Commands
```bash
npm start                 # Local development
npm run build            # Production build
npm run amplify-modelgen # Generate GraphQL models
npm run amplify-push     # Deploy backend changes
```

### Environment Configuration
- **aws-exports.js** - Auto-generated config
- **Environment variables** - Secured in Amplify Console
- **API Keys** - Rotated annually

## Security Implementation

### Authentication Flow
- **AWS Cognito JWT tokens** - Secure sessions
- **Email verification** - Account activation
- **Password requirements** - 8+ characters
- **Session management** - Automatic refresh

### API Security Layers
1. **API Key** - Public operations
2. **Cognito User Pools** - Authenticated users
3. **AWS IAM** - Service-to-service
4. **GraphQL authorization** - Field-level security

### Data Protection
- **TLS/SSL** - All connections encrypted
- **S3 encryption** - Server-side encryption
- **DynamoDB encryption** - Encryption at rest
- **Stripe webhook validation** - Signature verification
- **CORS configuration** - Controlled origins