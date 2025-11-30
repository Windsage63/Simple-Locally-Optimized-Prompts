/**
 * File Utilities - Download and HTML escape helpers
 */

/**
 * Download content as a file
 * @param {string} content - File content
 * @param {string} filename - Name for the downloaded file
 * @param {string} mimeType - MIME type (default: text/markdown)
 */
function downloadFile(content, filename, mimeType = 'text/markdown') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Escape HTML to prevent XSS when inserting user content into innerHTML
 * @param {string} text - Text to escape
 * @returns {string} - Escaped HTML-safe string
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Generate a safe filename from text (removes special characters)
 * @param {string} name - Original name
 * @param {string} extension - File extension (default: .md)
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(name, extension = '.md') {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + extension;
}
