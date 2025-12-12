/**
 * Simple in-memory rate limiting middleware
 * Tracks requests by IP address and enforces limits
 */

const requestLog = new Map();

/**
 * Check if request exceeds rate limit
 * @param {string} ip - Client IP address
 * @param {number} maxRequests - Maximum requests allowed in time window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - true if within limit, false if exceeded
 */
export function checkRateLimit(ip, maxRequests = 5, windowMs = 60000) {
    if (!ip) return false;

    const now = Date.now();
    const userRequests = requestLog.get(ip) || [];

    // Clean old requests outside the window
    const recentRequests = userRequests.filter(timestamp => now - timestamp < windowMs);

    if (recentRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
    }

    // Add current request
    recentRequests.push(now);
    requestLog.set(ip, recentRequests);

    return true; // Within limit
}

/**
 * Get client IP address from request
 * Handles proxies and various deployment scenarios
 */
export function getClientIp(req) {
    // Vercel deployment
    if (req.headers['x-forwarded-for']) {
        return req.headers['x-forwarded-for'].split(',')[0].trim();
    }
    // Standard headers
    if (req.headers['cf-connecting-ip']) {
        return req.headers['cf-connecting-ip'];
    }
    if (req.headers['x-real-ip']) {
        return req.headers['x-real-ip'];
    }
    // Direct connection
    return req.socket?.remoteAddress || 'unknown';
}

/**
 * Cleanup old entries periodically (runs every 5 minutes)
 * Prevents memory leak from old IP addresses
 */
setInterval(() => {
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;

    for (const [ip, timestamps] of requestLog.entries()) {
        const recentRequests = timestamps.filter(timestamp => now - timestamp < fiveMinutesMs);

        if (recentRequests.length === 0) {
            requestLog.delete(ip);
        } else {
            requestLog.set(ip, recentRequests);
        }
    }
}, 5 * 60 * 1000);

export default { checkRateLimit, getClientIp };
