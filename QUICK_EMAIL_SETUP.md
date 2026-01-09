# ⚡ Quick Email Setup - 3 Steps

## Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your **NextIgnition** project
3. Click **Authentication** (left sidebar)
4. Click **Email Templates** tab

## Step 2: Edit "Confirm signup" Template
1. Click on **"Confirm signup"** template
2. **Subject line:** Change to:
   ```
   Confirm your NextIgnition account
   ```

## Step 3: Replace Body with Custom Template
1. **Delete** all existing HTML in the body field
2. **Copy** the entire HTML template from `SUPABASE_EMAIL_TEMPLATE_READY_TO_USE.md`
3. **Paste** it into the body field
4. Click **Save** button (top right)

## ✅ Done!
Now register a new account and check your email - you'll see NextIgnition branding instead of Supabase!

---

## 🎯 Visual Guide

```
Supabase Dashboard
  └── Your Project
      └── Authentication (left sidebar)
          └── Email Templates (tab)
              └── Confirm signup (click to edit)
                  ├── Subject: "Confirm your NextIgnition account"
                  └── Body: [Paste custom HTML]
                      └── Click "Save"
```

---

## 📝 Important Notes

- The template uses `{{ .ConfirmationURL }}` - this is a Supabase variable, **don't change it**
- Make sure to click **Save** after pasting
- Test with a real email address to see the result
- The email will have NextIgnition branding, not Supabase
