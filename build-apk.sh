#!/bin/bash

# Build APK with version 9
# Make sure you're logged in to the 'next-ignition' account

echo "Checking EAS login status..."
eas whoami

echo ""
echo "If not logged in as 'next-ignition', please run: eas login"
echo "Then select the 'next-ignition' account"
echo ""
read -p "Press Enter once you're logged in to the correct account..."

echo ""
echo "Starting APK build with version 9..."
eas build --platform android --profile preview

echo ""
echo "Build initiated! Check the EAS dashboard for progress."
