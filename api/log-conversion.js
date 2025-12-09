export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { format, country, timestamp } = req.body;

        // Get client IP for geolocation
        const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';

        // Create log entry
        const logEntry = {
            timestamp: new Date(timestamp).toISOString(),
            format: format || 'unknown',
            country: country || 'unknown',
            ip: ip,
        };

        // Log to Vercel
        console.log('📊 CONVERSION:', JSON.stringify(logEntry));

        // Respond with success
        res.status(200).json({
            success: true,
            message: 'Conversion logged',
            entry: logEntry
        });
    } catch (error) {
        console.error('Error logging conversion:', error);
        res.status(500).json({ error: 'Failed to log conversion' });
    }
}
