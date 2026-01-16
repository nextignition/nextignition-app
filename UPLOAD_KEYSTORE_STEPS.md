# Upload Correct Keystore - Step by Step

## Current Issue
Your AAB is signed with SHA-1: `49:F5:DE:8B:C5:15:D1:5A:A1:4D:67:1D:9A:2C:DD:DF:78:54:27:3A`
But Google Play expects: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

## Solution: Upload the Correct Keystore

### Step 1: Run the Credentials Command

```bash
cd "/Volumes/Yatri Cloud/org/Yatri Cloud/nextignition-app"
export EXPO_TOKEN="HJZP-HsL5fEzzhmqD6SG9NiLCFwR0CuN4iYOZfgD"
eas credentials --platform android
```

### Step 2: Follow These Prompts

When the command runs, you'll see interactive prompts. Follow these steps:

1. **Which build profile do you want to configure?**
   - Select: `production` (usually option 1 or type `production`)

2. **What do you want to do?**
   - Select: `Set up a new keystore` or `Update credentials` (option to upload new keystore)

3. **Keystore file path:**
   - Enter: `/Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks`

4. **Keystore password:**
   - Enter: `schoolbus`

5. **Key alias:**
   - Enter: `release`

6. **Key password:**
   - Enter: `schoolbus`

### Step 3: After Upload

Once the keystore is uploaded, run:

```bash
export EXPO_TOKEN="HJZP-HsL5fEzzhmqD6SG9NiLCFwR0CuN4iYOZfgD"
eas build --platform android --profile production --non-interactive
```

This will rebuild the AAB with version 9 using the correct signing key.

### Expected Result

After rebuild, the AAB should have SHA-1: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

Then upload to Google Play - it should work! ✅
