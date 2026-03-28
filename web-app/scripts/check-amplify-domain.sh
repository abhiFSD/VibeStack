#!/bin/bash

# Get Amplify app ID
APP_ID=$(cat amplify/team-provider-info.json | grep -o '"appId":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$APP_ID" ]; then
    echo "Could not find Amplify App ID"
    echo "Please provide your Amplify App ID:"
    read APP_ID
fi

echo "Checking domain status for Amplify App: $APP_ID"
echo "----------------------------------------"

# Get domain association details
aws amplify list-domain-associations --app-id $APP_ID --region us-west-2 2>/dev/null | jq '.' > domain-info.json

if [ $? -eq 0 ]; then
    echo "Domain information saved to domain-info.json"
    echo ""
    echo "Domain Status:"
    cat domain-info.json | jq -r '.domainAssociations[].domainStatus'
    echo ""
    echo "DNS Records you need to add:"
    echo "============================="
    cat domain-info.json | jq -r '.domainAssociations[].subDomains[] | "Subdomain: \(.subDomainSetting.prefix)\nVerification: \(.dnsRecord)\n"'
else
    echo "Could not retrieve domain information. Please check:"
    echo "1. Your AWS credentials are configured"
    echo "2. The App ID is correct: $APP_ID"
    echo "3. You have the necessary permissions"
fi