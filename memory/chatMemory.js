// ===============================================
// Aman AI Advanced Memory System
// Chats + Safe Long-Term User Profile
// ===============================================

const fs = require("fs");
const path = require("path");

const chatsPath = path.join(__dirname, "chats.json");
const profilesPath = path.join(__dirname, "profiles.json");

// ===============================================
// SAFE DATABASE LOADER
// ===============================================

function loadFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
            return {};
        }

        const raw = fs.readFileSync(filePath, "utf8").trim();

        if (!raw) return {};

        return JSON.parse(raw);

    } catch (error) {
        console.error("MEMORY LOAD ERROR:", error);
        return {};
    }
}

// ===============================================
// SAFE DATABASE SAVER
// ===============================================

function saveFile(filePath, data) {
    const tempPath = filePath + ".tmp";

    fs.writeFileSync(
        tempPath,
        JSON.stringify(data, null, 2),
        "utf8"
    );

    fs.renameSync(tempPath, filePath);
}

// ===============================================
// CHAT DATABASE
// ===============================================

function loadDatabase() {
    return loadFile(chatsPath);
}

function saveDatabase(data) {
    saveFile(chatsPath, data);
}

// ===============================================
// PROFILE DATABASE
// ===============================================

function loadProfiles() {
    return loadFile(profilesPath);
}

function saveProfiles(data) {
    saveFile(profilesPath, data);
}

// ===============================================
// CREATE CHAT ID
// ===============================================

function createChatId() {
    return "chat_" + Date.now() + "_" +
        Math.random().toString(36).substring(2, 7);
}

// ===============================================
// CREATE NEW CHAT
// ===============================================

function createChat(userId, title = "New Chat") {
    const db = loadDatabase();

    if (!db[userId]) {
        db[userId] = {};
    }

    const chatId = createChatId();

    db[userId][chatId] = {
        title,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    saveDatabase(db);

    return chatId;
}

// ===============================================
// GET ALL USER CHATS
// ===============================================

function getUserChats(userId) {
    const db = loadDatabase();

    return db[userId] || {};
}

// ===============================================
// GET CHAT
// ===============================================

function getChat(userId, chatId) {
    const db = loadDatabase();

    if (
        db[userId] &&
        db[userId][chatId]
    ) {
        return db[userId][chatId].messages || [];
    }

    return [];
}

// ===============================================
// SAVE MESSAGE
// ===============================================

function saveMessage(
    userId,
    chatId,
    role,
    content
) {
    const db = loadDatabase();

    if (!db[userId]) {
        db[userId] = {};
    }

    if (!db[userId][chatId]) {
        db[userId][chatId] = {
            title: "New Chat",
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    const chat = db[userId][chatId];

    chat.messages.push({
        role,
        content,
        time: new Date().toISOString()
    });

    if (
        chat.title === "New Chat" &&
        role === "user"
    ) {
        chat.title = content
            .replace(/\s+/g, " ")
            .substring(0, 35);
    }

    chat.updatedAt = new Date().toISOString();

    saveDatabase(db);
}

// ===============================================
// DELETE CHAT
// ===============================================

function deleteChat(userId, chatId) {
    const db = loadDatabase();

    if (db[userId]) {
        delete db[userId][chatId];
    }

    saveDatabase(db);
}

// ===============================================
// DELETE ALL USER CHATS
// ===============================================

function deleteAllChats(userId) {
    const db = loadDatabase();

    delete db[userId];

    saveDatabase(db);
}

// ===============================================
// SAFE LONG-TERM PROFILE
// ===============================================

function getProfile(userId) {
    const profiles = loadProfiles();

    return profiles[userId] || {};
}

function updateProfile(userId, updates = {}) {
    const profiles = loadProfiles();

    if (!profiles[userId]) {
        profiles[userId] = {};
    }

    const allowedFields = [
        "name",
        "preferredLanguage",
        "educationLevel",
        "interests"
    ];

    for (const field of allowedFields) {
        if (
            updates[field] !== undefined &&
            updates[field] !== null &&
            updates[field] !== ""
        ) {
            profiles[userId][field] = updates[field];
        }
    }

    profiles[userId].updatedAt =
        new Date().toISOString();

    saveProfiles(profiles);

    return profiles[userId];
}

// ===============================================
// EXPORTS
// ===============================================

module.exports = {
    createChat,
    getUserChats,
    getChat,
    saveMessage,
    deleteChat,
    deleteAllChats,
    getProfile,
    updateProfile
};
