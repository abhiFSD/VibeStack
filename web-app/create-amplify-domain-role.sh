#!/bin/bash

# Create the IAM role for Amplify Domain management
ROLE_NAME="AWSAmplifyDomainRole-Z2R08HE2W3FMV3"

# Create trust policy
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "amplify.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file://trust-policy.json \
  --description "Role for AWS Amplify to manage domain settings"

# Attach the necessary policy for Route53 access
cat > domain-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:ListResourceRecordSets",
        "route53:ChangeResourceRecordSets",
        "route53:GetChange",
        "route53:ListHostedZonesByName",
        "route53:GetHostedZone",
        "route53:CreateHostedZone",
        "route53:DeleteHostedZone",
        "route53:ListTagsForResource",
        "route53:UpdateHostedZoneComment"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "acm:RequestCertificate",
        "acm:DescribeCertificate",
        "acm:DeleteCertificate",
        "acm:ListCertificates",
        "acm:AddTagsToCertificate",
        "acm:ListTagsForCertificate"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateDistribution",
        "cloudfront:UpdateDistribution",
        "cloudfront:GetDistribution",
        "cloudfront:ListDistributions",
        "cloudfront:DeleteDistribution",
        "cloudfront:TagResource",
        "cloudfront:GetDistributionConfig",
        "cloudfront:UpdateDistribution"
      ],
      "Resource": "*"
    }
  ]
}
EOF

# Create and attach the inline policy
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name AmplifyDomainPolicy \
  --policy-document file://domain-policy.json

echo "Role $ROLE_NAME created successfully!"
echo "You can now retry adding your domain in Amplify Console."

# Clean up temporary files
rm trust-policy.json domain-policy.json