# Upload Correct Keystore to EAS - Step by Step

## Current Problem

- **Expected SHA-1**: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`
- **Current EAS SHA-1**: `E7:5F:91:E9:5C:23:D7:6B:DD:1D:46:4C:B6:AD:F2:BB:B6:BC:2B:01`

## Found Keystore

- **Location**: `/Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks`
- **Password**: `schoolbus`
- **Key Alias**: `release`
- **Key Password**: `schoolbus`

## Step-by-Step Instructions

### Step 1: Run EAS Credentials Command

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx eas-cli credentials
```

### Step 2: Follow the Prompts

1. **Select platform**: Type `1` or `Android` and press Enter
2. **Select build profile**: Type `production` or `1` and press Enter
3. **Choose action**: Select `Set up a new keystore` (usually option 1 or 2)
4. **Keystore file path**: 
   ```
   /Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks
   ```
5. **Keystore password**: `schoolbus`
6. **Key alias**: `release`
7. **Key password**: `schoolbus`

### Step 3: Verify Upload

After uploading, EAS will confirm the keystore is set up.

### Step 4: Rebuild AAB

```bash
npx eas-cli build --platform android --profile production
```

### Step 5: Upload to Google Play

The new AAB should now have the correct SHA-1: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

## Quick Copy-Paste Commands

```bash
# Navigate to project
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"

# Start credentials setup
npx eas-cli credentials
# Then follow prompts above

# After keystore is uploaded, rebuild
npx eas-cli build --platform android --profile production
```

