/**
 * SLOP - Simple Locally Optimized Prompts
 * Main Application Orchestrator
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize core services
    const client = new LLMClient();
    const sessionManager = new SessionManager();
    const promptLibrary = new PromptLibrary();

    // Initialize prompt library database
    try {
        await promptLibrary.open();
    } catch (error) {
        console.error('Failed to initialize prompt library:', error);
    }

    // Initialize settings (from settings.js)
    initSettings(client);

    // --- Core UI Elements ---
    const promptInput = document.getElementById('prompt-input');
    const outputDisplay = document.getElementById('output-display');
    const optimizeBtn = document.getElementById('optimize-btn');
    const refineBtn = document.getElementById('refine-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const copyBtn = document.getElementById('copy-btn');
    const savePromptBtn = document.getElementById('save-prompt-btn');
    const loadingOverlay = document.getElementById('loading-overlay');

    // Chat Elements
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const chatHistoryDiv = document.getElementById('chat-history');

    // History Navigation
    const historyNav = document.getElementById('history-nav');
    const prevResultBtn = document.getElementById('prev-result');
    const nextResultBtn = document.getElementById('next-result');
    const historyCounter = document.getElementById('history-counter');

    // History Modal Elements
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtn = document.getElementById('close-history');
    const sessionsList = document.getElementById('sessions-list');

    // Library Modal Elements
    const librarySaveBtn = document.getElementById('library-save-btn');
    const libraryBtn = document.getElementById('library-btn');
    const libraryModal = document.getElementById('library-modal');
    const closeLibraryBtn = document.getElementById('close-library');
    const libraryNameFilter = document.getElementById('library-name-filter');
    const libraryPromptList = document.getElementById('library-prompt-list');
    const libraryImportBtn = document.getElementById('library-import-btn');
    const importFileInput = document.getElementById('import-file-input');
    const libraryDeleteBtn = document.getElementById('library-delete-btn');
    const libraryDownloadBtn = document.getElementById('library-download-btn');
    const libraryOpenBtn = document.getElementById('library-open-btn');

    // --- Application State ---
    let resultHistory = [];
    let currentHistoryIndex = -1;
    let currentSession = null;
    let isStreaming = false;
    let selectedPromptId = null;

    // Throttled rendering for streaming output
    let renderTimeout = null;
    let pendingContent = '';

    function scheduleRender(content) {
        pendingContent = content;
        if (!renderTimeout) {
            renderTimeout = setTimeout(() => {
                renderOutput(pendingContent);
                renderTimeout = null;
            }, 50);
        }
    }

    function flushRender() {
        if (renderTimeout) {
            clearTimeout(renderTimeout);
            renderTimeout = null;
        }
        if (pendingContent) {
            renderOutput(pendingContent);
            pendingContent = '';
        }
    }

    function renderOutput(text) {
        outputDisplay.value = text;
    }

    // --- Session Management ---

    function loadCurrentSession() {
        const sessionId = sessionManager.getCurrentSessionId();
        if (sessionId) {
            currentSession = sessionManager.getSession(sessionId);
        }

        if (!currentSession) {
            currentSession = sessionManager.createNewSession();
        }

        // Restore UI from session
        promptInput.value = currentSession.promptInput || '';
        client.history = currentSession.chatHistory || [];
        resultHistory = currentSession.resultHistory || [];
        currentHistoryIndex = currentSession.currentHistoryIndex !== undefined ? currentSession.currentHistoryIndex : -1;

        // Restore Chat UI
        chatHistoryDiv.innerHTML = '';
        if (!client.history || client.history.length === 0) {
            chatHistoryDiv.innerHTML = '<div class="chat-message system"><p>Optimize your prompt first, then chat here to refine it!</p></div>';
        } else {
            client.history.forEach(msg => appendChatMessage(msg.role, msg.content, false));
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
        }

        // Restore Output UI
        if (resultHistory.length > 0 && currentHistoryIndex >= 0) {
            renderOutput(resultHistory[currentHistoryIndex]);
            updateHistoryUI();
        } else {
            outputDisplay.value = '';
            historyNav.classList.add('hidden');
        }
    }

    function saveState() {
        if (!currentSession) return;

        currentSession.promptInput = promptInput.value;
        currentSession.chatHistory = client.history || [];
        currentSession.resultHistory = resultHistory;
        currentSession.currentHistoryIndex = currentHistoryIndex;

        sessionManager.saveSession(currentSession);
    }

    // Initialize session
    loadCurrentSession();

    // --- History Navigation ---

    function addToHistory(result) {
        if (currentHistoryIndex < resultHistory.length - 1) {
            resultHistory = resultHistory.slice(0, currentHistoryIndex + 1);
        }
        resultHistory.push(result);
        currentHistoryIndex = resultHistory.length - 1;
        updateHistoryUI();
        renderOutput(result);
    }

    function updateHistoryUI() {
        if (resultHistory.length > 1) {
            historyNav.classList.remove('hidden');
            historyCounter.textContent = `${currentHistoryIndex + 1} / ${resultHistory.length}`;
            prevResultBtn.disabled = currentHistoryIndex === 0;
            nextResultBtn.disabled = currentHistoryIndex === resultHistory.length - 1;
            prevResultBtn.style.opacity = prevResultBtn.disabled ? '0.5' : '1';
            nextResultBtn.style.opacity = nextResultBtn.disabled ? '0.5' : '1';
        } else {
            historyNav.classList.add('hidden');
        }
    }

    prevResultBtn.addEventListener('click', () => {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--;
            renderOutput(resultHistory[currentHistoryIndex]);
            updateHistoryUI();
            saveState();
        }
    });

    nextResultBtn.addEventListener('click', () => {
        if (currentHistoryIndex < resultHistory.length - 1) {
            currentHistoryIndex++;
            renderOutput(resultHistory[currentHistoryIndex]);
            updateHistoryUI();
            saveState();
        }
    });

    // --- Loading State ---

    const optimizeBtnOriginalHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Optimize';
    const refineBtnOriginalHTML = '<i class="fa-solid fa-rotate-right"></i> Refine';
    const stopBtnHTML = '<i class="fa-solid fa-stop"></i> Stop';

    function setLoading(loading, mode = null) {
        isStreaming = loading;

        if (loading) {
            loadingOverlay.classList.remove('hidden');
            if (mode === 'optimize') {
                optimizeBtn.innerHTML = stopBtnHTML;
                optimizeBtn.classList.add('stop-btn');
                refineBtn.disabled = true;
            } else if (mode === 'refine') {
                refineBtn.innerHTML = stopBtnHTML;
                refineBtn.classList.add('stop-btn');
                optimizeBtn.disabled = true;
            } else {
                optimizeBtn.disabled = true;
                refineBtn.disabled = true;
            }
        } else {
            loadingOverlay.classList.add('hidden');
            optimizeBtn.innerHTML = optimizeBtnOriginalHTML;
            optimizeBtn.classList.remove('stop-btn');
            optimizeBtn.disabled = false;
            refineBtn.innerHTML = refineBtnOriginalHTML;
            refineBtn.classList.remove('stop-btn');
            refineBtn.disabled = false;
        }
    }

    // --- Optimize Handler ---

    optimizeBtn.addEventListener('click', async () => {
        const text = promptInput.value.trim();
        if (!text) return;

        if (isStreaming) {
            client.abort();
            return;
        }

        client.history = [];
        chatHistoryDiv.innerHTML = '<div class="chat-message system"><p>Optimize your prompt first, then chat here to refine it!</p></div>';

        setLoading(true, 'optimize');
        outputDisplay.value = '';
        let fullResult = '';
        let streamStarted = false;

        try {
            for await (const chunk of client.optimizePromptStream(text)) {
                if (!streamStarted) {
                    streamStarted = true;
                    loadingOverlay.classList.add('hidden');
                }
                fullResult += chunk;
                scheduleRender(fullResult);
            }
            flushRender();
            addToHistory(fullResult);
            saveState();
        } catch (error) {
            flushRender();
            if (error.name === 'AbortError') {
                if (fullResult) {
                    addToHistory(fullResult);
                    saveState();
                }
            } else {
                renderOutput(`Error: ${error.message}\n\nPlease check your API settings and ensure the local LLM is running.`);
            }
        } finally {
            setLoading(false);
        }
    });

    // --- Refine Handler ---

    refineBtn.addEventListener('click', async () => {
        const originalText = promptInput.value.trim();
        const currentOutput = outputDisplay.value;
        const includeChat = document.getElementById('include-chat').checked;

        if (!originalText || !currentOutput) {
            alert("Please optimize a prompt first.");
            return;
        }

        if (isStreaming) {
            client.abort();
            return;
        }

        if (includeChat && (!client.history || client.history.length === 0)) {
            alert("No chat history to include. Please chat first or uncheck 'Include Chat'.");
            return;
        }

        setLoading(true, 'refine');
        outputDisplay.value = '';
        let fullResult = '';
        let streamStarted = false;

        try {
            const stream = includeChat
                ? client.refinePromptStream(originalText, currentOutput, client.history)
                : client.noChatRefinePromptStream(originalText, currentOutput);

            for await (const chunk of stream) {
                if (!streamStarted) {
                    streamStarted = true;
                    loadingOverlay.classList.add('hidden');
                }
                fullResult += chunk;
                scheduleRender(fullResult);
            }
            flushRender();
            addToHistory(fullResult);

            // Reset chat for the new refined prompt - clean slate
            client.history = [];
            chatHistoryDiv.innerHTML = '<div class="chat-message system"><p><i class="fa-solid fa-rotate-right"></i> Prompt refined. Chat reset for fresh context.</p></div>';

            saveState();
        } catch (error) {
            flushRender();
            if (error.name === 'AbortError') {
                if (fullResult) {
                    addToHistory(fullResult);
                    saveState();
                }
            } else {
                renderOutput(`Refinement Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    });

    // --- Chat Handler ---

    function appendChatMessage(role, text, save = true) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${role}`;
        msgDiv.innerText = text;
        chatHistoryDiv.appendChild(msgDiv);
        return msgDiv;
    }

    async function handleChat() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Safety guard - prevent double-sends during streaming
        if (isStreaming) return;

        appendChatMessage('user', message);
        chatInput.value = '';
        saveState();

        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

        const assistantMsgDiv = appendChatMessage('assistant', '');
        let fullResponse = '';

        sendChatBtn.disabled = true;
        const originalIcon = sendChatBtn.innerHTML;
        sendChatBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
        sendChatBtn.disabled = false;
        sendChatBtn.onclick = () => client.abort();
        isStreaming = true;

        try {
            const originalPrompt = promptInput.value.trim();
            const optimizedResult = currentHistoryIndex >= 0 ? resultHistory[currentHistoryIndex] : null;

            for await (const chunk of client.chatStream(message, originalPrompt, optimizedResult)) {
                fullResponse += chunk;
                assistantMsgDiv.innerText = fullResponse;
                chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
            }
            saveState();
        } catch (error) {
            if (error.name === 'AbortError') {
                if (!fullResponse) {
                    assistantMsgDiv.innerText = '[Cancelled]';
                    assistantMsgDiv.classList.add('system');
                }
            } else {
                assistantMsgDiv.innerText = `Error: ${error.message}`;
                assistantMsgDiv.classList.remove('assistant');
                assistantMsgDiv.classList.add('system');
            }
        } finally {
            isStreaming = false;
            sendChatBtn.innerHTML = originalIcon;
            sendChatBtn.onclick = handleChat;
        }
    }

    sendChatBtn.onclick = handleChat;

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Ignore Enter key during streaming to prevent accidental double-sends
            if (isStreaming) return;
            handleChat();
        }
    });

    // --- Input/Output Event Handlers ---

    outputDisplay.addEventListener('input', () => {
        if (currentHistoryIndex >= 0 && resultHistory[currentHistoryIndex] !== undefined) {
            resultHistory[currentHistoryIndex] = outputDisplay.value;
            saveState();
        }
    });

    promptInput.addEventListener('input', () => {
        saveState();
    });

    // --- New Chat Button ---

    newChatBtn.addEventListener('click', () => {
        currentSession = sessionManager.createNewSession();
        loadCurrentSession();
    });

    // --- Copy Button ---

    copyBtn.addEventListener('click', () => {
        const content = outputDisplay.value;
        if (content) {
            navigator.clipboard.writeText(content);
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => copyBtn.innerHTML = originalIcon, 2000);
        }
    });

    // --- Save Prompt Button (Download) ---

    savePromptBtn.addEventListener('click', () => {
        if (currentHistoryIndex < 0 || !resultHistory[currentHistoryIndex]) {
            alert("No prompt to save!");
            return;
        }

        const content = resultHistory[currentHistoryIndex];
        let filename = 'optimized-prompt.md';

        try {
            const match = content.match(/---\s*([\s\S]*?)\s*---/);
            if (match) {
                const yamlText = match[1];
                if (yamlText.length <= 50000) {
                    const data = jsyaml.load(yamlText);
                    if (data && data.name) {
                        filename = sanitizeFilename(data.name);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to parse YAML for filename:", e);
        }

        downloadFile(content, filename);
    });

    // --- History Modal ---

    function renderSessionsList() {
        const sessions = sessionManager.getAllSessions();
        const list = Object.values(sessions).sort((a, b) => b.updated - a.updated);

        sessionsList.innerHTML = '';

        if (list.length === 0) {
            sessionsList.innerHTML = '<p class="no-sessions">No saved sessions.</p>';
            return;
        }

        list.forEach(session => {
            const item = document.createElement('div');
            item.className = 'session-item';
            if (session.id === currentSession.id) {
                item.classList.add('active');
            }

            const date = new Date(session.updated).toLocaleString();

            item.innerHTML = `
                <div class="session-info">
                    <div class="session-name">${escapeHtml(session.name || 'Untitled Session')}</div>
                    <div class="session-date">${date}</div>
                </div>
                <div class="session-actions">
                    <button class="icon-btn delete-session" data-id="${session.id}" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;

            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-session')) {
                    sessionManager.setCurrentSessionId(session.id);
                    loadCurrentSession();
                    hideModal(historyModal);
                }
            });

            const deleteBtn = item.querySelector('.delete-session');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this session?')) {
                    sessionManager.deleteSession(session.id);
                    if (session.id === currentSession.id) {
                        currentSession = sessionManager.createNewSession();
                        loadCurrentSession();
                    }
                    renderSessionsList();
                }
            });

            sessionsList.appendChild(item);
        });
    }

    historyBtn.addEventListener('click', () => {
        renderSessionsList();
        showModal(historyModal);
    });

    setupModal(historyModal, closeHistoryBtn);

    // --- Library Modal ---

    async function renderLibraryPromptList(filter = '') {
        const allLibraryPrompts = await promptLibrary.getAllPrompts();
        const lowerFilter = filter.toLowerCase();

        let filtered = allLibraryPrompts;
        if (lowerFilter) {
            filtered = filtered.filter(p => p.name.toLowerCase().includes(lowerFilter));
        }

        filtered.sort((a, b) => b.updated - a.updated);

        libraryPromptList.innerHTML = '';

        filtered.forEach(prompt => {
            const li = document.createElement('li');
            li.className = 'list-item';
            if (prompt.id === selectedPromptId) {
                li.classList.add('selected');
            }
            li.dataset.id = prompt.id;
            li.innerHTML = `
                <div class="item-header">
                    <div class="item-name">${escapeHtml(prompt.name)}</div>
                </div>
                <div class="item-description">${escapeHtml(prompt.description || 'No description')}</div>
            `;
            li.addEventListener('click', () => {
                selectedPromptId = prompt.id;
                libraryPromptList.querySelectorAll('.list-item').forEach(item => {
                    item.classList.toggle('selected', parseInt(item.dataset.id) === prompt.id);
                });
            });
            libraryPromptList.appendChild(li);
        });
    }

    librarySaveBtn.addEventListener('click', async () => {
        if (currentHistoryIndex < 0 || !resultHistory[currentHistoryIndex]) {
            alert('No prompt to save!');
            return;
        }

        const content = resultHistory[currentHistoryIndex];
        const parsed = promptLibrary.parseYamlFrontmatter(content);
        const baseName = parsed.name;

        const allPrompts = await promptLibrary.getAllPrompts();
        const existing = allPrompts.find(p => p.name.toLowerCase() === baseName.toLowerCase());

        if (existing) {
            const choice = confirm(`A prompt named "${baseName}" already exists.\n\nClick OK to overwrite, or Cancel to keep both (will add a number).`);

            if (choice) {
                try {
                    await promptLibrary.deletePrompt(existing.id);
                    await promptLibrary.savePrompt(content, false);
                    alert('Prompt overwritten in library!');
                } catch (error) {
                    alert('Failed to save prompt: ' + error.message);
                }
            } else {
                try {
                    await promptLibrary.savePrompt(content, true);
                    alert('Prompt saved to library with new name!');
                } catch (error) {
                    alert('Failed to save prompt: ' + error.message);
                }
            }
        } else {
            try {
                await promptLibrary.savePrompt(content, false);
                alert('Prompt saved to library!');
            } catch (error) {
                alert('Failed to save prompt: ' + error.message);
            }
        }
    });

    libraryBtn.addEventListener('click', async () => {
        selectedPromptId = null;
        libraryNameFilter.value = '';
        await renderLibraryPromptList();
        showModal(libraryModal);
    });

    setupModal(libraryModal, closeLibraryBtn);

    libraryNameFilter.addEventListener('input', () => {
        renderLibraryPromptList(libraryNameFilter.value);
    });

    libraryDeleteBtn.addEventListener('click', async () => {
        if (!selectedPromptId) {
            alert('No prompt selected!');
            return;
        }

        if (!confirm('Delete this prompt?')) return;

        try {
            await promptLibrary.deletePrompt(selectedPromptId);
            selectedPromptId = null;
            await renderLibraryPromptList(libraryNameFilter.value);
        } catch (error) {
            alert('Failed to delete prompt: ' + error.message);
        }
    });

    libraryDownloadBtn.addEventListener('click', async () => {
        if (!selectedPromptId) {
            alert('No prompt selected!');
            return;
        }

        const prompt = await promptLibrary.getPrompt(selectedPromptId);
        if (!prompt) return;

        downloadFile(prompt.content, sanitizeFilename(prompt.name));
    });

    libraryOpenBtn.addEventListener('click', async () => {
        if (!selectedPromptId) {
            alert('No prompt selected!');
            return;
        }

        const prompt = await promptLibrary.getPrompt(selectedPromptId);
        if (!prompt) return;

        outputDisplay.value = prompt.content;
        addToHistory(prompt.content);
        saveState();
        hideModal(libraryModal);
    });

    libraryImportBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                await promptLibrary.savePrompt(event.target.result, true);
                alert('Prompt imported!');
                await renderLibraryPromptList(libraryNameFilter.value);
            } catch (error) {
                alert('Failed to import prompt: ' + error.message);
            }
        };
        reader.readAsText(file);
        importFileInput.value = '';
    });

    // --- Resize Handle ---

    const resizeHandle = document.getElementById('resize-handle');
    const inputPanel = document.querySelector('.input-panel');
    const chatInterface = document.querySelector('.chat-interface');

    const MIN_INPUT_HEIGHT = 280;
    const MIN_CHAT_HEIGHT = 310;

    const savedChatHeight = localStorage.getItem('chatHeightPercentage');
    if (savedChatHeight) {
        chatInterface.style.flex = `0 0 ${savedChatHeight}%`;
    }

    let isResizing = false;
    let startY = 0;
    let startChatHeight = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        startY = e.clientY;

        const chatStyle = window.getComputedStyle(chatInterface);
        const chatHeightPx = parseFloat(chatStyle.height);
        const panelHeightPx = inputPanel.offsetHeight;
        startChatHeight = (chatHeightPx / panelHeightPx) * 100;

        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const deltaY = e.clientY - startY;
        const panelHeight = inputPanel.offsetHeight;
        const deltaPercent = (deltaY / panelHeight) * 100;

        let newChatHeightPercent = startChatHeight - deltaPercent;

        const newChatHeightPx = (newChatHeightPercent / 100) * panelHeight;
        const newInputHeightPx = panelHeight - newChatHeightPx;

        if (newInputHeightPx < MIN_INPUT_HEIGHT) {
            newChatHeightPercent = ((panelHeight - MIN_INPUT_HEIGHT) / panelHeight) * 100;
        } else if (newChatHeightPx < MIN_CHAT_HEIGHT) {
            newChatHeightPercent = (MIN_CHAT_HEIGHT / panelHeight) * 100;
        }

        newChatHeightPercent = Math.max(15, Math.min(85, newChatHeightPercent));
        chatInterface.style.flex = `0 0 ${newChatHeightPercent}%`;
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';

            const chatStyle = window.getComputedStyle(chatInterface);
            const chatHeightPx = parseFloat(chatStyle.height);
            const panelHeightPx = inputPanel.offsetHeight;
            const finalChatHeightPercent = ((chatHeightPx / panelHeightPx) * 100).toFixed(2);

            localStorage.setItem('chatHeightPercentage', finalChatHeightPercent);
        }
    });
});
