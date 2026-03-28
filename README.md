# VibeStack

Enterprise SaaS platform. 234K lines of code across four services. Built over 12 months with Claude (Sonnet 3.0 through 4.5), Cursor, and Claude Code CLI.

Started as a Laravel monolith. I migrated it to AWS Amplify serverless one endpoint at a time while keeping the system live.

## Structure

```
VibeStack/
├── amplify-backend/   # AppSync GraphQL, 14 Lambda functions, Cognito, DynamoDB
├── web-app/           # React 18 + Amplify + TailwindCSS
├── mobile-app/        # React Native + Expo (iOS & Android)
└── pdf-service/       # FastAPI + Puppeteer + S3
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│              AWS Amplify Serverless Backend                   │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐          │
│  │  Cognito   │  │  AppSync    │  │  DynamoDB    │          │
│  │  (Auth)    │  │  (GraphQL)  │  │  (Data)      │          │
│  └────────────┘  └─────────────┘  └──────────────┘          │
│                         │                                     │
│            ┌────────────┴──────────────┐                      │
│            │   14 Lambda Functions     │                      │
│            │  Payments, Email, PDF,    │                      │
│            │  Auth, Webhooks, Sync     │                      │
│            └───────────────────────────┘                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   ┌────▼─────┐  ┌────▼─────┐  ┌────▼────────┐
   │ Web App  │  │ Mobile   │  │ PDF Service │
   │ (React)  │  │ (RN)     │  │ (FastAPI)   │
   │ 141K loc │  │ 3.6K loc │  │ 2.3K loc    │
   └──────────┘  └──────────┘  └─────────────┘
```

## Numbers

| Component | Lines of Code |
|-----------|---------------|
| Amplify Backend | 86,865 |
| Web App | 141,325 |
| Mobile App | 3,563 |
| PDF Service | 2,323 |
| **Total** | **234,076** |

## Stack

**Frontend:** React 18, React Native + Expo, TailwindCSS, GraphQL via AppSync

**Backend:** AWS AppSync, 14 Lambda functions (Node.js), Cognito auth, DynamoDB, S3

**PDF Service:** FastAPI, Puppeteer for HTML-to-PDF, S3 storage, batch queue processing

**Lambda functions:** Stripe payments (subscribe, cancel, webhooks, customer creation), email service (feedback, notifications, invites, PDF delivery), user management, quiz engine, MySQL sync, PDF generation

## What It Does

Multi-tenant org management with role-based access. Project boards with drag-drop. Assessment builder with conditional logic. Report generation and export. Stripe billing per org. Real-time GraphQL subscriptions. Automated PDF reports with per-org branding.

Mobile app runs offline-first with biometric auth, push notifications, camera integration, and a sync engine that handles conflicts.

PDF service renders templates, generates charts, processes batches, uploads to S3 with signed URLs.

## How I Built It

March 2025: I wrote the first prompt to Claude Sonnet 3.0 in Cursor. The backend was Laravel and MySQL. Over the next three months I built the React web app, the assessment engine, and the report system.

July 2025: Added the React Native app and the PDF service. Started the Amplify migration. Sonnet 3.5 handled the Lambda conversions. I moved one controller at a time from Laravel to a Lambda + AppSync resolver. Kept both systems running in parallel.

October 2025: Full serverless. AppSync handled all GraphQL, DynamoDB replaced MySQL for most tables, Cognito replaced custom auth. Sonnet 4.0 helped me refactor the CloudFormation templates and sort out IAM permissions.

January 2026: Performance tuning, docs, cleanup. Sonnet 4.5 and Claude Code CLI for batch refactoring across the codebase.

200K lines of PHP became 87K lines of serverless config and functions.

## Migration Approach

Incremental. One endpoint at a time. I converted a Laravel controller to a Lambda, tested it, pointed the frontend at the new endpoint, then removed the old code. Both systems ran side by side for months.

Converting a controller to Lambda + AppSync resolver took about 15 minutes with Claude. Reading AWS docs to do it by hand would take hours.

## What I Learned

Small prompts with specific context produce better code than broad instructions. I reviewed every generated CloudFormation template before deploying. When I tried migrating three services at once, I broke the system and rolled back. One at a time worked.

Claude explained patterns I hadn't used before (DynamoDB single-table design, AppSync VTL resolvers). I asked it to explain first, then generate. That order matters.

## Setup

```bash
# Backend (requires AWS account + Amplify CLI)
cd web-app
npm install -g @aws-amplify/cli
amplify configure
amplify init
amplify push

# Web app
cd web-app
npm install
npm start

# Mobile
cd mobile-app
npm install
npx expo start

# PDF service
cd pdf-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

See `.env.example` files in each directory for required credentials.

## License

MIT

## Author

Abhishek Paul — [@abhiFSD](https://github.com/abhiFSD)

Tools: Claude Sonnet 3.0 through 4.5, Cursor, Claude Code CLI.
