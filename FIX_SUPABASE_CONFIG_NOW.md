# 🚨 Fix Supabase Configuration - URGENT

## Problem
- Error: "requested path is invalid"
- `redirect_to=%20` (just a space) in the URL
- Site URL is **EMPTY**
- Malformed redirect URL (two URLs stuck together)

## ✅ Fix This Now

### Step 1: Set Site URL (REQUIRED)

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. In **Site URL** field, enter:
   ```
   https://app.nextignition.com/
   ```
3. **DO NOT** leave it empty!

### Step 2: Fix Malformed Redirect URL

You have this malformed URL:
```
https://app.nextignition.com/reset-passwordnextignition://reset-password
```

**This is TWO URLs stuck together!** Fix it:

1. **Delete** this malformed URL completely
2. **Add them separately** as two different URLs:

**First URL:**
```
https://app.nextignition.com/reset-password
```

**Second URL (click "Add URL" again):**
```
nextignition://reset-password
```

### Step 3: Complete Redirect URLs List

Your **Redirect URLs** should be (one per line, each on separate entry):

```
✅ https://app.nextignition.com/email-verified
✅ https://app.nextignition.com/reset-password
✅ nextignition://email-verified
✅ nextignition://reset-password
✅ http://localhost:8081/reset-password
✅ http://localhost:8081/auth-callback
✅ http://localhost:8081/(auth)/auth-callback
```

### Step 4: Verify Each URL

Make sure:
- ✅ Each URL is on a **separate line/entry**
- ✅ No spaces before or after
- ✅ No trailing slashes (except Site URL)
- ✅ No URLs stuck together
- ✅ Site URL is set to `https://app.nextignition.com/`

### Step 5: Save Changes

1. Click **"Save changes"** button
2. Wait 1-2 minutes for changes to propagate

---

## 🎯 Correct Configuration

### Site URL:
```
https://app.nextignition.com/
```

### Redirect URLs (each on separate entry):
```
https://app.nextignition.com/email-verified
https://app.nextignition.com/reset-password
nextignition://email-verified
nextignition://reset-password
http://localhost:8081/reset-password
http://localhost:8081/auth-callback
http://localhost:8081/(auth)/auth-callback
```

---

## ⚠️ Common Mistakes to Avoid

❌ **DON'T:**
- Leave Site URL empty
- Put multiple URLs on one line
- Add spaces before/after URLs
- Use wildcards in Site URL
- Concatenate URLs together

✅ **DO:**
- Set Site URL to `https://app.nextignition.com/`
- Put each URL on a separate entry
- No spaces, no trailing slashes (except Site URL)
- Use exact URLs only

---

## ✅ After Fixing

1. **Request a NEW password reset** (old links won't work)
2. **Check email** - the link should show:
   ```
   redirect_to=https://app.nextignition.com/reset-password
   ```
   (No spaces, correct URL)
3. **Click link** - should work perfectly!

---

## 🔍 Why This Happened

- **Empty Site URL** → Supabase uses empty/default → causes `redirect_to=%20` (space)
- **Malformed URL** → Two URLs stuck together → Supabase can't parse it
- **Missing exact URLs** → Supabase falls back to Site URL (which was empty)

**Fix all three issues above and it will work!** ✅
