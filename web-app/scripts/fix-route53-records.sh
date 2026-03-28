#!/bin/bash

# Get hosted zone ID for leanfitt.com
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name=='leanfitt.com.'].Id" --output text | sed 's|/hostedzone/||')

echo "Found Hosted Zone ID: $HOSTED_ZONE_ID"

if [ -z "$HOSTED_ZONE_ID" ]; then
    echo "Error: Could not find hosted zone for leanfitt.com"
    exit 1
fi

# Create change batch file to update DNS records
cat > update-dns-records.json << 'EOF'
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "www.leanfitt.com",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "dodnfbqsjwag8.cloudfront.net"
                    }
                ]
            }
        },
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "leanfitt.com",
                "Type": "A",
                "AliasTarget": {
                    "DNSName": "dodnfbqsjwag8.cloudfront.net",
                    "EvaluateTargetHealth": false,
                    "HostedZoneId": "Z2FDTNDATAQYW2"
                }
            }
        }
    ]
}
EOF

echo "Updating DNS records in Route53..."
echo "=================================="

# Execute the change
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://update-dns-records.json \
    --query 'ChangeInfo.Id' \
    --output text)

if [ $? -eq 0 ]; then
    echo "✓ DNS records update initiated successfully!"
    echo "Change ID: $CHANGE_ID"
    echo ""
    echo "Updated records:"
    echo "- www.leanfitt.com CNAME → dodnfbqsjwag8.cloudfront.net"
    echo "- leanfitt.com ALIAS → dodnfbqsjwag8.cloudfront.net"
    echo ""
    echo "Checking change status..."
    aws route53 get-change --id $CHANGE_ID --query 'ChangeInfo.Status' --output text
    echo ""
    echo "DNS propagation typically takes 1-5 minutes."
    echo "You can check status with: aws route53 get-change --id $CHANGE_ID"
else
    echo "❌ Failed to update DNS records"
    echo "Check the error message above"
fi

# Clean up
rm update-dns-records.json

echo ""
echo "Next steps:"
echo "1. Wait 2-5 minutes for DNS propagation"
echo "2. Go back to Amplify Console and check if domain status changes"
echo "3. If still stuck, click 'Actions' → 'Refresh DNS verification'"