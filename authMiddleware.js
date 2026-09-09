const {
    getSessionByToken
} = require("./authService");

const COOKIE_NAME = "aman_session";

function parseCookies(cookieHeader = "") {
    return String(cookieHeader)
        .split(";")
        .map(part => part.trim())
        .filter(Boolean)
        .reduce((cookies, part) => {
            const separator = part.indexOf("=");
            if (separator === -1) return cookies;

            const key = decodeURIComponent(part.slice(0, separator));
            const value = decodeURIComponent(part.slice(separator + 1));
            cookies[key] = value;
            return cookies;
        }, {});
}

function getSessionToken(req) {
    const cookies = parseCookies(req.headers.cookie || "");
    return cookies[COOKIE_NAME] || null;
}

async function optionalAuth(req, res, next) {
    try {
        const token = getSessionToken(req);

        if (!token) {
            req.auth = null;
            return next();
        }

        const session = await getSessionByToken(token);
        req.auth = session || null;
        req.sessionToken = session ? token : null;
        next();
    } catch (error) {
        console.error("AUTH MIDDLEWARE ERROR:", error);
        req.auth = null;
        req.sessionToken = null;
        next();
    }
}

async function requireAuth(req, res, next) {
    await optionalAuth(req, res, () => {
        if (!req.auth) {
            if (req.accepts("html") && !req.path.startsWith("/api/")) {
                return res.redirect("/login");
            }

            return res.status(401).json({
                success: false,
                message: "Authentication required."
            });
        }

        next();
    });
}

function requireSameOrigin(req, res, next) {
    const origin = req.get("origin");
    if (!origin) return next();

    const forwardedProto = req.get("x-forwarded-proto");
    const protocol = forwardedProto || req.protocol;
    const expectedOrigin = `${protocol}://${req.get("host")}`;

    if (origin !== expectedOrigin) {
        return res.status(403).json({
            success: false,
            message: "Cross-site authentication request blocked."
        });
    }

    next();
}

const attempts = new Map();

function authRateLimit(req, res, next) {
    const windowMs = 15 * 60 * 1000;
    const maxAttempts = 12;
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const current = attempts.get(key);

    if (!current || now > current.resetAt) {
        attempts.set(key, {
            count: 1,
            resetAt: now + windowMs
        });
        return next();
    }

    current.count += 1;

    if (current.count > maxAttempts) {
        return res.status(429).json({
            success: false,
            message: "Too many attempts. Please wait a few minutes and try again."
        });
    }

    next();
}

module.exports = {
    COOKIE_NAME,
    getSessionToken,
    optionalAuth,
    requireAuth,
    requireSameOrigin,
    authRateLimit
};
