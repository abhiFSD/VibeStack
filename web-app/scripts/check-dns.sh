#!/bin/bash

echo "Enter your domain name (e.g., example.com):"
read DOMAIN

echo ""
echo "Checking DNS records for $DOMAIN..."
echo "========================================"

# Check for Amplify verification record
echo ""
echo "1. Checking verification records (_*.${DOMAIN}):"
dig +short _*.${DOMAIN} CNAME

echo ""
echo "2. Checking www subdomain:"
dig +short www.${DOMAIN} CNAME

echo ""
echo "3. Checking root domain:"
dig +short ${DOMAIN} A

echo ""
echo "4. Checking name servers:"
dig +short ${DOMAIN} NS

echo ""
echo "========================================"
echo "If you see '_verify.amplify.aws' in the verification records,"
echo "your DNS is configured correctly. Wait for propagation."
echo ""
echo "If not, add these records to your DNS provider:"
echo "1. CNAME: _<verification-code>.${DOMAIN} → _verify.amplify.aws"
echo "2. CNAME: www.${DOMAIN} → <branch>.<app-id>.amplifyapp.com"