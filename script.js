import { GEMINI_API_KEY } from "./config.js"

const chatBox = document.querySelector("#chatArea")
const userInput = document.getElementById('chatInput')
const sendBtn = document.getElementById('send-btn')

window.onload = () => {
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
        const reply = await getAIResponse(message);
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

async function getAIResponse(userMessage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-type": "application/json" },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: "Answer strictly in 1 to 3 sentences. Be extremely concise and direct." }]
                },
                contents: [{ parts: [{ text: userMessage }] }],

            })
        })
        const data = await response.json()
        console.log({ data });
        if (!response.ok) {
            console.error("API Error: ", data);
            return data?.error?.message || "Error fetching response."
        }

        return (
            data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't get that."
        )

    } catch (error) {

    }
}