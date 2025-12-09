import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!process.env.GITHUB_TOKEN) {
        console.warn('GITHUB_TOKEN not set - logging to console only');
        return res.status(200).json({ success: true, message: 'Token not configured' });
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

        // Log to console
        console.log('CONVERSION_LOG:', JSON.stringify(logEntry));

        // Try to append to GitHub file
        const owner = 'sumathydoss';
        const repo = 'text-to-pdf-converter';
        const filePath = 'CONVERSION_LOGS.txt';

        try {
            const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

            // Get current file content
            let currentContent = '';
            try {
                const fileResponse = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: filePath,
                });
                currentContent = Buffer.from(fileResponse.data.content, 'base64').toString('utf-8');
            } catch (e) {
                // File doesn't exist yet
                currentContent = '=== CONVERSION LOGS ===\n';
            }

            // Append new log entry
            const logLine = `[${logEntry.timestamp}] ${logEntry.format} | Country: ${logEntry.country} | IP: ${logEntry.ip}\n`;
            const newContent = currentContent + logLine;

            // Get SHA if file exists
            let sha;
            try {
                const fileResponse = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: filePath,
                });
                sha = fileResponse.data.sha;
            } catch (e) {
                sha = undefined;
            }

            // Update or create file in GitHub
            await octokit.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: filePath,
                message: `📊 Log conversion: ${logEntry.format} from ${logEntry.country}`,
                content: Buffer.from(newContent).toString('base64'),
                ...(sha && { sha }),
            });

            res.status(200).json({
                success: true,
                message: 'Conversion logged to GitHub',
                entry: logEntry
            });
        } catch (githubError) {
            console.error('GitHub logging failed:', githubError.message);
            // Still return success - don't break user experience
            res.status(200).json({
                success: true,
                message: 'Conversion registered (GitHub log pending)',
                entry: logEntry
            });
        }
    } catch (error) {
        console.error('Error logging conversion:', error);
        res.status(500).json({ error: 'Failed to log conversion' });
    }
}
