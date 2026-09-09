
const crypto = require("crypto");
const { promisify } = require("util");
const { pool } = require("../memory/database");

const scryptAsync = promisify(crypto.scrypt);
const SESSION_DAYS = 7;

function normalizeEmail(email = "") {
    return String(email).trim().toLowerCase();
}

function normalizeName(name = "") {
    return String(name).trim().replace(/\s+/g, " ");
}

function validateSignupInput({ name, email, password, preferredLanguage }) {
    const cleanName = normalizeName(name);
    const cleanEmail = normalizeEmail(email);
    const cleanLanguage = preferredLanguage === "sw" ? "sw" : "en";

    if (cleanName.length < 2 || cleanName.length > 80) {
        return { ok: false, message: "Name must be between 2 and 80 characters." };
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
        return { ok: false, message: "Enter a valid email address." };
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
        return { ok: false, message: "Password must be between 8 and 128 characters." };
    }

    return {
        ok: true,
        name: cleanName,
        email: cleanEmail,
        password,
        preferredLanguage: cleanLanguage
    };
}

async function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derivedKey = await scryptAsync(password, salt, 64);

    return [
        "scrypt",
        salt.toString("hex"),
        Buffer.from(derivedKey).toString("hex")
    ].join("$");
}

async function verifyPassword(password, storedHash) {
    try {
        const [algorithm, saltHex, keyHex] = String(storedHash || "").split("$");

        if (algorithm !== "scrypt" || !saltHex || !keyHex) {
            return false;
        }

        const expected = Buffer.from(keyHex, "hex");
        const actual = Buffer.from(
            await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length)
        );

        if (actual.length !== expected.length) {
            return false;
        }

        return crypto.timingSafeEqual(actual, expected);
    } catch {
        return false;
    }
}

function createUserId() {
    return "user_" + crypto.randomUUID();
}

function hashSessionToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

async function createAccount({ name, email, password, preferredLanguage = "en" }) {
    const checked = validateSignupInput({ name, email, password, preferredLanguage });

    if (!checked.ok) {
        const error = new Error(checked.message);
        error.code = "VALIDATION_ERROR";
        throw error;
    }

    const passwordHash = await hashPassword(checked.password);
    const userId = createUserId();
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const existing = await client.query(
            `SELECT user_id FROM users WHERE LOWER(email) = $1 LIMIT 1`,
            [checked.email]
        );

        if (existing.rows.length > 0) {
            const error = new Error("An account already exists for that email.");
            error.code = "EMAIL_EXISTS";
            throw error;
        }

        await client.query(
            `
            INSERT INTO users(
                user_id,
                email,
                display_name,
                password_hash,
                preferred_language,
                account_status,
                lock_on_hidden,
                auto_logout_minutes
            )
            VALUES($1, $2, $3, $4, $5, 'active')
            `,
            [userId, checked.email, checked.name, passwordHash, checked.preferredLanguage]
        );

        await client.query(
            `
            INSERT INTO user_memory(user_id, memory)
            VALUES($1, jsonb_build_object('name', $2::text))
            ON CONFLICT(user_id) DO NOTHING
            `,
            [userId, checked.name]
        );

        await client.query("COMMIT");

        return {
            userId,
            email: checked.email,
            displayName: checked.name,
            preferredLanguage: checked.preferredLanguage
        };
    } catch (error) {
        await client.query("ROLLBACK");

        if (error.code === "23505") {
            const duplicateError = new Error("An account already exists for that email.");
            duplicateError.code = "EMAIL_EXISTS";
            throw duplicateError;
        }

        throw error;
    } finally {
        client.release();
    }
}

async function authenticateUser(email, password) {
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || typeof password !== "string") {
        return null;
    }

    const result = await pool.query(
        `
        SELECT
            user_id,
            email,
            display_name,
            password_hash,
            preferred_language,
            account_status
        FROM users
        WHERE LOWER(email) = $1
        LIMIT 1
        `,
        [cleanEmail]
    );

    const user = result.rows[0];

    if (!user || user.account_status !== "active" || !user.password_hash) {
        return null;
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);

    if (!passwordMatches) {
        return null;
    }

    await pool.query(
        `UPDATE users SET last_login_at = NOW() WHERE user_id = $1`,
        [user.user_id]
    );

    return {
        userId: user.user_id,
        email: user.email,
        displayName: user.display_name,
        preferredLanguage: user.preferred_language
    };
}

async function createSession(userId, userAgent = "") {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashSessionToken(token);
    const sessionId = "session_" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await pool.query(`DELETE FROM sessions WHERE expires_at <= NOW()`);

    await pool.query(
        `
        INSERT INTO sessions(
            session_id,
            user_id,
            token_hash,
            user_agent,
            expires_at
        )
        VALUES($1, $2, $3, $4, $5)
        `,
        [sessionId, userId, tokenHash, String(userAgent || "").slice(0, 500), expiresAt]
    );

    return { token, sessionId, expiresAt };
}

async function getSessionByToken(token) {
    if (!token) return null;

    const tokenHash = hashSessionToken(token);

    const result = await pool.query(
        `
        SELECT
            s.session_id,
            s.user_id,
            s.created_at,
            s.last_seen_at,
            s.expires_at,
            u.email,
            u.display_name,
            u.preferred_language,
            u.account_status
        FROM sessions s
        INNER JOIN users u ON u.user_id = s.user_id
        WHERE s.token_hash = $1
        AND s.expires_at > NOW()
        LIMIT 1
        `,
        [tokenHash]
    );

    const row = result.rows[0];

    if (!row || row.account_status !== "active") {
        return null;
    }

    await pool.query(
        `UPDATE sessions SET last_seen_at = NOW() WHERE session_id = $1`,
        [row.session_id]
    );

    return {
        sessionId: row.session_id,
        userId: row.user_id,
        email: row.email,
        displayName: row.display_name,
        preferredLanguage: row.preferred_language,
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        expiresAt: row.expires_at,
        tokenHash
    };
}

async function deleteSessionByToken(token) {
    if (!token) return;
    const tokenHash = hashSessionToken(token);
    await pool.query(`DELETE FROM sessions WHERE token_hash = $1`, [tokenHash]);
}

async function listUserSessions(userId, currentSessionId) {
    const result = await pool.query(
        `
        SELECT session_id, user_agent, created_at, last_seen_at, expires_at
        FROM sessions
        WHERE user_id = $1
        AND expires_at > NOW()
        ORDER BY last_seen_at DESC
        `,
        [userId]
    );

    return result.rows.map(row => ({
        sessionId: row.session_id,
        userAgent: row.user_agent || "",
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        expiresAt: row.expires_at,
        current: row.session_id === currentSessionId
    }));
}

async function revokeSession(userId, sessionId) {
    const result = await pool.query(
        `
        DELETE FROM sessions
        WHERE user_id = $1
        AND session_id = $2
        RETURNING session_id
        `,
        [userId, sessionId]
    );

    return result.rows.length > 0;
}

async function revokeAllSessions(userId) {
    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}
async function getPrivacyPreferences(
    userId
) {

    const result =
        await pool.query(
            `
            SELECT
                lock_on_hidden,
                auto_logout_minutes
            FROM users
            WHERE user_id = $1
            LIMIT 1
            `,
            [userId]
        );

    const row =
        result.rows[0] || {};

    return {
        lockOnHidden:
            row.lock_on_hidden !== false,
        autoLogoutMinutes:
            Number(
                row.auto_logout_minutes ?? 15
            )
    };
}


async function updatePrivacyPreferences(
    userId,
    {
        lockOnHidden,
        autoLogoutMinutes
    }
) {

    const allowedMinutes =
        new Set([
            0,
            5,
            15,
            30,
            60,
            240
        ]);

    const minutes =
        Number(
            autoLogoutMinutes
        );

    if (
        typeof lockOnHidden !==
        "boolean"
    ) {
        const error =
            new Error(
                "Invalid lock preference."
            );

        error.code =
            "VALIDATION_ERROR";

        throw error;
    }

    if (
        !Number.isInteger(minutes) ||
        !allowedMinutes.has(minutes)
    ) {
        const error =
            new Error(
                "Invalid auto-logout time."
            );

        error.code =
            "VALIDATION_ERROR";

        throw error;
    }

    const result =
        await pool.query(
            `
            UPDATE users
            SET
                lock_on_hidden = $2,
                auto_logout_minutes = $3
            WHERE user_id = $1
            RETURNING
                lock_on_hidden,
                auto_logout_minutes
            `,
            [
                userId,
                lockOnHidden,
                minutes
            ]
        );

    const row =
        result.rows[0];

    return {
        lockOnHidden:
            row.lock_on_hidden !== false,
        autoLogoutMinutes:
            Number(
                row.auto_logout_minutes
            )
    };
}


module.exports = {
    SESSION_DAYS,
    createAccount,
    authenticateUser,
    createSession,
    getSessionByToken,
    deleteSessionByToken,
    listUserSessions,
    revokeSession,
    revokeAllSessions,
    getPrivacyPreferences,
    updatePrivacyPreferences
};
