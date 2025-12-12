import nodemailer from 'nodemailer';
import { checkRateLimit, getClientIp } from './middleware/rateLimit.js';
import { escapeHtml } from './middleware/htmlSanitizer.js';

/**
 * API endpoint to handle contact form submissions and send emails
 * Expects POST request with: { name, email, subject, message }
 * Requires environment variables:
 * - CONTACT_EMAIL_RECIPIENT: Email to receive contact messages
 * - SMTP_HOST: SMTP server host
 * - SMTP_PORT: SMTP server port
 * - SMTP_USER: SMTP authentication username
 * - SMTP_PASS: SMTP authentication password
 */
export default async function handler(req, res) {
    // Debug: Log environment variables (remove in production)
    console.log('📋 [CONTACT FORM] Request received');
    console.log('📋 Method:', req.method);
    console.log('📋 Environment Check:');
    console.log('   - SMTP_HOST:', process.env.SMTP_HOST ? '✓ Set' : '✗ Not set');
    console.log('   - SMTP_PORT:', process.env.SMTP_PORT ? '✓ Set' : '✗ Not set');
    console.log('   - SMTP_USER:', process.env.SMTP_USER ? '✓ Set' : '✗ Not set');
    console.log('   - SMTP_PASS:', process.env.SMTP_PASS ? '✓ Set' : '✗ Not set');
    console.log('   - CONTACT_EMAIL_RECIPIENT:', process.env.CONTACT_EMAIL_RECIPIENT || 'sumathymohan@hotmail.com');

    // Only accept POST requests
    if (req.method !== 'POST') {
        console.warn('❌ Invalid method:', req.method);
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get client IP for rate limiting
        const clientIp = getClientIp(req);

        // Check rate limit: 5 requests per minute per IP
        if (!checkRateLimit(clientIp, 5, 60000)) {
            console.warn(`⚠️ Rate limit exceeded for IP: ${clientIp}`);
            return res.status(429).json({
                error: 'Too many requests',
                message: 'Please try again in a moment'
            });
        }

        const { name, email, subject, message } = req.body;

        // Validate required fields
        if (!name || !email || !subject || !message) {
            const missingFields = [];
            if (!name) missingFields.push('name');
            if (!email) missingFields.push('email');
            if (!subject) missingFields.push('subject');
            if (!message) missingFields.push('message');

            console.warn('❌ Missing required fields:', missingFields.join(', '));
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'Please provide name, email, subject, and message',
                missingFields: missingFields
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Invalid email',
                message: 'Please provide a valid email address'
            });
        }

        // Get recipient email from environment variable
        const recipientEmail = process.env.CONTACT_EMAIL_RECIPIENT || 'sumathymohan@hotmail.com';

        // Check if we have SMTP configuration
        const hasSmtpConfig = process.env.SMTP_HOST && process.env.SMTP_PORT &&
            process.env.SMTP_USER && process.env.SMTP_PASS;

        if (!hasSmtpConfig) {
            // If no SMTP configured, log the message and return success
            // In production, you'd want to store this in a database or log service
            console.log('📧 CONTACT MESSAGE (SMTP not configured):', {
                timestamp: new Date().toISOString(),
                name,
                email,
                subject,
                message,
                recipientEmail
            });

            return res.status(200).json({
                success: true,
                message: 'Message received. We will contact you soon.'
            });
        }

        // Create transporter with SMTP configuration
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // Email to site owner
        const ownerEmailHtml = `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <p><strong>Message:</strong></p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Received at: ${new Date().toISOString()}</small></p>
        `;

        const ownerTextEmail = `
New Contact Form Submission

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Received at: ${new Date().toISOString()}
        `;

        // Email to user (confirmation)
        const userEmailHtml = `
            <h2>Thank You for Contacting Us!</h2>
            <p>Hi ${escapeHtml(name)},</p>
            <p>We have received your message and appreciate you taking the time to contact us. We typically respond within 24-48 hours.</p>
            <hr>
            <p><strong>Your message:</strong></p>
            <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
            <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
            <hr>
            <p>Best regards,<br>Text to PDF Converter Team</p>
        `;

        const userTextEmail = `
Thank You for Contacting Us!

Hi ${name},

We have received your message and appreciate you taking the time to contact us. We typically respond within 24-48 hours.

Your message:
Subject: ${subject}

${message}

---
Best regards,
Text to PDF Converter Team
        `;

        // Send email to site owner
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `Text to PDF <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            replyTo: email,
            subject: `[Contact Form] ${subject}`,
            text: ownerTextEmail,
            html: ownerEmailHtml
        });

        // Send confirmation email to user
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `Text to PDF <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'We received your message - Text to PDF Converter',
            text: userTextEmail,
            html: userEmailHtml
        });

        // Log the successful submission
        console.log('📧 CONTACT MESSAGE:', {
            timestamp: new Date().toISOString(),
            name,
            email,
            subject,
            sent: true
        });

        res.status(200).json({
            success: true,
            message: 'Message sent successfully! We will respond soon.'
        });

    } catch (error) {
        console.error('Error sending contact email:', error);

        res.status(500).json({
            error: 'Failed to send message',
            message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request'
        });
    }
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
function escapeHtmlLocal(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
