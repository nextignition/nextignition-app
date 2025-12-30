# Use Found Keystore to Update App

## ✅ Found Keystore File

**Location**: `/Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks`

This looks like it could be the original keystore! Let's use it.

## 🚀 Quick Steps to Update Without Reset

### Step 1: Upload Keystore to EAS

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx eas-cli credentials
```

**Follow these prompts:**
1. Select: `Android`
2. Select: `production`
3. Choose: `Set up a new keystore`
4. When asked for keystore file, provide:
   ```
   /Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks
   ```
5. Enter the **keystore password** (you'll need to know this)
6. Enter the **key alias** (common values: `key0`, `upload`, `release`, or `androidkey`)
7. Enter the **key password** (might be same as keystore password)

### Step 2: Rebuild AAB

After uploading the keystore:

```bash
npx eas-cli build --platform android --profile production
```

### Step 3: Upload to Google Play

1. Download the new AAB from EAS
2. Go to Google Play Console → Your App → Release → Production
3. Create new release
4. Upload the AAB
5. It should work now! ✅

## ⚠️ If You Don't Know the Password

If you don't remember the keystore password:

1. **Try common passwords**:
   - Empty password (just press Enter)
   - `android`
   - `password`
   - `123456`
   - Your project name

2. **Check for password files**:
   - Look for `keystore.properties` in the same folder
   - Check for notes/documentation about the password

3. **If password is lost**: You'll need to reset the upload key (takes 1-3 days)

## 📝 Alternative: Verify Keystore First (Optional)

If you want to verify the SHA-1 before uploading:

1. **Install Java** (if not installed):
   ```bash
   brew install openjdk
   ```

2. **Check SHA-1**:
   ```bash
   keytool -list -v -keystore "/Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks"
   ```
   
   Look for SHA-1: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

## 🎯 Recommended: Just Try It!

Since we found a keystore in the "Next Ignition" folder, it's very likely the correct one. Just upload it to EAS and rebuild - if it matches, it will work!

