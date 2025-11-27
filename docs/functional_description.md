# Functional Description: Simple Locally Optimized Prompts (SLOP)

## Overview
SLOP is a web-based application designed to help users create, optimize, and refine prompts for Large Language Models (LLMs). It interacts with a local or remote LLM API (OpenAI-compatible) to act as an expert prompt engineer.

## User Interface Breakdown

### 1. Header
- **Logo/Title**: Displays the application name.
- **History Button** (`clock-rotate-left` icon): Opens the **History Modal** to view and manage past sessions.
- **Settings Button** (`gear` icon): Opens the **Settings Modal** to configure API connections and models.

### 2. Input Panel (Left/Top)
- **Input Area**: A large text area for users to enter their raw prompt ideas.
- **New Chat / Prompt Button**: Creates a new session, clearing the current input, chat history, and results.
- **Action Bar**:
    - **Refine Button**: Initiates a refinement process based on the current optimized result and the chat history. Requires an initial optimization and chat conversation.
    - **Optimize Button**: Sends the raw prompt from the Input Area to the LLM to generate an initial optimized prompt. This clears the current chat history for a fresh start.
- **Resize Handle**: A draggable bar to adjust the vertical split between the Input Area and the Chat Interface.
- **Chat Interface**:
    - **Chat History**: Displays the conversation between the user and the AI assistant.
    - **Chat Input**: Text area for sending messages to the AI.
    - **Send Button**: Sends the user's message.

### 3. Output Panel (Right/Bottom)
- **Optimized Result**: Displays the generated prompt in a rendered Markdown format.
- **History Navigation**:
    - **Previous/Next Buttons** (`chevron-left`, `chevron-right`): Navigate through the history of optimized prompts generated in the current session.
    - **Counter**: Shows the current position in the result history (e.g., "1 / 3").
- **Save Prompt Button** (`download` icon): Downloads the current optimized prompt as a Markdown file (`.md`). The filename is derived from the prompt's name in the YAML frontmatter.
- **Copy Button** (`copy` icon): Copies the content of the Optimized Result to the clipboard.

### 4. Modals
- **Settings Modal**:
    - **API Endpoint**: URL for the LLM API (default: `http://localhost:1234/v1`).
    - **API Key**: Optional key for authentication. Can be saved to local storage.
    - **Model Name**: The model identifier to use.
    - **Fetch Models Button**: Retrieves available models from the API.
    - **Customize System Prompts Button**: Opens the **Prompt Settings Modal**.
    - **Save Button**: Applies the settings.
- **History Modal**:
    - Lists saved sessions with their names (derived from the prompt) and timestamps.
    - Allows switching between sessions or deleting them.
- **Prompt Settings Modal** (New):
    - Allows customization of the three core system prompts:
        - **Optimize Prompt**: The instructions for generating the initial optimized prompt.
        - **Chat Prompt**: The persona for the refinement chat assistant.
        - **Refine Prompt**: The instructions for applying refinements to the prompt.
    - **Save Button**: Saves the custom prompt to local storage.
    - **Reset Button**: Reverts the prompt to the hardcoded default.

## Data Persistence
- **Local Storage**: The application saves the current session state (input, chat, results), API settings, and custom system prompts in the browser's Local Storage. No data is sent to a server other than the configured LLM API.
