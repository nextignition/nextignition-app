# 🎨 NextIgnition Email Template - Ready to Use

## 📋 Quick Setup Steps

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project
   - Click **Authentication** in the left sidebar
   - Click **Email Templates** tab

2. **Edit "Confirm signup" Template**
   - Find the **"Confirm signup"** template
   - Click on it to edit

3. **Update Subject Line**
   - Replace with: `Confirm your NextIgnition account`

4. **Replace Email Body**
   - Delete all existing content
   - Copy and paste the HTML template below
   - Click **Save**

---

## ✉️ Email Template (Copy This Entire Block)

### Subject:
```
Confirm your NextIgnition account
```

### Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with NextIgnition Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                NextIgnition
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Ignite the next chapter of your startup
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Confirm your signup
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                Welcome to NextIgnition! We're excited to have you join our community of founders, investors, and experts.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                To complete your registration and start connecting with the NextIgnition network, please confirm your email address by clicking the button below:
              </p>
              
              <!-- Confirmation Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Confirm your email
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 10px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px 0; padding: 12px; background-color: #f9fafb; border-radius: 6px; color: #667eea; font-size: 13px; word-break: break-all; font-family: monospace;">
                {{ .ConfirmationURL }}
              </p>
              
              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                This link will expire in 24 hours for security reasons.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                You're receiving this email because you signed up for a NextIgnition account.
              </p>
              <p style="margin: 0 0 20px 0; color: #9ca3af; font-size: 12px; line-height: 18px;">
                If you didn't create an account, you can safely ignore this email.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 18px; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
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

## ✅ After Saving

1. **Test it:**
   - Register a new test account
   - Check your email inbox
   - You should see the NextIgnition-branded email

2. **Verify the link works:**
   - Click "Confirm your email" button
   - Should redirect to your app's email-verified page
   - Then auto-redirect to login

---

## 🔧 Troubleshooting

**If you still see Supabase branding:**
- Make sure you clicked **Save** after pasting the template
- Clear your browser cache and try registering again
- Check that you edited the correct template ("Confirm signup")

**If the email doesn't send:**
- Check Supabase Dashboard → Authentication → Settings
- Verify email is enabled
- Check your email provider isn't blocking it

**If the link doesn't work:**
- Make sure your redirect URL is whitelisted in Supabase
- Go to Authentication → URL Configuration
- Add your app's URL to allowed redirect URLs

---

## 📧 Customize Other Email Templates

You can use the same styling for:
- **Reset Password** - Same header/footer, different content
- **Magic Link** - Same header/footer, different content  
- **Change Email** - Same header/footer, different content

Just replace the main content section while keeping the header and footer the same.
