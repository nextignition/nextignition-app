# Fix Android App Bundle Signing Key Mismatch

## Problem
Your Android App Bundle is signed with a different key than Google Play expects.

**Expected SHA1**: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`
**Current SHA1**: `70:F2:95:45:64:13:AF:00:60:B9:60:F8:08:E1:83:20:E9:24:90:DC`

## Solution Options

### Option 1: Reset Upload Key in Google Play (Recommended if you don't have the original keystore)

If you don't have access to the keystore with SHA1 `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`, you need to reset the upload key:

1. **Go to Google Play Console**
   - Navigate to your app
   - Go to **Release** → **Setup** → **App signing**

2. **Request Upload Key Reset**
   - Click on **Request upload key reset**
   - Follow Google's instructions
   - You'll need to contact Google Support using [this form](https://support.google.com/googleplay/android-developer/contact/key)

3. **After Reset**
   - Google will set the validity start date 72 hours in the future
   - You can then upload your new AAB signed with the current EAS keystore

### Option 2: Use the Correct Keystore (If you have it)

If you have the original keystore file with SHA1 `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`:

1. **Download Current Credentials from EAS** (for backup):
   ```bash
   cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
   npx eas-cli credentials
   ```
   - Select `Android`
   - Select `production`
   - Choose `credentials.json: Upload/Download credentials`
   - Select `Download credentials from EAS to credentials.json`

2. **Upload Your Original Keystore to EAS**:
   ```bash
   npx eas-cli credentials
   ```
   - Select `Android`
   - Select `production`
   - Choose `Set up a new keystore`
   - Upload your original `.jks` or `.keystore` file
   - Enter the keystore password and key alias/password

3. **Verify the SHA1**:
   ```bash
   keytool -list -v -keystore your-keystore.jks -alias your-key-alias
   ```
   - Check that the SHA1 matches: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

4. **Rebuild the AAB**:
   ```bash
   npx eas-cli build --platform android --profile production
   ```

## Quick Steps to Reset Upload Key

1. **Contact Google Support**:
   - Use this form: https://support.google.com/googleplay/android-developer/contact/key
   - Explain that you need to reset your upload key
   - Provide your app's package name: `com.nextignition.app`

2. **Wait for Google's Response** (usually 1-3 business days)

3. **After Reset**:
   - The new upload key will be valid 72 hours after reset
   - Rebuild and upload your AAB

## Verify Current Keystore SHA1

To check what keystore EAS is currently using:

1. Download credentials from EAS
2. Extract the keystore file
3. Run:
   ```bash
   keytool -list -v -keystore path/to/keystore.jks -alias your-alias
   ```

## Important Notes

- ⚠️ **Never lose your keystore** - you'll need it for all future updates
- ⚠️ **Backup your keystore** - store it securely (password manager, encrypted storage)
- ⚠️ **The app signing key (managed by Google)** is different from the upload key
- ✅ **After reset, you can use the current EAS keystore** for future uploads

