/**
 * reCAPTCHA v3 verification middleware
 * Validates user is human without requiring explicit interaction
 */

/**
 * Verify reCAPTCHA token with Google
 * @param {string} token - reCAPTCHA token from client
 * @param {string} secretKey - reCAPTCHA secret key
 * @param {number} minScore - Minimum score (0.0-1.0) to pass, default 0.5
 * @returns {Promise<Object>} - { success: boolean, score: number, action: string }
 */
export async function verifyRecaptcha(token, secretKey, minScore = 0.5) {
    if (!token || !secretKey) {
        return { success: false, error: 'Missing token or secret key' };
    }

    try {
        const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                secret: secretKey,
                response: token,
            }),
        });

        const data = await response.json();

        // Validate response structure
        if (!data.success) {
            console.warn('reCAPTCHA verification failed:', data['error-codes']);
            return { success: false, error: 'reCAPTCHA verification failed' };
        }

        // Check score (only for v3)
        if (data.score !== undefined) {
            if (data.score < minScore) {
                console.warn(`reCAPTCHA score too low: ${data.score} (minimum: ${minScore})`);
                return {
                    success: false,
                    score: data.score,
                    error: `Score ${data.score} below minimum ${minScore}`,
                };
            }
        }

        return {
            success: true,
            score: data.score,
            action: data.action,
            challenge_ts: data.challenge_ts,
            hostname: data.hostname,
        };
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error.message);
        return {
            success: false,
            error: 'Server error during reCAPTCHA verification',
        };
    }
}

export default { verifyRecaptcha };
