const groq = require("../config/groq");

const chooseExpert =
    require("../services/expertRouter");

const {
    createChat,
    getChat,
    saveMessage,
    getUserMemory,
    updateMemory
} = require("../memory/chatMemory");


function formatMemory(memory) {

    if (!memory ||
        Object.keys(memory).length === 0) {

        return "No permanent user memories yet.";
    }

    const lines = [];

    if (memory.name) {
        lines.push(
            `Preferred/name: ${memory.name}`
        );
    }

    return lines.join("\n");
}


async function chat(req, res) {

    try {

        let {
            message,
            userId = "guest",
            chatId
        } = req.body;


        console.log("USER ID:", userId);
        console.log("CHAT ID:", chatId);


        if (
            !message ||
            typeof message !== "string"
        ) {

            return res.status(400).json({
                reply: "Please enter a message."
            });
        }


        message = message.trim();


        if (!message) {

            return res.status(400).json({
                reply: "Message cannot be empty."
            });
        }


        /*
        ========================================
        CREATE CHAT IF NEEDED
        ========================================
        */

        if (!chatId) {

            chatId =
                await createChat(userId);

            console.log(
                "NEW CHAT CREATED:",
                chatId
            );
        }


        /*
        ========================================
        LOAD CURRENT CHAT
        ========================================
        */

        let history =
            await getChat(
                userId,
                chatId
            );


        console.log(
            "CHAT HISTORY:",
            history.length
        );


        /*
        ========================================
        SAVE USER MESSAGE
        ========================================
        */

        await saveMessage(
            userId,
            chatId,
            "user",
            message
        );


        /*
        ========================================
        UPDATE PERMANENT MEMORY
        ========================================
        */

        const memory =
            await updateMemory(
                userId,
                message
            );


        /*
        ========================================
        LOAD EXPERT
        ========================================
        */

        const expert =
            chooseExpert(message);


        /*
        ========================================
        PERMANENT MEMORY
        ========================================
        */

        const memoryText =
            formatMemory(memory);


        /*
        ========================================
        SYSTEM PROMPT
        ========================================
        */

        const systemPrompt = `

${expert}


========================================
PERMANENT USER MEMORY
========================================

${memoryText}

========================================

IMPORTANT MEMORY RULES:

- Permanent memory is shared across all chats.
- Use it naturally when relevant.
- Do not claim to remember something that
  is not present in permanent memory.
- Do not expose internal memory systems.
- Treat the user's current message normally.
`;


        /*
        ========================================
        BUILD GROQ MESSAGES
        ========================================
        */

        const messages = [

            {
                role: "system",
                content: systemPrompt
            }

        ];


        history
            .slice(-20)
            .forEach((msg) => {

                messages.push({

                    role: msg.role,

                    content: msg.content

                });

            });


        messages.push({

            role: "user",

            content: message

        });


        /*
        ========================================
        GROQ
        ========================================
        */

        console.log(
            "\n========== GROQ REQUEST ==========\n"
        );


        const completion =
            await groq.chat.completions.create({

                model:
                    "openai/gpt-oss-20b",

                temperature: 0.2,

                max_tokens: 2048,

                messages

            });


        let reply =
            completion
                .choices?.[0]
                ?.message
                ?.content;


        if (!reply) {

            reply =
                "Sorry, I couldn't generate a response.";
        }


        /*
        ========================================
        SAVE AI RESPONSE
        ========================================
        */

        await saveMessage(
            userId,
            chatId,
            "assistant",
            reply
        );


        /*
        ========================================
        RESPONSE
        ========================================
        */

        res.json({

            success: true,

            chatId,

            reply

        });


    } catch (error) {

        console.error(
            "CHAT ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            reply:
                "Internal AI server error."

        });

    }
}


module.exports = {
    chat
};
