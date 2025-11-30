/**
 * Modal Manager - Utility for setting up modal close behaviors
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
