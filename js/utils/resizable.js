/**
 * @fileoverview Resizable Utility - Handles vertical resizing between two panels in SLOP.
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
 * Initialize vertical resizing between an upper and lower panel
 * @param {HTMLElement} handle - The resize handle element
 * @param {HTMLElement} container - The parent container of both panels
 * @param {HTMLElement} lowerPanel - The panel that will be resized (flex-basis)
 * @param {Object} options - Configuration options
 */
function initVerticalResize(handle, container, lowerPanel, options = {}) {
  const {
    minUpperHeight = 200,
    minLowerHeight = 200,
    storageKey = null,
    defaultPercentage = 40,
  } = options;

  // Restore saved height
  if (storageKey) {
    const savedHeight = localStorage.getItem(storageKey);
    if (savedHeight) {
      lowerPanel.style.flex = `0 0 ${savedHeight}%`;
    }
  }

  let isResizing = false;
  let startY = 0;
  let startLowerHeightPercent = 0;

  handle.addEventListener("mousedown", (e) => {
    isResizing = true;
    startY = e.clientY;

    const lowerStyle = window.getComputedStyle(lowerPanel);
    const lowerHeightPx = parseFloat(lowerStyle.height);
    const containerHeightPx = container.offsetHeight;
    startLowerHeightPercent = (lowerHeightPx / containerHeightPx) * 100;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "ns-resize";
    e.preventDefault();
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;

    const deltaY = e.clientY - startY;
    const containerHeight = container.offsetHeight;
    const deltaPercent = (deltaY / containerHeight) * 100;

    let newLowerHeightPercent = startLowerHeightPercent - deltaPercent;

    const newLowerHeightPx = (newLowerHeightPercent / 100) * containerHeight;
    const newUpperHeightPx = containerHeight - newLowerHeightPx;

    // Apply constraints
    if (newUpperHeightPx < minUpperHeight) {
      newLowerHeightPercent =
        ((containerHeight - minUpperHeight) / containerHeight) * 100;
    } else if (newLowerHeightPx < minLowerHeight) {
      newLowerHeightPercent = (minLowerHeight / containerHeight) * 100;
    }

    newLowerHeightPercent = Math.max(10, Math.min(90, newLowerHeightPercent));
    lowerPanel.style.flex = `0 0 ${newLowerHeightPercent}%`;
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";

      if (storageKey) {
        const lowerStyle = window.getComputedStyle(lowerPanel);
        const lowerHeightPx = parseFloat(lowerStyle.height);
        const containerHeightPx = container.offsetHeight;
        const finalPercent = (
          (lowerHeightPx / containerHeightPx) *
          100
        ).toFixed(2);
        localStorage.setItem(storageKey, finalPercent);
      }
    }
  });
}
