# Supabase Email Template Customization Guide

This guide shows you how to customize Supabase email templates to remove Supabase branding and use NextIgnition branding instead.

## 📧 Where to Customize

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Email Templates**
3. You'll see templates for:
   - Confirm signup
   - Invite user
   - Magic Link
   - Change Email Address
   - Reset Password

## 🎨 Custom Email Template for "Confirm Signup"

Replace the default template with this custom NextIgnition-branded version:

### Subject Line:
```
Confirm your NextIgnition account
```

### Email Body (HTML):
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Email - NextIgnition</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                NextIgnition
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Ignite the next chapter of your startup
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Confirm your signup
              </h2>
              
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                Welcome to NextIgnition! We're excited to have you join our community of founders, investors, and experts.
              </p>
              
              <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 24px;">
                To complete your registration and start connecting with the NextIgnition network, please confirm your email address by clicking the button below:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Confirm your email
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0 0; color: #667eea; font-size: 14px; word-break: break-all;">
                {{ .ConfirmationURL }}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 20px;">
                You're receiving this email because you signed up for a NextIgnition account.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 18px;">
                If you didn't create an account, you can safely ignore this email.
              </p>
              <p style="margin: 20px 0 0 0; color: #9ca3af; font-size: 12px; line-height: 18px; text-align: center;">
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

## 🔧 Steps to Apply

1. **Copy the HTML template above**
2. **Go to Supabase Dashboard** → **Authentication** → **Email Templates**
3. **Click on "Confirm signup" template**
4. **Replace the Subject** with: `Confirm your NextIgnition account`
5. **Replace the Body** with the HTML template above
6. **Click "Save"**

## 📝 Available Variables

Supabase provides these variables you can use in templates:
- `{{ .ConfirmationURL }}` - The confirmation link
- `{{ .Email }}` - User's email address
- `{{ .Token }}` - The confirmation token (if needed)
- `{{ .TokenHash }}` - Hashed token (if needed)
- `{{ .SiteURL }}` - Your site URL
- `{{ .RedirectTo }}` - Redirect URL after confirmation

## 🎨 Customize Other Templates

You can use similar styling for other email templates:
- **Reset Password** - Use same header/footer, change content
- **Magic Link** - Use same header/footer, change content
- **Change Email** - Use same header/footer, change content

## ✅ Testing

After updating:
1. Register a new test account
2. Check your email inbox
3. Verify the email looks correct with NextIgnition branding
4. Click the confirmation link
5. Verify it redirects to `/email-verified` page

## 🔒 Security Note

- Never share your Supabase project credentials
- Keep email templates secure
- Test with a real email address before going live

---

**Need Help?** If you encounter issues, check:
- Supabase Dashboard → Authentication → Settings → Email Templates
- Make sure your redirect URLs are whitelisted in Supabase Auth settings
- Verify your app's deep link scheme matches the redirect URL
