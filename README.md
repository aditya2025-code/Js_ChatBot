# AI Chatbot — HTML, CSS & JS

A simple personal AI chatbot built with plain HTML, CSS, and JavaScript, no frameworks. It sends user messages to the Google Gemini API and displays the responses in a styled chat interface, with chat history saved locally in the browser.

## Demo Link

[AI ChatBot](https://jschatbot67.netlify.app/)

## Features

- Clean, responsive chat UI (works down to mobile)
- Live typing indicator while waiting for a response
- Chat history persisted with `localStorage`, so it survives a page reload
- Talks to the Gemini API (`gemini-3.6-flash`) for responses
- No build tools or dependencies — just open it in a browser

## File structure

```
.
├── index.html    # Page structure
├── styles.css    # All styling
├── script.js     # Chat logic + Gemini API call
└── config.js     # Your API key (you create this, not included)
```

## Setup

1. **Get a Gemini API key**
   Create one at [Google AI Studio](https://aistudio.google.com/app/apikey).

2. **Create `config.js`** in the project root:

   ```js
   export const GEMINI_API_KEY = "your-api-key-here";
   ```

   This file is imported by `script.js` and should **not** be committed to a public repo — add it to `.gitignore`.

3. **Run it through a local server**, not by double-clicking `index.html`. `script.js` is loaded as an ES module (`type="module"`), and browsers block module imports over the `file://` protocol.

   Any of these work:

   ```bash
   # Python
   python -m http.server 5500

   # Node
   npx serve .

   # VS Code
   # Right-click index.html → "Open with Live Server"
   ```

4. Open the printed local address (e.g. `http://localhost:5500`) in your browser.

## How it works

- Typing a message and pressing **Send** appends it to the chat, then calls `getAIResponse()`.
- `getAIResponse()` sends a `POST` request to the Gemini `generateContent` endpoint with your message, using a system instruction that keeps replies short (1–3 sentences).
- The reply is pulled out of the response and appended to the chat as an AI bubble.
- After every exchange, the full chat HTML is saved to `localStorage` under `chatHistory` and restored automatically on page load.

