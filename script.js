import { GEMINI_API_KEY } from "./config.js"

const chatBox = document.querySelector("#chatArea")
const userInput = document.getElementById('chatInput')
const sendBtn = document.getElementById('send-btn')
const themeToggle = document.getElementById('theme-toggle')

// ---------- Theme (light / dark) ----------
const root = document.documentElement
const systemLight = window.matchMedia("(prefers-color-scheme: light)")

function applyTheme(theme) {
    root.setAttribute("data-theme", theme)
    themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
    )
}

applyTheme(root.getAttribute("data-theme") || (systemLight.matches ? "light" : "dark"))
// Enable colour transitions only after the initial theme is applied
requestAnimationFrame(() => root.classList.add("theme-ready"))

themeToggle.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark"
    applyTheme(next)
    try { localStorage.setItem("theme", next) } catch (e) { }
})

// Follow the OS setting until the user picks a theme manually
systemLight.addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) applyTheme(e.matches ? "light" : "dark")
})

window.onload = (e) => {
    e.preventDefault()
    const savedChat = localStorage.getItem("chatHistory")
    if (savedChat) {
        chatBox.innerHTML = savedChat
        chatBox.scrollTop = chatBox.scrollHeight
    }

}

sendBtn.addEventListener('click', async (e) => {
    e.preventDefault()
    const message = userInput.value.trim()
    if (message === "") return
    appendMessage(message, "user")
    userInput.value = ""
    const aiTyping = showTyping()

    try {
        const reply = await handleUserMessage(message);
        aiTyping.remove();
        appendMessage(reply, 'ai');
    } catch (err) {
        aiTyping.remove();
        appendMessage('Something went wrong. Please try again.', 'ai');
        console.error(err);
    } finally {
        sendBtn.disabled = false;
    }
    localStorage.setItem("chatHistory", chatBox.innerHTML)

})


function appendMessage(text, sender) {
    const row = document.createElement('div');
    row.className = `row row-${sender}`;

    const bubble = document.createElement('div');
    bubble.className = sender === 'user' ? 'chat-user' : 'chat-ai';
    bubble.textContent = text;

    row.appendChild(bubble);
    chatBox.appendChild(row);
    scrollToBottom();
}

function showTyping() {
    const row = document.createElement('div');
    row.className = 'row row-ai';
    row.innerHTML = `
        <div class="chat-ai typing">
            <span></span><span></span><span></span>
        </div>
    `;
    chatBox.appendChild(row);
    scrollToBottom();
    return row;
}

function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`

let conversationSummary = localStorage.getItem("Summary") || "";
let recentMessages = JSON.parse(localStorage.getItem("Recent")) || [];

async function generateSummary(lastSummary,chatHistory) {
    const formattedHistory = chatHistory
        .map(msg => `${msg.role.toUpperCase()}: ${msg.parts[0].text}`)
        .join("\n");

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            system_instruction: {
                parts: [{
                    text: "You are a conversation summarizer. Distill the chat transcript into a concise context block (under 50 words). Focus ONLY on: user details/preferences, key decisions made, and current active goals. Ignore chit-chat."
                }]
            },
            contents: [
                {
                    role: "user",
                    parts: [{ text: `Summarize this chat transcript:\nPrevious summary:${lastSummary}\n${formattedHistory}` }]
                }
            ]
        })
    });

    const data = await response.json();
    // console.log(data.candidates[0].content.parts[0].text);
    localStorage.setItem("Summary", data.candidates[0].content.parts[0].text)
    return data.candidates[0].content.parts[0].text;
}

async function handleUserMessage(userMessage) {

    recentMessages.push({ role: "user", parts: [{ text: userMessage }] });

    if (recentMessages.length > 10) {
        conversationSummary = await generateSummary(conversationSummary,recentMessages);
        recentMessages = recentMessages.slice(-2);
    }
    
    const systemPrompt = `Answer strictly in 1 to 3 sentences. Be extremely concise.

    ${conversationSummary ? `CURRENT CONVERSATION CONTEXT:\n${conversationSummary}` : ""}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: recentMessages
        })
    });
    
    const data = await response.json();
    const replyText = data.candidates[0].content.parts[0].text;
    
    recentMessages.push({ role: "model", parts: [{ text: replyText }] });
    // console.log(recentMessages);
    localStorage.setItem("Recent", JSON.stringify(recentMessages))

    return replyText;
}