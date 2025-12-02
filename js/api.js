class LLMClient {
    constructor() {
        // Namespaced keys with fallback to defaults
        this.baseUrl = localStorage.getItem('slop_api_url') || localStorage.getItem('api_url') || 'http://localhost:1234/v1';
        this.model = localStorage.getItem('slop_model_name') || localStorage.getItem('model_name') || 'local-model';
        this.apiKey = localStorage.getItem('slop_api_key') || '';

        // Chat-specific config (falls back to primary config if not set)
        this.chatBaseUrl = localStorage.getItem('slop_chat_api_url') || 'http://localhost:1234/v1';
        this.chatModel = localStorage.getItem('slop_chat_model_name') || 'local-model';
        this.chatApiKey = localStorage.getItem('slop_chat_api_key') || '';

        this.history = null;
        this.abortController = null;
    }

    /**
     * Abort any in-progress streaming request
     */
    abort() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    /**
     * Create a new AbortController for a streaming request
     */
    createAbortController() {
        this.abort(); // Cancel any existing request
        this.abortController = new AbortController();
        return this.abortController.signal;
    }

    updateConfig(url, model, apiKey, saveKey) {
        this.baseUrl = url;
        this.model = model;
        this.apiKey = apiKey;

        localStorage.setItem('slop_api_url', url);
        localStorage.setItem('slop_model_name', model);

        if (saveKey) {
            localStorage.setItem('slop_api_key', apiKey);
        } else {
            localStorage.removeItem('slop_api_key');
        }
    }

    updateChatConfig(url, model, apiKey, saveKey) {
        this.chatBaseUrl = url;
        this.chatModel = model;
        this.chatApiKey = apiKey;

        localStorage.setItem('slop_chat_api_url', url);
        localStorage.setItem('slop_chat_model_name', model);

        if (saveKey) {
            localStorage.setItem('slop_chat_api_key', apiKey);
        } else {
            localStorage.removeItem('slop_chat_api_key');
        }
    }

    async getModels() {
        try {
            const headers = {};
            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            const response = await fetch(`${this.baseUrl}/models`, { headers });
            if (!response.ok) throw new Error('Failed to fetch models');
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            throw error;
        }
    }

    async getModelsForEndpoint(baseUrl, apiKey) {
        try {
            const headers = {};
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const response = await fetch(`${baseUrl}/models`, { headers });
            if (!response.ok) throw new Error('Failed to fetch models');
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error('Error fetching models:', error);
            throw error;
        }
    }

    static DEFAULT_PROMPTS = {
        optimize: `# Objective:

## Role:

You are an expert Prompt Engineer and LLM Optimizer. Your task is to take the raw Input Prompt or idea shown below as <ref:original_prompt>, analyze it, and rewrite it to be a highly effective, clear, and robust prompt. The input may either be a structured prompt or a freeform idea from the user, but your output must include a YAML frontmatter and an expertly crafted prompt formatted as listed in our instructions. 

## Input Prompt or Idea:

<original_prompt>
{{originalPrompt}}
</original_prompt>

## Instructions:

1. Analyze the <ref:original_prompt> to understand the user's intent or goal.
2. Craft a professionally engineered prompt based on your understanding from your analysis.
3. If the input has extensive existing frontmatter, retain it in the new frontmatter.
4. Format the output with YAML frontmatter followed by the refined prompt content in markdown.
   Format:
   ---
   name: [Short Name]
   description: [Concise Purpose of prompt]
   argument-hint: [Hint for users using the prompt]
   ---

   # Role:

   [the role to be assumed and the general purpose]

   ## Instructions:

   [Refined Prompt Content]

4. XML tags may be used to surround modular sections of structured prompts and used for reference, i.e., <ref:section_tag>. Any section XML opened must also be closed.
5. Do not include the <original_prompt> wrapper or placeholder text in the output. Your output should only be the YAML frontmatter and the professionally engineered prompt.
6. Do NOT add any other conversational text. Return ONLY the YAML frontmatter and prompt content.`,
        chat: `# Objective

## Role:

You are an expert Prompt Engineer and LLM Optimizer, who is tasked with analyzing, evaluating, and discussing prompts presented to you for discussion with the user. You goal is to help the user improve their prompts based on your expertise and the context provided. 

The following sections provide context for the discussion:
    <ref:original_prompt> - The original prompt or idea given by the user before any optimization
    <ref:current_optimized_result> - The current optimized prompt based on previous iterations
    The history of the chat between the user and the assistant to this point

## Instructions:

1. Evaluate the "<ref:current_optimized_result>", using the "<ref:original_prompt>" as a grounding reference point
2. Digest the chat history to understand the user's needs and desires, and understand that the user's goals may evolve as the chat progresses
3. Leverage your knowledge and experience in the field of prompt engineering to provide expert advice
4. Avoid common prompting pitfalls
5. Recommend 2-3 potential refinements.
6. Chat with the user in an open and friendly manner, explaining your criticisms, recommendations, and the reasoning clearly and concisely.
7. The "<ref:original_prompt>" and "<ref:current_optimized_result>" are provided below for context.
8. Remember that you are advising and not rewriting their prompt.

## Input Prompt or Idea:

<original_prompt>
{{originalPrompt}}
</original_prompt> 

## Current Optimized Result:

<current_optimized_result>
{{optimizedResult}}
</current_optimized_result>

## Chat History:
The chat history between you and the user follows below.`,
        chat_fallback: "You are a helpful AI assistant helping the user to evaluate and plan refinements to their prompt. Be concise and helpful.",
        refine: `# Objective:

## Role:

You are an expert Prompt Engineer. 
Your task is to incrementally REFINE the "Current Optimized Prompt" based on the user's feedback in the "Chat History", using the "Original User Idea" as a grounding reference. The goal is to better align the prompt with the recommendations and the user's evolving needs. The "Original User Idea", the "Chat History", and the "Current Optimized Prompt" are included in the context below.

## Original User Idea:

<original_prompt>
{{originalPrompt}}
</original_prompt>

## Current Optimized Prompt:

"""
{{currentResult}}
"""

## Chat History:

"""
{{chatHistory}}
"""

## Instructions:

1. Analyze the "Chat History" to understand the recommendations and what the "user" wants.
2. Compare the new desires and changes to the existing "Current Optimized Prompt."
3. Craft an updated professionally engineered prompt that incrementally incorporates these new ideas and their intent based on your analysis.
4. Format the output with YAML frontmatter followed by the refined prompt content in markdown.
   Format:
   ---
   name: [Short Name]
   description: [Concise Purpose of prompt]
   argument-hint: [Hint for users using the prompt]
   ---

   # Role:

   [the role to be assumed and the general purpose]

   ## Instructions:

   [Refined Prompt Content]

5. Do NOT add any other conversational text. Return ONLY the YAML frontmatter and prompt content.`,
        refine_no_chat: `# Role:

You are an expert Prompt Engineer. 
Your task is to incrementally REFINE the "Current Optimized Prompt" based on the "Original User Idea" as a grounding reference. The goal is to better align the prompt with the intent of the "Original User Idea". The "Original User Idea" and the "Current Optimized Prompt" are included in the context below.

---

<original_prompt>
{{originalPrompt}}
</original_prompt>

---

{{currentResult}}

---

## Instructions:

1. Analize the differences between the Updated User Idea and the "Current Optimized Prompt."
2. Craft an updated professionally engineered prompt that incrementally incorporates these ideas and their intent based on your analysis.
3. Format the output with YAML frontmatter followed by the refined prompt content in markdown.
   Format:
   ---
   name: [Short Name]
   description: [Concise Purpose of prompt]
   argument-hint: [Hint for users using the prompt]
   ---

    # Role

   [the role to be assumed and the general purpose]

   ## Instructions:

   [Updated Refined Prompt Content]

4. Do NOT add any other conversational text. Return ONLY the YAML frontmatter and prompt content.`

    };

    static batchTemplateReplace(template, replacements, fallback = '') {
        if (template == null) return '';

        // Sort keys by length (longest first) to avoid partial matches
        const keys = Object.keys(replacements).sort((a, b) => b.length - a.length);
        let result = template;

        for (const key of keys) {
            // Escape the key for regex, then build the pattern
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Match: {{ key }} with optional whitespace around the key
            const pattern = new RegExp(`{{\\s*${escapedKey}\\s*}}`, 'g');
            result = result.replace(pattern, () => replacements[key] ?? fallback);
        }

        return result;
    }

    // ==================== LLM API METHODS ====================

    /**
     * Parse SSE stream and yield content chunks
     */
    async *parseSSEStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ')) {
                        const data = trimmed.slice(6);
                        if (data === '[DONE]') return;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) yield content;
                        } catch (e) {
                            // Skip malformed JSON chunks
                            console.warn('Failed to parse SSE chunk:', data);
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    }

    /**
     * Optimize a user prompt using the LLM (streaming)
     * @param {string} userPrompt - The raw user prompt to optimize
     * @yields {string} Content chunks as they arrive
     */
    async *optimizePrompt(userPrompt) {
        const signal = this.createAbortController();
        const template = localStorage.getItem('slop_prompt_optimize') || LLMClient.DEFAULT_PROMPTS.optimize;
        const payload = LLMClient.batchTemplateReplace(template, { originalPrompt: userPrompt || '' });
        const messages = [{ role: "user", content: payload }];

        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                temperature: 0.7,
                stream: true
            }),
            signal
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error: ${response.status} - ${err}`);
        }
        yield* this.parseSSEStream(response);
    }

    /**
     * Chat with the LLM about prompt refinement (streaming)
     * @param {string} userMessage - The user's chat message
     * @param {string|null} originalPrompt - The original user prompt for context
     * @param {string|null} optimizedResult - The current optimized result for context
     * @yields {string} Content chunks as they arrive
     */
    async *chatStream(userMessage, originalPrompt = null, optimizedResult = null) {
        const signal = this.createAbortController();

        if (!this.history) {
            this.history = [];
        }

        // Persist the user's message to the saved history (unchanged)
        this.history.push({ role: "user", content: userMessage });

        // Work on a copy to avoid editing the saved history
        const historyCopy = this.history.map(m => ({ role: m.role, content: m.content }));

        // Prepare the assembled prompt text (we won't send it as a system role)
        let assembledPrompt = null;
        if (originalPrompt && optimizedResult) {
            const systemTemplate = localStorage.getItem('slop_prompt_chat') || LLMClient.DEFAULT_PROMPTS.chat;
            assembledPrompt = LLMClient.batchTemplateReplace(systemTemplate, { originalPrompt, optimizedResult });
        } else {
            assembledPrompt = LLMClient.DEFAULT_PROMPTS.chat_fallback;
        }

        // Find the first user message to attach the assembled prompt into
        let firstUserIdx = historyCopy.findIndex(m => m.role === 'user');
        if (firstUserIdx === -1) {
            // no user message found; create one at the beginning
            historyCopy.unshift({ role: 'user', content: assembledPrompt });
            firstUserIdx = 0;
        } else {
            // prefix the assembled prompt into the first user message
            historyCopy[firstUserIdx].content = assembledPrompt + '\n\n' + historyCopy[firstUserIdx].content;
        }

        // Remove any system role entries from the copy and merge consecutive user messages
        const merged = [];
        for (const msg of historyCopy) {
            if (msg.role === 'system') continue;
            if (merged.length && merged[merged.length - 1].role === 'user' && msg.role === 'user') {
                merged[merged.length - 1].content += '\n\n' + msg.content;
            } else {
                merged.push({ role: msg.role, content: msg.content });
            }
        }

        const messages = merged;

        // Use chat-specific config with fallback to primary config
        const chatUrl = this.chatBaseUrl || this.baseUrl;
        const chatModel = this.chatModel || this.model;
        const chatKey = this.chatApiKey || this.apiKey;

        const headers = { 'Content-Type': 'application/json' };
        if (chatKey) headers['Authorization'] = `Bearer ${chatKey}`;

        const response = await fetch(`${chatUrl}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: chatModel,
                messages: messages,
                temperature: 0.7,
                stream: true
            }),
            signal
        });

        if (!response.ok) throw new Error('Chat API Error');

        let fullResponse = '';
        for await (const chunk of this.parseSSEStream(response)) {
            fullResponse += chunk;
            yield chunk;
        }

        // Save assistant response back to the original history (without the assembled prompt)
        this.history.push({ role: "assistant", content: fullResponse });
    }

    /**
     * Refine a prompt based on chat history (streaming)
     * @param {string} originalPrompt - The original user prompt
     * @param {string} currentResult - The current optimized prompt
     * @param {Array} chatHistory - Array of chat messages for context
     * @yields {string} Content chunks as they arrive
     */
    async *refinePrompt(originalPrompt, currentResult, chatHistory) {
        const signal = this.createAbortController();
        let systemTemplate = localStorage.getItem('slop_prompt_refine') || LLMClient.DEFAULT_PROMPTS.refine;

        const chatHistoryString = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');

        const systemPrompt = LLMClient.batchTemplateReplace(systemTemplate, { originalPrompt, currentResult, chatHistory: chatHistoryString });

        const messages = [{ role: "system", content: systemPrompt }];

        const headers = { 'Content-Type': 'application/json' };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                temperature: 0.7,
                stream: true
            }),
            signal
        });

        if (!response.ok) throw new Error('Refine API Error');

        yield* this.parseSSEStream(response);
    }

    /**
     * Refine a prompt without chat history (streaming)
     * @param {string} originalPrompt - The original user prompt
     * @param {string} currentResult - The current optimized prompt
     * @yields {string} Content chunks as they arrive
     */
    async *noChatRefinePrompt(originalPrompt, currentResult) {
        const signal = this.createAbortController();
        let systemTemplate = localStorage.getItem('slop_prompt_refine_no_chat') || LLMClient.DEFAULT_PROMPTS.refine_no_chat;

        const systemPrompt = LLMClient.batchTemplateReplace(systemTemplate, { originalPrompt, currentResult });

        const messages = [{ role: "user", content: systemPrompt }];

        const headers = { 'Content-Type': 'application/json' };
        if (this.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: this.model,
                messages: messages,
                temperature: 0.7,
                stream: true
            }),
            signal
        });

        if (!response.ok) throw new Error('Refine (No Chat) API Error');

        yield* this.parseSSEStream(response);
    }
}
