class LLMClient {
    constructor() {
        this.baseUrl = localStorage.getItem('api_url') || 'http://localhost:1234/v1';
        this.model = localStorage.getItem('model_name') || 'local-model';
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
}
