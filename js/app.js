// LLMClient is now available globally via api.js

document.addEventListener('DOMContentLoaded', () => {
    const client = new LLMClient();
    
    // UI Elements
    const promptInput = document.getElementById('prompt-input');
    const outputDisplay = document.getElementById('output-display');
    const optimizeBtn = document.getElementById('optimize-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings');
    const apiUrlInput = document.getElementById('api-url');
    const modelNameInput = document.getElementById('model-name');
    const loadingOverlay = document.getElementById('loading-overlay');
    const fetchModelsBtn = document.getElementById('fetch-models-btn');
    const modelSelect = document.getElementById('model-select');

    // Initialize Settings UI
    apiUrlInput.value = client.baseUrl;
    modelNameInput.value = client.model;

    // Event Listeners
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const chatHistoryDiv = document.getElementById('chat-history');
    const refineBtn = document.getElementById('refine-btn');

    // Initialize Settings UI
    apiUrlInput.value = client.baseUrl;
    modelNameInput.value = client.model;

    // Event Listeners
    optimizeBtn.addEventListener('click', async () => {
        const text = promptInput.value.trim();
        if (!text) return;

        // Reset chat history on new optimization
        client.history = null;
        chatHistoryDiv.innerHTML = '<div class="chat-message system"><p>Optimize your prompt first, then chat here to refine it!</p></div>';

        setLoading(true);
        try {
            const result = await client.optimizePrompt(text);
            renderOutput(result);
        } catch (error) {
            renderOutput(`Error: ${error.message}\n\nPlease check your API settings and ensure the local LLM is running.`);
        } finally {
            setLoading(false);
        }
    });

    refineBtn.addEventListener('click', async () => {
        const originalText = promptInput.value.trim();
        const currentOutput = outputDisplay.innerText;
        
        if (!originalText || !currentOutput || !client.history || client.history.length === 0) {
            alert("Please optimize a prompt and have a chat conversation first.");
            return;
        }

        setLoading(true);
        try {
            const result = await client.refinePrompt(originalText, currentOutput, client.history);
            renderOutput(result);
        } catch (error) {
            renderOutput(`Refinement Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    });

    // Chat Logic
    async function handleChat() {
        const message = chatInput.value.trim();
        if (!message) return;

        appendChatMessage('user', message);
        chatInput.value = '';
        
        // Auto-scroll
        chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;

        try {
            // Show typing indicator? For now just wait.
            const response = await client.chat(message);
            appendChatMessage('assistant', response);
            chatHistoryDiv.scrollTop = chatHistoryDiv.scrollHeight;
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

    function appendChatMessage(role, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${role}`;
        // Simple text escape to prevent HTML injection if needed, 
        // but for now innerText is safer for user content.
        // However, we might want markdown for assistant? 
        // Let's stick to text for chat bubbles for simplicity or simple innerHTML if trusted.
        // Using innerText for user, and maybe marked for assistant if we wanted.
        // For now, simple text.
        msgDiv.innerText = text;
        chatHistoryDiv.appendChild(msgDiv);
    }

    clearBtn.addEventListener('click', () => {
        promptInput.value = '';
        promptInput.focus();
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

    // Settings Modal Logic
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
        apiUrlInput.value = client.baseUrl;
        modelNameInput.value = client.model;
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    saveSettingsBtn.addEventListener('click', () => {
        const url = apiUrlInput.value.trim();
        const model = modelNameInput.value.trim();
        
        if (url && model) {
            client.updateConfig(url, model);
            settingsModal.classList.add('hidden');
        }
    });

    // Close modal on outside click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
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
                // For now, let's just populate the text input with the first one 
                // or show a simple dropdown list in console for debugging?
                // Better: Create options for the select and show it.
                
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

    // Helpers
    function setLoading(isLoading) {
        if (isLoading) {
            loadingOverlay.classList.remove('hidden');
            optimizeBtn.disabled = true;
        } else {
            loadingOverlay.classList.add('hidden');
            optimizeBtn.disabled = false;
        }
    }

    function renderOutput(markdown) {
        // Use marked to parse markdown
        outputDisplay.innerHTML = marked.parse(markdown);
    }
});
