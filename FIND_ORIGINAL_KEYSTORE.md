# Find Original Keystore File

## What We Need

Google Play expects upload key with SHA-1: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

## Where to Look

### 1. Check Your Computer
Search for these file types:
- `*.jks` (Java KeyStore)
- `*.keystore`
- `*.p12` (PKCS12 format)

**Search locations:**
- Downloads folder
- Desktop
- Documents folder
- Previous project folders
- Backup drives
- Cloud storage (Google Drive, Dropbox, etc.)

### 2. Check Previous Builds
If you built the app before:
- Check old project folders
- Look for `android/app/` directories
- Check for `keystore.properties` files
- Look in `.gradle` or `android/` folders

### 3. Check Team Members
- Ask team members if they have the keystore
- Check shared drives or password managers
- Look in version control (but keystores shouldn't be committed)

### 4. Check EAS History
The keystore might have been uploaded to EAS before. Let's check:

```bash
cd "/Volumes/Yatri Cloud/clients/Next Ignition/live/nextignition-app"
npx eas-cli credentials
```

Then:
- Select `Android`
- Select `production`
- Choose `credentials.json: Upload/Download credentials`
- Select `Download credentials from EAS to credentials.json`

This will download the current credentials. If there's a different keystore in EAS history, we might need to check previous builds.

## Verify Keystore SHA-1

If you find a keystore file, verify its SHA-1:

```bash
keytool -list -v -keystore path/to/your-keystore.jks -alias your-key-alias
```

Look for the SHA-1 fingerprint. It should match: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

## If You Can't Find It

If you can't find the original keystore, you'll need to **reset the upload key** in Google Play Console:

1. Go to: Google Play Console → Your App → Release → Setup → App signing
2. Click: **"Request upload key reset"**
3. Contact Google Support: https://support.google.com/googleplay/android-developer/contact/key
4. Wait for approval (1-3 business days)
5. After reset, rebuild and upload

## Next Steps

1. **Search your computer** for keystore files
2. **Check with team members** if they have it
3. **Download current EAS credentials** to see what's there
4. **If not found**, proceed with upload key reset

