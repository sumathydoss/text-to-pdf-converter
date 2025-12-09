// Simple Analytics Tracker
async function trackConversion(format) {
    try {
        // Get user's approximate location based on timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timezoneParts = timezone.split('/');
        const country = timezoneParts.length > 1 ? timezoneParts[0] : 'Unknown';

        // Send to our logging API
        const response = await fetch('/api/log-conversion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                format: format,
                country: country,
                timestamp: new Date().getTime(),
            }),
        });

        if (response.ok) {
            console.log('✓ Conversion tracked');
        } else {
            console.log('Conversion tracking failed (offline or network issue - this is ok)');
        }
    } catch (error) {
        // Silently fail - don't disrupt user experience
        console.log('Tracking unavailable:', error.message);
    }
}
