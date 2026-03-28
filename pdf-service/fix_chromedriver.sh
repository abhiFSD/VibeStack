#!/bin/bash

echo "Fixing ChromeDriver permissions on macOS..."

# Find ChromeDriver
CHROMEDRIVER_PATH=$(which chromedriver)

if [ -z "$CHROMEDRIVER_PATH" ]; then
    echo "ChromeDriver not found in PATH"
    exit 1
fi

echo "Found ChromeDriver at: $CHROMEDRIVER_PATH"

# Remove quarantine attribute
echo "Removing quarantine attribute..."
xattr -d com.apple.quarantine "$CHROMEDRIVER_PATH" 2>/dev/null || echo "No quarantine attribute found"

# Make executable
echo "Ensuring ChromeDriver is executable..."
chmod +x "$CHROMEDRIVER_PATH"

# Test ChromeDriver
echo "Testing ChromeDriver..."
"$CHROMEDRIVER_PATH" --version

echo "ChromeDriver should now work without security warnings."
echo ""
echo "If you still see security warnings, you may need to:"
echo "1. Open System Settings > Privacy & Security"
echo "2. Look for a message about ChromeDriver being blocked"
echo "3. Click 'Allow Anyway'"
echo ""
echo "Or run: sudo spctl --add --label 'Approved' $CHROMEDRIVER_PATH"