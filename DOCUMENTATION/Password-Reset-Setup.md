# Password Reset Email Setup Guide

This guide will help you configure Supabase to send password reset emails.

## Common Issues

If password reset emails are not arriving, check the following:

## Step 1: Configure Redirect URLs in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **URL Configuration**
4. Under **Redirect URLs**, add:
   - `http://localhost:5173/reset-password` (for local development)
   - `https://yourdomain.com/reset-password` (for production)
5. Click **Save**

## Step 2: Configure Email Templates

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Find the **Reset Password** template
3. Make sure it's **enabled**
4. You can customize the email template if needed
5. The default template should work fine

## Step 3: Check Email Provider Settings

### Option A: Using Supabase Default Email (Free Tier - Limited)

Supabase free tier has **limited email sending**:
- Only works for emails you verify in your Supabase project
- May have rate limits
- Emails might be delayed

**To verify your email:**
1. Go to **Authentication** → **Users**
2. Find your user account
3. Make sure the email is verified

### Option B: Configure Custom SMTP (Recommended for Production)

For reliable email delivery, configure custom SMTP:

1. Go to **Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Enable **Custom SMTP**
4. Enter your SMTP provider details:
   - **Host**: Your SMTP server (e.g., `smtp.gmail.com`, `smtp.sendgrid.net`)
   - **Port**: Usually `587` for TLS or `465` for SSL
   - **Username**: Your SMTP username
   - **Password**: Your SMTP password
   - **Sender email**: The email address to send from
   - **Sender name**: Display name (e.g., "BackTrack")

**Popular SMTP Providers:**
- **SendGrid**: Free tier: 100 emails/day
- **Mailgun**: Free tier: 5,000 emails/month
- **Resend**: Free tier: 3,000 emails/month
- **Gmail**: Requires app password (not recommended for production)

## Step 4: Set Site URL

1. Go to **Settings** → **Authentication**
2. Set **Site URL** to:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

## Step 5: Test Email Sending

1. Try the password reset flow in your app
2. Check the browser console for any errors
3. Check your email inbox (and spam folder)
4. Check Supabase Dashboard → **Logs** → **Auth Logs** for email sending status

## Troubleshooting

### Email not arriving?

1. **Check Spam Folder**: Emails often go to spam, especially from free tier
2. **Check Supabase Logs**: 
   - Go to **Logs** → **Auth Logs**
   - Look for email sending errors
3. **Verify Email Address**: Make sure the email exists in your Supabase users
4. **Check Rate Limits**: Free tier has rate limits - wait a few minutes and try again
5. **Verify Redirect URL**: Make sure it's added in URL Configuration
6. **Check SMTP Settings**: If using custom SMTP, verify all credentials are correct

### Common Error Messages

- **"Invalid redirect URL"**: Add the URL to Authentication → URL Configuration
- **"Rate limit exceeded"**: Wait a few minutes before trying again
- **"User not found"**: The email doesn't exist in your database (Supabase still sends success for security)
- **"Email sending failed"**: Check SMTP configuration or use custom SMTP

## Testing

To test if email is working:

1. Use a real email address that you have access to
2. Make sure the email is registered in your Supabase project
3. Try the password reset flow
4. Check both inbox and spam folder
5. Check Supabase logs for any errors

## Production Recommendations

For production, **always use custom SMTP**:
- More reliable delivery
- Better email reputation
- No rate limits (depending on provider)
- Customizable email templates
- Better deliverability

## Additional Notes

- Supabase sends success even if email doesn't exist (for security - prevents email enumeration)
- Free tier emails may take a few minutes to arrive
- Always check spam folder
- Consider using a professional email service for production

