// ======================================================
// Aman AI - Permanent Memory
// PostgreSQL Memory Layer
// ======================================================

const {
    getUserMemory,
    saveUserMemory,
    createChat,
    getUserChats,
    getChat,
    saveMessage,
    deleteChat,
    deleteAllChats
} = require("./database");


// ======================================================
// EXTRACT PERMANENT MEMORY
// ======================================================

function extractMemory(message) {

    const memories = {};

    if (
        !message ||
        typeof message !== "string"
    ) {
        return memories;
    }

    const text =
        message
            .trim()
            .replace(/\s+/g, " ");


    // ==================================================
    // NAME PATTERNS
    // ==================================================

    const namePatterns = [

        // English
        /\bmy\s+name\s+is\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        /\bcall\s+me\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        /\bi\s+am\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        /\bi'm\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        // Swahili
        /\bjina\s+langu\s+ni\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        /\bnaitwa\s+([A-Za-z][A-Za-z'-]{1,30})\b/i
    ];


    // ==================================================
    // FIND NAME
    // ==================================================

    for (
        const pattern of namePatterns
    ) {

        const match =
            text.match(pattern);

        if (
            match &&
            match[1]
        ) {

            const name =
                match[1]
                    .trim()
                    .replace(
                        /[.!?,;:]+$/,
                        ""
                    );

            if (name.length >= 2) {

                memories.name =
                    name;

                console.log(
                    "🧠 NAME DETECTED:",
                    name
                );

                break;
            }
        }
    }


    return memories;
}


// ======================================================
// UPDATE PERMANENT MEMORY
// ======================================================

async function updateMemory(
    userId,
    message
) {

    console.log(
        "🧠 MEMORY CHECK FOR USER:",
        userId
    );

    console.log(
        "🧠 MEMORY MESSAGE:",
        message
    );


    // --------------------------------------------------
    // Load existing permanent memory
    // --------------------------------------------------

    const oldMemory =
        await getUserMemory(
            userId
        );

    console.log(
        "🧠 EXISTING MEMORY:",
        oldMemory
    );


    // --------------------------------------------------
    // Extract new memories
    // --------------------------------------------------

    const newMemory =
        extractMemory(
            message
        );

    console.log(
        "🧠 NEW MEMORY FOUND:",
        newMemory
    );


    // --------------------------------------------------
    // Nothing new to save
    // --------------------------------------------------

    if (
        Object.keys(newMemory)
            .length === 0
    ) {

        console.log(
            "🧠 NO NEW MEMORY"
        );

        return oldMemory;
    }


    // --------------------------------------------------
    // Merge old + new memory
    // --------------------------------------------------

    const updatedMemory = {

        ...oldMemory,

        ...newMemory

    };


    // --------------------------------------------------
    // Save permanently to PostgreSQL
    // --------------------------------------------------

    await saveUserMemory(
        userId,
        updatedMemory
    );


    console.log(
        "🧠 PERMANENT MEMORY SAVED:",
        updatedMemory
    );


    return updatedMemory;
}


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    getUserMemory,

    saveUserMemory,

    updateMemory,

    createChat,

    getUserChats,

    getChat,

    saveMessage,

    deleteChat,

    deleteAllChats

};
