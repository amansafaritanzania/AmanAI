// ======================================================
// Aman AI v4.1
// Shared Permanent Memory System
// PostgreSQL
//
// IMPORTANT:
// Permanent memory is ACCOUNT-WIDE.
// It is NOT tied to a chat or workspace.
// General, Coding, Agriculture, Teacher, Safari,
// Business, Health and Bible all use the same user memory.
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
// CLEAN SHORT VALUE
// ======================================================

function cleanValue(
    value,
    maxLength = 120
) {

    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[.!?,;:]+$/g, "")
        .slice(0, maxLength);
}


// ======================================================
// VALIDATE NAME
// ======================================================
//
// Avoid false memories such as:
//
// "I am coding"
// "I am tired"
// "I am learning"
// "I am a student"
//
// The old broad "I am X" pattern could accidentally
// remember ordinary sentences as names.
// ======================================================

function isReasonableName(value) {

    const name =
        cleanValue(
            value,
            50
        );

    if (
        !name ||
        name.length < 2
    ) {
        return false;
    }

    const blocked = new Set([
        "a",
        "an",
        "the",
        "coding",
        "learning",
        "studying",
        "working",
        "tired",
        "fine",
        "good",
        "okay",
        "ok",
        "happy",
        "sad",
        "hungry",
        "ready",
        "here",
        "back",
        "student",
        "developer",
        "programmer",
        "farmer",
        "teacher"
    ]);

    return !blocked.has(
        name.toLowerCase()
    );
}


// ======================================================
// ADD UNIQUE FACT
// ======================================================

function addUniqueFact(
    facts,
    fact
) {

    const clean =
        cleanValue(
            fact,
            180
        );

    if (!clean) {
        return facts;
    }

    const exists =
        facts.some(
            item =>
                String(item)
                    .toLowerCase() ===
                clean.toLowerCase()
        );

    if (!exists) {
        facts.push(clean);
    }

    /*
    Keep permanent memory intentionally compact.
    This also protects the Groq token budget.
    */
    return facts.slice(-20);
}


// ======================================================
// EXTRACT PERMANENT MEMORY
// ======================================================
//
// Only save clear, user-declared durable information.
// Do NOT treat every sentence as memory.
// ======================================================

function extractMemory(message) {

    const memories = {};

    const text =
        normalizeMemoryText(
            message
        );

    if (!text) {
        return memories;
    }


    // ==================================================
    // NAME
    // ==================================================

    const namePatterns = [

        /\bmy\s+name\s+is\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        /\bcall\s+me\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        /\bjina\s+langu\s+ni\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        /\bnaitwa\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        /*
        "I'm Aman" / "I am Aman" are accepted only after
        extra validation below.
        */
        /\bi['’]?m\s+([A-Za-z][A-Za-z'-]{1,30})\b/i,

        /\bi\s+am\s+([A-Za-z][A-Za-z'-]{1,30})\b/i
    ];


    for (
        const pattern
        of namePatterns
    ) {

        const match =
            text.match(
                pattern
            );

        if (
            match &&
            match[1] &&
            isReasonableName(
                match[1]
            )
        ) {

            memories.name =
                cleanValue(
                    match[1],
                    50
                );

            break;
        }
    }


    // ==================================================
    // PREFERRED LANGUAGE
    // ==================================================

    const languagePatterns = [

        /\bi\s+prefer\s+(english|swahili|kiswahili)\b/i,

        /\bmy\s+preferred\s+language\s+is\s+(english|swahili|kiswahili)\b/i,

        /\bnapendelea\s+(kiingereza|kiswahili)\b/i
    ];


    for (
        const pattern
        of languagePatterns
    ) {

        const match =
            text.match(
                pattern
            );

        if (
            match &&
            match[1]
        ) {

            const raw =
                match[1]
                    .toLowerCase();

            memories.preferredLanguage =
                raw === "swahili" ||
                raw === "kiswahili"
                    ? "Kiswahili"
                    : raw === "kiingereza"
                        ? "English"
                        : "English";

            break;
        }
    }


    // ==================================================
    // CLEAR USER PREFERENCES
    // ==================================================

    const preferencePatterns = [

        /\bi\s+prefer\s+(.{3,100})$/i,

        /\bi\s+like\s+(.{3,100})$/i,

        /\bi\s+usually\s+prefer\s+(.{3,100})$/i,

        /\bnapendelea\s+(.{3,100})$/i
    ];


    for (
        const pattern
        of preferencePatterns
    ) {

        const match =
            text.match(
                pattern
            );

        if (
            match &&
            match[1]
        ) {

            const value =
                cleanValue(
                    match[1],
                    120
                );

            if (
                value &&
                !/^(english|swahili|kiswahili|kiingereza)$/i
                    .test(value)
            ) {

                memories.preference =
                    value;
            }

            break;
        }
    }


    // ==================================================
    // CLEAR LONG-TERM GOALS
    // ==================================================

    const goalPatterns = [

        /\bmy\s+goal\s+is\s+(.{3,140})$/i,

        /\bi\s+want\s+to\s+become\s+(.{3,100})$/i,

        /\bi\s+plan\s+to\s+become\s+(.{3,100})$/i,

        /\blengo\s+langu\s+ni\s+(.{3,140})$/i
    ];


    for (
        const pattern
        of goalPatterns
    ) {

        const match =
            text.match(
                pattern
            );

        if (
            match &&
            match[1]
        ) {

            memories.goal =
                cleanValue(
                    match[1],
                    150
                );

            break;
        }
    }


    return memories;
}


// ======================================================
// MERGE PERMANENT MEMORY
// ======================================================

function mergeMemory(
    oldMemory,
    newMemory
) {

    const previous =
        (
            oldMemory &&
            typeof oldMemory === "object"
        )
            ? oldMemory
            : {};

    const incoming =
        (
            newMemory &&
            typeof newMemory === "object"
        )
            ? newMemory
            : {};


    const merged = {
        ...previous,
        ...incoming
    };


    // ==================================================
    // BUILD SMALL SHARED FACT LIST
    // ==================================================

    let facts =
        Array.isArray(
            previous.facts
        )
            ? [...previous.facts]
            : [];


    if (incoming.name) {

        facts =
            addUniqueFact(
                facts,
                `User's name is ${incoming.name}`
            );
    }


    if (
        incoming.preferredLanguage
    ) {

        facts =
            addUniqueFact(
                facts,
                `User prefers ${incoming.preferredLanguage}`
            );
    }


    if (
        incoming.preference
    ) {

        facts =
            addUniqueFact(
                facts,
                `User prefers ${incoming.preference}`
            );
    }


    if (
        incoming.goal
    ) {

        facts =
            addUniqueFact(
                facts,
                `User's goal is ${incoming.goal}`
            );
    }


    if (facts.length) {
        merged.facts = facts;
    }


    merged.updatedAt =
        new Date()
            .toISOString();


    return merged;
}


// ======================================================
// UPDATE ACCOUNT-WIDE PERMANENT MEMORY
// ======================================================

async function updateMemory(
    userId,
    message
) {

    /*
    userId MUST be the authenticated account ID supplied
    by the protected backend route/controller.

    There is deliberately NO:
    - chatId
    - workspace
    - expertId

    in this function's memory key.

    That is what makes memory shared by every workspace.
    */

    if (
        !userId ||
        typeof userId !== "string"
    ) {

        console.error(
            "🧠 MEMORY: invalid user ID"
        );

        return {};
    }


    console.log(
        "🧠 SHARED MEMORY CHECK:",
        userId
    );


    // ==================================================
    // LOAD ACCOUNT MEMORY
    // ==================================================

    const oldMemory =
        (
            await getUserMemory(
                userId
            )
        ) || {};


    console.log(
        "🧠 ACCOUNT MEMORY LOADED:",
        oldMemory
    );


    // ==================================================
    // EXTRACT NEW DURABLE MEMORY
    // ==================================================

    const newMemory =
        extractMemory(
            message
        );


    console.log(
        "🧠 DURABLE MEMORY FOUND:",
        newMemory
    );


    // ==================================================
    // NOTHING NEW — RETURN SAME ACCOUNT MEMORY
    // ==================================================

    if (
        Object.keys(
            newMemory
        ).length === 0
    ) {

        return oldMemory;
    }


    // ==================================================
    // MERGE + SAVE ONCE FOR THIS ACCOUNT
    // ==================================================

    const updatedMemory =
        mergeMemory(
            oldMemory,
            newMemory
        );


    await saveUserMemory(
        userId,
        updatedMemory
    );


    console.log(
        "🧠 SHARED PERMANENT MEMORY SAVED:",
        updatedMemory
    );


    return updatedMemory;
}


// ======================================================
// LOAD SHARED MEMORY
// ======================================================

async function getSharedMemory(
    userId
) {

    if (
        !userId ||
        typeof userId !== "string"
    ) {
        return {};
    }

    return (
        await getUserMemory(
            userId
        )
    ) || {};
}


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    getUserMemory,

    getSharedMemory,

    saveUserMemory,

    updateMemory,

    extractMemory,

    createChat,

    getUserChats,

    getChat,

    saveMessage,

    deleteChat,

    deleteAllChats

};
