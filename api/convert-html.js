// Vercel Serverless Function for rendering HTML
// Simple endpoint that returns the HTML as-is for client-side processing
// This avoids Puppeteer/Chromium deployment size issues on Vercel

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    try {
        const { html } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Validate HTML length
        if (html.length > 5 * 1024 * 1024) {
            return res.status(413).json({ error: 'HTML content exceeds 5MB limit' });
        }

        // Return success - client will handle PDF generation
        return res.status(200).json({
            success: true,
            message: 'Use client-side conversion',
        });

    } catch (error) {
        console.error('Conversion error:', error);
        return res.status(500).json({
            error: 'Server error',
            message: error.message,
        });
    }
}
