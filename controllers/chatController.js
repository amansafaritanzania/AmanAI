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


// ======================================================
// FORMAT PERMANENT MEMORY
// ======================================================

function formatMemory(memory) {

    if (
        !memory ||
        Object.keys(memory).length === 0
    ) {
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


// ======================================================
// CLEAN MESSAGE FOR MODEL CONTEXT
// ======================================================

function cleanContent(content) {

    if (
        !content ||
        typeof content !== "string"
    ) {
        return "";
    }

    return content.trim();
}


// ======================================================
// BUILD SMALL RECENT CONTEXT
// ======================================================

function buildRecentContext(history) {

    const MAX_MESSAGES = 8;

    const recent =
        history
            .slice(-MAX_MESSAGES);

    return recent
        .map((msg) => {

            const role =
                msg.role === "assistant"
                    ? "Assistant"
                    : "User";

            return `${role}: ${cleanContent(msg.content)}`;

        })
        .join("\n");
}


// ======================================================
// BUILD LONG-CHAT SUMMARY
// ======================================================

function buildConversationSummary(
    history
) {

    const MAX_SUMMARY_MESSAGES =
        20;

    if (
        history.length <=
        MAX_SUMMARY_MESSAGES
    ) {
        return "";
    }

    const olderMessages =
        history.slice(
            0,
            -8
        );

    if (
        olderMessages.length === 0
    ) {
        return "";
    }

    return olderMessages
        .map((msg) => {

            const role =
                msg.role === "assistant"
                    ? "Assistant"
                    : "User";

            return `${role}: ${cleanContent(msg.content)}`;

        })
        .join("\n")
        .slice(
            0,
            6000
        );
}


// ======================================================
// ASK MODEL FOR COMPACT SUMMARY
// ======================================================

async function createConversationSummary(
    history
) {

    const rawHistory =
        buildConversationSummary(
            history
        );

    if (!rawHistory) {
        return "";
    }

    try {

        const summaryCompletion =
            await groq.chat.completions.create({

                model:
                    "openai/gpt-oss-20b",

                temperature: 0.1,

                max_completion_tokens:
                    300,

                messages: [

                    {
                        role: "system",

                        content: `
Create a very compact conversation summary.

Keep only durable information that may matter for
continuing the conversation:

- User goals
- Destinations
- Dates
- Group size
- Preferences
- Budget mentioned by user
- Decisions already made
- Important unresolved questions

Do not invent information.

Do not include greetings or filler.

Return plain text only.

Keep it under 180 words.
`
                    },

                    {
                        role: "user",

                        content:
                            rawHistory
                    }

                ]

            });

        return (
            summaryCompletion
                .choices?.[0]
                ?.message
                ?.content
                ?.trim()
            || ""
        );

    } catch (error) {

        console.error(
            "SUMMARY ERROR:",
            error
        );

        return "";
    }
}


// ======================================================
// MAIN CHAT
// ======================================================

async function chat(req, res) {

    try {

        let {
            message,
            userId = "guest",
            chatId
        } = req.body;


        console.log(
            "USER ID:",
            userId
        );

        console.log(
            "CHAT ID:",
            chatId
        );


        // ==================================================
        // VALIDATE MESSAGE
        // ==================================================

        if (
            !message ||
            typeof message !== "string"
        ) {

            return res.status(400).json({

                reply:
                    "Please enter a message."

            });

        }


        message =
            message.trim();


        if (!message) {

            return res.status(400).json({

                reply:
                    "Message cannot be empty."

            });

        }


        // ==================================================
        // CREATE CHAT
        // ==================================================

        if (!chatId) {

            chatId =
                await createChat(
                    userId
                );

            console.log(
                "NEW CHAT CREATED:",
                chatId
            );
        }


        // ==================================================
        // LOAD FULL HISTORY
        //
        // PostgreSQL keeps the entire conversation.
        // We do NOT send the entire history to Groq.
        // ==================================================

        const history =
            await getChat(
                userId,
                chatId
            );


        console.log(
            "CHAT HISTORY:",
            history.length
        );


        // ==================================================
        // SAVE USER MESSAGE
        // ==================================================

        await saveMessage(
            userId,
            chatId,
            "user",
            message
        );


        // ==================================================
        // UPDATE PERMANENT MEMORY
        // ==================================================

        const memory =
            await updateMemory(
                userId,
                message
            );


        // ==================================================
        // LOAD EXPERT
        // ==================================================

        const expert =
            chooseExpert(
                message
            );


        console.log(
            "🦁 SELECTED EXPERT:",
            expert.id,
            expert.name,
            "SCORE:",
            expert.score
        );


        // ==================================================
        // MEMORY
        // ==================================================

        const memoryText =
            formatMemory(
                memory
            );


        // ==================================================
        // RECENT CONTEXT
        // ==================================================

        const recentContext =
            buildRecentContext(
                history
            );


        // ==================================================
        // LONG CHAT SUMMARY
        // ==================================================

        let conversationSummary =
            "";

        if (
            history.length > 20
        ) {

            conversationSummary =
                await createConversationSummary(
                    history
                );

        }


        // ==================================================
        // SYSTEM PROMPT
        // ==================================================

        const systemPrompt = `

${expert.prompt}

========================================
PERMANENT USER MEMORY
========================================

${memoryText}

========================================
CONVERSATION SUMMARY
========================================

${
    conversationSummary ||
    "No older conversation summary."
}

========================================
IMPORTANT MEMORY RULES
========================================

- Permanent memory is shared across all chats.
- Use it naturally when relevant.
- Do not claim to remember something that is not
  present in permanent memory.
- Do not expose internal memory systems.
- Treat the user's current message normally.

========================================
RESPONSE CONTEXT RULES
========================================

Use the recent conversation and summary only as
context.

Prioritize the user's current message.

Do not repeat old information unless it is useful.
`;


        // ==================================================
        // BUILD MODEL MESSAGES
        // ==================================================

        const messages = [

            {
                role:
                    "system",

                content:
                    systemPrompt
            }

        ];


        // ==================================================
        // ADD COMPACT RECENT CONTEXT
        // ==================================================

        if (recentContext) {

            messages.push({

                role:
                    "user",

                content:
                    `
RECENT CONVERSATION:

${recentContext}
`

            });

        }


        // ==================================================
        // CURRENT USER MESSAGE
        // ==================================================

        messages.push({

            role:
                "user",

            content:
                message

        });


        // ==================================================
        // DEBUG CONTEXT SIZE
        // ==================================================

        console.log(
            "🧠 FULL HISTORY STORED:",
            history.length
        );

        console.log(
            "🧠 RECENT CONTEXT MESSAGES:",
            Math.min(
                history.length,
                8
            )
        );

        console.log(
            "🧠 SUMMARY USED:",
            conversationSummary
                ? "YES"
                : "NO"
        );


        // ==================================================
        // GROQ
        // ==================================================

        console.log(
            "\n========== GROQ REQUEST ==========\n"
        );


        const completion =
            await groq.chat.completions.create({

                model:
                    "openai/gpt-oss-20b",

                temperature:
                    0.2,

                max_completion_tokens:
                    900,

                messages

            });


        // ==================================================
        // GET REPLY
        // ==================================================

        let reply =
            completion
                .choices?.[0]
                ?.message
                ?.content;


        if (!reply) {

            reply =
                "Sorry, I couldn't generate a response.";

        }


        // ==================================================
        // SAVE ASSISTANT RESPONSE
        // ==================================================

        await saveMessage(
            userId,
            chatId,
            "assistant",
            reply
        );


        // ==================================================
        // RESPONSE
        // ==================================================

        res.json({

            success:
                true,

            chatId,

            reply

        });


    } catch (error) {

        console.error(
            "CHAT ERROR:",
            error
        );


        // ==================================================
        // TOKEN LIMIT ERROR
        // ==================================================

        if (
            error?.status === 413
        ) {

            return res.status(413).json({

                success:
                    false,

                reply:
                    "This conversation has become too large for the current AI service limit. Please start a new chat and I will continue using your permanent memory."

            });

        }


        // ==================================================
        // GENERAL ERROR
        // ==================================================

        res.status(500).json({

            success:
                false,

            reply:
                "Internal AI server error."

        });

    }

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {
    chat
};
