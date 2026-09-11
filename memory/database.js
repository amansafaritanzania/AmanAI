const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
}

const pool = new Pool({
    connectionString:
        process.env.DATABASE_URL,
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

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS lock_on_hidden BOOLEAN
            NOT NULL DEFAULT TRUE;

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS auto_logout_minutes INTEGER
            NOT NULL DEFAULT 15;

        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint
                WHERE conname =
                    'users_auto_logout_minutes_check'
            ) THEN
                ALTER TABLE users
                ADD CONSTRAINT
                    users_auto_logout_minutes_check
                CHECK (
                    auto_logout_minutes
                    IN (0, 5, 15, 30, 60, 240)
                ) NOT VALID;
            END IF;
        END
        $$;

        CREATE UNIQUE INDEX IF NOT EXISTS
            idx_users_email_unique
        ON users (LOWER(email))
        WHERE email IS NOT NULL;


        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ;

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS google_sub TEXT;

        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

        CREATE UNIQUE INDEX IF NOT EXISTS
            idx_users_google_sub_unique
        ON users(google_sub)
        WHERE google_sub IS NOT NULL;

        CREATE TABLE IF NOT EXISTS password_recovery_codes (
            recovery_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL
                REFERENCES users(user_id)
                ON DELETE CASCADE,
            code_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL,
            attempts INTEGER NOT NULL DEFAULT 0,
            used_at TIMESTAMPTZ
        );

        CREATE INDEX IF NOT EXISTS idx_recovery_user
        ON password_recovery_codes(user_id);

        CREATE INDEX IF NOT EXISTS idx_recovery_expiry
        ON password_recovery_codes(expires_at);

        CREATE TABLE IF NOT EXISTS user_memory (
            user_id TEXT PRIMARY KEY
                REFERENCES users(user_id)
                ON DELETE CASCADE,
            memory JSONB NOT NULL
                DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ
                DEFAULT NOW()
        );


        CREATE TABLE IF NOT EXISTS chats (
            chat_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL
                REFERENCES users(user_id)
                ON DELETE CASCADE,
            title TEXT
                DEFAULT 'New Chat',
            created_at TIMESTAMPTZ
                DEFAULT NOW()
        );

        /*
        Aman AI v5 workspace/chat-management upgrade.
        Existing chats remain valid and automatically
        become General workspace chats.
        */

        ALTER TABLE chats
        ADD COLUMN IF NOT EXISTS workspace TEXT
            NOT NULL DEFAULT 'general';

        ALTER TABLE chats
        ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN
            NOT NULL DEFAULT FALSE;

        ALTER TABLE chats
        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN
            NOT NULL DEFAULT FALSE;

        ALTER TABLE chats
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ
            NOT NULL DEFAULT NOW();


        CREATE TABLE IF NOT EXISTS messages (
            id BIGSERIAL PRIMARY KEY,
            chat_id TEXT NOT NULL
                REFERENCES chats(chat_id)
                ON DELETE CASCADE,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ
                DEFAULT NOW()
        );


        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS has_image BOOLEAN
            NOT NULL DEFAULT FALSE;

        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS vision_context TEXT;

        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS has_file BOOLEAN
            NOT NULL DEFAULT FALSE;

        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS file_name TEXT;

        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS file_kind TEXT;

        ALTER TABLE messages
        ADD COLUMN IF NOT EXISTS file_context TEXT;


        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL
                REFERENCES users(user_id)
                ON DELETE CASCADE,
            token_hash TEXT NOT NULL UNIQUE,
            user_agent TEXT,
            created_at TIMESTAMPTZ
                DEFAULT NOW(),
            last_seen_at TIMESTAMPTZ
                DEFAULT NOW(),
            expires_at TIMESTAMPTZ
                NOT NULL
        );


        CREATE TABLE IF NOT EXISTS message_feedback (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT NOT NULL
                REFERENCES users(user_id)
                ON DELETE CASCADE,
            chat_id TEXT NOT NULL
                REFERENCES chats(chat_id)
                ON DELETE CASCADE,
            message_id BIGINT NOT NULL
                REFERENCES messages(id)
                ON DELETE CASCADE,
            rating SMALLINT NOT NULL
                CHECK (rating IN (-1, 1)),
            created_at TIMESTAMPTZ
                DEFAULT NOW(),
            updated_at TIMESTAMPTZ
                DEFAULT NOW(),
            UNIQUE(user_id, message_id)
        );


        CREATE INDEX IF NOT EXISTS idx_chats_user
        ON chats(user_id);

        CREATE INDEX IF NOT EXISTS idx_chats_user_workspace
        ON chats(user_id, workspace);

        CREATE INDEX IF NOT EXISTS idx_chats_user_updated
        ON chats(user_id, updated_at DESC);

        CREATE INDEX IF NOT EXISTS idx_chats_user_pinned
        ON chats(user_id, is_pinned);

        CREATE INDEX IF NOT EXISTS idx_messages_chat
        ON messages(chat_id);

        CREATE INDEX IF NOT EXISTS idx_sessions_user
        ON sessions(user_id);

        CREATE INDEX IF NOT EXISTS idx_sessions_expiry
        ON sessions(expires_at);

        CREATE INDEX IF NOT EXISTS idx_feedback_user
        ON message_feedback(user_id);

        CREATE INDEX IF NOT EXISTS idx_feedback_chat
        ON message_feedback(chat_id);
    `);

    console.log(
        "🗄️ Permanent database + accounts + workspaces ready"
    );
}


async function ensureUser(
    userId
) {

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
        INSERT INTO user_memory(
            user_id,
            memory
        )
        VALUES(
            $1,
            '{}'::jsonb
        )
        ON CONFLICT(user_id)
        DO NOTHING
        `,
        [userId]
    );
}


async function getUserMemory(
    userId
) {

    await ensureUser(
        userId
    );

    const result =
        await pool.query(
            `
            SELECT memory
            FROM user_memory
            WHERE user_id = $1
            `,
            [userId]
        );

    return (
        result.rows[0]
            ?.memory ||
        {}
    );
}


async function saveUserMemory(
    userId,
    memory
) {

    await ensureUser(
        userId
    );

    await pool.query(
        `
        UPDATE user_memory
        SET
            memory = $2,
            updated_at = NOW()
        WHERE user_id = $1
        `,
        [
            userId,
            JSON.stringify(
                memory || {}
            )
        ]
    );
}


async function createChat(
    userId,
    title = "New Chat",
    workspace = "general"
) {

    await ensureUser(
        userId
    );

    const safeWorkspace =
        String(
            workspace || "general"
        )
            .trim()
            .toLowerCase()
            .slice(
                0,
                40
            );

    const chatId =
        "chat_" +
        Date.now() +
        "_" +
        Math
            .random()
            .toString(36)
            .substring(
                2,
                8
            );

    const result =
        await pool.query(
            `
            INSERT INTO chats(
                chat_id,
                user_id,
                title,
                workspace
            )
            VALUES(
                $1,
                $2,
                $3,
                $4
            )
            RETURNING
                chat_id,
                workspace
            `,
            [
                chatId,
                userId,
                title,
                safeWorkspace
            ]
        );

    console.log(
        "CHAT CREATED IN DATABASE:",
        result.rows[0].chat_id,
        "USER:",
        userId,
        "WORKSPACE:",
        result.rows[0].workspace
    );

    return result.rows[0].chat_id;
}


async function getUserChats(
    userId
) {

    const result =
        await pool.query(
            `
            SELECT
                chat_id,
                title,
                workspace,
                is_pinned,
                is_archived,
                created_at,
                updated_at
            FROM chats
            WHERE user_id = $1
            ORDER BY
                is_pinned DESC,
                updated_at DESC,
                created_at DESC
            `,
            [userId]
        );

    return result.rows;
}


async function getChat(
    userId,
    chatId
) {

    const result =
        await pool.query(
            `
            SELECT
                m.id,
                m.role,
                m.content,
                m.has_image,
                m.vision_context,
                m.has_file,
                m.file_name,
                m.file_kind,
                m.file_context,
                m.created_at AS time
            FROM messages m
            INNER JOIN chats c
                ON c.chat_id =
                   m.chat_id
            WHERE c.user_id = $1
            AND c.chat_id = $2
            ORDER BY m.id ASC
            `,
            [
                userId,
                chatId
            ]
        );

    return result.rows;
}


async function saveMessage(
    userId,
    chatId,
    role,
    content
) {

    const chatCheck =
        await pool.query(
            `
            SELECT
                chat_id,
                user_id
            FROM chats
            WHERE chat_id = $1
            `,
            [chatId]
        );

    if (
        chatCheck.rows.length ===
        0
    ) {

        console.error(
            "CHAT NOT FOUND:",
            chatId
        );

        throw new Error(
            "Chat does not exist"
        );
    }

    if (
        chatCheck.rows[0]
            .user_id !==
        userId
    ) {

        console.error(
            "CHAT OWNER MISMATCH:",
            {
                chatId,
                expectedUser:
                    chatCheck.rows[0]
                        .user_id,
                receivedUser:
                    userId
            }
        );

        throw new Error(
            "Chat does not belong to user"
        );
    }

    const inserted =
        await pool.query(
            `
            INSERT INTO messages(
                chat_id,
                role,
                content
            )
            VALUES(
                $1,
                $2,
                $3
            )
            RETURNING id
            `,
            [
                chatId,
                role,
                content
            ]
        );

    /*
    Keep last-used chats at the top.
    */

    await pool.query(
        `
        UPDATE chats
        SET updated_at = NOW()
        WHERE chat_id = $1
        AND user_id = $2
        `,
        [
            chatId,
            userId
        ]
    );

    if (
        role === "user"
    ) {

        await pool.query(
            `
            UPDATE chats
            SET
                title =
                    CASE
                        WHEN title =
                            'New Chat'
                        THEN LEFT(
                            $3,
                            60
                        )
                        ELSE title
                    END,
                updated_at = NOW()
            WHERE chat_id = $1
            AND user_id = $2
            `,
            [
                chatId,
                userId,
                content
            ]
        );
    }

    return inserted.rows[0]?.id || null;
}


async function updateChatMetadata(
    userId,
    chatId,
    changes = {}
) {

    const sets = [];
    const values = [
        userId,
        chatId
    ];

    let position =
        values.length + 1;

    if (
        typeof changes.title ===
        "string"
    ) {

        const title =
            changes.title
                .trim()
                .slice(
                    0,
                    100
                );

        if (title) {

            sets.push(
                `title = $${position}`
            );

            values.push(
                title
            );

            position++;
        }
    }

    if (
        typeof changes.workspace ===
        "string"
    ) {

        sets.push(
            `workspace = $${position}`
        );

        values.push(
            changes.workspace
                .trim()
                .toLowerCase()
                .slice(
                    0,
                    40
                ) ||
            "general"
        );

        position++;
    }

    if (
        typeof changes.isPinned ===
        "boolean"
    ) {

        sets.push(
            `is_pinned = $${position}`
        );

        values.push(
            changes.isPinned
        );

        position++;
    }

    if (
        typeof changes.isArchived ===
        "boolean"
    ) {

        sets.push(
            `is_archived = $${position}`
        );

        values.push(
            changes.isArchived
        );

        position++;
    }

    if (
        sets.length === 0
    ) {

        const current =
            await pool.query(
                `
                SELECT
                    chat_id,
                    title,
                    workspace,
                    is_pinned,
                    is_archived,
                    created_at,
                    updated_at
                FROM chats
                WHERE user_id = $1
                AND chat_id = $2
                `,
                [
                    userId,
                    chatId
                ]
            );

        return (
            current.rows[0] ||
            null
        );
    }

    sets.push(
        "updated_at = NOW()"
    );

    const result =
        await pool.query(
            `
            UPDATE chats
            SET
                ${sets.join(",\n")}
            WHERE user_id = $1
            AND chat_id = $2
            RETURNING
                chat_id,
                title,
                workspace,
                is_pinned,
                is_archived,
                created_at,
                updated_at
            `,
            values
        );

    return (
        result.rows[0] ||
        null
    );
}


async function searchUserChats(
    userId,
    query,
    workspace = null
) {

    const term =
        `%${String(
            query || ""
        )
            .trim()
            .slice(
                0,
                120
            )}%`;

    const values = [
        userId,
        term
    ];

    let workspaceSql =
        "";

    if (workspace) {

        values.push(
            workspace
        );

        workspaceSql =
            `
            AND c.workspace = $3
            `;
    }

    const result =
        await pool.query(
            `
            SELECT DISTINCT
                c.chat_id,
                c.title,
                c.workspace,
                c.is_pinned,
                c.is_archived,
                c.created_at,
                c.updated_at
            FROM chats c
            LEFT JOIN messages m
                ON m.chat_id =
                   c.chat_id
            WHERE c.user_id = $1
            ${workspaceSql}
            AND (
                c.title ILIKE $2
                OR m.content ILIKE $2
            )
            ORDER BY
                c.is_pinned DESC,
                c.updated_at DESC
            LIMIT 50
            `,
            values
        );

    return result.rows;
}




async function saveMessageVisionContext(
    userId,
    chatId,
    messageId,
    visionContext
) {

    const result =
        await pool.query(
            `
            UPDATE messages AS m
            SET
                has_image = TRUE,
                vision_context = $4
            FROM chats AS c
            WHERE m.id = $1
            AND m.chat_id = $2
            AND c.chat_id = m.chat_id
            AND c.user_id = $3
            AND m.role = 'user'
            RETURNING m.id
            `,
            [
                messageId,
                chatId,
                userId,
                String(
                    visionContext || ""
                ).slice(
                    0,
                    12000
                )
            ]
        );

    return Boolean(
        result.rows[0]
    );
}



async function saveMessageFileContext(
    userId,
    chatId,
    messageId,
    fileData
) {
    const result = await pool.query(
        `
        UPDATE messages AS m
        SET
            has_file = TRUE,
            file_name = $4,
            file_kind = $5,
            file_context = $6
        FROM chats AS c
        WHERE m.id = $1
        AND m.chat_id = $2
        AND c.chat_id = m.chat_id
        AND c.user_id = $3
        AND m.role = 'user'
        RETURNING m.id
        `,
        [
            messageId,
            chatId,
            userId,
            String(fileData?.fileName || "").slice(0,255),
            String(fileData?.fileKind || "").slice(0,40),
            String(fileData?.fileContext || "").slice(0,50000)
        ]
    );

    return Boolean(result.rows[0]);
}


async function getChatRecord(
    userId,
    chatId
) {

    const result =
        await pool.query(
            `
            SELECT
                chat_id,
                title,
                workspace,
                is_pinned,
                is_archived,
                created_at,
                updated_at
            FROM chats
            WHERE user_id = $1
            AND chat_id = $2
            LIMIT 1
            `,
            [
                userId,
                chatId
            ]
        );

    return (
        result.rows[0] ||
        null
    );
}


async function deleteLastAssistantMessage(
    userId,
    chatId
) {

    const result =
        await pool.query(
            `
            DELETE FROM messages
            WHERE id = (
                SELECT m.id
                FROM messages m
                INNER JOIN chats c
                    ON c.chat_id = m.chat_id
                WHERE c.user_id = $1
                AND c.chat_id = $2
                AND m.role = 'assistant'
                ORDER BY m.id DESC
                LIMIT 1
            )
            RETURNING id
            `,
            [
                userId,
                chatId
            ]
        );

    return (
        result.rows[0]?.id ||
        null
    );
}


async function branchChat(
    userId,
    sourceChatId,
    throughMessageId
) {

    const source =
        await getChatRecord(
            userId,
            sourceChatId
        );

    if (!source) {
        return null;
    }

    const messages =
        await pool.query(
            `
            SELECT
                id,
                role,
                content,
                has_image,
                vision_context
            FROM messages
            WHERE chat_id = $1
            ORDER BY id ASC
            `,
            [sourceChatId]
        );

    const cutoffIndex =
        messages.rows.findIndex(
            item =>
                Number(item.id) ===
                Number(throughMessageId)
        );

    if (cutoffIndex < 0) {
        return null;
    }

    const branchId =
        "chat_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8);

    const client =
        await pool.connect();

    try {

        await client.query(
            "BEGIN"
        );

        await client.query(
            `
            INSERT INTO chats(
                chat_id,
                user_id,
                title,
                workspace,
                is_pinned,
                is_archived
            )
            VALUES(
                $1,
                $2,
                $3,
                $4,
                FALSE,
                FALSE
            )
            `,
            [
                branchId,
                userId,
                (
                    source.title ===
                    "New Chat"
                        ? "Branched Chat"
                        : `${source.title} — Branch`
                ).slice(0, 100),
                source.workspace ||
                "general"
            ]
        );

        const selected =
            messages.rows.slice(
                0,
                cutoffIndex + 1
            );

        for (
            const message
            of selected
        ) {

            await client.query(
                `
                INSERT INTO messages(
                    chat_id,
                    role,
                    content,
                    has_image,
                    vision_context
                )
                VALUES(
                    $1,
                    $2,
                    $3,
                    $4,
                    $5
                )
                `,
                [
                    branchId,
                    message.role,
                    message.content,
                    Boolean(
                        message.has_image
                    ),
                    message.vision_context ||
                    null
                ]
            );
        }

        await client.query(
            "COMMIT"
        );

        return branchId;

    } catch (error) {

        await client.query(
            "ROLLBACK"
        );

        throw error;

    } finally {

        client.release();
    }
}


async function saveMessageFeedback(
    userId,
    chatId,
    messageId,
    rating
) {

    const ownership =
        await pool.query(
            `
            SELECT m.id
            FROM messages m
            INNER JOIN chats c
                ON c.chat_id = m.chat_id
            WHERE m.id = $1
            AND c.chat_id = $2
            AND c.user_id = $3
            AND m.role = 'assistant'
            LIMIT 1
            `,
            [
                messageId,
                chatId,
                userId
            ]
        );

    if (
        ownership.rows.length ===
        0
    ) {
        return false;
    }

    await pool.query(
        `
        INSERT INTO message_feedback(
            user_id,
            chat_id,
            message_id,
            rating
        )
        VALUES(
            $1,
            $2,
            $3,
            $4
        )
        ON CONFLICT(
            user_id,
            message_id
        )
        DO UPDATE SET
            rating = EXCLUDED.rating,
            updated_at = NOW()
        `,
        [
            userId,
            chatId,
            messageId,
            rating
        ]
    );

    return true;
}


async function deleteChat(
    userId,
    chatId
) {

    await pool.query(
        `
        DELETE FROM chats
        WHERE chat_id = $1
        AND user_id = $2
        `,
        [
            chatId,
            userId
        ]
    );
}


async function deleteAllChats(
    userId
) {

    await pool.query(
        `
        DELETE FROM chats
        WHERE user_id = $1
        `,
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
    updateChatMetadata,
    searchUserChats,
    saveMessageVisionContext,
    saveMessageFileContext,
    getChatRecord,
    deleteLastAssistantMessage,
    branchChat,
    saveMessageFeedback,
    deleteChat,
    deleteAllChats
};
