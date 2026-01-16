# Fix Keystore Default

## Current Situation

You just created a NEW keystore, but it has the WRONG SHA1 fingerprint:
- New keystore SHA1: `73:62:17:84:86:CE:E3:B5:CC:5E:9A:2E:CB:67:EC:85:C0:1F:11:9C`
- Google Play expects: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

## Good News! ✅

The "next1" configuration ALREADY has the CORRECT keystore with SHA1: `1F:FF:79:D6:F1:9F:A7:22:D8:EF:0F:D4:C7:86:8D:8F:7B:2C:E0:2A`

## Solution: Change Default Back to "next1"

In the EAS credentials menu, select:
1. **"Change default keystore"**
2. Choose **"next1"** (the one with the correct SHA1 fingerprint)

Then exit the credentials menu and rebuild the AAB.

## After Changing Default

Run this to rebuild with version 9:

```bash
export EXPO_TOKEN="HJZP-HsL5fEzzhmqD6SG9NiLCFwR0CuN4iYOZfgD"
eas build --platform android --profile production --non-interactive
```

The AAB will be signed with the correct key and Google Play will accept it! ✅
