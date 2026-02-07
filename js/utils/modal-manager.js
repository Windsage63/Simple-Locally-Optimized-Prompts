/**
 * @fileoverview Modal Manager - Utility for setting up modal close behaviors in SLOP.
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
 * Setup standard modal close behaviors (close button + backdrop click)
 * @param {HTMLElement} modal - The modal element
 * @param {HTMLElement} closeBtn - The close button element
 * @param {Function} onClose - Optional callback when modal closes
 */
function setupModal(modal, closeBtn, onClose = null) {
    const close = () => {
        modal.classList.add('hidden');
        if (onClose) onClose();
    };

    closeBtn.addEventListener('click', close);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
    });

    return close; // Return close function for programmatic use
}

/**
 * Show a modal
 * @param {HTMLElement} modal - The modal element to show
 */
function showModal(modal) {
    modal.classList.remove('hidden');
}

/**
 * Hide a modal
 * @param {HTMLElement} modal - The modal element to hide
 */
function hideModal(modal) {
    modal.classList.add('hidden');
}
