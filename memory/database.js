const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email TEXT;

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS display_name TEXT;

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS password_hash TEXT;

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS preferred_language TEXT
            NOT NULL DEFAULT 'en';

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS account_status TEXT
            NOT NULL DEFAULT 'active';

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique
        ON users (LOWER(email))
        WHERE email IS NOT NULL;

        CREATE TABLE IF NOT EXISTS user_memory (
            user_id TEXT PRIMARY KEY
                REFERENCES users(user_id)
                ON DELETE CASCADE,
            memory JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS chats (
            chat_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL
                REFERENCES users(user_id)
                ON DELETE CASCADE,
            title TEXT DEFAULT 'New Chat',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS messages (
            id BIGSERIAL PRIMARY KEY,
            chat_id TEXT NOT NULL
                REFERENCES chats(chat_id)
                ON DELETE CASCADE,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL
                REFERENCES users(user_id)
                ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            user_agent TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            last_seen_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_chats_user
        ON chats(user_id);

        CREATE INDEX IF NOT EXISTS idx_messages_chat
        ON messages(chat_id);

        CREATE INDEX IF NOT EXISTS idx_sessions_user
        ON sessions(user_id);

        CREATE INDEX IF NOT EXISTS idx_sessions_expiry
        ON sessions(expires_at);
    `);

    console.log("🗄️ Permanent database + accounts ready");
}

async function ensureUser(userId) {
    await pool.query(
        `
        INSERT INTO users(user_id)
        VALUES($1)
        ON CONFLICT(user_id)
        DO NOTHING
        `,
        [userId]
    );

    await pool.query(
        `
        INSERT INTO user_memory(user_id, memory)
        VALUES($1, '{}'::jsonb)
        ON CONFLICT(user_id)
        DO NOTHING
        `,
        [userId]
    );
}

async function getUserMemory(userId) {
    await ensureUser(userId);
    const result = await pool.query(
        `SELECT memory FROM user_memory WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0]?.memory || {};
}

async function saveUserMemory(userId, memory) {
    await ensureUser(userId);
    await pool.query(
        `
        UPDATE user_memory
        SET memory = $2,
            updated_at = NOW()
        WHERE user_id = $1
        `,
        [userId, JSON.stringify(memory)]
    );
}

async function createChat(userId, title = "New Chat") {
    await ensureUser(userId);

    const chatId =
        "chat_" +
        Date.now() +
        "_" +
        Math.random().toString(36).substring(2, 8);

    const result = await pool.query(
        `
        INSERT INTO chats(chat_id, user_id, title)
        VALUES($1, $2, $3)
        RETURNING chat_id
        `,
        [chatId, userId, title]
    );

    console.log("CHAT CREATED IN DATABASE:", result.rows[0].chat_id, "USER:", userId);
    return result.rows[0].chat_id;
}

async function getUserChats(userId) {
    const result = await pool.query(
        `
        SELECT chat_id, title, created_at
        FROM chats
        WHERE user_id = $1
        ORDER BY created_at DESC
        `,
        [userId]
    );
    return result.rows;
}

async function getChat(userId, chatId) {
    const result = await pool.query(
        `
        SELECT m.role, m.content, m.created_at AS time
        FROM messages m
        INNER JOIN chats c ON c.chat_id = m.chat_id
        WHERE c.user_id = $1
        AND c.chat_id = $2
        ORDER BY m.id ASC
        `,
        [userId, chatId]
    );
    return result.rows;
}

async function saveMessage(userId, chatId, role, content) {
    const chatCheck = await pool.query(
        `
        SELECT chat_id, user_id
        FROM chats
        WHERE chat_id = $1
        `,
        [chatId]
    );

    if (chatCheck.rows.length === 0) {
        console.error("CHAT NOT FOUND:", chatId);
        throw new Error("Chat does not exist");
    }

    if (chatCheck.rows[0].user_id !== userId) {
        console.error("CHAT OWNER MISMATCH:", {
            chatId,
            expectedUser: chatCheck.rows[0].user_id,
            receivedUser: userId
        });
        throw new Error("Chat does not belong to user");
    }

    await pool.query(
        `
        INSERT INTO messages(chat_id, role, content)
        VALUES($1, $2, $3)
        `,
        [chatId, role, content]
    );

    if (role === "user") {
        await pool.query(
            `
            UPDATE chats
            SET title = CASE
                WHEN title = 'New Chat' THEN LEFT($2, 35)
                ELSE title
            END
            WHERE chat_id = $1
            `,
            [chatId, content]
        );
    }
}

async function deleteChat(userId, chatId) {
    await pool.query(
        `DELETE FROM chats WHERE chat_id = $1 AND user_id = $2`,
        [chatId, userId]
    );
}

async function deleteAllChats(userId) {
    await pool.query(
        `DELETE FROM chats WHERE user_id = $1`,
        [userId]
    );
}

module.exports = {
    pool,
    initDatabase,
    ensureUser,
    getUserMemory,
    saveUserMemory,
    createChat,
    getUserChats,
    getChat,
    saveMessage,
    deleteChat,
    deleteAllChats
};
