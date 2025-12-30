# 🚀 Action Plan: Fix Android Signing Key Issue

## 📋 Current Status

✅ **AAB Built Successfully**: https://expo.dev/artifacts/eas/93a4Atia2L6wNwhaSYB9Z6.aab

❌ **Signing Key Mismatch**:
- **Google Play Expects**: SHA-1 `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`
- **Current EAS Keystore**: SHA-1 `70:F2:95:45:64:13:AF:00:60:B9:60:F8:08:E1:83:20:E9:24:90:DC`

## 🎯 Solution: Reset Upload Key in Google Play Console

Since we don't have the original keystore, we need to reset the upload key.

## 📝 Step-by-Step Actions

### Step 1: Request Upload Key Reset (5 minutes)

1. **Open Google Play Console**
   - Go to: https://play.google.com/console
   - Sign in with your Google account

2. **Navigate to App Signing**
   - Select app: **Next Ignition** (`com.nextignition.app`)
   - Click: **Release** → **Setup** → **App signing**

3. **Request Reset**
   - Scroll to **"Upload key certificate"** section
   - Click **"Request upload key reset"** button
   - Confirm the action

### Step 2: Contact Google Support (10 minutes)

1. **Open Support Form**
   - URL: https://support.google.com/googleplay/android-developer/contact/key

2. **Fill Out Form**
   ```
   Subject: Request to reset upload key for Android app
   
   Package name: com.nextignition.app
   App name: Next Ignition
   
   Message:
   I need to reset my upload key because I don't have access to the original 
   keystore file. The expected upload key SHA-1 is: 
   1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A
   
   I want to use a new keystore managed by EAS Build for future releases.
   ```

3. **Submit and Wait**
   - Google typically responds within 1-3 business days

### Step 3: After Approval (72 hours later)

1. **Wait for Email Confirmation**
   - Google will email you when the reset is approved
   - New upload key becomes valid **72 hours** after approval

2. **Rebuild AAB**
   ```bash
   cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
   npx eas-cli build --platform android --profile production
   ```

3. **Upload to Google Play**
   - Go to: **Release** → **Production** (or **Testing**)
   - Click **"Create new release"**
   - Upload the new AAB file
   - Complete release process

## 📚 Reference Documents Created

1. **FIX_ANDROID_SIGNING_KEY.md** - Problem overview and solutions
2. **RESET_UPLOAD_KEY_STEPS.md** - Detailed step-by-step guide
3. **FIND_ORIGINAL_KEYSTORE.md** - How to find original keystore (if needed)
4. **ACTION_PLAN_SIGNING_KEY.md** - This file (quick action plan)

## 🔗 Quick Links

- **Google Play Console**: https://play.google.com/console
- **Google Support Form**: https://support.google.com/googleplay/android-developer/contact/key
- **EAS Build Dashboard**: https://expo.dev/accounts/next-ignition/projects/next-ignition-project/builds
- **Latest AAB**: https://expo.dev/artifacts/eas/93a4Atia2L6wNwhaSYB9Z6.aab

## ⚠️ Important Notes

- The **app signing key** (managed by Google) stays the same
- Only the **upload key** changes after reset
- You must use the **new upload key** for all future releases
- **72-hour waiting period** after approval before new key is valid
- **Backup your new keystore** after setup (download from EAS)

## ✅ Next Actions

1. ✅ AAB built successfully
2. ⏳ Request upload key reset in Google Play Console
3. ⏳ Contact Google Support
4. ⏳ Wait for approval (1-3 business days)
5. ⏳ Wait 72 hours after approval
6. ⏳ Rebuild AAB
7. ⏳ Upload to Google Play Console

---

**Status**: Ready to proceed with upload key reset. Follow steps above to complete the process.

