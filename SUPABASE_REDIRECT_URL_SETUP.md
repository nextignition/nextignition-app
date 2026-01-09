# 🔗 Supabase Redirect URL Configuration

## ⚠️ Important: Configure These URLs in Supabase

After updating the code, you **must** add these redirect URLs to your Supabase project:

### Steps:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your **NextIgnition** project
   - Click **Authentication** (left sidebar)
   - Click **URL Configuration** (under Settings)

2. **Add Redirect URLs**

   Add these URLs to the **"Redirect URLs"** list:

   **For Web:**
   ```
   https://app.nextignition.com/email-verified
   http://localhost:8081/email-verified
   ```

   **For Mobile (iOS/Android):**
   ```
   nextignition://email-verified
   ```

   **For Development:**
   ```
   http://localhost:8081/email-verified
   exp://localhost:8081/email-verified
   ```

3. **Add Site URL**

   In the **"Site URL"** field, enter:
   ```
   https://app.nextignition.com
   ```
   (Or your actual web app URL)

4. **Click "Save"**

---

## 📱 How It Works

### Web Flow:
1. User clicks confirmation link in email
2. Supabase verifies email
3. Redirects to: `https://app.nextignition.com/email-verified`
4. Shows "Email Verified!" page
5. Auto-redirects to login after 5 seconds

### Mobile Flow:
1. User clicks confirmation link in email
2. Opens app via deep link: `nextignition://email-verified`
3. App shows "Email Verified!" page
4. Auto-redirects to login after 5 seconds

---

## ✅ Testing

1. **Register a new account**
2. **Check your email** - click the confirmation link
3. **Verify:**
   - Web: Opens `app.nextignition.com/email-verified` → Shows success page → Redirects to login
   - Mobile: Opens app → Shows success page → Redirects to login

---

## 🔧 Troubleshooting

**If it still opens `app.nextignition.com` (web) instead of app:**
- Make sure you added `nextignition://email-verified` to redirect URLs
- Check that your app's deep link scheme is `nextignition` (in app.json)
- On mobile, the link should open the app, not the browser

**If the page shows error:**
- Check that `/email-verified` route exists in your app
- Verify the redirect URL is exactly as shown above
- Check browser console for errors

**If redirect doesn't work:**
- Make sure you clicked "Save" in Supabase
- Wait a few minutes for changes to propagate
- Try registering a new account to test

---

## 📝 Current Configuration

- **App Scheme:** `nextignition` (from app.json)
- **Web URL:** `https://app.nextignition.com` (update if different)
- **Email Verified Route:** `/email-verified`
- **Deep Link Format:** `nextignition://email-verified`

Make sure all these match your actual setup!
