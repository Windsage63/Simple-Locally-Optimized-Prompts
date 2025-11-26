class SessionManager {
    constructor() {
        this.STORAGE_KEY = 'slop_sessions';
        this.CURRENT_SESSION_KEY = 'slop_current_session_id';
    }

    // Generate a unique ID
    _generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Generate a session name from prompt input
    _generateNameFromPrompt(promptInput) {
        return promptInput.slice(0, 30) + (promptInput.length > 30 ? '...' : '');
    }

    // Get all sessions metadata
    getAllSessions() {
        const sessions = localStorage.getItem(this.STORAGE_KEY);
        return sessions ? JSON.parse(sessions) : {};
    }

    // Get a specific session
    getSession(id) {
        const sessions = this.getAllSessions();
        return sessions[id] || null;
    }

    // Get the ID of the last active session
    getCurrentSessionId() {
        return localStorage.getItem(this.CURRENT_SESSION_KEY);
    }

    // Set the current session ID
    setCurrentSessionId(id) {
        localStorage.setItem(this.CURRENT_SESSION_KEY, id);
    }

    // Create a new session
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

    // Save or update a session
    saveSession(session) {
        const sessions = this.getAllSessions();
        
        // Update timestamp
        session.updated = Date.now();
        
        // Generate a name if it's the default one and we have input
        if (session.name === 'New Session' && session.promptInput) {
            session.name = this._generateNameFromPrompt(session.promptInput);
        } else if (session.promptInput && session.name !== this._generateNameFromPrompt(session.promptInput)) {
             // Update name if prompt changes, but maybe we want to be smarter about this? 
             // For now, let's keep the name synced with the first few chars of the prompt if it hasn't been manually renamed (which we don't support yet anyway)
             session.name = this._generateNameFromPrompt(session.promptInput);
        }

        sessions[session.id] = session;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    }

    // Delete a session
    deleteSession(id) {
        const sessions = this.getAllSessions();
        delete sessions[id];
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
        
        if (this.getCurrentSessionId() === id) {
            localStorage.removeItem(this.CURRENT_SESSION_KEY);
        }
    }
}
