/**
 * @fileoverview File Utilities - Download and HTML escape helpers for SLOP.
 * @author Timothy Mallory
 * @license Apache-2.0
 * @copyright 2025-2026 Timothy Mallory
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
