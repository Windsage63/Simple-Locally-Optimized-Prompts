# API Quick Reference

| Method | Endpoint | Function | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/models` | `getModels` | Fetches available models from the configured primary API endpoint. |
| `GET` | `/models` | `getModelsForEndpoint` | Fetches available models from a specific endpoint (used for Chat API config). |
| `POST` | `/chat/completions` | `optimizePrompt` | Optimizes a raw user prompt using the `optimize` system prompt. |
| `POST` | `/chat/completions` | `chatStream` | Sends a chat message for refinement discussions, maintaining conversation history. |
| `POST` | `/chat/completions` | `refinePrompt` | Refines the optimized prompt based on chat history and user feedback. |
| `POST` | `/chat/completions` | `noChatRefinePrompt` | Refines the optimized prompt based on the original idea, without chat context. |

## Overview

The `LLMClient` class (`js/api.js`) manages all interactions with the LLM provider. It supports two separate configurations:
1.  **Primary API**: Used for `optimizePrompt`, `refinePrompt`, and `noChatRefinePrompt`.
2.  **Chat API**: Used for `chatStream` (the "Chat Assistant").

Both configurations default to `http://localhost:1234/v1` (local LLM) but can be configured to point to any OpenAI-compatible endpoint. All completion requests use `fetch` with streaming enabled (`stream: true`) and are handled via Server-Sent Events (SSE).

## Detailed Endpoints

### 1. Fetch Models
Retrieves a list of available models from the provider.

-   **Endpoint**: `GET /models`
-   **Headers**:
    -   `Authorization`: `Bearer <api_key>` (if configured)
-   **Response**: JSON object containing a `data` array of model objects.

### 2. Chat Completions (Streaming)
The core endpoint for all text generation tasks.

-   **Endpoint**: `POST /chat/completions`
-   **Headers**:
    -   `Content-Type`: `application/json`
    -   `Authorization`: `Bearer <api_key>` (if configured)
-   **Body**:
    ```json
    {
      "model": "<configured_model_name>",
      "messages": [
        { "role": "system", "content": "<system_prompt>" },
        { "role": "user", "content": "<user_input>" }
      ],
      "temperature": 0.7,
      "stream": true
    }
    ```
-   **Functions**:
    -   **`optimizePrompt`**: Uses the `optimize` system prompt template. Payload is the raw user idea.
    -   **`chatStream`**: Uses the `chat` system prompt template. Payload includes the conversation history.
    -   **`refinePrompt`**: Uses the `refine` system prompt template. Payload includes the original prompt, current result, and chat history.
    -   **`noChatRefinePrompt`**: Uses the `refine_no_chat` system prompt template. Payload includes the original prompt and current result.
