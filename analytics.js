// Simple Analytics Tracker
async function trackConversion(format) {
    try {
        // Check if analytics is enabled in config
        if (!window.appConfig?.ENABLE_ANALYTICS) {
            return;
        }

        // Get user's approximate location based on timezone
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const timezoneParts = timezone.split('/');
        const country = timezoneParts.length > 1 ? timezoneParts[0] : 'Unknown';

        // Send to our logging API endpoint from config
        const response = await fetch(window.appConfig.ANALYTICS_API_ENDPOINT, {
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
