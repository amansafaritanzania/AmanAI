```js
// ======================================================
// Aman AI - PostgreSQL Database Backup
// ======================================================

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is missing.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function backupDatabase() {

    const client =
        await pool.connect();

    try {

        console.log(
            "🔐 Connecting to Aman AI PostgreSQL..."
        );

        const users =
            await client.query(`
                SELECT
                    user_id,
                    created_at
                FROM users
                ORDER BY user_id
            `);

        const userMemory =
            await client.query(`
                SELECT
                    user_id,
                    memory,
                    updated_at
                FROM user_memory
                ORDER BY user_id
            `);

        const chats =
            await client.query(`
                SELECT
                    chat_id,
                    user_id,
                    title,
                    created_at
                FROM chats
                ORDER BY created_at, chat_id
            `);

        const messages =
            await client.query(`
                SELECT
                    id,
                    chat_id,
                    role,
                    content,
                    created_at
                FROM messages
                ORDER BY id
            `);

        const backup = {

            format:
                "aman-ai-postgresql-backup-v1",

            createdAt:
                new Date().toISOString(),

            tables: {

                users:
                    users.rows,

                user_memory:
                    userMemory.rows,

                chats:
                    chats.rows,

                messages:
                    messages.rows
            }
        };

        const backupDirectory =
            path.join(
                __dirname,
                "database-backups"
            );

        fs.mkdirSync(
            backupDirectory,
            {
                recursive: true
            }
        );

        const timestamp =
            new Date()
                .toISOString()
                .replace(
                    /[:.]/g,
                    "-"
                );

        const filename =
            `aman-ai-backup-${timestamp}.json`;

        const outputPath =
            path.join(
                backupDirectory,
                filename
            );

        fs.writeFileSync(
            outputPath,
            JSON.stringify(
                backup,
                null,
                2
            ),
            "utf8"
        );

        console.log("");
        console.log(
            "======================================"
        );
        console.log(
            "✅ DATABASE BACKUP COMPLETE"
        );
        console.log(
            "======================================"
        );

        console.log(
            "Users:",
            users.rows.length
        );

        console.log(
            "Permanent memories:",
            userMemory.rows.length
        );

        console.log(
            "Chats:",
            chats.rows.length
        );

        console.log(
            "Messages:",
            messages.rows.length
        );

        console.log("");

        console.log(
            "Backup saved to:"
        );

        console.log(
            outputPath
        );

        console.log(
            "======================================"
        );

    }
    catch (error) {

        console.error("");
        console.error(
            "❌ DATABASE BACKUP FAILED"
        );

        console.error(error);

        process.exitCode = 1;

    }
    finally {

        client.release();

        await pool.end();
    }
}

backupDatabase();
```
