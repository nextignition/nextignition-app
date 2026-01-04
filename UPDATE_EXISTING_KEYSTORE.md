# Update Existing Keystore in EAS

## Problem

You're getting: "Android app build credentials with name already exists for this Android app credential: c2"

This means there's already a keystore configured. We need to **update** it, not create a new one.

## Solution: Update Existing Credentials

### Step 1: Run Credentials Command Again

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx eas-cli credentials --platform android
```

### Step 2: Follow These Prompts

1. **Select build profile**: Choose `production`
2. **What do you want to do?**: 
   - Look for option like **"Update existing credentials"** or **"Replace keystore"**
   - OR choose **"Remove credentials"** first, then set up new one
   - OR choose **"Set up a new keystore"** and it should ask to replace existing

3. **If it asks to replace/update**: Confirm **Yes**

4. **Keystore file path**:
   ```
   /Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks
   ```

5. **Keystore password**: `schoolbus`

6. **Key alias**: `release`

7. **Key password**: `schoolbus`

## Alternative: Remove and Recreate

If updating doesn't work, you can remove the existing credentials first:

1. Run: `npx eas-cli credentials --platform android`
2. Select: `production`
3. Choose: **"Remove credentials"** or **"Delete keystore"**
4. Confirm removal
5. Then run the command again and choose **"Set up a new keystore"**

## After Success

Once the keystore is updated:

```bash
npx eas-cli build --platform android --profile production
```

The new AAB should have the correct SHA-1: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

