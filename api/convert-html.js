// Vercel Serverless Function for rendering complex HTML with JavaScript
// Uses Puppeteer to render JavaScript-heavy HTML and capture it as an image

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version');

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
        const { html, width = 1200, waitTime = 3000 } = req.body;

        if (!html) {
            return res.status(400).json({ error: 'HTML content is required' });
        }

        // Validate HTML length
        if (html.length > 5 * 1024 * 1024) {
            return res.status(413).json({ error: 'HTML content exceeds 5MB limit' });
        }

        // Launch Puppeteer with chromium
        let browser;
        try {
            browser = await puppeteer.launch({
                args: chromium.args,
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            });
        } catch (err) {
            console.error('Failed to launch browser:', err);
            return res.status(500).json({ 
                error: 'Failed to initialize browser',
                message: err.message 
            });
        }

        const page = await browser.newPage();
        
        // Set viewport size
        await page.setViewport({
            width: width,
            height: 800,
            deviceScaleFactor: 1.5,
        });

        try {
            // Set content with timeout
            await page.setContent(html, {
                waitUntil: ['networkidle0', 'domcontentloaded'],
                timeout: Math.min(waitTime + 5000, 30000),
            });

            // Wait for JavaScript to render
            await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 5000)));

            // Get the full page height after rendering
            const bodyHeight = await page.evaluate(() => {
                return Math.min(document.documentElement.scrollHeight, 10000); // Cap at 10000px
            });

            // Update viewport to match content height
            await page.setViewport({
                width: width,
                height: Math.min(bodyHeight, 10000),
                deviceScaleFactor: 1.5,
            });

            // Capture as PNG
            const screenshot = await page.screenshot({
                type: 'png',
                fullPage: true,
            });

            const base64Image = screenshot.toString('base64');
            
            await browser.close();
            
            return res.status(200).json({
                success: true,
                image: `data:image/png;base64,${base64Image}`,
                height: bodyHeight,
                width: width,
            });

        } catch (pageError) {
            console.error('Page error:', pageError);
            await browser.close();
            return res.status(500).json({
                error: 'Failed to render page',
                message: pageError.message,
            });
        }

    } catch (error) {
        console.error('Conversion error:', error);
        return res.status(500).json({
            error: 'Failed to render HTML',
            message: error.message,
        });
    }
}
