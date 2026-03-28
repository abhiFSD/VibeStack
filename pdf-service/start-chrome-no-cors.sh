#!/bin/bash

# Kill any existing Chrome processes to ensure clean start
pkill -f "Google Chrome"
sleep 2

# Create unique temp directory for this Chrome session
TEMP_DIR="/tmp/chrome_dev_$(date +%s)"
mkdir -p "$TEMP_DIR"

echo "Starting Chrome with CORS disabled..."
echo "Temp directory: $TEMP_DIR"
echo "Navigate to: http://localhost:3000"
echo ""
echo "⚠️  SECURITY WARNING: This Chrome instance has disabled web security."
echo "   Only use for development. Do not browse other websites."
echo ""

# Launch Chrome with CORS disabled
open -n -a "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --args \
  --user-data-dir="$TEMP_DIR" \
  --disable-web-security \
  --disable-features=VizDisplayCompositor \
  --disable-site-isolation-trials \
  --disable-blink-features=BlockInsecurePrivateNetworkRequests \
  --allow-running-insecure-content \
  --flag-switches-begin \
  --flag-switches-end

echo "Chrome started with CORS disabled for development."
echo "You can now test your PDF generation functionality."