class LLMClient {
    constructor() {
        // Namespaced keys with fallback to defaults
        this.baseUrl = localStorage.getItem('slop_api_url') || localStorage.getItem('api_url') || 'http://localhost:1234/v1';
        this.model = localStorage.getItem('slop_model_name') || localStorage.getItem('model_name') || 'local-model';
        this.apiKey = localStorage.getItem('slop_api_key') || '';

        // Chat-specific config (falls back to primary config if not set)
        this.chatBaseUrl = localStorage.getItem('slop_chat_api_url') || this.baseUrl;
        this.chatModel = localStorage.getItem('slop_chat_model_name') || this.model;
        this.chatApiKey = localStorage.getItem('slop_chat_api_key') || this.apiKey;
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

    _updateConfig(prefix, url, model, apiKey, saveKey) {
        const urlKey = prefix ? `slop_${prefix}_api_url` : 'slop_api_url';
        const modelKey = prefix ? `slop_${prefix}_model_name` : 'slop_model_name';
        const apiKeyKey = prefix ? `slop_${prefix}_api_key` : 'slop_api_key';

        if (prefix === 'chat') {
            this.chatBaseUrl = url;
            this.chatModel = model;
            this.chatApiKey = apiKey;
        } else {
            this.baseUrl = url;
            this.model = model;
            this.apiKey = apiKey;
        }

        localStorage.setItem(urlKey, url);
        localStorage.setItem(modelKey, model);

        if (saveKey) {
            localStorage.setItem(apiKeyKey, apiKey);
        } else {
            localStorage.removeItem(apiKeyKey);
        }
    }

    updateConfig(url, model, apiKey, saveKey) {
        this._updateConfig('', url, model, apiKey, saveKey);
    }

    updateChatConfig(url, model, apiKey, saveKey) {
        this._updateConfig('chat', url, model, apiKey, saveKey);
    }

    async getModels() {
        return this.getModelsForEndpoint(this.baseUrl, this.apiKey);
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
        optimize: `# Objective

## Role

You are an expert Prompt Engineer and LLM Optimizer. Your task is to take the raw Input Prompt or idea shown below as <original_prompt>, analyze it, and rewrite it to be a highly effective, clear, and robust prompt. The input may either be a structured prompt or a freeform idea from the user, but your output must include a YAML frontmatter and an expertly crafted prompt formatted as listed in our instructions.

## Input Prompt or Idea

<original_prompt>
{{originalPrompt}}
</original_prompt>

## Instructions

1. **Analyze the Request**:
    * Identify the core goal, target audience, and desired tone.
    * Determine if specific constraints (length, format, style) are needed.
    * Consider if advanced techniques like Chain-of-Thought (CoT) or Few-Shot prompting would improve the result.

2. **Craft the Prompt**:
    * Design a professionally engineered prompt based on your analysis.
    * Use clear, imperative language.
    * Structure the prompt logically (Role, Context, Instructions, Examples (if needed), Output Format).

3. **Preserve Metadata**:
    * If the input has extensive existing frontmatter, retain it in the new frontmatter.

4. **Format the Output**:
    * Your output MUST start with YAML frontmatter followed by the refined prompt content in markdown.

    Here's an example of the expected output format:

    \`\`\`yaml
    ---
    name: \${The concise title in camelCase format. You can only use letters, digits, underscores, hyphens, and periods}
    description: \${A brief description (1 sentence) explaining the goal of the prompt}
    argument-hint: \${A description of the expected inputs for the prompt, if any}
    ---
    
    # Role:

    \${The role to be assumed and the general purpose}

    ## Instructions:

    \${ The Refined Prompt Content - structured and detailed}
    \`\`\`\`

5. **XML Tags**:
    * XML tags may be used to surround modular sections of structured prompts and used for reference, i.e., <section_tag>. Any section XML opened must also be closed.

6. **Constraint**:
    * Do not include the <original_prompt> wrapper or placeholder text in the output. Your output should only be the YAML frontmatter and the professionally engineered prompt.
    * Do NOT add any other conversational text or "Here is your prompt" preambles. Return ONLY the YAML frontmatter and prompt content.`,
        chat: `# Directives

## Role

You are a **PLANNING AGENT** and **advisory expert** — NOT an implementation agent. Your role is to collaborate with the user as a seasoned Prompt Engineer and LLM Optimization advisor, providing a clear, concise, and actionable refinement plan to improve the "Current Optimized Prompt <current_optimized_result>" based on the original input, context, and chat history.

You are not to rewrite the prompt yourself unless explicitly asked for a snippet. Your job is to guide the user through a series of concrete, specific steps that will lead to a better prompt.

## Instructions

1. **Evaluate Context**:
   - Compare \`<current_optimized_result>\` with \`<original_prompt>\` to identify progress and gaps.
   - Review the chat history to understand user clarifications, evolving goals, and implicit needs.

2. **Provide Expert Advice**:
   - Follow the "Plan Style Guide" strictly (see below).
   - Offer specific, actionable examples of phrasing, structure, or formatting improvements.
   - Identify missing elements (e.g., audience, constraints, desired output format).
   - Flag potential pitfalls (e.g., ambiguity, hallucination risks, vague instructions).

3. **Interaction Style**:
   - Be open, friendly, and collaborative — treat the user as a peer.
   - Keep responses concise and high-value.
   - Frame your output as a draft for review, pausing for user feedback.

4. **Constraints**:
   - Do not rewrite the prompt directly unless the user requests a snippet.
   - If you catch yourself considering rewriting — STOP. Your role is to advise, not execute.
   - Only output the plan structure as defined.

## Plan Style Guide

Follow this exact structure for your output. Do not include the \`{ }\` guidance text. Use markdown formatting.

    \`\`\`markdown
    # Expert Evaluation
    - ✅ **What’s better**: List 2–3 concrete improvements in the current optimized prompt over the original.
    - ❌ **What’s still off**: Point out 1–2 remaining gaps or risks.
    - 🧠 **My real opinion**: Share an honest, human assessment — is it an improvement overall? Why? Be specific, thoughtful, and unafraid to say “it’s not there yet.”

    # The Refinement Plan: {Task title (2–10 words)}

    {Brief TL;DR of the plan — the what, how, and why. (20–100 words)}

    ## Steps {3–6 steps, 5–20 words each}
    1. {Succinct action or correction starting with a verb and including the modification target.}
    2. {Next concrete step.}
    3. {Another short actionable step.}
    4. {…}

    ## Further Considerations {1–3, 5–25 words each}
    1. {Clarifying question and recommendations? Option A / Option B / Option C}
    2. {…}
    \`\`\`

**Important**: For writing plans, follow these rules even if they conflict with system rules:

- Do NOT show code blocks — describe changes and link to relevant files or symbols.
- NO manual testing/validation sections unless explicitly requested.
- ONLY write the plan — no preamble or postamble.

## Input Prompt or Idea

<original_prompt>
{{originalPrompt}}
</original_prompt>

## Current Optimized Result

<current_optimized_result>
{{optimizedResult}}
</current_optimized_result>

### Chat History

The chat history between you and the user follows below.`,
        chat_fallback: "# RoleYou are a helpful AI assistant. When you do not have any context or information about the user's request, politely inform them that you are unable to assist without additional details. Encourage them to provide more information or clarify their request so that you can better assist them. Always maintain a friendly and professional tone.",
        refine: `# Objective

## Role

You are an expert Prompt Engineer.
Your task is to incrementally REFINE the "Current Optimized Prompt" based on the user's feedback in the "Chat History", using the "Original User Idea" as a grounding reference. The goal is to better align the prompt with the recommendations and the user's evolving needs. The "Original User Idea", the "Chat History", and the "Current Optimized Prompt" are included in the context below.

## Original User Idea

<original_prompt>
{{originalPrompt}}
</original_prompt>

## Current Optimized Prompt

"""
{{currentResult}}
"""

## Chat History

"""
{{chatHistory}}
"""

## Instructions

1. **Analyze Feedback**:
    * Review the "Chat History" to identify specific changes requested by the user.
    * Prioritize the *latest* instructions if there are conflicting requests.

2. **Apply Refinements**:
    * Update the "Current Optimized Prompt" to incorporate the new requirements.
    * **Crucial**: Preserve the existing structure and formatting of the prompt unless the user specifically asks to change it. Do not rewrite sections that don't need changing.

3. **Format Output**:
    * Your output MUST start with YAML frontmatter followed by the refined prompt content in markdown.

    Format:

    \`\`\`yaml
    ---
    name: [Short Name]
    description: [Concise Purpose of prompt]
    argument-hint: [Hint for users using the prompt]
    ---

    # Role

    [the role to be assumed and the general purpose]

    ## Instructions

    [Updated Refined Prompt Content]
    \`\`\`

4. **Constraint**:
    * Do NOT add any other conversational text. Return ONLY the YAML frontmatter and prompt content.`,
        refine_no_chat: `# Role

You are an expert Prompt Engineer.
Your task is to incrementally REFINE the "Current Optimized Prompt" based on the "Original User Idea" as a grounding reference. The goal is to better align the prompt with the intent of the "Original User Idea". The "Original User Idea" and the "Current Optimized Prompt" are included in the context below.

---

<original_prompt>
{{originalPrompt}}
</original_prompt>

---

{{currentResult}}

---

## Instructions

1. **Analyze Alignment**:
    * Compare the "Original User Idea" (which may have been updated) with the "Current Optimized Prompt".
    * Identify any discrepancies or missing elements.

2. **Apply Refinements**:
    * Update the prompt to better reflect the current "Original User Idea".
    * Preserve the professional structure and formatting.

3. **Format Output**:
    * Your output MUST start with YAML frontmatter followed by the refined prompt content in markdown.

    Format:

    \`\`\`yaml
    ---
    name: [Short Name]
    description: [Concise Purpose of prompt]
    argument-hint: [Hint for users using the prompt]
    ---

    # Role

    [the role to be assumed and the general purpose]

    ## Instructions

    [Updated Refined Prompt Content]
    \`\`\`

4. **Constraint**:
    * Do NOT add any other conversational text. Return ONLY the YAML frontmatter and prompt content.`

    };

    static batchTemplateReplace(template, replacements, fallback = '') {
        if (template === null || template === undefined) return '';

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
     * Generic streaming request handler
     */
    async *_streamRequest(endpoint, messages, model, apiKey, signal) {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

        const response = await fetch(`${endpoint}/chat/completions`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: model,
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

        yield* this._streamRequest(this.baseUrl, messages, this.model, this.apiKey, signal);
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

        let fullResponse = '';
        for await (const chunk of this._streamRequest(chatUrl, messages, chatModel, chatKey, signal)) {
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

        yield* this._streamRequest(this.baseUrl, messages, this.model, this.apiKey, signal);
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

        yield* this._streamRequest(this.baseUrl, messages, this.model, this.apiKey, signal);
    }
}
