#!/bin/bash

echo "Creating Amplify staging environment from prod..."

# Add new staging environment
amplify env add <<EOF
staging
EOF

echo "Staging environment created. Now you need to:"
echo "1. Run: amplify env checkout staging"
echo "2. Update Lambda function environment variables for staging"
echo "3. Run: amplify push --yes"