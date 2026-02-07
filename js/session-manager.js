/**
 * @fileoverview Session Manager - Handles local storage persistence for user sessions.
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

class SessionManager {

    constructor() {
        this.STORAGE_KEY = 'slop_sessions';
        this.CURRENT_SESSION_KEY = 'slop_current_session_id';
    }

    /**
     * Generate a unique session ID.
     * Uses crypto.getRandomValues for better entropy than Math.random().
     * @private
     * @returns {string} A unique identifier
     */
    _generateId() {
        return Date.now().toString(36) + '-' + 
               crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    }

    /**
     * Retrieve all sessions from local storage.
     * @returns {Object.<string, Object>} An object map of session IDs to session objects
     */
    getAllSessions() {
        const sessions = localStorage.getItem(this.STORAGE_KEY);
        return sessions ? JSON.parse(sessions) : {};
    }

    /**
     * Retrieve a specific session by ID.
     * @param {string} id - The session ID to retrieve
     * @returns {Object|null} The session object or null if not found
     */
    getSession(id) {
        const sessions = this.getAllSessions();
        return sessions[id] || null;
    }

    /**
     * Get the ID of the currently active session.
     * @returns {string|null} The current session ID or null if none set
     */
    getCurrentSessionId() {
        return localStorage.getItem(this.CURRENT_SESSION_KEY);
    }

    /**
     * Set the currently active session ID.
     * @param {string} id - The session ID to set as current
     */
    setCurrentSessionId(id) {
        localStorage.setItem(this.CURRENT_SESSION_KEY, id);
    }

    /**
     * Create and store a new session.
     * @returns {Object} The newly created session object
     */
    createNewSession() {
        const id = this._generateId();
        const session = {
            id: id,
            created: Date.now(),
            updated: Date.now(),
            promptInput: '',
            chatHistory: [],
            resultHistory: [],
            currentHistoryIndex: -1,
            name: 'New Session'
        };
        
        this.saveSession(session);
        this.setCurrentSessionId(id);
        return session;
    }

    /**
     * Save or update a session in local storage.
     * Automatically updates the 'updated' timestamp and generates a name if needed.
     * @param {Object} session - The session object to save
     */
    saveSession(session) {
        const sessions = this.getAllSessions();
        
        // Update timestamp
        session.updated = Date.now();
        
        // Generate a name if it's the default one and we have input
        if (session.promptInput) {
            const trimmedInput = session.promptInput.trim();
            const generatedName = trimmedInput.slice(0, 30) + (trimmedInput.length > 30 ? '...' : '');
            
            if (session.name === 'New Session' || !session.name) {
                session.name = generatedName || 'New Session';
            }
        }

        sessions[session.id] = session;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    }

    /**
     * Delete a session by ID.
     * Also clears current session key if the deleted session was active.
     * @param {string} id - The ID of the session to delete
     */
    deleteSession(id) {
        const sessions = this.getAllSessions();
        delete sessions[id];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
        
        if (this.getCurrentSessionId() === id) {
            localStorage.removeItem(this.CURRENT_SESSION_KEY);
        }
    }
}
