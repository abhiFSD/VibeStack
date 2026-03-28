# VibeStack Staging Environment Setup Plan

## Current Architecture Overview

### 1. **Frontend Applications**
- **Main Application**: React 18.2 web app (this repository)
  - Hosted on AWS Amplify (App ID: d35pt9zfpzj94h)
  - Domain: VibeStack.com
  - Build: React with AWS Amplify integration

- **Management FITT**: Separate Vite-based application
  - App ID: d2sq9r64z1yifb
  - Domain: VibeStack.com
  
- **FittWorks Landing**: Marketing landing page
  - App ID: d188xwkvtahioe
  - Domain: fittworks.app

### 2. **Backend Services**

#### AWS Amplify Backend
- **GraphQL API**: AppSync (LfAPI-production)
- **Authentication**: Cognito User Pools
  - Production: us-west-2_Do5QnW9fr
  - Alternative: us-west-2_LLZTeB8Je
- **Storage**: S3 buckets
  - Main storage: lf-api-storage-2b19a34b130925-production
  - Learning content: lf-learnings-bucket
  - Backups: VibeStack-db-backup

#### Lambda Functions (17 total)
Key functions include:
- `generatePDF2325-prod`: PDF report generation
- `handleStripeWebhook`: Payment processing
- `fetchDataFromMySQL`: Database operations
- `emailService` & `notificationEmail`: Email notifications
- `handleUserManagement`: User lifecycle
- `handleOrganizationInvite`: Multi-tenant operations
- `createStripeCustomer` & `handleSubscribe`: Subscription management

#### EC2-Based Services
1. **PDF Generation Server** (i-05ff75271d0cfbd92)
   - Instance: LF-PRP-PDF-GENERATION
   - API Endpoint: https://api.VibeStack.com
   - Status: Running

2. **AI Backend Server** (i-0c7f14c72b310e2f4)
   - Instance: AI Server
   - API Endpoint: https://thefittlab.com/api
   - Status: Running

3. **AI Staging Server** (i-03853a2dd053f95a2)
   - Instance: Lf-AI-System-Staging
   - Status: Running (already exists for staging)

### 3. **External Integrations**
- **Stripe**: Payment processing (Live keys in production)
- **Google Maps**: Location services
- **TinyMCE**: Rich text editor
- **MySQL Database**: Via Lambda functions (no direct RDS instance found)

### 4. **Domain Infrastructure**
- Route53 Hosted Zones:
  - VibeStack.com
  - VibeStack.com
  - thefittlab.com
  - leadershipfitt.com

## Staging Environment Implementation Plan

### Phase 1: AWS Infrastructure Setup (Week 1)

#### 1.1 Amplify Backend Staging Environment
```bash
# Commands to create staging environment
amplify env add staging
amplify push --env staging
```

**Tasks:**
- [ ] Create new Amplify environment named "staging"
- [ ] Deploy all 17 Lambda functions with staging suffix
- [ ] Create staging GraphQL API (AppSync)
- [ ] Create staging Cognito User Pool
- [ ] Create staging S3 buckets with proper naming convention

#### 1.2 Database Setup
- [ ] Determine MySQL database location (appears to be external)
- [ ] Create staging database instance
- [ ] Clone production schema
- [ ] Create sample/sanitized data

#### 1.3 EC2 Services
- [ ] Clone PDF Generation Server for staging
  - New instance: LF-PRP-PDF-GENERATION-STAGING
  - Configure with staging endpoints
- [ ] Verify AI Staging Server (already exists)
  - Ensure proper configuration
  - Update API endpoints

### Phase 2: Frontend Configuration (Week 1-2)

#### 2.1 Environment Variables
Create `.env.staging` file:
```env
REACT_APP_TINYMCE_API_KEY=<same-key>
REACT_APP_GOOGLE_MAPS_API_KEY=<same-key>
REACT_APP_STRIPE_PUBLISHABLE_KEY=<test-key>
REACT_APP_PDF_API_ENDPOINT=https://staging-api.VibeStack.com
REACT_APP_CHAT_API_URL=https://staging.thefittlab.com/api
REACT_APP_CHAT_API_KEY=staging-api-key
REACT_APP_LEARNING_IMAGES_BUCKET=lf-learnings-bucket-staging
```

#### 2.2 Amplify Frontend Hosting
- [ ] Create new branch in repository for staging
- [ ] Configure Amplify to auto-deploy staging branch
- [ ] Set up staging subdomain (staging.VibeStack.com)

### Phase 3: External Services (Week 2)

#### 3.1 Stripe Configuration
- [ ] Create Stripe test account/workspace
- [ ] Configure test webhooks
- [ ] Update Lambda functions with test keys
- [ ] Test payment flows

#### 3.2 Email Services
- [ ] Configure SES for staging domain
- [ ] Update email templates with staging branding
- [ ] Set up email forwarding rules

### Phase 4: DNS and Domain Setup (Week 2)

#### 4.1 Subdomain Configuration
- [ ] Create staging subdomains in Route53:
  - staging.VibeStack.com
  - staging.VibeStack.com
  - staging-api.VibeStack.com
  - staging.thefittlab.com

#### 4.2 SSL Certificates
- [ ] Request ACM certificates for staging domains
- [ ] Configure CloudFront distributions if needed

### Phase 5: CI/CD Pipeline (Week 3)

#### 5.1 GitHub Actions / Amplify Pipeline
- [ ] Set up automated deployments for staging branch
- [ ] Configure environment-specific build commands
- [ ] Add staging validation tests

#### 5.2 Deployment Scripts
Create deployment scripts:
```bash
# deploy-staging.sh
#!/bin/bash
export AWS_PROFILE=LF
amplify env checkout staging
amplify push --yes
npm run build:staging
```

### Phase 6: Data Management (Week 3)

#### 6.1 Data Synchronization
- [ ] Set up data anonymization scripts
- [ ] Create staging data refresh process
- [ ] Implement data isolation between environments

#### 6.2 Backup Strategy
- [ ] Configure automated backups for staging
- [ ] Set up restoration procedures
- [ ] Test disaster recovery

### Phase 7: Testing and Validation (Week 4)

#### 7.1 Functional Testing
- [ ] Test all 21 lean tools
- [ ] Verify multi-tenant functionality
- [ ] Test payment flows with Stripe test mode
- [ ] Validate PDF generation
- [ ] Test AI chat integration

#### 7.2 Integration Testing
- [ ] Test Lambda function connectivity
- [ ] Verify GraphQL subscriptions
- [ ] Test email notifications
- [ ] Validate file uploads to S3

### Cost Estimation

**Monthly Staging Environment Costs:**
- Amplify Hosting: ~$15-25
- Lambda Functions: ~$10-20 (low traffic)
- EC2 Instances (2 t3.medium): ~$60-80
- RDS/MySQL (if needed): ~$30-50
- S3 Storage: ~$5-10
- CloudWatch/Monitoring: ~$10-15
- **Total Estimated: $130-200/month**

### Security Considerations

1. **Access Control**
   - Separate IAM roles for staging
   - Restrict staging access to development team
   - Use different API keys for staging

2. **Data Protection**
   - Anonymize production data for staging
   - Use test payment credentials only
   - Separate secret management

3. **Network Isolation**
   - Use different security groups
   - Implement VPC isolation if needed
   - Separate API Gateway stages

### Rollback Plan

1. Maintain infrastructure as code (IaC)
2. Version control all configurations
3. Document rollback procedures
4. Keep production backups separate

### Monitoring and Alerts

- [ ] Set up CloudWatch dashboards for staging
- [ ] Configure separate alert channels
- [ ] Implement performance monitoring
- [ ] Set up error tracking (Sentry/similar)

### Timeline Summary

- **Week 1**: Infrastructure setup (Amplify, Lambda, EC2)
- **Week 2**: Frontend config, external services, DNS
- **Week 3**: CI/CD pipeline, data management
- **Week 4**: Testing, validation, documentation

**Total Implementation Time: 4 weeks**

## Action Items

### Immediate Actions Required

1. **Determine MySQL Database Location**
   - Check Lambda function code for database credentials
   - Identify if using RDS, Aurora, or external MySQL

2. **Review Stripe Integration**
   - Document current webhook configuration
   - List all Stripe API interactions

3. **Audit Lambda Functions**
   - Document environment variables used
   - Identify external service dependencies

4. **Create Staging Branch Strategy**
   - Decide on git workflow
   - Set up branch protection rules

5. **Cost Approval**
   - Get budget approval for staging environment
   - Set up cost alerts

### Team Requirements

- **DevOps Engineer**: Infrastructure setup
- **Backend Developer**: Lambda function configuration
- **Frontend Developer**: React app configuration
- **QA Engineer**: Testing and validation
- **Project Manager**: Coordination and timeline

## Conclusion

The staging environment will mirror production architecture while maintaining complete isolation. This setup enables safe testing of new features, performance optimization, and bug fixes without affecting production users. The modular approach allows for incremental implementation and easy maintenance.