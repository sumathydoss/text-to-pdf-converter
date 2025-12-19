// Index Page JavaScript

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

// Reinitialize AdSense ads after page loads
window.addEventListener('load', function () {
    if (window.adsbygoogle) {
        (adsbygoogle = window.adsbygoogle || []).push({});
    }
});

// Dark Mode Toggle
const themeToggle = document.getElementById('themeToggle');
const htmlElement = document.documentElement;

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.innerHTML = document.body.classList.contains('dark-mode')
        ? '<i class="bi bi-sun-fill"></i>'
        : '<i class="bi bi-moon-fill"></i>';
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

// More Info Modal
const moreInfoBtn = document.getElementById('moreInfoBtn');
const infoModal = new bootstrap.Modal(document.getElementById('infoModal'));

moreInfoBtn.addEventListener('click', () => {
    infoModal.show();
});

// Alert Messages
function showAlert(message, type = 'info', autoHide = true) {
    const alertContainer = document.getElementById('alertContainer');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" aria-label="Close"></button>
    `;

    // Add click handler to close button
    const closeBtn = alertDiv.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => {
        alertDiv.remove();
    });

    alertContainer.appendChild(alertDiv);

    if (autoHide) {
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

// Drag and Drop
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
let uploadedFile = null;
let uploadedFileName = null;

dropZone.addEventListener('click', () => fileInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropZone.classList.add('dragover');
}

function unhighlight(e) {
    dropZone.classList.remove('dragover');
}

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
    handleFiles(files);
}

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    if (files.length === 0) return;

    const file = files[0];
    const MAX_FILE_SIZE = window.appConfig.MAX_FILE_SIZE;

    if (file.size > MAX_FILE_SIZE) {
        showAlert(`File size exceeds ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`, 'danger');
        fileInput.value = '';
        return;
    }

    uploadedFile = file;
    // Extract filename without extension for PDF name
    uploadedFileName = file.name.replace(/\.[^/.]+$/, '');
    displayFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const content = e.target.result;
            document.getElementById('textArea').value = content;
            detectFormat(content);
        } catch (error) {
            console.error('Error reading file:', error);
            showAlert('Error reading file. Please try again.', 'danger');
            fileInput.value = '';
        }
    };
    reader.onerror = (error) => {
        console.error('FileReader error:', error);
        showAlert('Error reading file. Please try again.', 'danger');
        fileInput.value = '';
    };
    reader.readAsText(file);
}

function displayFile(file) {
    fileList.innerHTML = `
        <div class="file-item">
            <div>
                <i class="bi bi-file-earmark"></i>
                <strong>${file.name}</strong>
                <div class="text-muted" style="font-size: 0.85rem;">${(file.size / 1024).toFixed(2)} KB</div>
            </div>
            <button class="btn btn-sm btn-outline-danger" onclick="clearFile()">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
}

function clearFile() {
    uploadedFile = null;
    uploadedFileName = null;
    fileInput.value = '';
    fileList.innerHTML = '';
}

// Auto-detect content format
function detectFormat(content) {
    // Check for HTML tags
    const htmlPattern = /<[^>]+>/g;
    const hasHTMLTags = htmlPattern.test(content);

    const format = hasHTMLTags ? 'HTML' : 'Plain Text';
    window.detectedFormat = hasHTMLTags ? 'html' : 'text';
    document.getElementById('formatDetected').textContent = format;
}

// Detect format on textarea input
document.getElementById('textArea').addEventListener('input', () => {
    detectFormat(document.getElementById('textArea').value);
});

// Convert to PDF
document.getElementById('convertBtn').addEventListener('click', convertToPDF);

async function convertToPDF() {
    const textContent = document.getElementById('textArea').value.trim();
    const format = window.detectedFormat || 'text';

    // User-entered title takes precedence
    const userEnteredTitle = document.getElementById('pdfTitle').value.trim();
    let pdfTitle = userEnteredTitle;

    // If no title entered, use uploaded filename if available
    if (!pdfTitle && uploadedFileName && window.appConfig.USE_UPLOADED_FILENAME) {
        pdfTitle = uploadedFileName;
    }

    // Final fallback to default
    if (!pdfTitle) {
        pdfTitle = window.appConfig.DEFAULT_TEXT_PDF_NAME || 'document';
    }

    const MAX_TEXT_SIZE = window.appConfig.MAX_TEXT_SIZE;

    if (!textContent) {
        showAlert('Please enter content or upload a file', 'warning');
        return;
    }

    if (new Blob([textContent]).size > MAX_TEXT_SIZE) {
        showAlert(`Content exceeds ${(MAX_TEXT_SIZE / 1024 / 1024).toFixed(0)}MB limit. Your content is ${(new Blob([textContent]).size / 1024 / 1024).toFixed(2)}MB.`, 'warning');
        return;
    }

    const convertBtn = document.getElementById('convertBtn');
    convertBtn.disabled = true;
    convertBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Converting...';

    try {
        if (format === 'html') {
            await convertHTMLToPDF(textContent, pdfTitle);
        } else {
            await convertTextToPDF(textContent, pdfTitle);
        }

        // Track the conversion
        trackConversion(format === 'html' ? 'HTML to PDF' : 'Text to PDF');

        showAlert('✓ PDF downloaded successfully!', 'success', false);
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error creating PDF: ' + error.message, 'danger');
    } finally {
        convertBtn.disabled = false;
        convertBtn.innerHTML = '<i class="bi bi-download"></i> Convert to PDF';
    }
}

async function convertTextToPDF(text, title) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const lineHeight = 5;
    const maxWidth = pageWidth - (2 * margin);

    // Set font
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    // Split text into lines
    const lines = doc.splitTextToSize(text, maxWidth);

    let yPosition = margin;

    lines.forEach((line) => {
        if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
    });

    doc.save(title + '.pdf');
}

// Extract CSS from HTML and inject it into container
function extractAndApplyStyles(html, container) {
    // Extract all style tags
    const styleMatches = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];

    styleMatches.forEach(styleTag => {
        const styleContent = styleTag.replace(/<\/?style[^>]*>/gi, '');
        const style = document.createElement('style');
        style.textContent = styleContent;
        container.appendChild(style);
    });

    // Add fallback CSS for common Bootstrap/form classes to ensure rendering
    const fallbackCSS = document.createElement('style');
    fallbackCSS.textContent = `
        /* Bootstrap fallback styles for PDF rendering */
        .panel { border: 1px solid #ddd; border-radius: 4px; margin-bottom: 20px; background: #fff; }
        .panel-heading { background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px 4px 0 0; padding: 10px 15px; }
        .panel-title { margin: 0; font-size: 16px; font-weight: 600; }
        .panel-body { padding: 15px; }
        .form-group { margin-bottom: 15px; }
        .form-control { display: block; width: 100%; padding: 6px 12px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; }
        .control-label { display: block; margin-bottom: 5px; font-weight: 600; }
        .required::after { content: ' *'; color: red; }
        .has-error { margin-top: 5px; }
        .help-block { display: block; margin-top: 5px; font-size: 12px; color: #999; }
        .field-validation-valid { display: none; }
        .reminder { padding: 12px; margin-bottom: 15px; border-radius: 4px; }
        .reminder-info { background: #d9edf7; border: 1px solid #bce8f1; color: #31708f; }
        .btn { display: inline-block; padding: 6px 12px; margin-bottom: 0; font-weight: 600; text-align: center; white-space: nowrap; vertical-align: middle; border: 1px solid transparent; border-radius: 4px; cursor: pointer; }
        .btn-primary { background: #337ab7; color: white; border-color: #2e6da4; }
        .btn-lg { padding: 10px 16px; font-size: 18px; }
        .col-sm-4 { width: 33.33%; float: left; padding: 0 15px; }
        .col-sm-8 { width: 66.66%; float: left; padding: 0 15px; }
        .form-group > .col-sm-4 { padding-top: 7px; }
        .login-register { margin-top: 20px; }
        .login-register > div { float: left; margin-right: 10px; }
        .reset-password-feedback { margin-top: 15px; font-size: 12px; }
        input[type="text"], input[type="password"], input[type="email"], textarea { box-sizing: border-box; }
        a { color: #337ab7; text-decoration: none; }
        a:hover { text-decoration: underline; }
        /* Clear floats */
        .clearfix::after { content: ""; display: table; clear: both; }
        .panel::after { content: ""; display: table; clear: both; }
        /* Ensure form inputs are visible */
        input[type="text"], input[type="password"], input[type="email"] {
            visibility: visible !important;
            display: block !important;
        }
    `;
    container.appendChild(fallbackCSS);

    // Also extract link stylesheets if any (with timeout handling)
    // CRITICAL: Only load stylesheets from CDNs or absolute URLs, skip relative paths
    const linkMatches = html.match(/<link[^>]*rel=["\']?stylesheet["\']?[^>]*>/gi) || [];
    linkMatches.forEach(linkTag => {
        const hrefMatch = linkTag.match(/href=["\']?([^"\'\s>]+)["\']?/);
        if (hrefMatch && hrefMatch[1]) {
            const href = hrefMatch[1];
            // Only load absolute URLs (http/https) or data URLs
            // Skip relative paths that would resolve to non-existent files
            if (href.startsWith('http') || href.startsWith('data:') || href.startsWith('//')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                container.appendChild(link);
            }
            // Silently skip relative paths to prevent 404 errors
        }
    });
}

// Wait for stylesheets to load with timeout
async function waitForStylesheets(container, timeout = 10000) {
    const links = container.querySelectorAll('link[rel="stylesheet"]');
    if (links.length === 0) return;

    const loadPromises = Array.from(links).map((link) => {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                console.warn(`Stylesheet timeout: ${link.href}`);
                resolve(); // Resolve anyway to not block conversion
            }, timeout);

            const onLoad = () => {
                clearTimeout(timer);
                resolve();
            };

            const onError = () => {
                clearTimeout(timer);
                console.warn(`Stylesheet failed to load: ${link.href}`);
                resolve(); // Resolve anyway to not block conversion
            };

            link.addEventListener('load', onLoad);
            link.addEventListener('error', onError);
        });
    });

    await Promise.race([
        Promise.all(loadPromises),
        new Promise(resolve => setTimeout(resolve, timeout))
    ]);
}

// Sanitize HTML to remove problematic elements and external dependencies
function sanitizeHTMLForPDF(html) {
    // CRITICAL: Do string replacement FIRST before parsing as DOM
    // This prevents the browser from trying to load images during innerHTML assignment

    // Remove all src attributes from img tags to prevent 404 errors
    // This stops the browser from attempting to fetch non-existent resources
    html = html.replace(/<img\s+([^>]*\s)?src="[^"]*"([^>]*)>/gi, (match, before, after) => {
        // Keep the img tag but remove the src attribute
        const attributes = (before || '') + (after || '');
        return `<img ${attributes.trim()}>`;
    });

    // Also handle single-quoted src attributes
    html = html.replace(/<img\s+([^>]*\s)?src='[^']*'([^>]*)>/gi, (match, before, after) => {
        const attributes = (before || '') + (after || '');
        return `<img ${attributes.trim()}>`;
    });

    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove script tags (they won't execute in canvas anyway)
    temp.querySelectorAll('script').forEach(el => el.remove());

    // Remove noscript tags
    temp.querySelectorAll('noscript').forEach(el => el.remove());

    // CRITICAL: Remove ALL iframes that reference file bundles FIRST
    // This prevents any loading attempts before we get to html2canvas
    temp.querySelectorAll('iframe').forEach(iframe => {
        const src = iframe.getAttribute('src') || '';
        if (src.includes('_files') || src.includes('%20_files') || src === '') {
            iframe.remove();
        }
    });

    // CRITICAL: Remove ALL links/anchors/elements that reference file bundle files
    temp.querySelectorAll('[href], [src], [data]').forEach(el => {
        const href = el.getAttribute('href') || '';
        const src = el.getAttribute('src') || '';
        const data = el.getAttribute('data') || '';

        // If ANY attribute references _files, remove the element
        if (href.includes('_files') || src.includes('_files') || data.includes('_files') ||
            href.includes('%20_files') || src.includes('%20_files') || data.includes('%20_files')) {
            el.remove();
        }
    });

    // Remove link tags that try to load external CSS from file bundles
    temp.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href') || '';
        // Only remove if it references file bundle
        if (href.includes('_files') || href.includes('%20_files')) {
            link.remove();
        }
    });

    // Handle iframes - try to extract visible content, fall back to placeholder only for external embeds
    temp.querySelectorAll('iframe').forEach(el => {
        // Keep the iframe element - html2canvas may be able to render it
        // Only show placeholder if it's an external embed (YouTube, etc.)
        const src = el.getAttribute('src') || '';
        const isExternalEmbed = /youtube|vimeo|dailymotion|facebook|instagram|twitter|tiktok/i.test(src);

        if (isExternalEmbed) {
            const placeholder = document.createElement('div');
            placeholder.style.border = '2px dashed #999';
            placeholder.style.padding = '15px';
            placeholder.style.backgroundColor = '#f9f9f9';
            placeholder.style.textAlign = 'center';
            placeholder.style.color = '#666';
            placeholder.style.minHeight = '100px';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.innerHTML = `<span>[External embed: ${src.split('/')[2] || 'embedded content'}]</span>`;
            el.replaceWith(placeholder);
        }
        // Keep local iframes as-is for rendering
    });

    // Handle video and audio tags - show info instead of removing
    temp.querySelectorAll('video').forEach(el => {
        const poster = el.getAttribute('poster');
        const placeholder = document.createElement('div');
        placeholder.style.border = '2px dashed #999';
        placeholder.style.padding = '15px';
        placeholder.style.backgroundColor = '#f0f0f0';
        placeholder.style.textAlign = 'center';
        placeholder.style.color = '#333';
        if (poster) {
            placeholder.style.backgroundImage = `url('${poster}')`;
            placeholder.style.backgroundSize = 'cover';
            placeholder.style.backgroundPosition = 'center';
            placeholder.style.minHeight = '200px';
        } else {
            placeholder.style.minHeight = '100px';
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
        }
        const text = document.createElement('span');
        text.style.backgroundColor = 'rgba(255,255,255,0.9)';
        text.style.padding = '10px';
        text.style.borderRadius = '4px';
        text.textContent = '[Video content]';
        placeholder.appendChild(text);
        el.replaceWith(placeholder);
    });

    temp.querySelectorAll('audio').forEach(el => {
        const placeholder = document.createElement('div');
        placeholder.style.border = '2px dashed #999';
        placeholder.style.padding = '15px';
        placeholder.style.backgroundColor = '#f9f9f9';
        placeholder.style.textAlign = 'center';
        placeholder.style.color = '#666';
        placeholder.style.minHeight = '60px';
        placeholder.style.display = 'flex';
        placeholder.style.alignItems = 'center';
        placeholder.style.justifyContent = 'center';
        placeholder.textContent = '[Audio content]';
        el.replaceWith(placeholder);
    });

    // Remove style attributes that use external background-images (prevent blocking)
    temp.querySelectorAll('[style*="background-image"]').forEach(el => {
        const style = el.getAttribute('style');
        const cleanStyle = style.replace(/background-image\s*:\s*url\([^)]*\)/gi, '');
        if (cleanStyle.trim()) {
            el.setAttribute('style', cleanStyle);
        } else {
            el.removeAttribute('style');
        }
    });

    // Make hidden elements visible for PDF rendering
    temp.querySelectorAll('[style*="display:none"], [style*="visibility:hidden"], [hidden]').forEach(el => {
        el.removeAttribute('hidden');
        const style = el.getAttribute('style') || '';
        const cleanStyle = style
            .replace(/display\s*:\s*none\s*!?;?/gi, 'display: block;')
            .replace(/visibility\s*:\s*hidden\s*!?;?/gi, 'visibility: visible;');
        el.setAttribute('style', cleanStyle);
    });

    // Force visibility of all form inputs
    temp.querySelectorAll('input[type="text"], input[type="password"], input[type="email"], input[type="checkbox"], input[type="radio"], textarea, select, button').forEach(el => {
        el.style.display = 'block';
        el.style.visibility = 'visible';
        el.removeAttribute('hidden');
    });

    // Ensure labels and form elements are not hidden
    temp.querySelectorAll('label, .form-group, .control-label, .form-control').forEach(el => {
        const style = el.getAttribute('style') || '';
        const cleanStyle = style
            .replace(/display\s*:\s*none\s*!?;?/gi, 'display: block;')
            .replace(/visibility\s*:\s*hidden\s*!?;?/gi, 'visibility: visible;');
        el.setAttribute('style', cleanStyle);
    });

    // Remove duplicate IDs to clean up DOM warnings
    const seenIds = new Set();
    temp.querySelectorAll('[id]').forEach(el => {
        const id = el.getAttribute('id');
        if (seenIds.has(id)) {
            // Remove the id from duplicate elements
            el.removeAttribute('id');
        } else {
            seenIds.add(id);
        }
    });

    return temp.innerHTML;
}

// Extract and render JavaScript data as static HTML with better styling
async function extractAndRenderData(html) {
    // Try to extract the messages variable from script tags
    const messagesMatch = html.match(/const\s+messages\s*=\s*(\[[\s\S]*?\]);/);

    if (messagesMatch) {
        try {
            // Parse the messages array
            const messages = eval(messagesMatch[1]);

            // Create styled HTML from messages
            let staticContent = `
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f7f7f9; }
                    .transcript { max-width: 900px; margin: 0 auto; }
                    h1 { color: #333; margin-bottom: 20px; font-size: 24px; }
                    .message {
                        margin-bottom: 12px;
                        padding: 12px 15px;
                        border-radius: 8px;
                        word-wrap: break-word;
                    }
                    .message.bot {
                        background: rgb(116, 39, 116);
                        color: white;
                        margin-right: 40px;
                    }
                    .message.user {
                        background: white;
                        color: #000;
                        margin-left: 40px;
                        border: 1px solid #ddd;
                    }
                    .message-header {
                        font-weight: 700;
                        font-size: 12px;
                        margin-bottom: 4px;
                        opacity: 0.9;
                    }
                    .message-time {
                        font-size: 10px;
                        opacity: 0.7;
                        margin-top: 4px;
                    }
                    .message-content {
                        font-size: 13px;
                        line-height: 1.4;
                    }
                </style>
            </head>
            <body>
                <div class="transcript">
                    <h1>Chat Transcript</h1>
            `;

            messages.forEach(msg => {
                // Skip control messages and system messages
                if (msg.isControlMessage || (msg.tags && msg.tags.includes('system'))) {
                    return;
                }

                const displayName = msg.from?.user?.displayName || msg.from?.application?.displayName || 'User';
                const content = msg.content || '';
                const timestamp = msg.created ? new Date(msg.created).toLocaleTimeString("en-us", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : '';

                // Determine if it's a bot or user message
                const isBot = msg.from?.user ? true : false;
                const messageClass = isBot ? 'bot' : 'user';

                if (content) {
                    staticContent += `
                    <div class="message ${messageClass}">
                        <div class="message-header">${displayName}</div>
                        <div class="message-content">${content}</div>
                        <div class="message-time">${timestamp}</div>
                    </div>
                    `;
                }
            });

            staticContent += `
                </div>
            </body>
            </html>
            `;
            return staticContent;
        } catch (e) {
            console.warn('Could not extract messages:', e);
            return null;
        }
    }

    return null;
}

// Enhanced HTML to PDF conversion with full styling support
async function convertHTMLToCanvasPDF(html, title) {
    const { jsPDF } = window.jspdf;

    let htmlToConvert = html;

    // Try to extract and render data from JavaScript
    const staticHtml = await extractAndRenderData(html);
    if (staticHtml) {
        console.log('Using extracted static HTML with styling');
        htmlToConvert = staticHtml;
    }

    // Sanitize HTML to remove problematic elements
    htmlToConvert = sanitizeHTMLForPDF(htmlToConvert);

    // Create a temporary container with full HTML structure
    const container = document.createElement('div');

    // If it's a full HTML document, use it as-is
    if (htmlToConvert.toLowerCase().includes('</html>')) {
        container.innerHTML = htmlToConvert;
    } else {
        // Otherwise wrap it with proper HTML structure and fallback styles
        container.innerHTML = `
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    html, body { font-family: Arial, sans-serif; padding: 20px; background: white; width: 100%; }
                    /* Bootstrap fallback styles */
                    .panel { border: 1px solid #ddd; border-radius: 4px; margin-bottom: 20px; background: #fff; overflow: auto; }
                    .panel-heading { background: #f5f5f5; border: 1px solid #ddd; border-radius: 4px 4px 0 0; padding: 10px 15px; }
                    .panel-title { margin: 0; font-size: 16px; font-weight: 600; }
                    .panel-body { padding: 15px; }
                    .form-group { margin-bottom: 15px; overflow: auto; }
                    .form-control { display: block; width: 100%; padding: 6px 12px; font-size: 14px; border: 1px solid #ccc; border-radius: 4px; }
                    .control-label { display: block; margin-bottom: 5px; font-weight: 600; }
                    .required::after { content: ' *'; color: red; }
                    .has-error { margin-top: 5px; }
                    .help-block { display: block; margin-top: 5px; font-size: 12px; color: #999; }
                    .field-validation-valid { display: none; }
                    .reminder { padding: 12px; margin-bottom: 15px; border-radius: 4px; }
                    .reminder-info { background: #d9edf7; border: 1px solid #bce8f1; color: #31708f; }
                    .btn { display: inline-block; padding: 6px 12px; margin-bottom: 0; font-weight: 600; text-align: center; white-space: nowrap; vertical-align: middle; border: 1px solid transparent; border-radius: 4px; cursor: pointer; }
                    .btn-primary { background: #337ab7; color: white; border-color: #2e6da4; }
                    .btn-lg { padding: 10px 16px; font-size: 18px; }
                    .col-sm-4 { width: 33.33%; float: left; padding: 0 15px; box-sizing: border-box; }
                    .col-sm-8 { width: 66.66%; float: left; padding: 0 15px; box-sizing: border-box; }
                    .form-group > .col-sm-4 { padding-top: 7px; }
                    .login-register { margin-top: 20px; }
                    .login-register > div { float: left; margin-right: 10px; }
                    .reset-password-feedback { margin-top: 15px; font-size: 12px; }
                    input[type="text"], input[type="password"], input[type="email"], textarea { box-sizing: border-box; visibility: visible !important; display: block !important; }
                    a { color: #337ab7; text-decoration: none; }
                    a:hover { text-decoration: underline; }
                    .clearfix::after { content: ""; display: table; clear: both; }
                    .panel::after { content: ""; display: table; clear: both; }
                </style>
            </head>
            <body>${htmlToConvert}</body>
            </html>
        `;
    }

    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.display = 'block';
    document.body.appendChild(container);

    // Extract styles from original HTML
    extractAndApplyStyles(html, container);

    // Get the body element to measure
    const bodyElement = container.querySelector('body') || container;
    bodyElement.style.width = '1200px';
    bodyElement.style.margin = '0';
    bodyElement.style.padding = '20px';
    bodyElement.style.backgroundColor = '#fff';

    // Wait for styling to be applied (short delay only)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Block all network requests during html2canvas rendering to prevent console errors
    const originalFetch = window.fetch;
    const originalOpen = window.XMLHttpRequest.prototype.open;

    let requestsBlocked = true;

    window.fetch = () => {
        return Promise.reject(new Error('Network blocked during PDF conversion'));
    };

    window.XMLHttpRequest.prototype.open = function (method, url) {
        if (requestsBlocked) {
            this.abort();
        }
        return this;
    };

    try {
        // Enable console warning suppression during PDF conversion
        window.suppressDOMWarnings = true;

        // Use html2canvas with optimized settings for complex HTML
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: false, // Disable CORS to avoid hanging on external resources
            allowTaint: true, // Allow tainted canvas (images that fail to load)
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 1200,
            windowHeight: Math.max(bodyElement.scrollHeight, 1000), // Ensure minimum height
            timeout: 5000, // Reduced timeout
            imageTimeout: 100, // Very short image timeout
            useForeignObjectMethod: false, // Don't use foreign object method
            onclone: (clonedDocument) => {
                const clonedBody = clonedDocument.querySelector('body');
                if (clonedBody) {
                    clonedBody.style.margin = '0';
                    clonedBody.style.padding = '20px';
                    clonedBody.style.width = '1200px';
                    clonedBody.style.display = 'block';
                }
                // Remove scripts from cloned document
                clonedDocument.querySelectorAll('script').forEach(script => script.remove());

                // Hide problematic images but keep structure
                clonedDocument.querySelectorAll('img').forEach(img => {
                    const src = img.getAttribute('src') || '';
                    // Only hide if it's NOT a data URI (meaning it's trying to load a real file)
                    if (!src.startsWith('data:')) {
                        img.style.display = 'none';
                        img.style.visibility = 'hidden';
                        img.style.width = '0';
                        img.style.height = '0';
                    }
                });
            }
        });

        if (canvas.width === 0 || canvas.height === 0) {
            throw new Error('Canvas rendering resulted in empty image. Check your HTML content.');
        }

        const imgData = canvas.toDataURL('image/png', 0.95);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Fixed pagination logic
        let heightLeft = imgHeight;
        let position = 0;

        // Add first page
        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 2 * margin);

        // Add subsequent pages
        while (heightLeft > 0) {
            position = heightLeft - imgHeight + margin;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - 2 * margin);
        }

        const pageCount = Math.ceil(imgHeight / (pageHeight - 2 * margin));
        pdf.save(title + '.pdf');
        console.log('✓ PDF generated successfully with', pageCount, 'page(s)');
        //showAlert(`PDF created successfully (${pageCount} page${pageCount > 1 ? 's' : ''})`, 'success');
    } catch (error) {
        console.error('PDF conversion error:', error);
        const errorMsg = error.message || 'Unknown error';
        showAlert(`Failed to convert HTML: ${errorMsg}`, 'danger');
        throw new Error(`HTML to PDF conversion failed: ${errorMsg}`);
    } finally {
        // Disable console warning suppression
        window.suppressDOMWarnings = false;

        // Restore original fetch and XHR
        requestsBlocked = false;
        window.fetch = originalFetch;
        window.XMLHttpRequest.prototype.open = originalOpen;

        document.body.removeChild(container);
    }
}

async function convertHTMLToPDF(html, title) {
    // Use client-side conversion for all HTML
    await convertHTMLToCanvasPDF(html, title);
}

// Clear Button
document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('textArea').value = '';
    document.getElementById('pdfTitle').value = '';
    document.getElementById('formatDetected').textContent = 'Plain Text';
    window.detectedFormat = 'text';
    clearFile();
});

// Suppress [DOM] duplicate ID warnings during PDF conversion
// These warnings come from the uploaded HTML and are not critical
const originalWarn = console.warn;
const originalError = console.error;

window.suppressDOMWarnings = false;

console.warn = function (...args) {
    // Suppress [DOM] warnings about duplicate IDs during conversion
    if (window.suppressDOMWarnings && args[0] && args[0].includes && args[0].includes('[DOM]')) {
        return;
    }
    return originalWarn.apply(console, args);
};

console.error = function (...args) {
    // Suppress 404 errors from html2canvas and fetch attempts during conversion
    if (window.suppressDOMWarnings && args[0] && args[0].includes &&
        (args[0].includes('404') || args[0].includes('ERR_') || args[0].includes('net::'))) {
        return;
    }
    return originalError.apply(console, args);
};