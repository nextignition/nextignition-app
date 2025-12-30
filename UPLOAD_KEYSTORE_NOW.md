# ✅ Upload Keystore to EAS - Ready to Go!

## Found Keystore Information

- **Keystore File**: `/Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks`
- **Password**: `schoolbus`
- **Key Alias**: `release`
- **Key Password**: `schoolbus` (same as keystore password)

## 🚀 Upload to EAS Now

Run this command and follow the prompts:

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx eas-cli credentials
```

**When prompted:**
1. Select: `Android`
2. Select: `production`
3. Choose: `Set up a new keystore`
4. **Keystore file path**: 
   ```
   /Users/yatharthchauhan/Downloads/Next Ignition/hustlrhub/android/release-key.jks
   ```
5. **Keystore password**: `schoolbus`
6. **Key alias**: `release`
7. **Key password**: `schoolbus`

## After Upload

1. **Rebuild AAB**:
   ```bash
   npx eas-cli build --platform android --profile production
   ```

2. **Upload to Google Play** - it should work now! ✅

## Expected Result

If this is the correct keystore (SHA-1: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`), the AAB will be signed correctly and you can upload it to Google Play without any issues!

