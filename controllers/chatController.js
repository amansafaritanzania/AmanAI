const groq = require("../config/groq");
const chooseExpert = require("../services/expertRouter");
const { createChat, getChat, saveMessage } = require("../memory/chatMemory");

async function chat(req, res) {
    try {
        let { message, userId = "guest", chatId } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({
                success: false,
                reply: "Please enter a message."
            });
        }

        message = message.trim();

        if (!message) {
            return res.status(400).json({
                success: false,
                reply: "Message cannot be empty."
            });
        }

        if (!chatId) {
            chatId = createChat(userId);
        }

        let history = getChat(userId, chatId);

        saveMessage(userId, chatId, "user", message);

        history = [
            ...history,
            {
                role: "user",
                content: message
            }
        ];

        const expert = chooseExpert(message);

        const messages = [
            {
                role: "system",
                content: expert
            }
        ];

        history.slice(-20).forEach(function (msg) {
            messages.push({
                role: msg.role,
                content: msg.content
            });
        });

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            temperature: 0.2,
            max_tokens: 2048,
            messages: messages
        });

        let reply = completion.choices[0].message.content;

        if (!reply) {
            reply = "Sorry, I couldn't generate a response.";
        }

        saveMessage(userId, chatId, "assistant", reply);

        res.json({
            success: true,
            chatId: chatId,
            reply: reply
        });

    } catch (error) {
        console.error("CHAT ERROR:", error);

        res.status(500).json({
            success: false,
            reply: "Internal AI server error."
        });
    }
}

module.exports = { chat };
