# 🔧 Fix Email Verification Redirect Issue

## Problem
The email verification link redirects to `https://app.nextignition.com/` (root) instead of `/email-verified`.

## Root Cause
Supabase is using the **Site URL** as the redirect because the `emailRedirectTo` URL might not be in the allowed redirect URLs list, or there's a mismatch.

---

## ✅ Solution - 2 Steps

### Step 1: Update Supabase Site URL (IMPORTANT)

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Change **Site URL** from:
   ```
   https://app.nextignition.com/
   ```
   To:
   ```
   https://app.nextignition.com/email-verified
   ```
3. Click **"Save changes"**

**OR** keep the Site URL as root, but make sure the redirect URL is in the allowed list (Step 2).

---

### Step 2: Verify Redirect URLs List

Make sure you have **exactly** this URL in your **Redirect URLs** list:

```
https://app.nextignition.com/email-verified
```

**Not:**
- ❌ `https://app.nextignition.com/` (root)
- ❌ `https://app.nextignition.com/*` (wildcard - might not work for specific routes)

**Yes:**
- ✅ `https://app.nextignition.com/email-verified` (specific route)

---

## 🔍 How to Check

1. **Register a new test account**
2. **Check the email** - look at the confirmation link
3. **The link should look like:**
   ```
   https://gatwoxtvedjgdxahgzkw.supabase.co/auth/v1/verify?token=xxx&type=signup&redirect_to=https://app.nextignition.com/email-verified
   ```
   
   Notice: `redirect_to=https://app.nextignition.com/email-verified` ✅

4. **If it shows:**
   ```
   redirect_to=https://app.nextignition.com/
   ```
   
   Then the Site URL is being used instead. Fix by:
   - Adding `https://app.nextignition.com/email-verified` to Redirect URLs
   - OR changing Site URL to `/email-verified`

---

## 🎯 Alternative: Handle Root URL with Params

I've updated the code to handle verification even when it redirects to root. The app will:

1. Detect verification params on root URL (`?type=signup&token=xxx`)
2. Automatically redirect to `/email-verified` page
3. Show success message
4. Redirect to login

So even if Supabase redirects to root, the app will still work! ✅

---

## 📝 Complete Redirect URLs List

Your **Redirect URLs** should include:

```
✅ https://app.nextignition.com/email-verified
✅ https://app.nextignition.com/*
✅ nextignition://email-verified
✅ http://localhost:8081/email-verified
✅ exp://localhost:8081/--/reset-password
✅ http://localhost:8081/reset-password
```

---

## ✅ After Fixing

1. **Save changes** in Supabase
2. **Wait 1-2 minutes** for changes to propagate
3. **Register a new test account**
4. **Click the confirmation link**
5. **Should now:**
   - Open `https://app.nextignition.com/email-verified`
   - Show "Email Verified!" page
   - Auto-redirect to login after 5 seconds

---

## 🔧 Code Changes Made

I've updated:
- ✅ `app/index.tsx` - Now handles verification params on root URL
- ✅ `app/(auth)/register.tsx` - Better logging for redirect URLs

The app will now work even if Supabase redirects to root with params!

---

## 💡 Pro Tip

If you want to keep Site URL as root (`https://app.nextignition.com/`), make sure:
1. `https://app.nextignition.com/email-verified` is in Redirect URLs
2. The `emailRedirectTo` in code matches exactly
3. The app handles root URL with verification params (already done ✅)
