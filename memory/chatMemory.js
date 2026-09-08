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

function extractMemory(message) {
    const memories = {};

    const nameMatch = message.match(
        /\b(?:my name is|call me|i'm)\s+([A-Za-z][A-Za-z '-]{1,30})/i
    );

    const swahiliNameMatch = message.match(
        /\b(?:jina langu ni|naitwa)\s+([A-Za-z][A-Za-z '-]{1,30})/i
    );

    if (nameMatch) {
        memories.name = nameMatch[1]
            .trim()
            .replace(/[.!?,]+$/, "");
    }

    if (swahiliNameMatch) {
        memories.name = swahiliNameMatch[1]
            .trim()
            .replace(/[.!?,]+$/, "");
    }

    return memories;
}

async function updateMemory(userId, message) {
    const oldMemory =
        await getUserMemory(userId);

    const newMemory =
        extractMemory(message);

    if (Object.keys(newMemory).length === 0) {
        return oldMemory;
    }

    const updatedMemory = {
        ...oldMemory,
        ...newMemory
    };

    await saveUserMemory(
        userId,
        updatedMemory
    );

    console.log(
        "🧠 MEMORY UPDATED:",
        updatedMemory
    );

    return updatedMemory;
}

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
