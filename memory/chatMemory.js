// ======================================================
// Aman AI v4.0
// Permanent Memory System
// PostgreSQL
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
// NORMALIZE MEMORY TEXT
// ======================================================

function normalizeMemoryText(message) {

    if (
        !message ||
        typeof message !== "string"
    ) {
        return "";
    }

    return message
        .trim()
        .replace(/\s+/g, " ")
        .replace(/-+/g, " ");
}


// ======================================================
// EXTRACT PERMANENT MEMORY
// ======================================================

function extractMemory(message) {

    const memories = {};

    const text =
        normalizeMemoryText(message);

    if (!text) {
        return memories;
    }


    // ==================================================
    // NAME PATTERNS
    // ==================================================

    const namePatterns = [

        // My name is Aman
        /\bmy\s+name\s+is\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        // Call me Aman
        /\bcall\s+me\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        // I am Aman
        /\bi\s+am\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        // I'm Aman
        /\bi'm\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        // Jina langu ni Aman
        /\bjina\s+langu\s+ni\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        // Naitwa Aman
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

            if (
                name.length >= 2
            ) {

                memories.name =
                    name;

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


    // ==================================================
    // LOAD EXISTING MEMORY
    // ==================================================

    const oldMemory =
        await getUserMemory(
            userId
        );

    console.log(
        "🧠 EXISTING MEMORY:",
        oldMemory
    );


    // ==================================================
    // EXTRACT NEW MEMORY
    // ==================================================

    const newMemory =
        extractMemory(
            message
        );

    console.log(
        "🧠 NEW MEMORY FOUND:",
        newMemory
    );


    // ==================================================
    // NOTHING NEW
    // ==================================================

    if (
        Object.keys(newMemory)
            .length === 0
    ) {

        console.log(
            "🧠 NO NEW MEMORY"
        );

        return oldMemory;
    }


    // ==================================================
    // MERGE MEMORY
    // ==================================================

    const updatedMemory = {

        ...oldMemory,

        ...newMemory

    };


    // ==================================================
    // SAVE TO POSTGRESQL
    // ==================================================

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
