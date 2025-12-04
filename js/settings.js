/**
 * Settings Manager - Handles settings modal, prompt settings, and word wrap
 */

// Constants
const STORAGE_KEYS = {
    WORD_WRAP: 'slop_word_wrap',
    CHAT_HEIGHT: 'chatHeightPercentage',
    API_KEY: 'slop_api_key',
    CHAT_API_KEY: 'slop_chat_api_key',
    PROMPT_OPTIMIZE: 'slop_prompt_optimize',
    PROMPT_CHAT: 'slop_prompt_chat',
    PROMPT_REFINE: 'slop_prompt_refine',
    PROMPT_REFINE_NO_CHAT: 'slop_prompt_refine_no_chat'
};

/**
 * Initialize settings functionality
 * @param {LLMClient} client - The LLM client instance
 */
function initSettings(client) {
    // Settings Modal Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings');

    // API Settings Elements
    const apiUrlInput = document.getElementById('api-url');
    const modelNameInput = document.getElementById('model-name');
    const modelSelect = document.getElementById('model-select');
    const apiKeyInput = document.getElementById('api-key');
    const saveKeyCheckbox = document.getElementById('save-key');
    const keySavedBadge = document.getElementById('key-saved-badge');
    const fetchModelsBtn = document.getElementById('fetch-models-btn');

    // Chat API Settings Elements
    const chatApiUrlInput = document.getElementById('chat-api-url');
    const chatApiKeyInput = document.getElementById('chat-api-key');
    const chatModelNameInput = document.getElementById('chat-model-name');
    const chatModelSelect = document.getElementById('chat-model-select');
    const chatSaveKeyCheckbox = document.getElementById('chat-save-key');
    const chatKeySavedBadge = document.getElementById('chat-key-saved-badge');
    const chatFetchModelsBtn = document.getElementById('chat-fetch-models-btn');

    // Word Wrap
    const wordWrapCheckbox = document.getElementById('word-wrap');
    const outputDisplay = document.getElementById('output-display');
    const promptInput = document.getElementById('prompt-input');

    // Prompt Settings Elements
    const promptSettingsModal = document.getElementById('prompt-settings-modal');
    const closePromptSettingsBtn = document.getElementById('close-prompt-settings');

    const editOptimizePromptBtn = document.getElementById('edit-optimize-prompt-btn');
    const editRefinePromptBtn = document.getElementById('edit-refine-prompt-btn');
    const editRefineNoChatPromptBtn = document.getElementById('edit-refine-no-chat-prompt-btn');
    const editChatPromptBtn = document.getElementById('edit-chat-prompt-btn');

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

    // Track if model select listeners have been added (prevent duplicates)
    let modelSelectListenerAdded = false;
    let chatModelSelectListenerAdded = false;

    /**
     * Setup model fetcher button behavior
     */
    function setupModelFetcher(btn, urlInput, keyInput, select, nameInput, isChat = false) {
        btn.addEventListener('click', async () => {
            const originalIcon = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const url = urlInput.value.trim();
                const key = keyInput.value.trim();

                if (!url) {
                    alert('Please enter an API URL first.');
                    return;
                }

                let models = [];
                if (isChat) {
                    models = await client.getModelsForEndpoint(url, key);
                } else {
                    // Use temp client for main API to avoid changing global state before save
                    const tempClient = new LLMClient();
                    tempClient.baseUrl = url;
                    tempClient.apiKey = key; // Ensure key is used if provided
                    models = await tempClient.getModels();
                }

                if (models && models.length > 0) {
                    select.innerHTML = '';
                    models.forEach(m => {
                        const option = document.createElement('option');
                        option.value = m.id;
                        option.textContent = m.id;
                        select.appendChild(option);
                    });

                    select.classList.remove('hidden');
                    nameInput.classList.add('hidden');

                    // Add listener only once per select element
                    const listenerFlag = isChat ? chatModelSelectListenerAdded : modelSelectListenerAdded;
                    if (!listenerFlag) {
                        select.addEventListener('change', () => {
                            nameInput.value = select.value;
                        });
                        if (isChat) chatModelSelectListenerAdded = true;
                        else modelSelectListenerAdded = true;
                    }

                    select.value = models[0].id;
                    nameInput.value = models[0].id;
                } else {
                    alert('No models found or empty list returned.');
                }
            } catch (error) {
                alert('Failed to fetch models. Check URL.');
                console.error(error);
            } finally {
                btn.innerHTML = originalIcon;
            }
        });
    }

    // Setup fetchers
    setupModelFetcher(fetchModelsBtn, apiUrlInput, apiKeyInput, modelSelect, modelNameInput, false);
    setupModelFetcher(chatFetchModelsBtn, chatApiUrlInput, chatApiKeyInput, chatModelSelect, chatModelNameInput, true);

    // --- Word Wrap ---

    function applyWordWrap(enabled) {
        if (enabled) {
            outputDisplay.classList.remove('no-wrap');
            promptInput.classList.remove('no-wrap');
        } else {
            outputDisplay.classList.add('no-wrap');
            promptInput.classList.add('no-wrap');
        }
    }

    // Apply saved word wrap on load
    const savedWordWrap = localStorage.getItem(STORAGE_KEYS.WORD_WRAP) === 'true';
    applyWordWrap(savedWordWrap);

    // --- Settings Modal ---

    settingsBtn.addEventListener('click', () => {
        // Populate Optimize/Refine API settings
        apiUrlInput.value = client.baseUrl;
        modelNameInput.value = client.model;
        apiKeyInput.value = client.apiKey;

        const isSaved = !!localStorage.getItem(STORAGE_KEYS.API_KEY);
        saveKeyCheckbox.checked = isSaved;
        keySavedBadge.classList.toggle('hidden', !isSaved);

        // Populate Chat API settings
        chatApiUrlInput.value = client.chatBaseUrl;
        chatModelNameInput.value = client.chatModel;
        chatApiKeyInput.value = client.chatApiKey;

        const isChatKeySaved = !!localStorage.getItem(STORAGE_KEYS.CHAT_API_KEY);
        chatSaveKeyCheckbox.checked = isChatKeySaved;
        chatKeySavedBadge.classList.toggle('hidden', !isChatKeySaved);

        // Load word wrap setting
        wordWrapCheckbox.checked = localStorage.getItem(STORAGE_KEYS.WORD_WRAP) === 'true';

        showModal(settingsModal);
    });

    // Setup modal close behaviors
    setupModal(settingsModal, closeSettingsBtn);

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
            localStorage.setItem(STORAGE_KEYS.WORD_WRAP, wordWrap);
            applyWordWrap(wordWrap);

            hideModal(settingsModal);
        }
    });

    // --- Fetch Models ---
    // (Logic moved to setupModelFetcher above)

    // --- Prompt Settings ---

    function openPromptSettings(sectionId) {
        // Load current prompts
        optimizePromptInput.value = localStorage.getItem(STORAGE_KEYS.PROMPT_OPTIMIZE) || LLMClient.DEFAULT_PROMPTS.optimize;
        chatPromptInput.value = localStorage.getItem(STORAGE_KEYS.PROMPT_CHAT) || LLMClient.DEFAULT_PROMPTS.chat;
        refinePromptInput.value = localStorage.getItem(STORAGE_KEYS.PROMPT_REFINE) || LLMClient.DEFAULT_PROMPTS.refine;
        refineNoChatPromptInput.value = localStorage.getItem(STORAGE_KEYS.PROMPT_REFINE_NO_CHAT) || LLMClient.DEFAULT_PROMPTS.refine_no_chat;

        // Hide all sections
        sectionOptimize.classList.add('hidden');
        sectionRefine.classList.add('hidden');
        sectionRefineNoChat.classList.add('hidden');
        sectionChat.classList.add('hidden');

        // Show requested section
        document.getElementById(sectionId).classList.remove('hidden');

        hideModal(settingsModal);
        showModal(promptSettingsModal);
    }

    editOptimizePromptBtn.addEventListener('click', () => openPromptSettings('section-optimize'));
    editRefinePromptBtn.addEventListener('click', () => openPromptSettings('section-refine'));
    editRefineNoChatPromptBtn.addEventListener('click', () => openPromptSettings('section-refine-no-chat'));
    editChatPromptBtn.addEventListener('click', () => openPromptSettings('section-chat'));

    // Setup prompt settings modal to return to main settings on close
    setupModal(promptSettingsModal, closePromptSettingsBtn, () => {
        showModal(settingsModal);
    });

    // --- Prompt Save/Reset Actions ---

    // Helper to create save/reset handlers
    function setupPromptActions(saveBtn, resetBtn, textarea, storageKey, defaultKey) {
        saveBtn.addEventListener('click', () => {
            const val = textarea.value.trim();
            if (val) {
                localStorage.setItem(storageKey, val);
                alert('Prompt saved!');
            }
        });

        resetBtn.addEventListener('click', () => {
            if (confirm('Reset this prompt to default?')) {
                const defaultVal = LLMClient.DEFAULT_PROMPTS[defaultKey];
                textarea.value = defaultVal;
                localStorage.setItem(storageKey, defaultVal);
            }
        });
    }

    setupPromptActions(saveOptimizePromptBtn, resetOptimizePromptBtn, optimizePromptInput, STORAGE_KEYS.PROMPT_OPTIMIZE, 'optimize');
    setupPromptActions(saveChatPromptBtn, resetChatPromptBtn, chatPromptInput, STORAGE_KEYS.PROMPT_CHAT, 'chat');
    setupPromptActions(saveRefinePromptBtn, resetRefinePromptBtn, refinePromptInput, STORAGE_KEYS.PROMPT_REFINE, 'refine');
    setupPromptActions(saveRefineNoChatPromptBtn, resetRefineNoChatPromptBtn, refineNoChatPromptInput, STORAGE_KEYS.PROMPT_REFINE_NO_CHAT, 'refine_no_chat');
}
