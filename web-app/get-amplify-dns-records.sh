#!/bin/bash

echo "Fetching DNS records for leanfitt.com from Amplify..."
echo "=================================================="

# Get domain association details
aws amplify get-domain-association \
  --app-id d35pt9zfpzj94h \
  --domain-name leanfitt.com \
  --region us-west-2 2>/dev/null | jq -r '
    .domainAssociation | 
    "Domain: \(.domainName)\n" +
    "Status: \(.domainStatus)\n" +
    "\nDNS Records to add to GoDaddy:\n" +
    "================================\n" +
    (.subDomains[] | 
      "\nSubdomain: \(.subDomainSetting.prefix // "root")\n" +
      "DNS Record: \(.dnsRecord)\n" +
      "Verification Status: \(.verified)\n" +
      "Target: \(.subDomainSetting.branchName).\(.domainAssociation.appId).amplifyapp.com\n" +
      "---"
    ) +
    "\n\nCertificate Validation Records:\n" +
    "================================\n" +
    (.certificateVerificationDNSRecord // "Not available yet")
  '

# Alternative: Get raw JSON for debugging
echo ""
echo "Raw domain data (for debugging):"
echo "================================"
aws amplify get-domain-association \
  --app-id d35pt9zfpzj94h \
  --domain-name leanfitt.com \
  --region us-west-2 2>/dev/null | jq '.domainAssociation.subDomains[] | {prefix: .subDomainSetting.prefix, dnsRecord: .dnsRecord, verified: .verified}'

# Check certificate validation record separately
echo ""
echo "Certificate Validation CNAME:"
echo "============================="
aws amplify get-domain-association \
  --app-id d35pt9zfpzj94h \
  --domain-name leanfitt.com \
  --region us-west-2 2>/dev/null | jq -r '.domainAssociation.certificateVerificationDNSRecord // "Checking..." '