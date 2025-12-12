/**
 * API endpoint to get public configuration
 * Returns environment variables that are safe to expose client-side
 */

export default function handler(req, res) {
    // Set CORS headers to allow client-side requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!siteKey) {
        return res.status(500).json({
            error: 'reCAPTCHA site key not configured',
            recaptchaSiteKey: null
        });
    }

    res.status(200).json({
        recaptchaSiteKey: siteKey
    });
}
