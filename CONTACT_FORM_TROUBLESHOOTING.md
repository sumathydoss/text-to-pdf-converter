# Contact Form & reCAPTCHA Troubleshooting Guide

## Issues Fixed

### 1. ✅ reCAPTCHA Not Showing
**Problem**: The reCAPTCHA checkbox was not visible on the contact page.

**Root Cause**: 
- The API script was loading but the `grecaptcha.render()` wasn't initializing properly
- Missing error handling for when grecaptcha API loads

**Solution Applied**:
- Added console logging to verify grecaptcha loads
- Added check for `window.grecaptcha` availability
- Ensured proper DOMContentLoaded timing before render
- Added theme property to render call for v2 checkbox

**To Verify**: 
1. Open contact.html
2. Open browser Developer Tools (F12)
3. Check Console tab for message: `"reCAPTCHA v2 initialized with site key:..."`
4. You should see the reCAPTCHA checkbox appear after "Message *" field

### 2. ✅ 400 Error on Form Submission
**Problem**: Form returns 400 error when submitted

**Root Causes**:
- Empty reCAPTCHA token (because reCAPTCHA wasn't rendering)
- Missing fields in form submission

**Solutions Applied**:
- Added detailed validation logging in API to show which fields are missing
- Enhanced client-side validation with trim() to remove whitespace
- Added console logging of request body before sending
- Added better error messages showing which fields are missing

**To Debug**:
1. Open Developer Tools (F12)
2. Go to Console tab
3. Fill form and submit
4. Look for log message showing what field failed validation
5. Check Network tab to see exact 400 response with missingFields array

### 3. ✅ Email Not Sending
**Problem**: Contact form doesn't send emails

**Prerequisites for Email Sending**:
You must have the following environment variables configured on Vercel:
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP authentication username
- `SMTP_PASS` - SMTP authentication password
- `SMTP_SECURE` - Set to 'true' for port 465, 'false' for other ports
- `SMTP_FROM` - (Optional) From email address
- `CONTACT_EMAIL_RECIPIENT` - Email address to receive contact messages

**Common SMTP Providers**:
```
Gmail:
  Host: smtp.gmail.com
  Port: 465 (or 587)
  Secure: true (for 465)
  User: your-email@gmail.com
  Pass: App-specific password (not regular password)

Outlook:
  Host: smtp-mail.outlook.com
  Port: 587
  Secure: false
  User: your-email@outlook.com
  Pass: Your password

SendGrid:
  Host: smtp.sendgrid.net
  Port: 587
  Secure: false
  User: apikey
  Pass: SG.xxxxxxxxxxxxxx

Hostinger/cPanel:
  Host: mail.yourdomain.com (check your provider)
  Port: 465 or 587
  Secure: true or false
  User: email@yourdomain.com
  Pass: Your password
```

**To Set Environment Variables on Vercel**:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the exact name and value
5. Redeploy the project

**To Test Locally**:
1. Create `.env` file in project root:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_SECURE=true
CONTACT_EMAIL_RECIPIENT=your-email@gmail.com
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
```
2. Note: `.env` is in `.gitignore` to prevent committing secrets

### 4. ✅ reCAPTCHA Verification Issues
**Problem**: Form says "reCAPTCHA verification failed"

**Prerequisites**:
You must have reCAPTCHA v2 configured on Google Console:
1. Go to https://www.google.com/recaptcha/admin
2. Click "Create" or select existing site
3. Choose reCAPTCHA v2 (checkbox style)
4. Add your domains (both localhost and vercel domain)
5. Copy the Site Key and Secret Key

**Configuration**:
1. Set environment variable on Vercel:
   - `RECAPTCHA_SECRET_KEY=your-secret-key`

2. Update Site Key in `config.js`:
```javascript
RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY || '6LeuJyksAAAAAG14ND1x7G3gghpAug5G9VRXK2hp',
```

**To Verify**:
1. Check browser Console for errors
2. Check browser Network tab for failed reCAPTCHA API calls
3. Check Vercel logs for reCAPTCHA verification errors

---

## Current Implementation Details

### Frontend (contact.html)
- Uses reCAPTCHA v2 (checkbox style)
- Loads google.com/recaptcha/api.js
- Renders checkbox into `.g-recaptcha` div
- Submits token with form data to `/api/send-contact-email`

### Backend (api/send-contact-email.js)
- Validates all required fields
- Verifies reCAPTCHA token if secret key configured
- Checks rate limiting (5 requests per minute per IP)
- Sends two emails (one to site owner, one to user)
- Returns success/error response with details

### Middleware
- **recaptcha.js**: Verifies tokens with Google API
- **rateLimit.js**: Prevents spam submissions
- **htmlSanitizer.js**: Escapes HTML to prevent XSS

---

## Debugging Steps

### Step 1: Check reCAPTCHA Loads
```javascript
// In Browser Console
console.log(window.grecaptcha); // Should show grecaptcha object
```

### Step 2: Check reCAPTCHA Token
```javascript
// In Browser Console
grecaptcha.getResponse(); // Should return non-empty string after checking box
```

### Step 3: Check Form Submission
```javascript
// In Browser Console, Network tab
// Submit form and watch for POST to /api/send-contact-email
// Check Request body has all fields
// Check Response status and message
```

### Step 4: Check Server Logs
On Vercel:
1. Go to your project
2. Click "Deployments"
3. Click latest deployment
4. Go to "Runtime Logs"
5. Look for "[CONTACT FORM]" messages

---

## Testing Checklist

- [ ] reCAPTCHA checkbox appears on contact page
- [ ] Can check/uncheck reCAPTCHA without errors
- [ ] Form validation works (required fields)
- [ ] Email validation works (invalid email rejected)
- [ ] reCAPTCHA verification passes
- [ ] Form submission succeeds (200 response)
- [ ] Success message appears
- [ ] Form clears after submission
- [ ] Email received (if SMTP configured)
- [ ] Rate limiting works (5+ requests rejected)
- [ ] Dark mode works on contact page
- [ ] Responsive on mobile

---

## Environment Variables Checklist

For **reCAPTCHA to work**:
- [ ] RECAPTCHA_SECRET_KEY is set on Vercel
- [ ] RECAPTCHA_SITE_KEY is set in config.js or env
- [ ] reCAPTCHA site is registered on Google Console
- [ ] Your domain is added to reCAPTCHA settings

For **Email to work**:
- [ ] SMTP_HOST is set
- [ ] SMTP_PORT is set
- [ ] SMTP_USER is set
- [ ] SMTP_PASS is set
- [ ] SMTP_SECURE is set (true for 465, false for 587)
- [ ] CONTACT_EMAIL_RECIPIENT is set

---

## Common Errors

### "Please complete the reCAPTCHA verification"
- reCAPTCHA didn't render → Check console for errors
- Check browser hasn't blocked google.com requests
- Try clearing cache and refreshing page

### "400 Bad Request" with missingFields
- Check Network tab to see which fields are missing
- Ensure form inputs have correct IDs (name, email, subject, message)
- Check reCAPTCHA token is being obtained

### "reCAPTCHA verification failed"
- Wrong secret key in environment variables
- reCAPTCHA site not properly configured
- Token is expired (user took too long to submit)
- Check Vercel logs for Google API error details

### Emails not being sent but form submission succeeds
- SMTP configuration incomplete
- SMTP credentials wrong
- Firewall/port blocking
- Check Vercel logs for nodemailer errors

---

## Additional Resources

- [Google reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel API Routes](https://vercel.com/docs/concepts/functions/serverless-functions)
