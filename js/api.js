class LLMClient {
    constructor() {
        this.baseUrl = localStorage.getItem('api_url') || 'http://localhost:1234/v1';
        this.model = localStorage.getItem('model_name') || 'local-model';
        this.history = null;
    }

    updateConfig(url, model) {
        this.baseUrl = url;
        this.model = model;
        localStorage.setItem('api_url', url);
        localStorage.setItem('model_name', model);
    }

    async getModels() {
        try {
            const response = await fetch(`${this.baseUrl}/models`);
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
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

    async chat(userMessage) {
        if (!this.history) {
            this.history = [
                { role: "system", content: "You are a helpful AI assistant helping the user refine their prompt. Be concise and helpful." }
            ];
        }

        this.history.push({ role: "user", content: userMessage });

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    messages: this.history,
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
4. Ensure the "#prompt" tag is present.
5. Return ONLY the code block followed by the Tips section.
`;

        const messages = [{ role: "system", content: systemPrompt }];

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
