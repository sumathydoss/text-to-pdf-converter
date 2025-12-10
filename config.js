// Configuration file for Text to PDF Converter
export const config = {
    // File size limits
    MAX_FILE_SIZE: 5 * 1024 * 1024,      // 5MB in bytes
    MAX_TEXT_SIZE: 5 * 1024 * 1024,      // 5MB in bytes

    // Google AdSense Configuration
    ADSENSE_PUBLISHER_ID: 'ca-pub-3379746510244069',

    // Site Configuration
    SITE_URL: 'https://text-to-pdf-converter-kappa.vercel.app/',
    SITE_NAME: 'Text to PDF Converter',

    // Analytics Configuration
    ANALYTICS_API_ENDPOINT: '/api/log-conversion',
    ENABLE_ANALYTICS: true,
};
