// LLMClient is now available globally via api.js
// SessionManager is now available globally via session-manager.js

document.addEventListener('DOMContentLoaded', () => {
    const client = new LLMClient();
    const sessionManager = new SessionManager();

    // UI Elements
    const promptInput = document.getElementById('prompt-input');
    const outputDisplay = document.getElementById('output-display');
    const optimizeBtn = document.getElementById('optimize-btn');
    const newChatBtn = document.getElementById('new-chat-btn'); // Renamed from clear-btn
    const copyBtn = document.getElementById('copy-btn');
    const savePromptBtn = document.getElementById('save-prompt-btn'); // New
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings');
    const apiUrlInput = document.getElementById('api-url');
    const modelNameInput = document.getElementById('model-name');
    const loadingOverlay = document.getElementById('loading-overlay');
    const fetchModelsBtn = document.getElementById('fetch-models-btn');
    const modelSelect = document.getElementById('model-select');
    const apiKeyInput = document.getElementById('api-key');
    const saveKeyCheckbox = document.getElementById('save-key');
    const keySavedBadge = document.getElementById('key-saved-badge');

    // Chat API Settings Elements
    const chatApiUrlInput = document.getElementById('chat-api-url');
    const chatApiKeyInput = document.getElementById('chat-api-key');
    const chatModelNameInput = document.getElementById('chat-model-name');
    const chatModelSelect = document.getElementById('chat-model-select');
    const chatSaveKeyCheckbox = document.getElementById('chat-save-key');
    const chatKeySavedBadge = document.getElementById('chat-key-saved-badge');
    const chatFetchModelsBtn = document.getElementById('chat-fetch-models-btn');

    // Prompt Settings Elements
    // Prompt Settings Elements
    // const customizePromptsBtn = document.getElementById('customize-prompts-btn'); // Removed
    const editOptimizePromptBtn = document.getElementById('edit-optimize-prompt-btn');
    const editRefinePromptBtn = document.getElementById('edit-refine-prompt-btn');
    const editRefineNoChatPromptBtn = document.getElementById('edit-refine-no-chat-prompt-btn');
    const editChatPromptBtn = document.getElementById('edit-chat-prompt-btn');

    const promptSettingsModal = document.getElementById('prompt-settings-modal');
    const closePromptSettingsBtn = document.getElementById('close-prompt-settings');

    // Sections
    const sectionOptimize = document.getElementById('section-optimize');
    const sectionRefine = document.getElementById('section-refine');
    const sectionRefineNoChat = document.getElementById('section-refine-no-chat');
    const sectionChat = document.getElementById('section-chat');

    const optimizePromptInput = document.getElementById('optimize-prompt-input');
    const saveOptimizePromptBtn = document.getElementById('save-optimize-prompt');
    const resetOptimizePromptBtn = document.getElementById('reset-optimize-prompt');

    const chatPromptInput = document.getElementById('chat-prompt-input');
    const saveChatPromptBtn = document.getElementById('save-chat-prompt');
    const resetChatPromptBtn = document.getElementById('reset-chat-prompt');

    const refinePromptInput = document.getElementById('refine-prompt-input');
    const saveRefinePromptBtn = document.getElementById('save-refine-prompt');
    const resetRefinePromptBtn = document.getElementById('reset-refine-prompt');

    const refineNoChatPromptInput = document.getElementById('refine-no-chat-prompt-input');
    const saveRefineNoChatPromptBtn = document.getElementById('save-refine-no-chat-prompt');
    const resetRefineNoChatPromptBtn = document.getElementById('reset-refine-no-chat-prompt');

    // History UI Elements
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const closeHistoryBtn = document.getElementById('close-history');
    const sessionsList = document.getElementById('sessions-list');

    // Initialize Settings UI
    apiUrlInput.value = client.baseUrl;
    modelNameInput.value = client.model;

    // Chat Elements
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const chatHistoryDiv = document.getElementById('chat-history');
    const refineBtn = document.getElementById('refine-btn');
    const historyNav = document.getElementById('history-nav');
    const prevResultBtn = document.getElementById('prev-result');
    const nextResultBtn = document.getElementById('next-result');
    const historyCounter = document.getElementById('history-counter');

    // State
    let resultHistory = [];
    let currentHistoryIndex = -1;
    let currentSession = null;

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
            outputDisplay.innerHTML = '';
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

    // Initialize
    loadCurrentSession();


    // --- Event Listeners ---

    optimizeBtn.addEventListener('click', async () => {
        const text = promptInput.value.trim();
        if (!text) return;

        // Reset chat history on new optimization? 
        // User requested: "The history should automatically update as chat continues to keep the work safe."
        // But usually optimization resets the context. Let's keep the behavior of resetting chat for a *fresh* optimization,
        // but since we have "New Chat" button now, maybe this is just a re-optimization?
        // Let's stick to the original behavior: Optimize clears chat context for the new prompt.

        client.history = [];
        chatHistoryDiv.innerHTML = '<div class="chat-message system"><p>Optimize your prompt first, then chat here to refine it!</p></div>';

        setLoading(true);
        try {
            const result = await client.optimizePrompt(text);
            addToHistory(result);
            saveState(); // Save after optimization
        } catch (error) {
            renderOutput(`Error: ${error.message}\n\nPlease check your API settings and ensure the local LLM is running.`);
        } finally {
            setLoading(false);
        }
    });

    refineBtn.addEventListener('click', async () => {
        const originalText = promptInput.value.trim();
        const currentOutput = outputDisplay.innerText;
        const includeChat = document.getElementById('include-chat').checked;

        if (!originalText || !currentOutput) {
            alert("Please optimize a prompt first.");
            return;
        }

        if (includeChat && (!client.history || client.history.length === 0)) {
            alert("No chat history to include. Please chat first or uncheck 'Include Chat'.");
            return;
        }

        setLoading(true);
        try {
            let result;
            if (includeChat) {
                result = await client.refinePrompt(originalText, currentOutput, client.history);
            } else {
                result = await client.noChatRefinePrompt(originalText, currentOutput);
            }
            addToHistory(result);
            saveState(); // Save after refinement
        } catch (error) {
            renderOutput(`Refinement Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    });

    // History Navigation Logic
    function addToHistory(result) {
        // If we were browsing history and generate new result, truncate future history
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

            // Visual feedback for disabled state
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
            saveState(); // Save index position
        }
    });

    nextResultBtn.addEventListener('click', () => {
        if (currentHistoryIndex < resultHistory.length - 1) {
            currentHistoryIndex++;
            renderOutput(resultHistory[currentHistoryIndex]);
            updateHistoryUI();
            saveState(); // Save index position
        }
    });

    // Chat Logic
    async function handleChat() {
        const message = chatInput.value.trim();
        if (!message) return;

        appendChatMessage('user', message);
        chatInput.value = '';
        saveState(); // Save user message immediately

        // Auto-scroll
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

        try {
            // Get context
            const originalPrompt = promptInput.value.trim();
            const optimizedResult = currentHistoryIndex >= 0 ? resultHistory[currentHistoryIndex] : null;

            // Call chat with context
            const response = await client.chat(message, originalPrompt, optimizedResult);
            appendChatMessage('assistant', response);
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
            saveState(); // Save assistant response
        } catch (error) {
            appendChatMessage('system', `Error: ${error.message}`);
        }
    }

    sendChatBtn.addEventListener('click', handleChat);

    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleChat();
        }
    });

    function appendChatMessage(role, text, save = true) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${role}`;
        msgDiv.innerText = text;
        chatHistoryDiv.appendChild(msgDiv);
    }

    // New Chat Button
    newChatBtn.addEventListener('click', () => {
        // Create new session
        currentSession = sessionManager.createNewSession();
        loadCurrentSession(); // Reload UI with empty session
    });

    // Save Prompt Button
    savePromptBtn.addEventListener('click', () => {
        if (currentHistoryIndex < 0 || !resultHistory[currentHistoryIndex]) {
            alert("No prompt to save!");
            return;
        }

        const content = resultHistory[currentHistoryIndex];
        let filename = 'optimized-prompt.md';

        // Remove markdown code blocks if present
        // This regex removes the opening ```markdown (or other lang) and the closing ```
        let cleanContent = content.replace(/^```[a-z]*\s*\n/i, '').replace(/```\s*$/, '');
        cleanContent = cleanContent.trim();

        // Try to parse YAML frontmatter to get the name
        try {
            // Match YAML block (find the first one)
            const match = cleanContent.match(/---\s*([\s\S]*?)\s*---/);
            if (match) {
                const yamlText = match[1];

                // Security: Basic size check before parsing to prevent DoS
                if (yamlText.length > 50000) {
                    console.warn("YAML frontmatter too large, skipping parse.");
                    throw new Error("YAML too large");
                }

                const data = jsyaml.load(yamlText);
                if (data && data.name) {
                    // Sanitize filename
                    filename = data.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.md';
                }
            }
        } catch (e) {
            console.error("Failed to parse YAML for filename:", e);
        }

        // Create blob and download
        const blob = new Blob([cleanContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    copyBtn.addEventListener('click', () => {
        const content = outputDisplay.innerText;
        if (content) {
            navigator.clipboard.writeText(content);
            const originalIcon = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            setTimeout(() => copyBtn.innerHTML = originalIcon, 2000);
        }
    });

    // Input auto-save
    promptInput.addEventListener('input', () => {
        saveState();
    });

    // --- History Modal Logic ---

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
                    <div class="session-name">${session.name || 'Untitled Session'}</div>
                    <div class="session-date">${date}</div>
                </div>
                <div class="session-actions">
                    <button class="icon-btn delete-session" data-id="${session.id}" title="Delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;

            // Click on item to load (excluding delete button)
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-session')) {
                    sessionManager.setCurrentSessionId(session.id);
                    loadCurrentSession();
                    historyModal.classList.add('hidden');
                }
            });

            // Delete button
            const deleteBtn = item.querySelector('.delete-session');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this session?')) {
                    sessionManager.deleteSession(session.id);
                    // If we deleted the current session, create a new one
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
        historyModal.classList.remove('hidden');
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyModal.classList.add('hidden');
    });

    historyModal.addEventListener('click', (e) => {
        if (e.target === historyModal) {
            historyModal.classList.add('hidden');
        }
    });


    // Settings Modal Logic
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');

        // Populate Optimize/Refine API settings
        apiUrlInput.value = client.baseUrl;
        modelNameInput.value = client.model;
        apiKeyInput.value = client.apiKey;

        const isSaved = !!localStorage.getItem('slop_api_key');
        saveKeyCheckbox.checked = isSaved;

        if (isSaved) {
            keySavedBadge.classList.remove('hidden');
        } else {
            keySavedBadge.classList.add('hidden');
        }

        // Populate Chat API settings
        chatApiUrlInput.value = client.chatBaseUrl;
        chatModelNameInput.value = client.chatModel;
        chatApiKeyInput.value = client.chatApiKey;

        const isChatKeySaved = !!localStorage.getItem('slop_chat_api_key');
        chatSaveKeyCheckbox.checked = isChatKeySaved;

        if (isChatKeySaved) {
            chatKeySavedBadge.classList.remove('hidden');
        } else {
            chatKeySavedBadge.classList.add('hidden');
        }

        // Load word wrap setting
        wordWrapCheckbox.checked = localStorage.getItem('slop_word_wrap') === 'true';
    });

    // Apply word wrap setting on load
    const wordWrapCheckbox = document.getElementById('word-wrap');
    const savedWordWrap = localStorage.getItem('slop_word_wrap') === 'true';
    applyWordWrap(savedWordWrap);

    function applyWordWrap(enabled) {
        if (enabled) {
            outputDisplay.classList.add('wrap-code');
            promptInput.classList.remove('no-wrap');
        } else {
            outputDisplay.classList.remove('wrap-code');
            promptInput.classList.add('no-wrap');
        }
    }

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    saveSettingsBtn.addEventListener('click', () => {
        const url = apiUrlInput.value.trim();
        const model = modelNameInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        const saveKey = saveKeyCheckbox.checked;
        const wordWrap = wordWrapCheckbox.checked;

        // Chat API settings
        const chatUrl = chatApiUrlInput.value.trim();
        const chatModel = chatModelNameInput.value.trim();
        const chatApiKey = chatApiKeyInput.value.trim();
        const chatSaveKey = chatSaveKeyCheckbox.checked;

        if (url && model) {
            client.updateConfig(url, model, apiKey, saveKey);
            client.updateChatConfig(chatUrl, chatModel, chatApiKey, chatSaveKey);

            // Save word wrap setting
            localStorage.setItem('slop_word_wrap', wordWrap);
            applyWordWrap(wordWrap);

            settingsModal.classList.add('hidden');
        }
    });

    // Close modal on outside click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });

    // --- Prompt Settings Logic ---

    // Helper to open specific prompt section
    function openPromptSettings(sectionId) {
        // Load current prompts
        optimizePromptInput.value = localStorage.getItem('slop_prompt_optimize') || LLMClient.DEFAULT_PROMPTS.optimize;
        chatPromptInput.value = localStorage.getItem('slop_prompt_chat') || LLMClient.DEFAULT_PROMPTS.chat;
        refinePromptInput.value = localStorage.getItem('slop_prompt_refine') || LLMClient.DEFAULT_PROMPTS.refine;
        refineNoChatPromptInput.value = localStorage.getItem('slop_prompt_refine_no_chat') || LLMClient.DEFAULT_PROMPTS.refine_no_chat;

        // Hide all sections
        sectionOptimize.classList.add('hidden');
        sectionRefine.classList.add('hidden');
        sectionRefineNoChat.classList.add('hidden');
        sectionChat.classList.add('hidden');

        // Show requested section
        document.getElementById(sectionId).classList.remove('hidden');

        settingsModal.classList.add('hidden'); // Close main settings
        promptSettingsModal.classList.remove('hidden');
    }

    editOptimizePromptBtn.addEventListener('click', () => openPromptSettings('section-optimize'));
    editRefinePromptBtn.addEventListener('click', () => openPromptSettings('section-refine'));
    editRefineNoChatPromptBtn.addEventListener('click', () => openPromptSettings('section-refine-no-chat'));
    editChatPromptBtn.addEventListener('click', () => openPromptSettings('section-chat'));

    closePromptSettingsBtn.addEventListener('click', () => {
        promptSettingsModal.classList.add('hidden');
        settingsModal.classList.remove('hidden'); // Re-open main settings
    });

    promptSettingsModal.addEventListener('click', (e) => {
        if (e.target === promptSettingsModal) {
            promptSettingsModal.classList.add('hidden');
            settingsModal.classList.remove('hidden');
        }
    });

    // Optimize Prompt Actions
    saveOptimizePromptBtn.addEventListener('click', () => {
        const val = optimizePromptInput.value.trim();
        if (val) {
            localStorage.setItem('slop_prompt_optimize', val);
            alert('Optimize prompt saved!');
        }
    });

    resetOptimizePromptBtn.addEventListener('click', () => {
        if (confirm('Reset optimize prompt to default?')) {
            const defaultVal = LLMClient.DEFAULT_PROMPTS.optimize;
            optimizePromptInput.value = defaultVal;
            localStorage.setItem('slop_prompt_optimize', defaultVal);
        }
    });

    // Chat Prompt Actions
    saveChatPromptBtn.addEventListener('click', () => {
        const val = chatPromptInput.value.trim();
        if (val) {
            localStorage.setItem('slop_prompt_chat', val);
            alert('Chat prompt saved!');
        }
    });

    resetChatPromptBtn.addEventListener('click', () => {
        if (confirm('Reset chat prompt to default?')) {
            const defaultVal = LLMClient.DEFAULT_PROMPTS.chat;
            chatPromptInput.value = defaultVal;
            localStorage.setItem('slop_prompt_chat', defaultVal);
        }
    });

    // Refine Prompt Actions
    saveRefinePromptBtn.addEventListener('click', () => {
        const val = refinePromptInput.value.trim();
        if (val) {
            localStorage.setItem('slop_prompt_refine', val);
            alert('Refine prompt saved!');
        }
    });

    resetRefinePromptBtn.addEventListener('click', () => {
        if (confirm('Reset refine prompt to default?')) {
            const defaultVal = LLMClient.DEFAULT_PROMPTS.refine;
            refinePromptInput.value = defaultVal;
            localStorage.setItem('slop_prompt_refine', defaultVal);
        }
    });

    // Refine (No Chat) Prompt Actions
    saveRefineNoChatPromptBtn.addEventListener('click', () => {
        const val = refineNoChatPromptInput.value.trim();
        if (val) {
            localStorage.setItem('slop_prompt_refine_no_chat', val);
            alert('Refine (No Chat) prompt saved!');
        }
    });

    resetRefineNoChatPromptBtn.addEventListener('click', () => {
        if (confirm('Reset refine (no chat) prompt to default?')) {
            const defaultVal = LLMClient.DEFAULT_PROMPTS.refine_no_chat;
            refineNoChatPromptInput.value = defaultVal;
            localStorage.setItem('slop_prompt_refine_no_chat', defaultVal);
        }
    });

    // Fetch Models Logic
    fetchModelsBtn.addEventListener('click', async () => {
        const originalIcon = fetchModelsBtn.innerHTML;
        fetchModelsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            // Temporarily update client URL to fetch from the input value
            const tempClient = new LLMClient();
            tempClient.baseUrl = apiUrlInput.value.trim();

            const models = await tempClient.getModels();

            if (models && models.length > 0) {
                // Show select, hide text input if we have models
                modelSelect.innerHTML = '';
                models.forEach(m => {
                    const option = document.createElement('option');
                    option.value = m.id;
                    option.textContent = m.id;
                    modelSelect.appendChild(option);
                });

                modelSelect.classList.remove('hidden');
                modelNameInput.classList.add('hidden');

                // When select changes, update the hidden text input (or just use select value)
                modelSelect.addEventListener('change', () => {
                    modelNameInput.value = modelSelect.value;
                });

                // Set initial value
                modelSelect.value = models[0].id;
                modelNameInput.value = models[0].id;
            } else {
                alert('No models found or empty list returned.');
            }
        } catch (error) {
            alert('Failed to fetch models. Check URL.');
            console.error(error);
        } finally {
            fetchModelsBtn.innerHTML = originalIcon;
        }
    });

    // Fetch Models Logic for Chat API
    chatFetchModelsBtn.addEventListener('click', async () => {
        const originalIcon = chatFetchModelsBtn.innerHTML;
        chatFetchModelsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        try {
            const chatUrl = chatApiUrlInput.value.trim();
            const chatKey = chatApiKeyInput.value.trim();

            if (!chatUrl) {
                alert('Please enter a Chat API URL first.');
                return;
            }

            const models = await client.getModelsForEndpoint(chatUrl, chatKey);

            if (models && models.length > 0) {
                // Show select, hide text input if we have models
                chatModelSelect.innerHTML = '';
                models.forEach(m => {
                    const option = document.createElement('option');
                    option.value = m.id;
                    option.textContent = m.id;
                    chatModelSelect.appendChild(option);
                });

                chatModelSelect.classList.remove('hidden');
                chatModelNameInput.classList.add('hidden');

                // When select changes, update the hidden text input
                chatModelSelect.addEventListener('change', () => {
                    chatModelNameInput.value = chatModelSelect.value;
                });

                // Set initial value
                chatModelSelect.value = models[0].id;
                chatModelNameInput.value = models[0].id;
            } else {
                alert('No models found or empty list returned.');
            }
        } catch (error) {
            alert('Failed to fetch models. Check Chat API URL.');
            console.error(error);
        } finally {
            chatFetchModelsBtn.innerHTML = originalIcon;
        }
    });

    // Helpers
    function setLoading(isLoading) {
        if (isLoading) {
            loadingOverlay.classList.remove('hidden');
            optimizeBtn.disabled = true;
            refineBtn.disabled = true;
        } else {
            loadingOverlay.classList.add('hidden');
            optimizeBtn.disabled = false;
            refineBtn.disabled = false;
        }
    }

    function renderOutput(markdown) {
        // Use marked to parse markdown
        const rawHtml = marked.parse(markdown);
        // Sanitize with DOMPurify
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        outputDisplay.innerHTML = cleanHtml;
    }

    // ===== RESIZE HANDLE LOGIC =====
    const resizeHandle = document.getElementById('resize-handle');
    const inputPanel = document.querySelector('.input-panel');
    const inputArea = document.querySelector('.input-area');
    const chatInterface = document.querySelector('.chat-interface');

    // Minimum heights in pixels
    const MIN_INPUT_HEIGHT = 280;
    const MIN_CHAT_HEIGHT = 310;

    // Load saved chat height percentage from localStorage, default to 35%
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

        // Get current chat height as percentage
        const chatStyle = window.getComputedStyle(chatInterface);
        const chatHeightPx = parseFloat(chatStyle.height);
        const panelHeightPx = inputPanel.offsetHeight;
        startChatHeight = (chatHeightPx / panelHeightPx) * 100;

        // Prevent text selection during drag
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';

        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isResizing) return;

        const deltaY = e.clientY - startY;
        const panelHeight = inputPanel.offsetHeight;

        // Calculate the change as a percentage of the panel height
        const deltaPercent = (deltaY / panelHeight) * 100;

        // New chat height percentage (dragging down decreases chat, up increases chat)
        let newChatHeightPercent = startChatHeight - deltaPercent;

        // Calculate what the input area height would be
        const newChatHeightPx = (newChatHeightPercent / 100) * panelHeight;
        const newInputHeightPx = panelHeight - newChatHeightPx;

        // Enforce pixel-based minimum constraints
        if (newInputHeightPx < MIN_INPUT_HEIGHT) {
            // Input area too small, limit it
            newChatHeightPercent = ((panelHeight - MIN_INPUT_HEIGHT) / panelHeight) * 100;
        } else if (newChatHeightPx < MIN_CHAT_HEIGHT) {
            // Chat area too small, limit it
            newChatHeightPercent = (MIN_CHAT_HEIGHT / panelHeight) * 100;
        }

        // Clamp between reasonable bounds (at least 15% and at most 85%)
        newChatHeightPercent = Math.max(15, Math.min(85, newChatHeightPercent));

        // Apply the new height
        chatInterface.style.flex = `0 0 ${newChatHeightPercent}%`;
    });

    document.addEventListener('mouseup', () => {
        if (isResizing) {
            isResizing = false;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';

            // Save the final chat height percentage to localStorage
            const chatStyle = window.getComputedStyle(chatInterface);
            const chatHeightPx = parseFloat(chatStyle.height);
            const panelHeightPx = inputPanel.offsetHeight;
            const finalChatHeightPercent = ((chatHeightPx / panelHeightPx) * 100).toFixed(2);

            localStorage.setItem('chatHeightPercentage', finalChatHeightPercent);
        }
    });
});
