class LLMClient {
    constructor() {
        // Namespaced keys with fallback to old keys
        this.baseUrl = localStorage.getItem('slop_api_url') || localStorage.getItem('api_url') || 'http://localhost:1234/v1';
        this.model = localStorage.getItem('slop_model_name') || localStorage.getItem('model_name') || 'local-model';
        this.apiKey = localStorage.getItem('slop_api_key') || '';

        // Chat-specific config (falls back to primary config if not set)
        this.chatBaseUrl = localStorage.getItem('slop_chat_api_url') || '';
        this.chatModel = localStorage.getItem('slop_chat_model_name') || '';
        this.chatApiKey = localStorage.getItem('slop_chat_api_key') || '';

        this.history = null;
        this.abortController = null;

        // Migration: If old keys exist and new ones don't, migrate them
        if (!localStorage.getItem('slop_api_url') && localStorage.getItem('api_url')) {
            localStorage.setItem('slop_api_url', localStorage.getItem('api_url'));
            localStorage.removeItem('api_url');
        }
        if (!localStorage.getItem('slop_model_name') && localStorage.getItem('model_name')) {
            localStorage.setItem('slop_model_name', localStorage.getItem('model_name'));
            localStorage.removeItem('model_name');
        }
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

You are an expert Prompt Engineer and LLM Optimizer. 
Your task is to take a raw prompt input, analyze it, and rewrite it to be highly effective, clear, and robust.
The input will be freeform writing, but your output must be in markdown and YAML format.

## Instructions:

1. Analyze the user's freeform request to understand their goal.
2. Construct a professional prompt based on their request.
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

   [Refined Prompt Content]

4. Do NOT add any other conversational text. Return ONLY the YAML frontmatter and prompt content.
`,
        chat: `# Objective

You are a professional prompt engineer with experience in all types of LLM prompting, who is tasked with evaluating an discussing the users prompts and helping to improve them. 

## Original User Intent:

"""
{{originalPrompt}}
"""

## Current Optimized Result:

"""
{{optimizedResult}}
"""

## Instructions:

1. Use the Original User Intent as a grounding reference point
2. Understand that the user's goals may evolve as the chat progresses
3. Leverage your knowledge and experience
4. Evaluate the Current Optimized Result
5. Avoid common prompting pitfalls
6. Recommend 2-3 potential refinements.
7. Remember that you are advising and not just rewriting their prompt.
8. Chat with the user in an open and friendly manner, explaining your criticisms, recommendations, and the reasoning for each, clearly and concisely.
`,
        chat_fallback: "You are a helpful AI assistant helping the user to evaluate and plan refinements to their prompt. Be concise and helpful.",
        refine: `# Objective:

You are an expert Prompt Engineer. 
Your task is to incrementally REFINE the Current Optimized Prompt based on the user's feedback in the chat history.

## Original User Idea:

"{{originalPrompt}}"

## Current Optimized Prompt:

{{currentResult}}

## User Feedback (Chat History):

{{chatHistory}}

## Instructions:

1. Analyze the chat history to understand what changes the user wants.
2. Compare the new desires and changes to the existing "Current Optimized Prompt"
3. Construct an updated professional prompt, incorporating the new changes to incrementally incorporate these new ideas.
4. Format the output with YAML frontmatter followed by the refined prompt content in markdown.
   Format:
   ---
   name: [Short Name]
   description: [Concise Purpose of prompt]
   argument-hint: [Hint for users using the prompt]
   ---

    # Role

   [the role to be assumed and the general purpose]

   ## Instructions:

   [Refined Prompt Content]

5. Do NOT add any other conversational text. Return ONLY the YAML frontmatter and prompt content.
`,
        refine_no_chat: `# Objective:

You are an expert Prompt Engineer. 
Your task is to REFINE the Current Optimized Prompt based on the Updated User Idea.

## Updated User Idea:

"{{originalPrompt}}"

## Current Optimized Prompt:

{{currentResult}}

## Instructions:

1. Analize the differences between the Updated User Idea and the "Current Optimized Prompt."
2. Craft an updated professionally engineered prompt that incrementally incorporates the ideas and intent this analysis.
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

4. Do NOT add any other conversational text. Return ONLY the YAML frontmatter and prompt content.
`
    };

    async optimizePrompt(userPrompt) {
        const systemPrompt = localStorage.getItem('slop_prompt_optimize') || LLMClient.DEFAULT_PROMPTS.optimize;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        try {
            const headers = {
                'Content-Type': 'application/json',
            };
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
                    stream: false
                })
            });

            if (!response.ok) {
                const err = await response.text();
                throw new Error(`API Error: ${response.status} - ${err}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('Optimization failed:', error);
            throw error;
        }
    }

    async chat(userMessage, originalPrompt = null, optimizedResult = null) {
        if (!this.history) {
            this.history = [];
        }

        this.history.push({ role: "user", content: userMessage });

        // Build messages array for API call
        const messages = [];

        // Add system message with context if prompts are provided
        if (originalPrompt && optimizedResult) {
            let systemTemplate = localStorage.getItem('slop_prompt_chat') || LLMClient.DEFAULT_PROMPTS.chat;
            const systemContent = systemTemplate
                .replace('{{originalPrompt}}', originalPrompt)
                .replace('{{optimizedResult}}', optimizedResult);

            const systemMessage = {
                role: "system",
                content: systemContent
            };
            messages.push(systemMessage);
        } else {
            // Fallback system message if no context
            messages.push({
                role: "system",
                content: LLMClient.DEFAULT_PROMPTS.chat_fallback
            });
        }

        // Add chat history
        messages.push(...this.history);

        // Use chat-specific config with fallback to primary config
        const chatUrl = this.chatBaseUrl || this.baseUrl;
        const chatModel = this.chatModel || this.model;
        const chatKey = this.chatApiKey || this.apiKey;

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (chatKey) {
                headers['Authorization'] = `Bearer ${chatKey}`;
            }

            const response = await fetch(`${chatUrl}/chat/completions`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: chatModel,
                    messages: messages,
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error('Chat API Error');
            const data = await response.json();
            const assistantMessage = data.choices[0].message.content;

            this.history.push({ role: "assistant", content: assistantMessage });
            return assistantMessage;
        } catch (error) {
            console.error('Chat failed:', error);
            throw error;
        }
    }

    async refinePrompt(originalPrompt, currentResult, chatHistory) {
        let systemTemplate = localStorage.getItem('slop_prompt_refine') || LLMClient.DEFAULT_PROMPTS.refine;

        const chatHistoryString = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');

        const systemPrompt = systemTemplate
            .replace('{{originalPrompt}}', originalPrompt)
            .replace('{{currentResult}}', currentResult)
            .replace('{{chatHistory}}', chatHistoryString);

        const messages = [{ role: "system", content: systemPrompt }];

        try {
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
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error('Refine API Error');
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Refine failed:', error);
            throw error;
        }
    }

    async noChatRefinePrompt(originalPrompt, currentResult) {
        let systemTemplate = localStorage.getItem('slop_prompt_refine_no_chat') || LLMClient.DEFAULT_PROMPTS.refine_no_chat;

        const systemPrompt = systemTemplate
            .replace('{{originalPrompt}}', originalPrompt)
            .replace('{{currentResult}}', currentResult);

        const messages = [{ role: "system", content: systemPrompt }];

        try {
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
                    temperature: 0.7
                })
            });

            if (!response.ok) throw new Error('Refine (No Chat) API Error');
            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error('Refine (No Chat) failed:', error);
            throw error;
        }
    }

    // ==================== STREAMING METHODS ====================

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
     * Streaming version of optimizePrompt
     * @yields {string} Content chunks as they arrive
     */
    async *optimizePromptStream(userPrompt) {
        const signal = this.createAbortController();
        const systemPrompt = localStorage.getItem('slop_prompt_optimize') || LLMClient.DEFAULT_PROMPTS.optimize;

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ];

        const headers = {
            'Content-Type': 'application/json',
        };
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

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`API Error: ${response.status} - ${err}`);
        }

        yield* this.parseSSEStream(response);
    }

    /**
     * Streaming version of chat
     * @yields {string} Content chunks as they arrive
     */
    async *chatStream(userMessage, originalPrompt = null, optimizedResult = null) {
        const signal = this.createAbortController();

        if (!this.history) {
            this.history = [];
        }

        this.history.push({ role: "user", content: userMessage });

        // Build messages array for API call
        const messages = [];

        // Add system message with context if prompts are provided
        if (originalPrompt && optimizedResult) {
            let systemTemplate = localStorage.getItem('slop_prompt_chat') || LLMClient.DEFAULT_PROMPTS.chat;
            const systemContent = systemTemplate
                .replace('{{originalPrompt}}', originalPrompt)
                .replace('{{optimizedResult}}', optimizedResult);

            messages.push({
                role: "system",
                content: systemContent
            });
        } else {
            messages.push({
                role: "system",
                content: LLMClient.DEFAULT_PROMPTS.chat_fallback
            });
        }

        // Add chat history
        messages.push(...this.history);

        // Use chat-specific config with fallback to primary config
        const chatUrl = this.chatBaseUrl || this.baseUrl;
        const chatModel = this.chatModel || this.model;
        const chatKey = this.chatApiKey || this.apiKey;

        const headers = { 'Content-Type': 'application/json' };
        if (chatKey) {
            headers['Authorization'] = `Bearer ${chatKey}`;
        }

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

        // Add complete response to history
        this.history.push({ role: "assistant", content: fullResponse });
    }

    /**
     * Streaming version of refinePrompt
     * @yields {string} Content chunks as they arrive
     */
    async *refinePromptStream(originalPrompt, currentResult, chatHistory) {
        const signal = this.createAbortController();
        let systemTemplate = localStorage.getItem('slop_prompt_refine') || LLMClient.DEFAULT_PROMPTS.refine;

        const chatHistoryString = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n');

        const systemPrompt = systemTemplate
            .replace('{{originalPrompt}}', originalPrompt)
            .replace('{{currentResult}}', currentResult)
            .replace('{{chatHistory}}', chatHistoryString);

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
     * Streaming version of noChatRefinePrompt
     * @yields {string} Content chunks as they arrive
     */
    async *noChatRefinePromptStream(originalPrompt, currentResult) {
        const signal = this.createAbortController();
        let systemTemplate = localStorage.getItem('slop_prompt_refine_no_chat') || LLMClient.DEFAULT_PROMPTS.refine_no_chat;

        const systemPrompt = systemTemplate
            .replace('{{originalPrompt}}', originalPrompt)
            .replace('{{currentResult}}', currentResult);

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
