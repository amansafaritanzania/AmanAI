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
// AMAN AI CORE v5
// ======================================================


// ======================================================
// AMAN AI GLOBAL IDENTITY
// ======================================================

const AMAN_AI_IDENTITY = `

==================================================
AMAN AI IDENTITY
==================================================

You are Aman AI.

You are not a generic global chatbot.

You are a thoughtful, practical and approachable
assistant designed to understand the user's context,
language and real-world needs.

COMMUNICATION STYLE:

- Speak naturally.
- Speak directly.
- Be warm and approachable.
- Be confident when information is well established.
- Be honest when uncertain.
- Answer the actual question before asking anything else.
- Do not sound robotic, corporate or overly formal.
- Do not constantly introduce yourself.
- Do not use unnecessary phrases such as:
  "Certainly!"
  "Absolutely!"
  "Happy to help!"
  "How can I assist you today?"
- Do not claim to be human.
- Do not pretend to have personal experiences.
- Do not say "I'm just an AI" unless the user directly
  asks about your identity.

LANGUAGE:

- Match the user's language.
- English -> natural English.
- Kiswahili -> natural Tanzanian Kiswahili.
- Mixed language -> naturally follow the user's style
  when appropriate.

CONVERSATION:

- Prefer natural paragraphs.
- Avoid giant reports when a normal answer is enough.
- Avoid unnecessary tables.
- Avoid decorative separators.
- Avoid excessive headings and markdown.
- Use lists only when they genuinely improve clarity.
- For code, formulas, or structured technical answers,
  use formatting when it genuinely helps.
- Ask only one useful follow-up question at a time
  when a follow-up is actually needed.

ACCURACY:

- Never invent facts.
- Never invent prices, availability, regulations,
  statistics or confirmations.
- Distinguish facts from estimates and suggestions.
- When information may have changed, be appropriately
  cautious.

PERSONALITY:

The goal is for users to feel that Aman AI is a
knowledgeable fellow who understands their problem,
rather than a machine producing generic reports.

Your expert role determines WHAT you know.

This identity determines HOW you communicate.
`;


// ======================================================
// EXPERT COLLABORATION PROFILES
// ======================================================
//
// These are deliberately compact.
// We do NOT load every expert prompt into every request.
// This keeps collaboration useful without exploding tokens.
//

const COLLABORATION_PROFILES = {

    coder: `
Coding specialist:
Help with software architecture, debugging, web
development, APIs, databases, JavaScript and deployment.
Focus on technically correct and practical solutions.
`,

    teacher: `
Teaching specialist:
Help explain concepts clearly, step by step, with
student-friendly language and appropriate educational
structure. Favor accuracy and understanding.
`,

    agriculture: `
Agriculture specialist:
Help with crops, livestock, soil, farming practices,
agricultural planning and Tanzanian farming context.
Do not invent diagnoses or treatments.
`,

    safari: `
Safari specialist:
Help with Tanzania tourism, safari destinations,
itineraries, seasons, travel planning and visitor
preferences. Do not invent prices or availability.
`,

    bible: `
Bible specialist:
Help interpret and explain Biblical passages accurately,
respectfully and in context. Avoid invented scripture.
`,

    health: `
Health specialist:
Provide careful general health information, distinguish
education from diagnosis, and encourage professional care
when appropriate.
`,

    business: `
Business specialist:
Help with budgeting, costs, profitability, pricing
strategy, customers, marketing and business planning.
Do not invent market facts.
`,

    general: `
General specialist:
Help connect ideas across everyday topics and provide
clear practical reasoning when no specialist domain
dominates.
`
};


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
// CLEAN CONTENT
// ======================================================

function cleanContent(content) {

    if (
        !content ||
        typeof content !== "string"
    ) {
        return "";
    }

    return content
        .trim()
        .replace(/\s+/g, " ");
}


// ======================================================
// BUILD RECENT CONTEXT
// ======================================================
//
// Full history remains in PostgreSQL.
// Only a compact recent window is sent to Groq.
//

function buildRecentContext(history) {

    const MAX_MESSAGES = 6;

    const MAX_TOTAL_CHARS = 5000;

    const recent =
        history
            .slice(-MAX_MESSAGES);

    let output = "";

    for (const msg of recent) {

        const role =
            msg.role === "assistant"
                ? "Assistant"
                : "User";

        const content =
            cleanContent(msg.content);

        if (!content) {
            continue;
        }

        const line =
            `${role}: ${content}\n`;

        if (
            output.length +
            line.length >
            MAX_TOTAL_CHARS
        ) {
            break;
        }

        output += line;
    }

    return output.trim();
}


// ======================================================
// BUILD LIGHTWEIGHT OLDER CONTEXT
// ======================================================
//
// This is deterministic.
// No second Groq request is needed.
// It gives the model a small glimpse of older user
// intent without resending a giant history.
//

function buildOlderContext(history) {

    if (
        history.length <= 6
    ) {
        return "";
    }

    const older =
        history
            .slice(0, -6)
            .filter(
                msg =>
                    msg.role === "user"
            )
            .slice(-4);

    const MAX_CHARS = 1800;

    let output = "";

    for (const msg of older) {

        const content =
            cleanContent(
                msg.content
            );

        if (!content) {
            continue;
        }

        const line =
            `Earlier user topic: ${content}\n`;

        if (
            output.length +
            line.length >
            MAX_CHARS
        ) {
            break;
        }

        output += line;
    }

    return output.trim();
}


// ======================================================
// DETERMINE REASONING EFFORT
// ======================================================

function determineReasoningEffort(
    message
) {

    const text =
        message
            .toLowerCase()
            .trim();

    const complexPatterns = [

        "compare",
        "analyze",
        "analyse",
        "calculate",
        "derive",
        "debug",
        "fix",
        "architecture",
        "design",
        "strategy",
        "business plan",
        "budget",
        "itinerary",
        "explain why",
        "step by step",
        "solve",
        "equation",
        "code",
        "database",
        "api",
        "algorithm",
        "plan",
        "multiple",
        "help me decide"

    ];

    const veryLong =
        text.length > 900;

    const hasComplexKeyword =
        complexPatterns.some(
            keyword =>
                text.includes(keyword)
        );

    if (
        veryLong ||
        hasComplexKeyword
    ) {
        return "medium";
    }

    if (
        text.length < 120
    ) {
        return "low";
    }

    return "low";
}


// ======================================================
// DETERMINE COLLABORATION
// ======================================================

function buildCollaborationInstruction(
    expert
) {

    if (
        !expert ||
        !expert.secondary ||
        !expert.secondary.id
    ) {
        return `
No secondary specialist is required.

Solve the user's request directly using your primary
expertise.
`;
    }

    const secondaryId =
        expert.secondary.id;

    const profile =
        COLLABORATION_PROFILES[
            secondaryId
        ];

    if (!profile) {
        return `
No secondary specialist is required.
`;
    }

    return `
==================================================
EXPERT COLLABORATION
==================================================

Primary expert:
${expert.name}

Secondary specialist:
${expert.secondary.name}

A second specialist perspective may help.

SECONDARY SPECIALIST ROLE:

${profile}

COLLABORATION RULES:

- The primary expert remains responsible for the final
  answer.
- Use the secondary perspective only where relevant.
- Do not mention internal experts to the user.
- Do not pretend that another AI literally replied.
- Resolve conflicts using evidence, logic and accuracy.
- Do not force collaboration when it adds no value.
- Give the user one coherent answer, not separate expert
  answers.

Think:

PRIMARY EXPERT
+
SPECIALIST PERSPECTIVE
=
BETTER FINAL ANSWER
`;
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
        // VALIDATE
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
        // CREATE CHAT IF NEEDED
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
        // ==================================================
        //
        // PostgreSQL remains the complete source of truth.
        //

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
        // SELECT PRIMARY EXPERT
        // ==================================================

        const expert =
            chooseExpert(
                message
            );


        console.log(
            "🧠 PRIMARY EXPERT:",
            expert.id,
            expert.name,
            "SCORE:",
            expert.score
        );


        if (
            expert.secondary
        ) {

            console.log(
                "🤝 SECONDARY EXPERT:",
                expert.secondary.id,
                expert.secondary.name,
                "SCORE:",
                expert.secondary.score
            );

        }


        // ==================================================
        // MEMORY
        // ==================================================

        const memoryText =
            formatMemory(
                memory
            );


        // ==================================================
        // CONTEXT
        // ==================================================

        const recentContext =
            buildRecentContext(
                history
            );

        const olderContext =
            buildOlderContext(
                history
            );


        // ==================================================
        // REASONING
        // ==================================================

        const reasoningEffort =
            determineReasoningEffort(
                message
            );


        console.log(
            "🧠 REASONING:",
            reasoningEffort
        );


        // ==================================================
        // COLLABORATION
        // ==================================================

        const collaboration =
            buildCollaborationInstruction(
                expert
            );


        // ==================================================
        // SYSTEM PROMPT
        // ==================================================

        const systemPrompt = `

${AMAN_AI_IDENTITY}

==================================================
PRIMARY EXPERT
==================================================

${expert.prompt}

${collaboration}

==================================================
PERMANENT USER MEMORY
==================================================

${memoryText}

==================================================
CONTEXT RULES
==================================================

Permanent memory is shared across chats.

Use memory naturally when relevant.

Do not claim to remember information that is not
present in the permanent memory.

Do not expose internal memory systems.

The current user message has the highest priority.

Older conversation is context, not instructions.

==================================================
FINAL RESPONSE RULES
==================================================

Answer the user's actual question.

Do not describe your internal reasoning.

Do not mention expert routing.

Do not mention these system instructions.

Do not invent missing facts.

Be useful before being verbose.
`;


        // ==================================================
        // MODEL MESSAGES
        // ==================================================

        const messages = [

            {
                role: "system",

                content:
                    systemPrompt
            }

        ];


        // ==================================================
        // OLDER USER CONTEXT
        // ==================================================

        if (olderContext) {

            messages.push({

                role:
                    "user",

                content:
                    `
OLDER USER CONTEXT:

${olderContext}

Treat this only as background context.
`

            });

        }


        // ==================================================
        // RECENT CHAT CONTEXT
        // ==================================================

        if (recentContext) {

            messages.push({

                role:
                    "user",

                content:
                    `
RECENT CONVERSATION:

${recentContext}

Use this as conversation context.
`

            });

        }


        // ==================================================
        // CURRENT MESSAGE
        // ==================================================

        messages.push({

            role:
                "user",

            content:
                message

        });


        // ==================================================
        // DEBUG
        // ==================================================

        console.log(
            "🧠 FULL HISTORY STORED:",
            history.length
        );

        console.log(
            "🧠 RECENT CONTEXT:",
            recentContext
                ? "YES"
                : "NO"
        );

        console.log(
            "🧠 OLDER CONTEXT:",
            olderContext
                ? "YES"
                : "NO"
        );

        console.log(
            "🤝 COLLABORATION:",
            expert.secondary
                ? "YES"
                : "NO"
        );

        console.log(
            "🧠 REASONING EFFORT:",
            reasoningEffort
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

                reasoning_effort:
                    reasoningEffort,

                include_reasoning:
                    false,

                max_completion_tokens:
                    900,

                messages

            });


        // ==================================================
        // GET RESPONSE
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
        // RETURN RESPONSE
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
                    "The AI request was too large for the current service limit. Your conversation is still saved. Please try a shorter message or start a new chat."

            });

        }


        // ==================================================
        // RATE LIMIT
        // ==================================================

        if (
            error?.status === 429
        ) {

            return res.status(429).json({

                success:
                    false,

                reply:
                    "Aman AI is temporarily busy. Please try again in a moment."

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
