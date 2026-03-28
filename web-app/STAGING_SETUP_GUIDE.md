# Complete Guide: Setting Up Staging Environment for Amplify Application

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Backend Setup - AWS Amplify](#backend-setup---aws-amplify)
4. [Troubleshooting Common Issues](#troubleshooting-common-issues)
5. [Frontend Hosting Setup](#frontend-hosting-setup)
6. [Environment Management](#environment-management)
7. [Important Notes and Warnings](#important-notes-and-warnings)

---

## Overview

This guide provides step-by-step instructions for creating a complete staging environment for an AWS Amplify application with React frontend. The staging environment will have:
- Separate AWS resources (Cognito, Lambda, API Gateway, AppSync, S3)
- Independent data and user pools
- Same codebase as production
- Separate hosting environment

### Architecture Components
- **Backend**: AWS Amplify (14 Lambda functions, GraphQL API, REST API, Cognito, S3)
- **Frontend**: React application
- **Hosting**: AWS Amplify Hosting
- **Authentication**: AWS Cognito
- **Storage**: AWS S3

---

## Prerequisites

1. **AWS CLI configured** with appropriate profile
   ```bash
   aws configure --profile LF
   ```

2. **Amplify CLI installed**
   ```bash
   npm install -g @aws-amplify/cli
   ```

3. **Git repository** with your codebase
4. **Node.js** and npm installed
5. **Access to AWS Console** with appropriate permissions

---

## Backend Setup - AWS Amplify

### Step 1: Prepare Your Environment

1. **Check current environment:**
   ```bash
   amplify env list
   ```

2. **Ensure you're on production environment:**
   ```bash
   amplify env checkout prod
   ```

### Step 2: Create Staging Environment

1. **Add new staging environment:**
   ```bash
   AWS_PROFILE=LF amplify env add stage
   ```

2. **When prompted, select:**
   - Authentication method: `AWS profile`
   - Select profile: `LF` (or your configured profile)
   - Environment name: `stage`

### Step 3: Deploy Staging Backend

1. **Push all resources to staging:**
   ```bash
   AWS_PROFILE=LF amplify push --yes
   ```

   This will create:
   - New GraphQL API endpoint
   - New REST API endpoint
   - New Cognito User Pool and Identity Pool
   - New S3 buckets
   - All 14 Lambda functions
   - DynamoDB tables (if using)

2. **Expected output:**
   ```
   GraphQL endpoint: https://[unique-id].appsync-api.us-west-2.amazonaws.com/graphql
   GraphQL API KEY: da2-[unique-key]
   REST API endpoint: https://[unique-id].execute-api.us-west-2.amazonaws.com/stage
   ```

### Step 4: Configure Environment Variables

1. **Update team-provider-info.json with Stripe and other environment variables:**

   After deployment, edit `amplify/team-provider-info.json` to add custom environment variables for the stage environment:

   ```json
   {
     "stage": {
       "categories": {
         "function": {
           "createStripeCustomer": {
             "stripeSecretKey": "sk_live_YOUR_STRIPE_KEY",
             "stripePriceIdMonthly": "price_YOUR_MONTHLY_PRICE",
             "stripePriceIdYearly": "price_YOUR_YEARLY_PRICE",
             "apiLfapiGraphqlapiendpointoutput": "[AUTO_GENERATED]",
             "apiLfapiGraphqlapikeyoutput": "[AUTO_GENERATED]"
           },
           "handleStripeWebhook": {
             "stripeSecretKey": "sk_live_YOUR_STRIPE_KEY",
             "stripeWebhookSecret": "whsec_YOUR_WEBHOOK_SECRET",
             "apiLfapiGraphqlapiendpointoutput": "[AUTO_GENERATED]",
             "apiLfapiGraphqlapikeyoutput": "[AUTO_GENERATED]"
           }
         }
       }
     }
   }
   ```

2. **Push environment variable updates:**
   ```bash
   AWS_PROFILE=LF amplify push --yes
   ```

---

## Troubleshooting Common Issues

### Issue 1: Empty aws-exports.js

**Problem:** `aws-exports.js` is generated with minimal configuration
```javascript
const awsmobile = {
    "aws_project_region": "us-west-2"
};
```

**Solution:** Manually update with complete configuration:

1. Get your Cognito User Pool details:
   ```bash
   AWS_PROFILE=LF aws cognito-idp list-user-pools --region us-west-2 --max-results 50
   ```

2. Get User Pool clients:
   ```bash
   AWS_PROFILE=LF aws cognito-idp list-user-pool-clients --user-pool-id [YOUR_POOL_ID] --region us-west-2
   ```

3. Get Identity Pool:
   ```bash
   AWS_PROFILE=LF aws cognito-identity list-identity-pools --max-results 50 --region us-west-2
   ```

4. Update `src/aws-exports.js`:
   ```javascript
   const awsmobile = {
       "aws_project_region": "us-west-2",
       "aws_cognito_identity_pool_id": "us-west-2:[IDENTITY_POOL_ID]",
       "aws_cognito_region": "us-west-2",
       "aws_user_pools_id": "us-west-2_[USER_POOL_ID]",
       "aws_user_pools_web_client_id": "[WEB_CLIENT_ID]",
       "aws_appsync_graphqlEndpoint": "https://[ENDPOINT].appsync-api.us-west-2.amazonaws.com/graphql",
       "aws_appsync_region": "us-west-2",
       "aws_appsync_authenticationType": "API_KEY",
       "aws_appsync_apiKey": "da2-[API_KEY]",
       "aws_cloud_logic_custom": [
           {
               "name": "apifetchdata",
               "endpoint": "https://[ENDPOINT].execute-api.us-west-2.amazonaws.com/stage",
               "region": "us-west-2"
           }
       ],
       "aws_user_files_s3_bucket": "[BUCKET_NAME]",
       "aws_user_files_s3_bucket_region": "us-west-2"
   };
   ```

### Issue 2: Auth Import Error During Pull

**Problem:** Error when pulling staging environment:
```
The previously imported 'lfapi' auth resource was imported from 'undefined' region
No Cognito User Pools were found in the configured region
```

**Solution:**

1. **Option A - Use restore flag:**
   ```bash
   AWS_PROFILE=LF amplify env checkout staging --restore
   ```

2. **Option B - Manual cleanup and recreation:**
   ```bash
   # Remove staging locally
   AWS_PROFILE=LF amplify env remove staging
   
   # Recreate from prod
   AWS_PROFILE=LF amplify env checkout prod
   AWS_PROFILE=LF amplify env add staging
   AWS_PROFILE=LF amplify push
   ```

### Issue 3: "User is not authenticated" Error

**Problem:** Getting authentication errors when testing staging

**Cause:** Staging Cognito User Pool has no users (it's a fresh environment)

**Solutions:**

1. **Create test users in staging:**
   - Go to your app's signup page
   - Create new test accounts
   - Verify email addresses
   - Use test accounts for staging

2. **Import users from production (if needed):**
   ```bash
   # Export from production
   AWS_PROFILE=LF aws cognito-idp list-users --user-pool-id [PROD_POOL_ID] --region us-west-2 > prod_users.json
   
   # Import to staging (requires custom script or manual creation)
   ```

### Issue 4: Amplify Studio Not Showing Staging

**Problem:** Staging environment doesn't appear in Amplify Studio

**Explanation:** CLI-created environments don't automatically appear in Amplify Studio

**Solution:** 
- Use CLI for management: `amplify status`, `amplify push`
- Or manually link in Amplify Console by creating new app and connecting to existing backend

### Issue 5: Local State Out of Sync

**Problem:** `amplify status` shows all resources as "Create" when they already exist

**Solution:**
```bash
# Pull the latest state from cloud
AWS_PROFILE=LF amplify pull --appId [APP_ID] --envName stage

# Or force refresh
AWS_PROFILE=LF amplify env checkout prod
AWS_PROFILE=LF amplify env checkout stage
```

---

## Frontend Hosting Setup

### Step 1: Create Git Branch for Staging

1. **Create staging branch:**
   ```bash
   git checkout -b staging
   ```

2. **Commit staging configuration:**
   ```bash
   git add .
   git commit -m "Setup staging environment configuration"
   ```

3. **Push to remote:**
   ```bash
   git push origin staging
   ```

### Step 2: Configure Amplify Hosting

1. **Go to AWS Amplify Console**

2. **Create new app or add environment:**
   - Click "Host web app"
   - Connect to GitHub/GitLab/Bitbucket
   - Select repository
   - Select `staging` branch

3. **Configure build settings:**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: build
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Set environment variables in Amplify Console:**
   - `REACT_APP_ENV`: `staging`
   - `REACT_APP_STAGE`: `stage`
   - Any other app-specific variables

5. **Deploy and monitor build**

---

## Environment Management

### Switching Between Environments Locally

1. **Check current environment:**
   ```bash
   amplify env list
   ```

2. **Switch to production:**
   ```bash
   AWS_PROFILE=LF amplify env checkout prod
   ```

3. **Switch to staging:**
   ```bash
   AWS_PROFILE=LF amplify env checkout stage
   ```

### Understanding Environment Resources

Each environment has completely separate:
- **Cognito User Pools** - Different users for each environment
- **API Endpoints** - Separate GraphQL and REST APIs
- **DynamoDB Tables** - Independent data stores
- **S3 Buckets** - Separate file storage
- **Lambda Functions** - Same code, different instances

### Verifying Resources

1. **Check deployed resources:**
   ```bash
   AWS_PROFILE=LF amplify status
   ```

2. **Get environment details:**
   ```bash
   AWS_PROFILE=LF amplify env get --name stage
   ```

3. **View CloudFormation stacks:**
   ```bash
   AWS_PROFILE=LF aws cloudformation list-stacks --region us-west-2 \
     --query "StackSummaries[?contains(StackName,'amplify-[APP_NAME]-stage')]"
   ```

---

## Important Notes and Warnings

### Critical Warnings

⚠️ **Never mix production and staging configurations** in `aws-exports.js`
- Using production auth with staging APIs can corrupt data
- Always ensure all services point to the same environment

⚠️ **Environment variables in team-provider-info.json**
- This file contains sensitive information (API keys, secrets)
- Consider using AWS Secrets Manager for production
- Never commit real secrets to public repositories

⚠️ **User Pools are separate**
- Staging starts with 0 users
- Users cannot login across environments
- Create test users specifically for staging

### Best Practices

1. **Use separate Stripe keys** for staging (test mode keys)
2. **Create staging-specific test data** 
3. **Document environment-specific configurations**
4. **Use environment variables** for environment detection:
   ```javascript
   const isStaging = process.env.REACT_APP_ENV === 'staging';
   ```

5. **Regular sync from production:**
   ```bash
   # Update staging with latest prod code
   git checkout staging
   git merge main
   git push origin staging
   ```

### Cleanup

To remove staging environment completely:

```bash
# Remove from AWS
AWS_PROFILE=LF amplify env remove stage

# Remove local configuration
rm -rf amplify/backend/amplify-meta.json
amplify env checkout prod

# Remove git branch
git branch -D staging
git push origin --delete staging
```

---

## Quick Reference Commands

```bash
# Environment Management
amplify env list                          # List all environments
amplify env checkout [env]                # Switch environment
amplify env add [name]                     # Add new environment
amplify env remove [name]                 # Remove environment
amplify env get --name [env]              # Get environment details

# Deployment
amplify push --yes                         # Deploy all changes
amplify status                             # Check resource status
amplify pull --appId [id] --envName [env] # Pull environment

# Troubleshooting
amplify env checkout [env] --restore      # Restore environment
amplify configure                         # Reconfigure Amplify

# AWS CLI Commands
aws cognito-idp list-user-pools           # List Cognito pools
aws appsync list-graphql-apis             # List GraphQL APIs
aws apigateway get-rest-apis              # List REST APIs
aws s3 ls                                 # List S3 buckets
```

---

## Support and Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Amplify CLI Commands](https://docs.amplify.aws/cli/reference/command-reference/)
- [Multi-Environment Setup](https://docs.amplify.aws/cli/teams/overview/)
- [Troubleshooting Guide](https://docs.amplify.aws/cli/project/troubleshooting/)

---

*Last Updated: February 2024*
*Document Version: 1.0*