// Vercel Serverless Function for rendering HTML
// Simple endpoint that returns the HTML as-is for client-side processing
// This avoids Puppeteer/Chromium deployment size issues on Vercel

import { checkRateLimit, getClientIp } from './middleware/rateLimit.js';
import { sanitizeHtml, validateHtml } from './middleware/htmlSanitizer.js';

export default async function handler(req, res) {
    // Get client IP for rate limiting
    const clientIp = getClientIp(req);

    // Restrict CORS to your domain only (change to your actual domain)
    const allowedOrigins = [
        'https://text-to-pdf-converter-kappa.vercel.app',
        'http://localhost:3000', // For development
        'http://localhost:5000'  // For development
    ];

    const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
        // Check rate limit: 20 requests per minute per IP
        if (!checkRateLimit(clientIp, 20, 60000)) {
            console.warn(`⚠️ Rate limit exceeded for PDF conversion from IP: ${clientIp}`);
            return res.status(429).json({
                error: 'Too many requests',
                message: 'Please try again in a moment'
            });
        }

        const { html } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Validate HTML
        const validation = validateHtml(html, 5);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid HTML',
                message: validation.error
            });
        }

        // Sanitize HTML to prevent injection attacks
        const sanitizedHtml = sanitizeHtml(html);

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
