#!/bin/bash

# Create staging environment
export AWS_PROFILE=LF

# Use expect to automate the interactive prompts
/usr/bin/expect <<EOF
spawn amplify env add
expect "Enter a name for the environment"
send "staging\r"
expect "Select the authentication method you want to use:"
send "\033\[B\r"  # Arrow down to select AWS profile
expect "Please choose the profile you want to use:"
send "LF\r"
expect eof
EOF

echo "Staging environment created successfully!"