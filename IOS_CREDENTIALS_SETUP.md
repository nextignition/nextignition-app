# iOS Credentials Setup Guide

## ⚠️ Current Issue
Your account doesn't have any Apple distribution certificates associated with it. You need to set up iOS credentials before building for iOS.

## 🚀 Quick Setup Steps

### Step 1: Run Interactive Credentials Setup

Run this command in your terminal:

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx eas-cli credentials --platform ios
```

### Step 2: Follow the Prompts

1. **Select Build Profile**: Choose `production` (or `preview` if you want to test first)

2. **Choose Action**: Select `Set up new credentials` or `Manage credentials`

3. **Distribution Certificate**:
   - EAS will ask if you want to generate a new certificate
   - Select `Yes` to generate a new distribution certificate
   - You'll need to log in to your Apple Developer account
   - EAS will create and store the certificate automatically

4. **Provisioning Profile**:
   - EAS will automatically create a provisioning profile
   - This links your app to your distribution certificate

5. **Push Notification Key (Optional)**:
   - If you need push notifications, set up an APN key
   - You can skip this for now and add it later

### Step 3: Verify Setup

After setup, verify your credentials:

```bash
npx eas-cli credentials --platform ios
```

You should see:
- ✅ Distribution Certificate (valid)
- ✅ Provisioning Profile (valid)
- ⚠️ Push Notification Key (optional)

## 📋 Requirements

### Apple Developer Account
You need:
- An **active Apple Developer Program membership** ($99/year)
- Access to [Apple Developer Console](https://developer.apple.com/account)
- Your Apple ID credentials

### If You Don't Have an Apple Developer Account

1. **Sign up** at: https://developer.apple.com/programs/
2. **Enroll** in the Apple Developer Program ($99/year)
3. **Wait for approval** (usually 24-48 hours)
4. Then run the credentials setup

## 🔧 Manual Setup (Alternative)

If you prefer to set up credentials manually:

### Option 1: Use Apple Developer Console

1. Go to [Apple Developer Console](https://developer.apple.com/account/resources/certificates/list)
2. Create a **Distribution Certificate** (iOS App Development or App Store)
3. Create a **Provisioning Profile** for your app
4. Download and upload to EAS:

```bash
npx eas-cli credentials --platform ios
# Select "Upload credentials"
```

### Option 2: Use Xcode

1. Open Xcode
2. Go to Preferences → Accounts
3. Add your Apple ID
4. Download certificates
5. Export and upload to EAS

## ✅ After Setup

Once credentials are set up, you can build for iOS:

```bash
# Build for iOS (production)
npx eas-cli build --platform ios --profile production

# Build for iOS (preview/test)
npx eas-cli build --platform ios --profile preview
```

## 🆘 Troubleshooting

### "No Apple Developer account found"
- Make sure you're logged in with an account that has an active Apple Developer Program membership
- Check: https://developer.apple.com/account

### "Certificate generation failed"
- Verify your Apple Developer account is active
- Check if you've reached the certificate limit (2 per account)
- Try revoking old certificates in Apple Developer Console

### "Provisioning profile creation failed"
- Ensure your bundle identifier (`com.nextignition.app`) is registered in App Store Connect
- Check that your distribution certificate is valid
- Verify your Apple Developer account permissions

### "ITSAppUsesNonExemptEncryption missing"
- ✅ **Fixed**: Added to `app.json` - this is now configured
- This tells Apple if your app uses encryption (set to `false` for most apps)

## 📝 Current Configuration

- **Bundle ID**: `com.nextignition.app`
- **App Name**: Next Ignition
- **Project ID**: `9b3208d9-100c-40db-9d81-ef19f1570d02`
- **ITSAppUsesNonExemptEncryption**: `false` (configured)

## 🔗 Useful Links

- **Apple Developer Console**: https://developer.appo.com/account
- **EAS Build Docs**: https://docs.expo.dev/build/introduction
- **iOS Credentials Guide**: https://docs.expo.dev/app-signing/ios-credentials
- **App Store Connect**: https://appstoreconnect.apple.com

## ⚡ Quick Command Reference

```bash
# Set up iOS credentials (interactive)
npx eas-cli credentials --platform ios

# View current credentials
npx eas-cli credentials --platform ios

# Build for iOS (after credentials are set up)
npx eas-cli build --platform ios --profile production

# Check build status
npx eas-cli build:list --platform ios
```

---

**Next Step**: Run `npx eas-cli credentials --platform ios` in your terminal and follow the interactive prompts!


