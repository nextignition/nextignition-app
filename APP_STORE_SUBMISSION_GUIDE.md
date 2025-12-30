# App Store Submission Guide - NextIgnition

Complete guide to publish NextIgnition to Apple App Store and Google Play Store.

## 📱 Current Status

- ✅ **Android APK**: Built successfully
- ⚠️ **iOS**: Credentials need to be set up
- ✅ **Web**: Live on Vercel (https://nextignition-app.vercel.app)

---

## 🍎 Apple App Store (iOS)

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up: https://developer.apple.com/programs/
   - Active membership required

2. **App Store Connect Account**
   - Access: https://appstoreconnect.apple.com
   - Same Apple ID as Developer account

3. **iOS Credentials** (Set up first)
   ```bash
   npx eas-cli credentials --platform ios
   ```

### Step-by-Step Process

#### Step 1: Set Up iOS Credentials

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx eas-cli credentials --platform ios
```

Follow prompts to:
- Generate distribution certificate
- Create provisioning profile
- Set up push notification key (optional)

#### Step 2: Build iOS App

```bash
# Build for App Store
npx eas-cli build --platform ios --profile production
```

This creates an `.ipa` file ready for App Store submission.

#### Step 3: Create App in App Store Connect

1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. **Click "My Apps"** → **"+"** → **"New App"**
3. **Fill in details**:
   - **Platform**: iOS
   - **Name**: Next Ignition
   - **Primary Language**: English
   - **Bundle ID**: `com.nextignition.app` (must match your app.json)
   - **SKU**: `nextignition-ios-001` (unique identifier)
   - **User Access**: Full Access

#### Step 4: Prepare App Store Listing

**Required Information:**

1. **App Information**:
   - Name: "Next Ignition"
   - Subtitle: "Startup Ecosystem Platform" (optional)
   - Category: Business / Productivity
   - Privacy Policy URL: (required) - Add your privacy policy URL
   - Support URL: https://nextignition-app.vercel.app/help

2. **Pricing and Availability**:
   - Price: Free (or set price)
   - Availability: All countries (or select)

3. **App Privacy**:
   - Data collection practices
   - Privacy policy required
   - Answer privacy questions

4. **App Store Screenshots** (Required):
   - **iPhone 6.7" Display**: 1290 x 2796 pixels (at least 1)
   - **iPhone 6.5" Display**: 1242 x 2688 pixels (at least 1)
   - **iPhone 5.5" Display**: 1242 x 2208 pixels (at least 1)
   - **iPad Pro 12.9"**: 2048 x 2732 pixels (if supporting iPad)

5. **App Preview Video** (Optional but recommended):
   - 15-30 seconds
   - Showcase key features

6. **Description**:
   ```
   Next Ignition helps founders grow from idea to launch. 
   Connect with experts, get mentorship, build your MVP, 
   and raise funding—all on one platform.
   
   Features:
   • AI-Powered Expert Matching
   • Business Community Feed
   • Founder–Expert Booking System
   • AI Tools: Startup Summary, Profile Summarizer, Pitch Deck Summary
   • Webinars & Events
   • Real-time Messaging
   • Switch between Founder, Expert, Investor, and Agency roles
   ```

7. **Keywords**: startup, founder, investor, mentorship, business, funding

8. **Support URL**: https://nextignition-app.vercel.app/help
9. **Marketing URL**: https://nextignition-app.vercel.app (optional)

10. **App Icon**:
    - 1024 x 1024 pixels
    - No transparency
    - No rounded corners (Apple adds them)

11. **Version Information**:
    - Version: 1.0.0
    - Copyright: "© 2025 Next Ignition"
    - Age Rating: Complete questionnaire

#### Step 5: Submit Build to App Store

**Option A: Using EAS Submit (Recommended)**

```bash
# Submit to App Store
npx eas-cli submit --platform ios --profile production
```

This will:
- Upload your build to App Store Connect
- Link it to your app listing

**Option B: Manual Upload**

1. Download the `.ipa` from EAS build
2. Use **Transporter** app (Mac) or **Application Loader**
3. Upload the `.ipa` file

#### Step 6: Complete App Store Listing

1. Go to your app in App Store Connect
2. Click **"+ Version or Platform"**
3. Select the uploaded build
4. Complete all required sections:
   - Screenshots
   - Description
   - Keywords
   - Support URL
   - Privacy Policy
   - Age Rating
5. Answer **Export Compliance** questions
6. Add **App Review Information**:
   - Contact information
   - Demo account (if needed)
   - Notes for reviewers

#### Step 7: Submit for Review

1. Review all information
2. Click **"Submit for Review"**
3. Status will change to **"Waiting for Review"**
4. Review typically takes 24-48 hours

#### Step 8: After Approval

- App goes live automatically (or on scheduled date)
- You'll receive email notification
- App appears in App Store

---

## 🤖 Google Play Store (Android)

### Prerequisites

1. **Google Play Developer Account** ($25 one-time fee)
   - Sign up: https://play.google.com/console/signup
   - One-time payment

2. **Android Credentials** (Already set up ✅)
   - Your keystore is already configured

### Step-by-Step Process

#### Step 1: Build Android App Bundle (AAB)

For Play Store, you need an **AAB** (not APK):

```bash
# Update eas.json to build AAB for production
```

Update `eas.json`:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  }
}
```

Then build:
```bash
npx eas-cli build --platform android --profile production
```

#### Step 2: Create App in Google Play Console

1. **Go to Google Play Console**: https://play.google.com/console
2. **Click "Create app"**
3. **Fill in details**:
   - **App name**: Next Ignition
   - **Default language**: English
   - **App or game**: App
   - **Free or paid**: Free
   - **Declarations**: Accept policies

#### Step 3: Complete Store Listing

**Required Information:**

1. **App Details**:
   - **Short description**: "Startup ecosystem platform connecting founders, investors, and experts"
   - **Full description**: 
     ```
     Next Ignition helps founders grow from idea to launch. 
     Connect with experts, get mentorship, build your MVP, 
     and raise funding—all on one platform.
     
     Features:
     • AI-Powered Expert Matching
     • Business Community Feed
     • Founder–Expert Booking System
     • AI Tools: Startup Summary, Profile Summarizer, Pitch Deck Summary
     • Webinars & Events
     • Real-time Messaging
     • Switch between Founder, Expert, Investor, and Agency roles
     ```

2. **Graphics**:
   - **App icon**: 512 x 512 pixels
   - **Feature graphic**: 1024 x 500 pixels
   - **Screenshots**: 
     - Phone: At least 2 (min 320px, max 3840px height)
     - Tablet (7"): At least 1 (optional)
     - Tablet (10"): At least 1 (optional)

3. **Categorization**:
   - **App category**: Business
   - **Tags**: Business, Productivity, Networking

4. **Contact Details**:
   - **Email**: support@nextignition.com
   - **Phone**: (optional)
   - **Website**: https://nextignition-app.vercel.app

5. **Privacy Policy**:
   - **URL**: Required (add your privacy policy URL)

#### Step 4: Set Up App Content

1. **Content Rating**:
   - Complete questionnaire
   - Get rating (usually "Everyone" for business apps)

2. **Target Audience**:
   - Age groups
   - Content guidelines

3. **Data Safety**:
   - Declare data collection practices
   - Privacy policy required

4. **App Access**:
   - All or some features require sign-in
   - Demo account (if needed)

#### Step 5: Upload Build

**Option A: Using EAS Submit (Recommended)**

```bash
# Submit to Play Store
npx eas-cli submit --platform android --profile production
```

**Option B: Manual Upload**

1. Download the `.aab` from EAS build
2. Go to Play Console → Your App → **Production** → **Create new release**
3. Upload the `.aab` file
4. Add **Release notes**:
   ```
   Initial release of Next Ignition
   - Connect founders with investors and experts
   - AI-powered matching and tools
   - Real-time messaging and webinars
   ```

#### Step 6: Complete Required Sections

1. **Store listing**: All sections complete
2. **Content rating**: Completed
3. **Privacy policy**: URL added
4. **Target audience**: Set
5. **Data safety**: Declared
6. **App access**: Configured

#### Step 7: Review and Rollout

1. Review all information
2. Click **"Review release"**
3. If everything is correct, click **"Start rollout to Production"**
4. Review typically takes 1-7 days

#### Step 8: After Approval

- App goes live automatically
- You'll receive email notification
- App appears in Play Store

---

## 📋 Pre-Submission Checklist

### Both Stores

- [ ] App builds successfully
- [ ] All features tested
- [ ] Privacy policy URL ready
- [ ] Support email configured
- [ ] App icon (1024x1024 for iOS, 512x512 for Android)
- [ ] Screenshots prepared
- [ ] App description written
- [ ] Keywords researched
- [ ] Age rating completed
- [ ] Demo account ready (if needed)

### iOS Specific

- [ ] Apple Developer account active
- [ ] iOS credentials set up
- [ ] App Store Connect app created
- [ ] All screenshots uploaded
- [ ] Export compliance answered
- [ ] App Review information added

### Android Specific

- [ ] Google Play Developer account created
- [ ] AAB build created (not APK)
- [ ] Content rating completed
- [ ] Data safety form completed
- [ ] Feature graphic created

---

## 🎨 Required Assets

### iOS App Store

1. **App Icon**: 1024 x 1024 px (PNG, no transparency)
2. **Screenshots**:
   - iPhone 6.7": 1290 x 2796 px
   - iPhone 6.5": 1242 x 2688 px
   - iPhone 5.5": 1242 x 2208 px
   - iPad Pro 12.9": 2048 x 2732 px (if supporting iPad)
3. **App Preview Video**: 15-30 seconds (optional)

### Google Play Store

1. **App Icon**: 512 x 512 px (PNG)
2. **Feature Graphic**: 1024 x 500 px
3. **Screenshots**:
   - Phone: 2+ screenshots
   - Tablet: 1+ screenshots (optional)
4. **Promo Video**: YouTube link (optional)

---

## 🚀 Quick Commands

### iOS

```bash
# Set up credentials
npx eas-cli credentials --platform ios

# Build for App Store
npx eas-cli build --platform ios --profile production

# Submit to App Store
npx eas-cli submit --platform ios --profile production
```

### Android

```bash
# Build AAB for Play Store
npx eas-cli build --platform android --profile production

# Submit to Play Store
npx eas-cli submit --platform android --profile production
```

---

## 📞 Support Resources

- **Apple App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **EAS Submit Docs**: https://docs.expo.dev/submit/introduction
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Play Store Policies**: https://play.google.com/about/developer-content-policy/

---

## ⏱️ Timeline

### iOS App Store
- **Setup**: 1-2 hours
- **Review**: 24-48 hours
- **Total**: 2-3 days

### Google Play Store
- **Setup**: 1-2 hours
- **Review**: 1-7 days
- **Total**: 2-8 days

---

## 💡 Tips

1. **Start with Android** (faster review, cheaper)
2. **Prepare all assets** before starting
3. **Test thoroughly** before submission
4. **Read guidelines** for both stores
5. **Have privacy policy** ready (required)
6. **Use demo accounts** if app requires login
7. **Respond quickly** to review feedback

---

**Next Steps**: 
1. Set up iOS credentials (if not done)
2. Build production apps
3. Create store listings
4. Submit for review

Good luck with your app store submissions! 🚀


