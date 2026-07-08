// ======================================================
// Chat Controller
// ======================================================

const groq = require("../config/groq");

const chooseExpert = require("../services/expertRouter");

const {
    createChat,
    getChat,
    saveMessage
} = require("../memory/chatMemory");

async function chat(req, res) {

    try {

        let {

            message,
            userId = "guest",
            chatId

        } = req.body;

        // --------------------------
        // Validate message
        // --------------------------

        if (!message || typeof message !== "string") {

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

        // --------------------------
        // Create chat if needed
        // --------------------------

        if (!chatId) {

            chatId = createChat(userId);

        }

        // --------------------------
        // Save user message
        // --------------------------

        saveMessage(

            userId,
            chatId,
            "user",
            message

        );

        // --------------------------
        // Load history
        // --------------------------

        const history = getChat(

            userId,
            chatId

        );

        // --------------------------
        // Select Expert
        // --------------------------

        const expert = chooseExpert(message);

        // --------------------------
        // Build messages
        // --------------------------
      
        const messages = [

    {
        role: "system",
        content: expert
    }

];


// Add previous conversation
history.slice(-20).forEach(msg => {

    messages.push({

        role: msg.role,

        content: msg.content

    });

});


// Add current user message
messages.push({

    role: "user",

    content: message

});

        // --------------------------
        // Ask Groq
        // --------------------------

        console.log("\n========== MESSAGES SENT TO GROQ ==========");

        messages.forEach((msg, index) => {

            console.log(`\n----- ${index + 1} (${msg.role}) -----`);

            console.log(msg.content);

        });

        console.log("\n===========================================\n");

        const completion = await groq.chat.completions.create({

            model: "llama-3.3-70b-versatile",

            temperature: 0.2,

            max_tokens: 2048,

            messages

        });

        let reply = completion.choices?.[0]?.message?.content;

        if (!reply) {

            reply = "Sorry, I couldn't generate a response.";

        }

        // --------------------------
        // Save AI reply
        // --------------------------

        saveMessage(

            userId,
            chatId,
            "assistant",
            reply

        );

        // --------------------------
        // Return
        // --------------------------

        res.json({

            success: true,
            chatId,
            reply

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            reply: "Internal AI server error."

        });

    }

}

module.exports = {

    chat

};