class LLMClient {
    constructor() {
        // Namespaced keys with fallback to old keys
        this.baseUrl = localStorage.getItem('slop_api_url') || localStorage.getItem('api_url') || 'http://localhost:1234/v1';
        this.model = localStorage.getItem('slop_model_name') || localStorage.getItem('model_name') || 'local-model';
        this.apiKey = localStorage.getItem('slop_api_key') || '';
        this.history = null;

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

    async optimizePrompt(userPrompt) {
        const systemPrompt = `You are an expert Prompt Engineer and LLM Optimizer. 
Your task is to take a raw prompt input, analyze it, and rewrite it to be highly effective, clear, and robust.
The input will be freeform writing, but your output must be in markdown and YAML format.

Instructions:
1. Analyze the user's freeform request to understand their goal.
2. Construct a professional prompt based on their request.
3. Format the output as a Markdown code block containing the YAML frontmatter and the refined prompt.
   Format:
   \`\`\`markdown
   ---
   name: [Short Name]
   description: [Concise Purpose of prompt]
   argument-hint: [Hint for users using the prompt]
   tags:
     - "#prompt"
     - [Optional other tags]
   ---
   "[Refined Prompt Content]"
   \`\`\`
4. Always include the "#prompt" tag in the tags list. Tags must be in the format "#tag".
5. AFTER the code block, add a section titled "## Tips & Questions" containing:
    - 2-3 specific questions to clarify the user's intent.
    - 1-2 tips to make the prompt even better (e.g. "Try adding examples...").
6. Do NOT add any other conversational text. Return ONLY the code block followed by the tips section.
`;

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
            const systemMessage = {
                role: "system",
                content: `You are a helpful AI assistant helping the user to evaluate and plan refinements to their prompt.

Original User Intent:
"""
${originalPrompt}
"""

Current Optimized Result:
"""
${optimizedResult}
"""

The user is chatting with you to evaluate the Current Optimized Result and plan potential refinements. Use the Original User Intent as a reference point, understanding that goals may evolve as the work progresses. Remember that you are only planning, not making any changes to the prompt.`
            };
            messages.push(systemMessage);
        } else {
            // Fallback system message if no context
            messages.push({
                role: "system",
                content: "You are a helpful AI assistant helping the user to evaluate and plan refinements to their prompt. Be concise and helpful."
            });
        }
        
        // Add chat history
        messages.push(...this.history);

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
        const systemPrompt = `You are an expert Prompt Engineer. 
Your task is to incrementally REFINE the Current Optimized Prompt based on the user's feedback in the chat history.

Original User Idea:
"${originalPrompt}"

Current Optimized Prompt:
${currentResult}

User Feedback (Chat History):
${chatHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

Instructions:
1. Analyze the chat history to understand what changes the user wants.
2. Apply these changes to the "Current Optimized Prompt".
3. Maintain the same YAML + Markdown format.
 Format:
   \`\`\`markdown
   ---
   name: [Short Name]
   description: [Concise Purpose of prompt]
   argument-hint: [Hint for users using the prompt]
   tags:
     - "#prompt"
     - [Optional other tags]
   ---
   "[Refined Prompt Content]"
   \`\`\`
4. Ensure the "#prompt" tag is present.
5. Return ONLY the code block followed by the Tips section.
`;

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
}
