# User Guide: Simple Locally Optimized Prompts

Welcome to **Simple Locally Optimized Prompts (SLOP)**! This tool helps you craft professional, high-quality prompts for AI models using your own local LLM or an OpenAI-compatible API.

## Getting Started

1.  **Configure Settings**:
    *   Click the **Settings** icon (<i class="fa-solid fa-gear"></i>) in the top right.
    *   Enter your **API Endpoint** (e.g., `http://localhost:1234/v1` for LM Studio).
    *   Enter your **Model Name** or click the refresh icon to fetch available models.
    *   Click **Save**.

2.  **Create Your First Prompt**:
    *   In the **Input Idea** box, type a rough description of what you want.
        *   *Example: "I want a python script to scrape a website."*
    *   Click **Optimize** (<i class="fa-solid fa-wand-magic-sparkles"></i>).
    *   The AI will generate a structured, professional prompt in the **Optimized Result** panel.

## Refining Your Prompt

Often, the first result is good but not perfect. Use the chat to improve it:

1.  **Chat with the AI**:
    *   Use the **Refinement Chat** at the bottom of the input panel.
    *   Tell the AI what you want to change.
        *   *Example: "Add error handling to the script."* or *"Make the tone more formal."*
2.  **Apply Changes**:
    *   Once you've discussed the changes, click the **Refine** button (<i class="fa-solid fa-rotate-right"></i>).
    *   The AI will generate a *new* version of the prompt incorporating your feedback.
3.  **Review History**:
    *   Use the arrow buttons (<i class="fa-solid fa-chevron-left"></i> / <i class="fa-solid fa-chevron-right"></i>) in the Output Panel to switch between different versions of your prompt.

## Managing Prompts

*   **Save to File**: Click the **Save** icon (<i class="fa-solid fa-download"></i>) to download the current prompt as a Markdown file.
*   **Copy to Clipboard**: Click the **Copy** icon (<i class="fa-regular fa-copy"></i>) to copy the prompt text.
*   **History**: Click the **History** icon (<i class="fa-solid fa-clock-rotate-left"></i>) to see your past sessions.

## Advanced: Customizing the AI

You can teach the AI how to behave by customizing its system prompts:

1.  Open **Settings** (<i class="fa-solid fa-gear"></i>).
2.  Click **Customize System Prompts**.
3.  You can edit three prompts:
    *   **Optimize Prompt**: Controls how the AI converts your raw idea into a structured prompt.
    *   **Chat Prompt**: Controls the personality of the chat assistant.
    *   **Refine Prompt**: Controls how the AI applies changes during refinement.
4.  Click **Save** to apply your changes.
5.  Click **Reset** to revert to the default behavior.

## Tips
*   **Be Specific**: The more detail you provide in your initial idea, the better the result.
*   **Iterate**: Don't be afraid to refine multiple times. You can always go back to a previous version.
*   **Local Privacy**: Your prompts and history are stored in your browser's local storage. Nothing is sent to the cloud unless you use a cloud-based API.
