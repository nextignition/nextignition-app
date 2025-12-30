# Update App Without Resetting Upload Key

## Understanding the Situation

- **Google Play expects**: SHA-1 `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`
- **Current EAS keystore**: SHA-1 `70:F2:95:45:64:13:AF:00:60:B9:60:F8:08:E1:83:20:E9:24:90:DC`

## ⚠️ Important: Expo Go vs Production

**Expo Go** is for **development/testing only** - it doesn't require signing keys. However, you **cannot** publish to Google Play Store using Expo Go.

## Options to Update Without Reset

### Option 1: Use Expo Go for Development (No Signing Needed)

If you just want to **test** the app during development:

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx expo start
```

Then scan the QR code with Expo Go app on your phone. **This doesn't require any signing keys.**

### Option 2: Find the Original Keystore (Best Option)

If you can find the original keystore file that matches SHA-1 `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`:

1. **Search your computer**:
   ```bash
   # Search for keystore files
   find ~ -name "*.jks" -o -name "*.keystore" 2>/dev/null
   ```

2. **Check common locations**:
   - Downloads folder
   - Desktop
   - Previous project folders
   - Backup drives
   - Cloud storage (Google Drive, Dropbox)

3. **Verify the keystore** (if found):
   ```bash
   keytool -list -v -keystore path/to/keystore.jks -alias your-alias
   ```
   - Check if SHA-1 matches: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

4. **Upload to EAS**:
   ```bash
   npx eas-cli credentials
   ```
   - Select: `Android` → `production`
   - Choose: `Set up a new keystore`
   - Upload your keystore file
   - Enter password and alias

5. **Rebuild**:
   ```bash
   npx eas-cli build --platform android --profile production
   ```

### Option 3: Check if App Was Built Before with Different Tool

If the app was previously built with:
- **Android Studio** (Gradle)
- **React Native CLI**
- **Another build service**

The keystore might be in:
- `android/app/keystore.jks`
- `android/keystore.properties` (references keystore location)
- Project root or `android/` folder

### Option 4: Internal Testing Track (Temporary Workaround)

You can't bypass the signing requirement, but you could:
1. Use **Internal Testing** track if available
2. However, this still requires the correct upload key

## ❌ What Won't Work

- **Cannot use Expo Go for production** - Expo Go is development only
- **Cannot bypass signing requirement** - Google Play requires matching upload key
- **Cannot generate keystore from certificate** - Need the private key, not just the certificate
- **Cannot download keystore from Google Play** - Google doesn't store your private keys

## ✅ Recommended Solution

**Find the original keystore** - this is the only way to update without resetting:

1. Search all your devices and backups
2. Check with team members
3. Look in old project folders
4. Check cloud storage

If you absolutely cannot find it, you **must** reset the upload key (takes 1-3 days + 72 hours wait).

## Quick Commands

### Search for Keystore Files
```bash
# Search entire home directory
find ~ -name "*.jks" -o -name "*.keystore" -o -name "*.p12" 2>/dev/null

# Search current project
find . -name "*.jks" -o -name "*.keystore" 2>/dev/null

# Search common locations
ls -la ~/Downloads/*.jks ~/Downloads/*.keystore 2>/dev/null
ls -la ~/Desktop/*.jks ~/Desktop/*.keystore 2>/dev/null
```

### Verify Keystore SHA-1
```bash
keytool -list -v -keystore path/to/keystore.jks -alias your-alias
```

### Test with Expo Go (Development Only)
```bash
npx expo start
```

