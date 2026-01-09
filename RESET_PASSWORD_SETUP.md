# 🔐 Reset Password Setup Guide

## ✅ What's Been Configured

### 1. Reset Password Flow
- ✅ Request reset email screen
- ✅ "Check your email" confirmation screen
- ✅ Set new password screen (when clicking email link)
- ✅ Proper redirect URLs for web and mobile

### 2. Code Updates
- ✅ Updated redirect URL logic to work for web and mobile
- ✅ Created dedicated "check-email-reset" screen
- ✅ Improved password update flow
- ✅ Better error handling

---

## 🔧 Supabase Configuration Required

### Step 1: Add Redirect URLs

Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

Add these **Redirect URLs**:

**For Web:**
```
https://app.nextignition.com/reset-password
```

**For Mobile:**
```
nextignition://reset-password
```

**For Development:**
```
http://localhost:8081/reset-password
exp://localhost:8081/--/reset-password
```

### Step 2: Configure Email Template

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Click on **"Reset Password"** template
3. Update the template (see below)

---

## 📧 Reset Password Email Template

### Subject Line:
```
Reset your NextIgnition password
```

### Body (HTML) - Use This Template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - NextIgnition</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6666FF 0%, #4B4FDB 100%); padding: 50px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: -1px;">
                NextIgnition
              </h1>
              <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 18px;">
                Ignite the next chapter of your startup
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <h2 style="margin: 0 0 24px 0; color: #1f2937; font-size: 28px; font-weight: 600;">
                Reset your password
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 26px;">
                We received a request to reset your password for your <strong style="color: #6666FF;">NextIgnition</strong> account.
              </p>
              
              <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 26px;">
                Click the button below to set a new password. If you didn't request this, you can safely ignore this email.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 40px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #6666FF 0%, #4B4FDB 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 6px 20px rgba(102, 102, 255, 0.4);">
                      Reset password
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px; line-height: 20px; font-weight: 500;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0; padding: 14px 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; color: #6666FF; font-size: 13px; word-break: break-all; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; line-height: 20px;">
                      {{ .ConfirmationURL }}
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Security Note -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px;">
                    <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 20px;">
                      <strong>Security Note:</strong> This reset link will expire in 1 hour for your security. If you didn't request a password reset, please ignore this email or contact support if you're concerned.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 22px; text-align: center;">
                You're receiving this email because a password reset was requested for your <strong style="color: #6666FF;">NextIgnition</strong> account.
              </p>
              <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 18px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                © 2024 NextIgnition. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
```

---

## 🔄 Complete Flow

### 1. User Clicks "Forgot Password"
- On login screen → Clicks "Forgot password?"
- Navigates to reset password screen

### 2. User Enters Email
- Enters email address
- Clicks "Send reset instructions"
- Sees "Check Your Email" screen

### 3. User Clicks Email Link
- Receives email with reset link
- Clicks "Reset password" button
- Opens app/web → Shows "Set new password" form

### 4. User Sets New Password
- Enters new password
- Confirms password
- Clicks "Update Password"
- Sees success message
- Redirects to login

---

## ✅ Testing Checklist

1. **Test Request Reset:**
   - [ ] Go to login screen
   - [ ] Click "Forgot password?"
   - [ ] Enter email
   - [ ] Click "Send reset instructions"
   - [ ] See "Check Your Email" screen

2. **Test Email:**
   - [ ] Check email inbox
   - [ ] See NextIgnition-branded email
   - [ ] Click "Reset password" link

3. **Test Password Reset:**
   - [ ] App opens to reset password screen
   - [ ] Enter new password
   - [ ] Confirm password
   - [ ] Click "Update Password"
   - [ ] See success message
   - [ ] Redirects to login

4. **Test Login:**
   - [ ] Login with new password
   - [ ] Should work successfully

---

## 🔧 Troubleshooting

**If reset link doesn't work:**
- Check redirect URLs are added in Supabase
- Verify the URL matches exactly (no trailing slash)
- Check email template uses `{{ .ConfirmationURL }}`

**If email doesn't send:**
- Check Supabase Dashboard → Authentication → Settings
- Verify email is enabled
- Check spam folder

**If app doesn't open from link:**
- Verify deep link scheme is `nextignition` (in app.json)
- Check redirect URL is `nextignition://reset-password`
- Make sure it's in Supabase allowed redirect URLs

---

## 📝 Current Configuration

- **App Scheme:** `nextignition` (from app.json)
- **Web URL:** `https://app.nextignition.com`
- **Reset Password Route:** `/reset-password`
- **Deep Link Format:** `nextignition://reset-password`

Everything is configured and ready to use! 🎉
