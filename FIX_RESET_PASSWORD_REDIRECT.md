# 🔧 Fix Password Reset Redirect Issue

## Problem
The reset password link shows "This screen doesn't exist" because:
1. The redirect URL has spaces: `redirect_to=%20%20%20https://app.nextignition.com/*`
2. Using wildcard `/*` instead of exact URL
3. The app can't find the route

## ✅ Solution

### Step 1: Fix Supabase Redirect URLs

**Remove the wildcard and use EXACT URLs:**

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. **Remove** this URL if it exists:
   ```
   https://app.nextignition.com/*
   ```
3. **Add/Keep** these EXACT URLs (no wildcards, no spaces):
   ```
   https://app.nextignition.com/reset-password
   https://app.nextignition.com/email-verified
   nextignition://reset-password
   nextignition://email-verified
   ```
4. **Site URL** should be:
   ```
   https://app.nextignition.com/
   ```
5. Click **"Save changes"**

### Step 2: Verify Code is Updated

I've already updated the code to:
- ✅ Trim whitespace from redirect URLs
- ✅ Use exact paths (no wildcards)
- ✅ Better handle recovery type detection
- ✅ Route properly from root URL with params

### Step 3: Test Again

1. **Request a new password reset** (the old link won't work)
2. **Check the email** - the link should show:
   ```
   redirect_to=https://app.nextignition.com/reset-password
   ```
   (No spaces, no wildcard)
3. **Click the link** - should open the reset password screen

---

## 🔍 Why This Happened

The wildcard `/*` in redirect URLs can cause issues:
- Supabase might encode it incorrectly
- The app router might not match wildcards
- Spaces in URLs break routing

**Solution:** Use exact URLs only.

---

## ✅ Correct Configuration

### Site URL:
```
https://app.nextignition.com/
```

### Redirect URLs (EXACT, no wildcards):
```
✅ https://app.nextignition.com/reset-password
✅ https://app.nextignition.com/email-verified
✅ nextignition://reset-password
✅ nextignition://email-verified
✅ http://localhost:8081/reset-password
✅ http://localhost:8081/email-verified
```

### ❌ DON'T Use:
```
❌ https://app.nextignition.com/*
❌ https://app.nextignition.com/* (with spaces)
❌ Any URL with trailing spaces
```

---

## 🎯 After Fixing

1. **Request a NEW password reset** (old links won't work)
2. **Check email** - verify the redirect URL is correct
3. **Click link** - should work perfectly now!

The code is already updated to handle this properly. Just fix the Supabase configuration! ✅
