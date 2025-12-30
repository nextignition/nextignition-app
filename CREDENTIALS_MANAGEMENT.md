# NextIgnition App Credentials Management Guide

This guide helps you manage Android and iOS credentials for your NextIgnition app.

## 📱 Current App Configuration

- **Project ID**: `9b3208d9-100c-40db-9d81-ef19f1570d02`
- **Android Package**: `com.nextignition.app`
- **iOS Bundle ID**: `com.nextignition.app`
- **App Name**: Next Ignition

## 🤖 Android Credentials

### Current Status
Your Android app is already configured and has been built successfully. The keystore is managed by EAS.

### Download Credentials (Backup)

To download and backup your Android credentials:

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx eas-cli credentials
```

Then:
1. Select `Android`
2. Select the build profile (e.g., `preview` or `production`)
3. Choose `credentials.json: Upload/Download credentials between EAS servers and your local json`
4. Select `Download credentials from EAS to credentials.json`

**⚠️ IMPORTANT**: Never commit `credentials.json` or keystore files to git!

### Export Keystore to PEM (For Google Play)

If you need to sync your keystore with Google Play:

1. **Download credentials** (see above)
2. **Find the key alias** in `credentials.json` under `keyAlias`
3. **Export to PEM format**:
   ```bash
   keytool -export -rfc -alias YOUR_KEY_ALIAS -file certificate_for_google.pem -keystore ./path/to/keystore.jks
   ```
4. **Contact Google Support** using [this form](https://support.google.com/googleplay/android-developer/contact/key) and attach the PEM file

### App Signing by Google Play

When you upload your first release to Google Play, you'll see:
- "App signing by Google Play"
- "Google is protecting your app signing key"

This is **normal and recommended**. Just press "Continue" - no action needed.

### Lost Keystore?

If you lose your keystore:
1. Download credentials from EAS (if still available)
2. Export to PEM format
3. Contact Google Support to reset your upload key
4. Note: Google sets validity start date 72 hours in the future after reset

## 🍎 iOS Credentials

### Current Status
iOS credentials need to be set up if you plan to build for iOS.

### Required iOS Credentials

1. **Distribution Certificate**
   - One per Apple Developer account (shared across all apps)
   - Used for all your apps
   - Expires but doesn't affect production apps
   - Needed to upload new apps or updates

2. **Provisioning Profiles**
   - One per app (app-specific)
   - Links your app to your distribution certificate
   - Expires after 12 months (doesn't affect production)
   - Regenerated automatically on next build

3. **Push Notification Keys (APN)**
   - Maximum 2 per Apple Developer account
   - One key can be used for multiple apps
   - Never expires
   - If revoked, apps can't send push notifications until replaced

### Set Up iOS Credentials

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx eas-cli credentials
```

Then:
1. Select `iOS`
2. Select build profile
3. Follow prompts to:
   - Generate distribution certificate (if needed)
   - Create provisioning profile
   - Set up push notification key

### Manage iOS Credentials

**View credentials:**
```bash
npx eas-cli credentials
```

**Clear credentials from EAS:**
```bash
npx eas-cli credentials
# Select iOS → Select profile → Choose to clear
```

**Note**: Clearing from EAS doesn't delete from Apple Developer Console. To fully delete, use [Apple Developer Console](https://developer.apple.com/account/resources/certificates/list).

### Re-signing iOS Builds

To add a new test device to an existing build without rebuilding:

```bash
npx eas-cli build:resign
```

This will:
1. Show available builds
2. Let you select a build to re-sign
3. Prompt for Apple Developer login
4. Allow you to select a new provisioning profile with the new device
5. Re-sign the existing .ipa file

## 🔐 Security Best Practices

### ✅ DO:
- Download and backup credentials regularly
- Store credentials securely (password manager, encrypted storage)
- Use EAS managed credentials (recommended)
- Keep credentials.json in `.gitignore`

### ❌ DON'T:
- Commit credentials to git
- Share credentials publicly
- Delete credentials without backup
- Use debug keystores for production

## 📋 Credential Summary

| Platform | Credential Type | Limit | App-Specific? | Can Revoke Safely? |
|----------|----------------|-------|---------------|-------------------|
| Android | Keystore | N/A | Yes | Yes (with Google Play reset) |
| iOS | Distribution Certificate | 2 | No | Yes |
| iOS | Provisioning Profile | Unlimited | Yes | Yes |
| iOS | Push Notification Key | 2 | No | No (breaks push) |

## 🛠️ Common Commands

### View All Credentials
```bash
npx eas-cli credentials
```

### Download Android Credentials
```bash
npx eas-cli credentials
# Android → Select profile → Download to credentials.json
```

### Build with Specific Profile
```bash
# Android
npx eas-cli build --platform android --profile production

# iOS
npx eas-cli build --platform ios --profile production
```

### Re-sign iOS Build
```bash
npx eas-cli build:resign
```

## 📞 Support Resources

- **EAS Build Docs**: https://docs.expo.dev/build/introduction
- **Android Signing**: https://docs.expo.dev/app-signing/android-credentials
- **iOS Signing**: https://docs.expo.dev/app-signing/ios-credentials
- **Google Play Support**: https://support.google.com/googleplay/android-developer/contact/key
- **Apple Developer Console**: https://developer.apple.com/account/resources/certificates/list

## 🔄 Next Steps

1. **For Android**: Your credentials are already set up. Consider downloading a backup.
2. **For iOS**: Set up credentials when ready to build for iOS:
   ```bash
   npx eas-cli credentials
   # Select iOS and follow prompts
   ```
3. **Backup**: Download credentials regularly and store securely
4. **Google Play**: When uploading, use App Signing by Google Play (default)

---

**Last Updated**: December 2024  
**Project**: Next Ignition  
**Package**: com.nextignition.app


