
const {
    SESSION_DAYS,
    createAccount,
    authenticateUser,
    createSession,
    deleteSessionByToken,
    listUserSessions,
    revokeSession,
    revokeAllSessions,
    getPrivacyPreferences,
    updatePrivacyPreferences
} = require("./authService");

const {
    COOKIE_NAME
} = require("./authMiddleware");

function isSecureEnvironment() {
    return (
        process.env.NODE_ENV === "production" ||
        String(process.env.RENDER || "").toLowerCase() === "true"
    );
}

function setSessionCookie(res, token) {
    res.cookie(
        COOKIE_NAME,
        token,
        {
            httpOnly: true,
            secure: isSecureEnvironment(),
            sameSite: "lax",
            path: "/",
            maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000
        }
    );
}

function clearSessionCookie(res) {
    res.clearCookie(
        COOKIE_NAME,
        {
            httpOnly: true,
            secure: isSecureEnvironment(),
            sameSite: "lax",
            path: "/"
        }
    );
}

async function signup(req, res) {
    try {
        const {
            name,
            email,
            password,
            preferredLanguage
        } = req.body || {};

        const user = await createAccount({
            name,
            email,
            password,
            preferredLanguage
        });

        const session = await createSession(
            user.userId,
            req.get("user-agent")
        );

        setSessionCookie(res, session.token);

        res.status(201).json({
            success: true,
            user
        });
    } catch (error) {
        if (error.code === "VALIDATION_ERROR") {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.code === "EMAIL_EXISTS") {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        console.error("SIGNUP ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Could not create account."
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body || {};

        const user = await authenticateUser(email, password);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const session = await createSession(
            user.userId,
            req.get("user-agent")
        );

        setSessionCookie(res, session.token);

        res.json({
            success: true,
            user
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Could not sign in."
        });
    }
}

async function logout(req, res) {
    try {
        await deleteSessionByToken(req.sessionToken);
        clearSessionCookie(res);

        res.json({ success: true });
    } catch (error) {
        console.error("LOGOUT ERROR:", error);
        clearSessionCookie(res);
        res.json({ success: true });
    }
}

function me(req, res) {
    res.json({
        success: true,
        user: {
            userId: req.auth.userId,
            email: req.auth.email,
            displayName: req.auth.displayName,
            preferredLanguage: req.auth.preferredLanguage
        }
    });
}

async function sessions(req, res) {
    try {
        const rows = await listUserSessions(
            req.auth.userId,
            req.auth.sessionId
        );

        res.json({
            success: true,
            sessions: rows
        });
    } catch (error) {
        console.error("SESSION LIST ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Could not load sessions."
        });
    }
}

async function removeSession(req, res) {
    try {
        const sessionId = String(req.params.sessionId || "");

        const removed = await revokeSession(
            req.auth.userId,
            sessionId
        );

        if (!removed) {
            return res.status(404).json({
                success: false,
                message: "Session not found."
            });
        }

        if (sessionId === req.auth.sessionId) {
            clearSessionCookie(res);
        }

        res.json({
            success: true,
            currentSessionRevoked: sessionId === req.auth.sessionId
        });
    } catch (error) {
        console.error("SESSION REVOKE ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Could not revoke session."
        });
    }
}

async function logoutAll(req, res) {
    try {
        await revokeAllSessions(req.auth.userId);
        clearSessionCookie(res);

        res.json({ success: true });
    } catch (error) {
        console.error("LOGOUT ALL ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Could not sign out of all sessions."
        });
    }
}
async function privacyPreferences(
    req,
    res
) {

    try {

        const preferences =
            await getPrivacyPreferences(
                req.auth.userId
            );

        res.json({
            success: true,
            preferences
        });

    } catch (error) {

        console.error(
            "PRIVACY PREFS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Could not load privacy settings."
        });
    }
}


async function savePrivacyPreferences(
    req,
    res
) {

    try {

        const preferences =
            await updatePrivacyPreferences(
                req.auth.userId,
                {
                    lockOnHidden:
                        req.body?.lockOnHidden,
                    autoLogoutMinutes:
                        req.body?.autoLogoutMinutes
                }
            );

        res.json({
            success: true,
            preferences
        });

    } catch (error) {

        if (
            error.code ===
            "VALIDATION_ERROR"
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        error.message
                });
        }

        console.error(
            "SAVE PRIVACY PREFS ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Could not save privacy settings."
        });
    }
}


async function unlock(
    req,
    res
) {

    try {

        const password =
            req.body?.password;

        if (
            typeof password !==
            "string" ||
            !password
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Enter your password."
                });
        }

        const user =
            await authenticateUser(
                req.auth.email,
                password
            );

        if (!user) {
            return res
                .status(401)
                .json({
                    success: false,
                    message:
                        "Incorrect password."
                });
        }

        res.json({
            success: true
        });

    } catch (error) {

        console.error(
            "UNLOCK ERROR:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Could not unlock Aman AI."
        });
    }
}


module.exports = {
    signup,
    login,
    logout,
    me,
    sessions,
    removeSession,
    logoutAll,
    privacyPreferences,
    savePrivacyPreferences,
    unlock
};

