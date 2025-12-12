# Quick Setup Guide for Contact Form & Email

## What Was Fixed

✅ **reCAPTCHA v2 checkbox** - Now properly renders on contact page  
✅ **Form validation** - Better error messages showing which fields are missing  
✅ **API error handling** - Detailed logging to help debug 400 errors  
✅ **Email integration** - Ready to send emails once SMTP is configured  

---

## To Get Emails Working (3 Steps)

### Step 1: Choose Your Email Provider
Pick one and get the SMTP details. Common options:

**Gmail** (Easiest for testing)
```
Host: smtp.gmail.com
Port: 465
User: your.email@gmail.com
Password: Generate App Password (see below)
Secure: true
```

> **Gmail Setup**: 
> 1. Enable 2-Factor Authentication on your account
> 2. Go to myaccount.google.com/apppasswords
> 3. Select Mail and your device
> 4. Copy the 16-character password
> 5. Use this password in SMTP_PASS

### Step 2: Set Environment Variables on Vercel
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add these (replace with your values):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_SECURE=true
CONTACT_EMAIL_RECIPIENT=where@to.send
```

4. Click "Save"
5. Redeploy your project (Settings → Deployments → Redeploy)

### Step 3: Test
1. Go to your contact page
2. Fill in all fields
3. Check reCAPTCHA
4. Click Send
5. Check the recipient email inbox

---

## To Get reCAPTCHA Working (2 Steps)

### Step 1: Register Site on Google
1. Go to [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin)
2. Click "Create"
3. Fill in:
   - Label: "Text to PDF Converter"
   - reCAPTCHA type: "reCAPTCHA v2" → "I'm not a robot" Checkbox
   - Domains: 
     - `localhost`
     - `text-to-pdf-converter-kappa.vercel.app`
     - Your custom domain (if any)
4. Accept terms and click "Create"
5. Copy your **Site Key** and **Secret Key**

### Step 2: Configure on Vercel
1. Add environment variable:
```
RECAPTCHA_SECRET_KEY=your_copied_secret_key
```

2. Update the fallback Site Key in `config.js` (line 19):
```javascript
RECAPTCHA_SITE_KEY: process.env.RECAPTCHA_SITE_KEY || '6LeuJyksAAAAAG14ND1x7G3gghpAug5G9VRXK2hp',
```

3. Redeploy

---

## Verify Everything Works

### Check reCAPTCHA loads:
Open contact page, press F12, go to Console tab. You should see:
```
reCAPTCHA v2 initialized with site key: 6LeI...
```

### Check form submission:
1. Fill all fields
2. Check reCAPTCHA box
3. Press F12, go to Network tab
4. Click Send
5. Look for POST `/api/send-contact-email`
6. Should see status 200 with response:
```json
{
  "success": true,
  "message": "Message sent successfully! We will respond soon."
}
```

### Check if emails sent:
Look in Vercel logs:
1. Project → Deployments → Latest
2. Runtime Logs
3. Look for "📧 CONTACT MESSAGE:" entries

---

## If reCAPTCHA Not Showing

**In Browser Console (F12), run:**
```javascript
window.grecaptcha  // Should show an object
```

If it shows `undefined`, reCAPTCHA API didn't load. Check:
- Browser dev tools Network tab - see if google.com/recaptcha/api.js loaded
- Is google.com blocked by proxy/firewall?
- Try hard refresh (Ctrl+Shift+R)

---

## If Form Returns 400 Error

**In Browser Console (F12), when you submit:**
```
Response status: 400
Response body: {
  "error": "Missing required fields",
  "missingFields": ["name", "email"]  // Shows which fields empty
}
```

Check that:
- All form fields have values
- reCAPTCHA checkbox is checked
- No JavaScript errors in console

---

## If Emails Not Sending But Form Succeeds

Check Vercel logs for SMTP errors:
1. Project → Deployments → Latest
2. Runtime Logs
3. Search for "Error sending contact email"

Common issues:
- Wrong SMTP credentials
- Port blocked (use 587 instead of 465, or vice versa)
- Gmail: Did you generate app password?
- Firewall/VPN blocking SMTP port

---

## File Changes Made

| File | Changes |
|------|---------|
| `contact.html` | Updated reCAPTCHA v2 initialization with better logging |
| `api/send-contact-email.js` | Added field validation logging, better error messages |
| `api/middleware/recaptcha.js` | Made v2-compatible (doesn't require score) |
| `CONTACT_FORM_TROUBLESHOOTING.md` | Detailed troubleshooting guide |
| `SETUP_CONTACT_FORM.md` | This quick setup guide |

---

## Next Steps

1. **Choose email provider** (Gmail easiest)
2. **Get SMTP credentials** (or generate app password)
3. **Add to Vercel Environment Variables**
4. **Redeploy** the project
5. **Test** the contact form
6. Check **email received**

Need help? Check `CONTACT_FORM_TROUBLESHOOTING.md` in the project root.
