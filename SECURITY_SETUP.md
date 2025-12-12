# Security Implementation Guide

This guide explains the security features implemented to protect your APIs from bot abuse and attacks.

## Features Implemented

### 1. **Rate Limiting**
Prevents bots and malicious actors from overwhelming your servers with requests.

- **Email API**: 5 requests per minute per IP address
- **PDF Conversion API**: 20 requests per minute per IP address

**How it works:**
- Tracks requests by client IP address
- Blocks requests exceeding the limit with HTTP 429 (Too Many Requests)
- Automatically cleans up old data every 5 minutes

### 2. **reCAPTCHA v3 Integration**
Verifies that requests come from real humans without requiring user interaction.

- Invisible to users (no checkbox or puzzle)
- Returns a score (0.0 - 1.0) indicating likelihood of bot
- Minimum score of 0.5 required to pass

**Why v3?**
- Better user experience (no manual verification)
- More accurate bot detection
- Works in background

### 3. **Restricted CORS Policy**
Prevents unauthorized websites from accessing your APIs.

- Only your domain can access the APIs
- Rejects requests from unknown origins
- Can add additional domains as needed

### 4. **HTML Sanitization**
Prevents injection attacks and XSS vulnerabilities.

- Removes dangerous script tags
- Neutralizes event handlers
- Validates content size

## Setup Instructions

### Step 1: Get reCAPTCHA Keys

1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Click **"+" to create a new site**
3. Fill in:
   - **Label**: Your site name
   - **reCAPTCHA type**: Select "reCAPTCHA v3"
   - **Domains**: Add your domain(s)
     - `text-to-pdf-converter-kappa.vercel.app` (production)
     - `localhost:3000` (local development)
4. Accept terms and click **Submit**
5. You'll see:
   - **Site Key** (public, use in frontend)
   - **Secret Key** (private, use in backend)

### Step 2: Set Environment Variables

Add these to your Vercel project settings or `.env.local`:

```
RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here
CONTACT_EMAIL_RECIPIENT=your-email@example.com
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=noreply@yourdomain.com
SMTP_SECURE=false
```

### Step 3: Update Frontend - Contact Form

In your `contact.html`, update the form submission code:

```javascript
// Include reCAPTCHA script in <head>
<script src="https://cdn.jsdelivr.net/npm/recaptcha__at__js" async defer></script>

// Update form submission
async function submitContactForm(formData) {
    // Get reCAPTCHA token
    const token = await grecaptcha.execute('YOUR_SITE_KEY', { action: 'submit' });
    
    // Add token to form data
    formData.recaptchaToken = token;
    
    // Send to API
    const response = await fetch('/api/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    });
    
    return response.json();
}
```

### Step 4: Test the Setup

**Test Rate Limiting:**
```bash
# Send 6 requests quickly - 6th should fail with 429
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/send-contact-email \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@test.com","subject":"Test","message":"Test","recaptchaToken":"test"}'
done
```

**Test reCAPTCHA:**
- Submit the contact form normally
- Check server logs for reCAPTCHA score
- Should see "✓ reCAPTCHA verified with score: X.XX"

## Monitoring & Logs

Monitor suspicious activity in your logs:

```javascript
// Look for these patterns:
// ⚠️ Rate limit exceeded
// ⚠️ reCAPTCHA verification failed
// ✓ reCAPTCHA verified with score
```

## Advanced Configuration

### Adjust Rate Limits

Edit `api/middleware/rateLimit.js`:
```javascript
// Email: 5 requests per 60 seconds
checkRateLimit(clientIp, 5, 60000)

// Change to: 10 requests per 120 seconds
checkRateLimit(clientIp, 10, 120000)
```

### Add More Domains to CORS

Edit `api/convert-html.js`:
```javascript
const allowedOrigins = [
    'https://yourdomain.com',
    'https://another-domain.com',
    'http://localhost:3000'
];
```

### Adjust reCAPTCHA Score Threshold

Edit `api/send-contact-email.js`:
```javascript
// Current: 0.5 (moderate)
await verifyRecaptcha(recaptchaToken, secretKey, 0.5)

// Stricter: 0.7
await verifyRecaptcha(recaptchaToken, secretKey, 0.7)

// More lenient: 0.3
await verifyRecaptcha(recaptchaToken, secretKey, 0.3)
```

## Security Best Practices

1. **Keep Secret Keys Secret**
   - Never commit `RECAPTCHA_SECRET_KEY` to git
   - Use environment variables only
   - Rotate keys periodically

2. **Monitor Rate Limits**
   - Check logs for suspicious patterns
   - Adjust limits based on legitimate usage

3. **Update Dependencies**
   ```bash
   npm update
   ```

4. **Use HTTPS**
   - reCAPTCHA requires HTTPS in production
   - Your Vercel deployment already uses HTTPS

5. **Test Regularly**
   - Test from different IPs
   - Monitor reCAPTCHA score trends
   - Adjust thresholds if needed

## Troubleshooting

### reCAPTCHA always fails
- Check `RECAPTCHA_SECRET_KEY` is correct
- Verify domain is added to reCAPTCHA console
- Check browser console for errors

### Rate limit too strict
- Adjust `maxRequests` parameter
- Clear rate limit cache for testing
- Monitor legitimate user patterns

### CORS errors
- Add your domain to `allowedOrigins`
- Check exact domain spelling
- Include protocol (http/https)

## Additional Security Tips

For production deployment:
1. Enable Web Application Firewall (WAF)
2. Use IP-based blocking for repeated offenders
3. Store failed attempts in database
4. Set up alerts for suspicious activity
5. Implement progressive rate limiting (stricter over time)

## Support

For reCAPTCHA issues: https://support.google.com/recaptcha
For API rate limiting: Check logs with `Rate limit exceeded`

---

**Last Updated**: December 2025
**Security Level**: Production Ready ✓
