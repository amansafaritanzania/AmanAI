const crypto = require("crypto");
const { promisify } = require("util");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");
const { pool } = require("../memory/database");

const scryptAsync = promisify(crypto.scrypt);
const SESSION_DAYS = 7;
const RECOVERY_MINUTES = 10;
const MAX_RECOVERY_ATTEMPTS = 5;

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
        if (algorithm !== "scrypt" || !saltHex || !keyHex) return false;

        const expected = Buffer.from(keyHex, "hex");
        const actual = Buffer.from(
            await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length)
        );

        if (actual.length !== expected.length) return false;
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

function hashRecoveryCode(code) {
    return crypto.createHash("sha256").update(String(code)).digest("hex");
}

function safeUser(row) {
    return {
        userId: row.user_id,
        email: row.email,
        displayName: row.display_name,
        preferredLanguage: row.preferred_language,
        lockOnHidden: row.lock_on_hidden !== false,
        autoLogoutMinutes: Number(row.auto_logout_minutes ?? 15),
        hasPassword: Boolean(row.password_hash),
        googleLinked: Boolean(row.google_sub)
    };
}

async function createAccount({ name, email, password, preferredLanguage = "en", acceptTerms, acceptPrivacy }) {
    const checked = validateSignupInput({ name, email, password, preferredLanguage });
if(acceptTerms!==true||acceptPrivacy!==true){const error=new Error("You must agree to the Terms of Use and Privacy Policy.");error.code="CONSENT_REQUIRED";throw error;}

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
                terms_accepted_at,
                privacy_accepted_at
            )
            VALUES($1, $2, $3, $4, $5, 'active', NOW(), NOW())
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
            preferredLanguage: checked.preferredLanguage,
            hasPassword: true,
            googleLinked: false
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
    if (!cleanEmail || typeof password !== "string") return null;

    const result = await pool.query(
        `
        SELECT
            user_id,
            email,
            display_name,
            password_hash,
            preferred_language,
            account_status,
            lock_on_hidden,
            auto_logout_minutes,
            google_sub
        FROM users
        WHERE LOWER(email) = $1
        LIMIT 1
        `,
        [cleanEmail]
    );

    const user = result.rows[0];
    if (!user || user.account_status !== "active" || !user.password_hash) return null;

    const passwordMatches = await verifyPassword(password, user.password_hash);
    if (!passwordMatches) return null;

    await pool.query(
        `UPDATE users SET last_login_at = NOW() WHERE user_id = $1`,
        [user.user_id]
    );

    return safeUser(user);
}

function getGoogleClientId() {
    return String(process.env.GOOGLE_CLIENT_ID || "").trim();
}

async function authenticateGoogleCredential(credential, { acceptTerms = false, acceptPrivacy = false } = {}) {
    const clientId = getGoogleClientId();

    if (!clientId) {
        const error = new Error("Google sign-in is not configured yet.");
        error.code = "GOOGLE_NOT_CONFIGURED";
        throw error;
    }

    if (!credential || typeof credential !== "string") {
        const error = new Error("Missing Google sign-in credential.");
        error.code = "VALIDATION_ERROR";
        throw error;
    }

    const googleClient = new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: clientId
    });

    const payload = ticket.getPayload() || {};
    const sub = String(payload.sub || "");
    const email = normalizeEmail(payload.email || "");
    const emailVerified = payload.email_verified === true;
    const name = normalizeName(payload.name || email.split("@")[0] || "Aman AI User");

    if (!sub || !email || !emailVerified) {
        const error = new Error("Google could not verify this email address.");
        error.code = "GOOGLE_IDENTITY_INVALID";
        throw error;
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const byGoogle = await client.query(
            `SELECT * FROM users WHERE google_sub = $1 LIMIT 1 FOR UPDATE`,
            [sub]
        );

        let user = byGoogle.rows[0];

        if (!user) {
            const byEmail = await client.query(
                `SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1 FOR UPDATE`,
                [email]
            );

            user = byEmail.rows[0];

            if (!user && (acceptTerms !== true || acceptPrivacy !== true)) { const error = new Error("You must agree to the Terms of Use and Privacy Policy before creating an account."); error.code = "CONSENT_REQUIRED"; throw error; }

            if (user) {
                if (user.google_sub && user.google_sub !== sub) {
                    const error = new Error("This email is already linked to another Google account.");
                    error.code = "GOOGLE_LINK_CONFLICT";
                    throw error;
                }

                await client.query(
                    `
                    UPDATE users
                    SET
                        google_sub = $2,
                        email_verified_at = COALESCE(email_verified_at, NOW()),
                        last_login_at = NOW()
                    WHERE user_id = $1
                    `,
                    [user.user_id, sub]
                );
            } else {
                const userId = createUserId();

                await client.query(
                    `
                    INSERT INTO users(
                        user_id,
                        email,
                        display_name,
                        password_hash,
                        preferred_language,
                        account_status,
                        google_sub,
                        email_verified_at,
                        last_login_at,
                        lock_on_hidden,
                        terms_accepted_at,
                        privacy_accepted_at
                    )
                    VALUES($1, $2, $3, NULL, 'en', 'active', $4, NOW(), NOW(), FALSE, NOW(), NOW())
                    `,
                    [userId, email, name, sub]
                );

                await client.query(
                    `
                    INSERT INTO user_memory(user_id, memory)
                    VALUES($1, jsonb_build_object('name', $2::text))
                    ON CONFLICT(user_id) DO NOTHING
                    `,
                    [userId, name]
                );

                const inserted = await client.query(
                    `SELECT * FROM users WHERE user_id = $1 LIMIT 1`,
                    [userId]
                );
                user = inserted.rows[0];
            }
        } else {
            await client.query(
                `
                UPDATE users
                SET
                    email_verified_at = COALESCE(email_verified_at, NOW()),
                    last_login_at = NOW()
                WHERE user_id = $1
                `,
                [user.user_id]
            );
        }

        const refreshed = await client.query(
            `SELECT * FROM users WHERE user_id = $1 LIMIT 1`,
            [user.user_id]
        );

        await client.query("COMMIT");
        return safeUser(refreshed.rows[0]);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
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
            u.account_status,
            u.lock_on_hidden,
            u.auto_logout_minutes,
            u.google_sub,
            u.password_hash
        FROM sessions s
        INNER JOIN users u ON u.user_id = s.user_id
        WHERE s.token_hash = $1
        AND s.expires_at > NOW()
        LIMIT 1
        `,
        [tokenHash]
    );

    const row = result.rows[0];
    if (!row || row.account_status !== "active") return null;

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
        lockOnHidden: row.lock_on_hidden !== false,
        autoLogoutMinutes: Number(row.auto_logout_minutes ?? 15),
        createdAt: row.created_at,
        lastSeenAt: row.last_seen_at,
        expiresAt: row.expires_at,
        tokenHash,
        hasPassword: Boolean(row.password_hash),
        googleLinked: Boolean(row.google_sub)
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
        `DELETE FROM sessions WHERE user_id = $1 AND session_id = $2 RETURNING session_id`,
        [userId, sessionId]
    );
    return result.rows.length > 0;
}

async function revokeAllSessions(userId) {
    await pool.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
}

async function getPrivacyPreferences(userId) {
    const result = await pool.query(
        `SELECT lock_on_hidden, auto_logout_minutes FROM users WHERE user_id = $1 LIMIT 1`,
        [userId]
    );
    const row = result.rows[0] || {};
    return {
        lockOnHidden: row.lock_on_hidden !== false,
        autoLogoutMinutes: Number(row.auto_logout_minutes ?? 15)
    };
}

async function updatePrivacyPreferences(userId, { lockOnHidden, autoLogoutMinutes }) {
    const allowedMinutes = new Set([0, 5, 15, 30, 60, 240]);
    const minutes = Number(autoLogoutMinutes);

    if (typeof lockOnHidden !== "boolean") {
        const error = new Error("Invalid lock preference.");
        error.code = "VALIDATION_ERROR";
        throw error;
    }

    if (!Number.isInteger(minutes) || !allowedMinutes.has(minutes)) {
        const error = new Error("Invalid auto-logout time.");
        error.code = "VALIDATION_ERROR";
        throw error;
    }

    const result = await pool.query(
        `
        UPDATE users
        SET lock_on_hidden = $2, auto_logout_minutes = $3
        WHERE user_id = $1
        RETURNING lock_on_hidden, auto_logout_minutes
        `,
        [userId, lockOnHidden, minutes]
    );

    const row = result.rows[0];
    return {
        lockOnHidden: row.lock_on_hidden !== false,
        autoLogoutMinutes: Number(row.auto_logout_minutes)
    };
}

function recoveryMailerConfigured() {
    return Boolean(
        process.env.SMTP_HOST &&
        process.env.SMTP_PORT &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS &&
        process.env.SMTP_FROM
    );
}

function createTransporter() {
    if (!recoveryMailerConfigured()) return null;

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

async function sendRecoveryEmail(to, code, displayName) {
    const transporter = createTransporter();

    if (!transporter) {
        const error = new Error("Email recovery is not configured yet.");
        error.code = "EMAIL_NOT_CONFIGURED";
        throw error;
    }

    const safeName = normalizeName(displayName || "there");

    await transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: "Your Aman AI password reset code",
        text:
            `Hello ${safeName},\n\n` +
            `Your Aman AI password reset code is: ${code}\n\n` +
            `It expires in ${RECOVERY_MINUTES} minutes. If you did not request this, ignore this email.`,
        html:
            `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17231d">` +
            `<h2>Aman AI password reset</h2>` +
            `<p>Hello ${safeName},</p>` +
            `<p>Your verification code is:</p>` +
            `<div style="font-size:30px;font-weight:800;letter-spacing:8px;padding:14px 0">${code}</div>` +
            `<p>This code expires in ${RECOVERY_MINUTES} minutes.</p>` +
            `<p>If you did not request a password reset, ignore this email.</p>` +
            `</div>`
    });
}

async function requestPasswordReset(email) {
    const cleanEmail = normalizeEmail(email);

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return { accepted: true };
    }

    const result = await pool.query(
        `
        SELECT user_id, email, display_name
        FROM users
        WHERE LOWER(email) = $1
        AND account_status = 'active'
        LIMIT 1
        `,
        [cleanEmail]
    );

    const user = result.rows[0];
    if (!user) return { accepted: true };

    if (!recoveryMailerConfigured()) {
        const error = new Error("Email recovery is not configured yet.");
        error.code = "EMAIL_NOT_CONFIGURED";
        throw error;
    }

    await pool.query(
        `UPDATE password_recovery_codes SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
        [user.user_id]
    );

    const code = String(crypto.randomInt(100000, 1000000));
    const recoveryId = "recovery_" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + RECOVERY_MINUTES * 60 * 1000);

    await pool.query(
        `
        INSERT INTO password_recovery_codes(recovery_id, user_id, code_hash, expires_at)
        VALUES($1, $2, $3, $4)
        `,
        [recoveryId, user.user_id, hashRecoveryCode(code), expiresAt]
    );

    try {
        await sendRecoveryEmail(user.email, code, user.display_name);
    } catch (error) {
        await pool.query(
            `UPDATE password_recovery_codes SET used_at = NOW() WHERE recovery_id = $1`,
            [recoveryId]
        );
        throw error;
    }

    return { accepted: true };
}

async function getUsableRecovery(email) {
    const cleanEmail = normalizeEmail(email);
    const result = await pool.query(
        `
        SELECT r.recovery_id, r.user_id, r.code_hash, r.expires_at, r.attempts
        FROM password_recovery_codes r
        INNER JOIN users u ON u.user_id = r.user_id
        WHERE LOWER(u.email) = $1
        AND r.used_at IS NULL
        AND r.expires_at > NOW()
        ORDER BY r.created_at DESC
        LIMIT 1
        `,
        [cleanEmail]
    );
    return result.rows[0] || null;
}

async function verifyPasswordResetCode(email, code) {
    const cleanCode = String(code || "").trim();
    if (!/^\d{6}$/.test(cleanCode)) return false;

    const recovery = await getUsableRecovery(email);
    if (!recovery || Number(recovery.attempts) >= MAX_RECOVERY_ATTEMPTS) return false;

    const expected = Buffer.from(String(recovery.code_hash), "hex");
    const actual = Buffer.from(hashRecoveryCode(cleanCode), "hex");
    const matches = expected.length === actual.length && crypto.timingSafeEqual(actual, expected);

    if (!matches) {
        await pool.query(
            `UPDATE password_recovery_codes SET attempts = attempts + 1 WHERE recovery_id = $1`,
            [recovery.recovery_id]
        );
        return false;
    }

    return true;
}

async function resetPasswordWithCode(email, code, newPassword) {
    if (
        typeof newPassword !== "string" ||
        newPassword.length < 8 ||
        newPassword.length > 128
    ) {
        const error = new Error("Password must be between 8 and 128 characters.");
        error.code = "VALIDATION_ERROR";
        throw error;
    }

    const cleanCode = String(code || "").trim();
    if (!/^\d{6}$/.test(cleanCode)) return false;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const cleanEmail = normalizeEmail(email);
        const result = await client.query(
            `
            SELECT r.recovery_id, r.user_id, r.code_hash, r.attempts
            FROM password_recovery_codes r
            INNER JOIN users u ON u.user_id = r.user_id
            WHERE LOWER(u.email) = $1
            AND r.used_at IS NULL
            AND r.expires_at > NOW()
            ORDER BY r.created_at DESC
            LIMIT 1
            FOR UPDATE
            `,
            [cleanEmail]
        );

        const recovery = result.rows[0];
        if (!recovery || Number(recovery.attempts) >= MAX_RECOVERY_ATTEMPTS) {
            await client.query("ROLLBACK");
            return false;
        }

        const expected = Buffer.from(String(recovery.code_hash), "hex");
        const actual = Buffer.from(hashRecoveryCode(cleanCode), "hex");
        const matches = expected.length === actual.length && crypto.timingSafeEqual(actual, expected);

        if (!matches) {
            await client.query(
                `UPDATE password_recovery_codes SET attempts = attempts + 1 WHERE recovery_id = $1`,
                [recovery.recovery_id]
            );
            await client.query("COMMIT");
            return false;
        }

        const passwordHash = await hashPassword(newPassword);

        await client.query(
            `UPDATE users SET password_hash = $2 WHERE user_id = $1`,
            [recovery.user_id, passwordHash]
        );

        await client.query(
            `UPDATE password_recovery_codes SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
            [recovery.user_id]
        );

        await client.query(
            `DELETE FROM sessions WHERE user_id = $1`,
            [recovery.user_id]
        );

        await client.query("COMMIT");
        return true;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}


const DEFAULT_UI_PREFERENCES = Object.freeze({
    language: "en",
    fontSize: "normal",
    fontFamily: "inter",
    fontColor: "#f8fafc",
    theme: "cinematic",
    accent: "#7c9cff",
    background: "aurora",
    density: "comfortable",
    bubbleStyle: "soft",
    reduceMotion: false
});

const ALLOWED_UI = {
    language: new Set(["en","sw","fr","es","pt","de","ar","hi","zh","ja"]),
    fontSize: new Set(["small","normal","large","xlarge"]),
    fontFamily: new Set(["inter","system","serif","rounded","mono"]),
    theme: new Set(["cinematic","midnight","amoled","light","ocean","sunset"]),
    background: new Set(["aurora","nebula","grid","plain","forest","sunset"]),
    density: new Set(["compact","comfortable","spacious"]),
    bubbleStyle: new Set(["soft","glass","minimal"])
};

function sanitizeHexColor(value, fallback) {
    const color = String(value || "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(color) ? color : fallback;
}

function sanitizeUiPreferences(input = {}) {
    const base = { ...DEFAULT_UI_PREFERENCES };

    for (const key of Object.keys(ALLOWED_UI)) {
        if (ALLOWED_UI[key].has(String(input[key] || ""))) {
            base[key] = String(input[key]);
        }
    }

    base.fontColor = sanitizeHexColor(
        input.fontColor,
        DEFAULT_UI_PREFERENCES.fontColor
    );

    base.accent = sanitizeHexColor(
        input.accent,
        DEFAULT_UI_PREFERENCES.accent
    );

    base.reduceMotion = input.reduceMotion === true;

    return base;
}

async function getUiPreferences(userId) {
    const result = await pool.query(
        `SELECT ui_preferences FROM users WHERE user_id = $1 LIMIT 1`,
        [userId]
    );

    const stored = result.rows[0]?.ui_preferences || {};
    return sanitizeUiPreferences(stored);
}

async function updateUiPreferences(userId, input = {}) {
    const preferences = sanitizeUiPreferences(input);

    const result = await pool.query(
        `
        UPDATE users
        SET
            ui_preferences = $2::jsonb,
            preferred_language = $3
        WHERE user_id = $1
        RETURNING
            ui_preferences,
            preferred_language
        `,
        [
            userId,
            JSON.stringify(preferences),
            preferences.language
        ]
    );

    return sanitizeUiPreferences(
        result.rows[0]?.ui_preferences || preferences
    );
}

module.exports = {
    SESSION_DAYS,
    createAccount,
    authenticateUser,
    authenticateGoogleCredential,
    createSession,
    getSessionByToken,
    deleteSessionByToken,
    listUserSessions,
    revokeSession,
    revokeAllSessions,
    getPrivacyPreferences,
    updatePrivacyPreferences,
    requestPasswordReset,
    verifyPasswordResetCode,
    resetPasswordWithCode,
    getGoogleClientId,
    getUiPreferences,
    updateUiPreferences
};
