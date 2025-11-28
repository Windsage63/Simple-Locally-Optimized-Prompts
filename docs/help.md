# User Guide: Simple Locally Optimized Prompts

Welcome to **Simple Locally Optimized Prompts (SLOP) 🧲**! This tool helps you craft professional, high-quality prompts for AI models using your own local LLM or any OpenAI-compatible API.

## 🚀 Getting Started

1.  **Configure Settings**:
    *   Click the **Settings** icon ⚙️ in the top right.
    *   Enter your **API Endpoint** (e.g., `http://localhost:1234/v1` for LM Studio).
    *   Enter your **Model Name** or click the refresh icon to fetch available models.
    *   Click **Save**.

2.  **Create Your First Prompt**:
    *   In the **Input Idea** box, either paste your existing prompt or type a rough description of what you want.
        *   *Example: "I want a python script to scrape a website."*
    *   Click **Optimize** ✨.
    *   The AI will generate a structured, professional prompt in the **Optimized Result** panel.
    * Note that all prompts are created with a frontmatter section that contains metadata about the prompt. This is useful for storing or categorizing and storing prompts systems like VS Code or Obsidian
    *   Copy the prompt with the copy button or save it with the save button and paste it into your LLM or any OpenAI-compatible API.

## 📝 Refining Your Prompt

Often, the first result is good but not perfect. Use the chat to improve it:

1.  **Chat with the AI**:
    *   Use the **Refinement Chat** at the bottom of the input panel.
    *   Tell the AI what you want to change.
        *   *Example: "Add error handling to the script."* or *"Make the tone more formal."*
2.  **Apply Changes**:
    *   Once you've discussed the changes, click the **Refine** button 🔄.
    *   The AI will generate a *new* version of the prompt incorporating your feedback.
3.  **Review History**:
    *   Use the arrow buttons < and > in the Output Panel to switch between different versions of your prompt.

## 📦 Managing Prompts

*   **Save to File**: Click the **Save** button to download the current prompt as a Markdown file.
*   **Copy to Clipboard**: Click the **Copy** button to copy the prompt text.
*   **History**: Click the **History** button to see your past sessions.

## 🛠️ Advanced: Customizing the AI

You can teach the AI how to behave by customizing its system prompts, but be aware that this can have unintended consequences. No matter what happens the rest button will return the original prompts.

1.  Open **Settings** ⚙️.
2.  Click **Customize System Prompts**.
3.  You can edit three prompts:
    *   **Optimize Prompt**: Controls how the AI converts your raw idea into a structured prompt this first time using the optimize button.
    *   **Chat Prompt**: Controls the personality of the chat assistant. This also controls which 
    *   **Refine Prompt**: Controls how the AI applies changes during refinement.
4.  Click **Save** to apply your changes.
5.  Click **Reset** to revert to the default behavior.

## 📝 Tips
*   **Be Specific**: The more detail you provide in your initial idea, the better the result.
*   **Iterate**: Don't be afraid to refine multiple times. You can always go back to a previous version.
*   **Local Privacy**: Your prompts and history are stored in your browser's local storage. Nothing is sent to the cloud unless you use a cloud-based API.
