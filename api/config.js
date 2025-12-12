/**
 * API endpoint to get public configuration
 * Returns environment variables that are safe to expose client-side
 */
export default function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    res.status(200).json({
        recaptchaSiteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LeuJyksAAAAAG14ND1x7G3gghpAug5G9VRXK2hp'
    });
}
