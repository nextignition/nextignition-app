# 🎨 Professional NextIgnition Email Template

## Copy this entire template into Supabase Dashboard

### Subject Line:
```
Confirm your NextIgnition account
```

### Body (HTML) - Copy Everything Below:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Confirm Your Email - NextIgnition</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  
  <!-- Main Container -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Email Card -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); max-width: 600px; width: 100%;">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #6666FF 0%, #4B4FDB 100%); padding: 50px 40px; text-align: center;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <h1 style="margin: 0; color: #ffffff; font-size: 36px; font-weight: 700; letter-spacing: -1px; line-height: 1.2;">
                      NextIgnition
                    </h1>
                    <p style="margin: 12px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 18px; font-weight: 400; letter-spacing: 0.3px;">
                      Ignite the next chapter of your startup
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 50px 40px;">
              
              <!-- Greeting -->
              <h2 style="margin: 0 0 24px 0; color: #1f2937; font-size: 28px; font-weight: 600; line-height: 1.3; letter-spacing: -0.5px;">
                Confirm your signup
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 26px;">
                Welcome to <strong style="color: #6666FF;">NextIgnition</strong>! We're thrilled to have you join our exclusive community of ambitious founders, strategic investors, and industry experts.
              </p>
              
              <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 26px;">
                To complete your registration and unlock access to our platform, please confirm your email address by clicking the button below:
              </p>
              
              <!-- CTA Button -->
              <!-- IMPORTANT: Use {{ .ConfirmationURL }} which includes the redirectTo parameter -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 40px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #6666FF 0%, #4B4FDB 100%); color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 6px 20px rgba(102, 102, 255, 0.4); transition: all 0.3s ease;">
                      Confirm your email
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
                      <strong>Security Note:</strong> This confirmation link will expire in 24 hours for your security. If you didn't create this account, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
              
              <!-- Footer Content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px 0;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 22px;">
                      You're receiving this email because you signed up for a <strong style="color: #6666FF;">NextIgnition</strong> account.
                    </p>
                  </td>
                </tr>
                
                <tr>
                  <td align="center" style="padding: 0 0 24px 0; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                    <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; line-height: 18px;">
                      © 2024 NextIgnition. All rights reserved.
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 18px;">
                      Connecting founders, investors, and experts worldwide.
                    </p>
                  </td>
                </tr>
              </table>
              
            </td>
          </tr>
          
        </table>
        
        <!-- Spacer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
          <tr>
            <td align="center">
              <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 16px;">
                This is an automated message. Please do not reply to this email.
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

## 📋 How to Use

1. **Go to Supabase Dashboard**
   - Navigate to: **Authentication** → **Email Templates**
   - Click on **"Confirm signup"** template

2. **Update Subject:**
   - Replace with: `Confirm your NextIgnition account`

3. **Update Body:**
   - Delete all existing content
   - Copy the entire HTML block above (from `<!DOCTYPE html>` to `</html>`)
   - Paste into the Body field
   - Click **Save**

4. **Test:**
   - Register a new account
   - Check your email - you'll see professional NextIgnition branding!

---

## ✨ Features

- ✅ Professional gradient header matching your app
- ✅ Modern, clean design
- ✅ Mobile-responsive
- ✅ Clear call-to-action button
- ✅ Security notice included
- ✅ Professional footer
- ✅ No Supabase branding
- ✅ Matches your app's color scheme (#6666FF, #4B4FDB)

---

## 🎨 Design Elements

- **Header:** Purple gradient matching your app
- **Button:** Gradient CTA with shadow
- **Typography:** Clean, modern fonts
- **Spacing:** Professional padding and margins
- **Colors:** Matches your app's theme
- **Footer:** Clean, minimal branding

This template will make your emails look professional and match your app perfectly!
