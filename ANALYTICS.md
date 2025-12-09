# Analytics Tracking

This project tracks PDF conversions to help monitor usage.

## How It Works

1. **Client-side**: When a user converts text/HTML to PDF, the `analytics.js` script captures:
   - Conversion type (Text to PDF or HTML to PDF)
   - User's timezone/country (approximate, privacy-friendly)
   - Timestamp of conversion

2. **Server-side**: The `/api/log-conversion.js` serverless function logs each conversion.

## Viewing Logs

### Option 1: Vercel Logs (Real-time)
1. Go to your Vercel dashboard
2. Select your project
3. Click "Logs" or "Functions" tab
4. Search for "CONVERSION_LOG" entries

Each entry looks like:
```
CONVERSION_LOG: {"timestamp":"2025-12-09T10:30:45.123Z","format":"Text to PDF","country":"America","ip":"192.168.1.1"}
```

### Option 2: GitHub Actions Log File (Historical)
We can add a workflow to save logs to a file in your repo for easy viewing in GitHub.

## What Data Is Tracked

- ✅ Conversion type (Text to PDF / HTML to PDF)
- ✅ Approximate location (timezone)
- ✅ Timestamp
- ✅ IP address (server side)

## Privacy

- No personal data is collected
- Only conversion activity is logged
- User text/HTML content is NOT stored
- All processing happens in the user's browser
