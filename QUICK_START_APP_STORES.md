# Quick Start: Publish to App Stores

## 🎯 Quick Checklist

### For iOS App Store

1. **Set up iOS credentials** (one-time):
   ```bash
   npx eas-cli credentials --platform ios
   ```

2. **Build iOS app**:
   ```bash
   npx eas-cli build --platform ios --profile production
   ```

3. **Create app in App Store Connect**:
   - Go to: https://appstoreconnect.apple.com
   - Create new app with bundle ID: `com.nextignition.app`

4. **Submit build**:
   ```bash
   npx eas-cli submit --platform ios --profile production
   ```

5. **Complete store listing** (screenshots, description, etc.)

6. **Submit for review**

**Cost**: $99/year (Apple Developer Program)

---

### For Google Play Store

1. **Build Android AAB** (already configured):
   ```bash
   npx eas-cli build --platform android --profile production
   ```

2. **Create app in Play Console**:
   - Go to: https://play.google.com/console
   - Create new app

3. **Submit build**:
   ```bash
   npx eas-cli submit --platform android --profile production
   ```

4. **Complete store listing** (screenshots, description, etc.)

5. **Submit for review**

**Cost**: $25 one-time (Google Play Developer)

---

## 📋 What You Need

### Required Assets

**Both Stores:**
- App icon (iOS: 1024x1024, Android: 512x512)
- Screenshots (multiple sizes)
- App description
- Privacy policy URL
- Support email: support@nextignition.com

**iOS Only:**
- Apple Developer account ($99/year)
- App Store Connect access

**Android Only:**
- Google Play Developer account ($25 one-time)
- AAB build (not APK)

---

## ⚡ Fastest Path

1. **Start with Android** (cheaper, faster review)
2. **Set up accounts** (Play Console + App Store Connect)
3. **Prepare assets** (screenshots, icons, descriptions)
4. **Build apps** (AAB for Android, IPA for iOS)
5. **Submit** using EAS Submit
6. **Complete listings** while waiting for review

---

## 📖 Full Guide

See `APP_STORE_SUBMISSION_GUIDE.md` for complete step-by-step instructions.

---

**Estimated Time**: 2-3 days for both stores (including review time)


