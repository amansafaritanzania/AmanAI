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
// CLEAN PROJECT VALUE
// ======================================================
//
// Project memory should be durable but conservative.
// Keep the actual project name/description, not the whole
// sentence that happened to mention it.
// ======================================================

function cleanProjectValue(
    value
) {

    let project =
        cleanValue(
            value,
            180
        );

    project =
        project
            .split(
                /\s+(?:and\s+i|but\s+i|because\s+i|so\s+i|while\s+i)\b/i
            )[0]
            .trim()
            .replace(
                /^(?:a|an|the)\s+/i,
                ""
            );

    if (
        !project ||
        project.length < 2
    ) {
        return "";
    }

    const blocked =
        /^(?:it|this|that|something|project|work|school|coding|website|app)$/i;

    if (blocked.test(project)) {
        return "";
    }

    return project;
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
    return facts.slice(-40);
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


    // ==================================================
    // DURABLE PROJECT / WORK MEMORY
    // ==================================================
    //
    // Examples intentionally supported:
    // "My project is Aman AI"
    // "I'm working on Aman Safari"
    // "I am building Shamba GPT"
    // "We are developing Aman AI"
    // "I have a project called Aman AI"
    //
    // This is account-wide memory, so the same project can
    // be recalled from General, Coding, Business, School,
    // Safari, Agriculture, etc.
    // ==================================================

    const projectPatterns = [

        /\bmy\s+(?:current\s+)?project\s+is\s+(.{2,180})$/i,

        /\bmy\s+(?:main\s+)?project\s+is\s+(.{2,180})$/i,

        /\bthe\s+project\s+i(?:'m|\s+am)\s+working\s+on\s+is\s+(.{2,180})$/i,

        /\bi\s+have\s+(?:a\s+)?project\s+(?:called|named)\s+(.{2,180})$/i,

        /\bi(?:'m|\s+am)\s+(?:currently\s+)?working\s+on\s+(.{2,180})$/i,

        /\bi\s+work\s+on\s+(.{2,180})$/i,

        /\bi(?:'m|\s+am)\s+(?:currently\s+)?building\s+(.{2,180})$/i,

        /\bi(?:'m|\s+am)\s+(?:currently\s+)?developing\s+(.{2,180})$/i,

        /\bi(?:'m|\s+am)\s+(?:currently\s+)?creating\s+(.{2,180})$/i,

        /\bour\s+(?:main\s+)?project\s+is\s+(.{2,180})$/i,

        /\bwe(?:'re|\s+are)\s+(?:currently\s+)?working\s+on\s+(.{2,180})$/i,

        /\bwe\s+work\s+on\s+(.{2,180})$/i,

        /\bwe(?:'re|\s+are)\s+(?:currently\s+)?building\s+(.{2,180})$/i,

        /\bwe(?:'re|\s+are)\s+(?:currently\s+)?developing\s+(.{2,180})$/i,

        /\bmradi\s+wangu\s+ni\s+(.{2,180})$/i,

        /\bninafanya\s+kazi\s+kwenye\s+mradi\s+(?:wa\s+)?(.{2,180})$/i
    ];


    const projects = [];

    for (
        const pattern
        of projectPatterns
    ) {

        const match =
            text.match(
                pattern
            );

        if (
            match &&
            match[1]
        ) {

            const project =
                cleanProjectValue(
                    match[1]
                );

            if (project) {
                projects.push(
                    project
                );
            }

            break;
        }
    }


    if (projects.length) {
        memories.projects =
            projects;
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


    // ==================================================
    // MERGE PROJECTS ACROSS ALL WORKSPACES
    // ==================================================

    const previousProjects =
        Array.isArray(
            previous.projects
        )
            ? previous.projects
            : [];

    const incomingProjects =
        Array.isArray(
            incoming.projects
        )
            ? incoming.projects
            : [];

    const projects = [];

    for (
        const item
        of [
            ...previousProjects,
            ...incomingProjects
        ]
    ) {

        const project =
            cleanProjectValue(
                item
            );

        if (
            project &&
            !projects.some(
                existing =>
                    existing
                        .toLowerCase() ===
                    project
                        .toLowerCase()
            )
        ) {
            projects.push(
                project
            );
        }
    }


    if (projects.length) {

        merged.projects =
            projects.slice(-20);

        for (
            const project
            of incomingProjects
        ) {

            facts =
                addUniqueFact(
                    facts,
                    `User is working on project: ${project}`
                );
        }
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
