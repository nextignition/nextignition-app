# Complete Guide: Reset Upload Key in Google Play Console

## Current Situation

- **Expected Upload Key SHA-1**: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`
- **Current EAS Keystore SHA-1**: `70:F2:95:45:64:13:AF:00:60:B9:60:F8:08:E1:83:20:E9:24:90:DC`
- **Status**: Mismatch - need to reset upload key

## Step-by-Step Instructions

### Step 1: Request Upload Key Reset in Google Play Console

1. **Go to Google Play Console**
   - URL: https://play.google.com/console
   - Sign in with your Google account

2. **Navigate to App Signing**
   - Select your app: **Next Ignition** (or `com.nextignition.app`)
   - Go to: **Release** → **Setup** → **App signing**

3. **Request Upload Key Reset**
   - Scroll down to **"Upload key certificate"** section
   - Click **"Request upload key reset"** button
   - Follow the prompts to confirm

### Step 2: Contact Google Support

1. **Go to Google Support Form**
   - URL: https://support.google.com/googleplay/android-developer/contact/key

2. **Fill Out the Form**
   - **Subject**: "Request to reset upload key for Android app"
   - **Package name**: `com.nextignition.app`
   - **App name**: Next Ignition
   - **Reason**: "I don't have access to the original keystore file that matches the expected upload key SHA-1: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`. I need to reset the upload key to use a new keystore managed by EAS Build."

3. **Submit the Form**
   - Wait for Google's response (usually 1-3 business days)

### Step 3: After Google Approves

1. **Wait for Approval Email**
   - Google will send you an email confirming the upload key reset
   - The new upload key will be valid **72 hours** after approval

2. **Rebuild Your AAB**
   ```bash
   cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
   npx eas-cli build --platform android --profile production
   ```

3. **Upload to Google Play Console**
   - Go to: **Release** → **Production** (or **Testing**)
   - Click **"Create new release"**
   - Upload the new AAB file
   - Complete the release process

## Alternative: If You Find the Original Keystore

If you find the keystore file with SHA-1 `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`:

1. **Verify the Keystore**
   ```bash
   keytool -list -v -keystore path/to/keystore.jks -alias your-alias
   ```
   - Check that SHA-1 matches: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

2. **Upload to EAS**
   ```bash
   npx eas-cli credentials
   ```
   - Select: `Android`
   - Select: `production`
   - Choose: `Set up a new keystore`
   - Upload your `.jks` or `.keystore` file
   - Enter keystore password and key alias

3. **Rebuild**
   ```bash
   npx eas-cli build --platform android --profile production
   ```

## Important Notes

- ⚠️ **After reset, you MUST use the new upload key** for all future releases
- ⚠️ **The app signing key (managed by Google) remains the same** - only the upload key changes
- ⚠️ **72-hour waiting period** - new upload key becomes valid 72 hours after reset approval
- ✅ **Backup your new keystore** - download it from EAS after setup
- ✅ **Keep credentials secure** - never commit keystores to git

## Quick Links

- **Google Play Console**: https://play.google.com/console
- **Google Support Form**: https://support.google.com/googleplay/android-developer/contact/key
- **EAS Build Dashboard**: https://expo.dev/accounts/next-ignition/projects/next-ignition-project/builds

