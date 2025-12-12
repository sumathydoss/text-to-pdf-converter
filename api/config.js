/**
 * API endpoint to get public configuration
 * Returns environment variables that are safe to expose client-side
 */

export default function handler(req, res) {
    // Set CORS headers to allow client-side requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');

    res.status(200).json({
        message: 'Configuration endpoint',
        appName: 'Text to PDF Converter'
    });
}
