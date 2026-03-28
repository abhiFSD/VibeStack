# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VibeStack™ Pro** is a comprehensive React web application for lean manufacturing and business improvement. It provides 21+ lean methodology tools (5S, Value Stream Mapping, Kaizen, PDCA, etc.) with multi-tenant organization support, subscription management, and professional PDF reporting capabilities.

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# AWS Amplify commands
npm run amplify-modelgen    # Generate GraphQL models
npm run amplify-push       # Deploy backend changes
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 18.2.0 with Create React App, React Bootstrap, Chart.js
- **Backend**: AWS Amplify with 12+ Lambda functions
- **Database**: GraphQL (AppSync) + MySQL (via Lambda)
- **Auth**: AWS Cognito with multi-organization support
- **Storage**: AWS S3 for file attachments
- **Payments**: Stripe integration
- **PDF Generation**: Multiple Lambda functions for professional reports

### Key Architectural Patterns

**Multi-Tenant Architecture**
- Organization-based data segregation
- Role-based access control (Admin, User, Super Admin)
- Users can belong to multiple organizations
- Organization selector component for context switching

**Context-Based State Management**
The app uses React Context extensively instead of Redux:
- `UserContext` - Authentication and user profile
- `OrganizationContext` - Multi-tenant organization management
- `ToolContext` - Lean tools configuration and data
- `AwardContext` - Gamification and rewards system
- `AdminContext` - Administrative functionality

**Component Organization**
```
/src/components/
├── screens/          # Main pages (Home, Reports, Tools, etc.)
├── reports/          # Lean methodology report components
├── shared/           # Reusable components across the app
├── auth/             # Authentication-related components
├── organization/     # Organization management UI
├── shop/             # Internal shop/rewards system
├── modals/           # Modal dialog components
└── layouts/          # Layout wrapper components
```

**Backend Lambda Functions**
Critical serverless functions handle:
- `generatePDF2325` - Professional PDF report generation
- `handleStripeWebhook` - Stripe payment processing
- `emailService` / `notificationEmail` - Email notifications
- `fetchDataFromMySQL` - Database operations
- `handleUserManagement` - User lifecycle management

### Data Flow Patterns

**Report Management**
Reports are the core entity with different types (5S, VSM, Kaizen, etc.). Each report type has:
- Dedicated edit/view components in `/components/reports/`
- PDF generation capabilities
- Attachment management
- Action item tracking
- Real-time collaboration features

**Authentication Flow**
1. Landing page at `/` (public)
2. Login/signup at `/login` using AWS Cognito
3. Organization selection if user belongs to multiple orgs
4. Redirect to `/dashboard` (authenticated area)

**PDF Generation Workflow**
1. Frontend components in `/components/public/` render PDF-ready views
2. Lambda functions generate professional PDFs with charts
3. S3 storage for PDF files and attachments
4. Email delivery via SES integration

### Important File Locations

**Configuration**
- `/src/App.js` - Main app component with Amplify configuration
- `/src/AppRouter.js` - Complete routing configuration
- `/amplify/backend/backend-config.json` - AWS backend configuration

**Context Providers**
- `/src/contexts/` - All React Context providers for global state

**API Integration**
- `/src/graphql/` - GraphQL queries, mutations, and subscriptions
- `/src/utils/` - API helpers and utility functions

**Static Data**
- `/src/json/` - Static configuration for lean tools and methodology data

### Development Guidelines

**Component Patterns**
- Use React Bootstrap for UI consistency
- Implement responsive design with Bootstrap classes
- Follow established naming conventions for report components
- Use Formik + Yup for form handling and validation

**State Management**
- Prefer React Context over prop drilling
- Use local state for component-specific data
- Leverage GraphQL subscriptions for real-time updates

**API Integration**
- Use GraphQL for real-time data operations
- REST APIs (via Lambda) for specific business logic
- Handle multi-organization data filtering at query level

**PDF Generation**
- PDF components are in `/components/public/` and `/components/reports_pdf/`
- Use Chart.js for embedded charts in PDFs
- Follow existing PDF styling patterns for consistency

**Testing**
- Test files should follow Create React App conventions
- Focus on component integration tests
- Mock AWS services for unit tests

## Multi-Organization Considerations

This app is designed as a multi-tenant system where:
- Users can belong to multiple organizations
- Data is strictly segregated by organization
- Organization context must be maintained throughout the app
- All API calls should include organization filtering
- UI components should respect organization-specific configurations

## Deployment

The app uses AWS Amplify for deployment:
- Frontend deploys automatically via Amplify hosting
- Backend changes require `amplify push`
- Lambda functions deploy independently
- GraphQL schema changes require model regeneration

When working on this codebase, always consider the multi-tenant nature and ensure organization-level data isolation is maintained.