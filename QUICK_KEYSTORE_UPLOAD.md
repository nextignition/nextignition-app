# Quick Keystore Upload Guide

## ⚠️ Current Issue

Your AAB is signed with SHA-1: `E7:5F:91:E9:5C:23:D7:6B:DD:1D:46:4C:B6:AD:F2:BB:B6:BC:2B:01`
But Google Play expects: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

## ✅ Solution: Upload Correct Keystore

### Keystore Details
- **File**: `/Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks`
- **Password**: `schoolbus`
- **Alias**: `release`
- **Key Password**: `schoolbus`

### Run This Command

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx eas-cli credentials --platform android
```

### Interactive Steps (When Prompted)

1. **Select build profile**: Choose `production` (usually option 1)
2. **What do you want to do?**: Choose `Set up a new keystore` or `Update credentials`
3. **Keystore file path**: Paste this:
   ```
   /Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks
   ```
4. **Keystore password**: Type `schoolbus`
5. **Key alias**: Type `release`
6. **Key password**: Type `schoolbus`

### After Upload

```bash
# Rebuild with correct keystore
npx eas-cli build --platform android --profile production
```

### Verify

After rebuild, the AAB should have SHA-1: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

Then upload to Google Play - it should work! ✅

