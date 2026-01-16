#!/bin/bash

# Upload correct keystore to EAS for Android signing
# This script will guide you through uploading the keystore

export EXPO_TOKEN="HJZP-HsL5fEzzhmqD6SG9NiLCFwR0CuN4iYOZfgD"

echo "=========================================="
echo "Uploading Keystore to EAS"
echo "=========================================="
echo ""
echo "Keystore Details:"
echo "  File: /Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks"
echo "  Password: schoolbus"
echo "  Alias: release"
echo "  Key Password: schoolbus"
echo ""
echo "When prompted, follow these steps:"
echo "  1. Select: Android"
echo "  2. Select: production"
echo "  3. Choose: Set up a new keystore (or Update credentials)"
echo "  4. Keystore file path: /Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks"
echo "  5. Keystore password: schoolbus"
echo "  6. Key alias: release"
echo "  7. Key password: schoolbus"
echo ""
echo "Starting EAS credentials command..."
echo ""

cd "/Volumes/Yatri Cloud/org/Yatri Cloud/nextignition-app"
eas credentials --platform android

echo ""
echo "=========================================="
echo "If upload was successful, run:"
echo "  eas build --platform android --profile production"
echo "=========================================="
