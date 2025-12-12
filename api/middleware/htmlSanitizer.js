/**
 * HTML sanitization to prevent XSS and injection attacks
 */

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text safe for HTML
 */
export function escapeHtml(text) {
    if (typeof text !== 'string') return '';

    const htmlEscapeMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    };

    return text.replace(/[&<>"']/g, (char) => htmlEscapeMap[char]);
}

/**
 * Basic HTML sanitization - removes dangerous tags
 * @param {string} html - HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export function sanitizeHtml(html) {
    if (typeof html !== 'string') return '';

    // Remove script tags and event handlers
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, ''); // Remove inline event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, ''); // Remove unquoted event handlers

    // Remove dangerous iframe sources
    sanitized = sanitized.replace(/src\s*=\s*["']?javascript:/gi, 'src=""');

    return sanitized;
}

/**
 * Validate HTML size and structure
 * @param {string} html - HTML to validate
 * @param {number} maxSizeMb - Maximum size in MB, default 5
 * @returns {Object} - { valid: boolean, error?: string }
 */
export function validateHtml(html, maxSizeMb = 5) {
    if (typeof html !== 'string') {
        return { valid: false, error: 'HTML must be a string' };
    }

    const maxBytes = maxSizeMb * 1024 * 1024;
    const htmlBytes = new TextEncoder().encode(html).length;

    if (htmlBytes > maxBytes) {
        return {
            valid: false,
            error: `HTML exceeds ${maxSizeMb}MB limit (${(htmlBytes / 1024 / 1024).toFixed(2)}MB)`,
        };
    }

    if (html.trim().length === 0) {
        return { valid: false, error: 'HTML content cannot be empty' };
    }

    return { valid: true };
}

export default { escapeHtml, sanitizeHtml, validateHtml };
