const express = require("express");

const {
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
} = require("./authController");

const {
    requireAuth,
    requireSameOrigin,
    authRateLimit
} = require("./authMiddleware");

const router = express.Router();

router.post(
    "/signup",
    requireSameOrigin,
    authRateLimit,
    signup
);

router.post(
    "/login",
    requireSameOrigin,
    authRateLimit,
    login
);

router.post(
    "/logout",
    requireSameOrigin,
    requireAuth,
    logout
);

router.get(
    "/me",
    requireAuth,
    me
);

router.get(
    "/sessions",
    requireAuth,
    sessions
);

router.delete(
    "/sessions/:sessionId",
    requireSameOrigin,
    requireAuth,
    removeSession
);

router.post(
    "/logout-all",
    requireSameOrigin,
    requireAuth,
    logoutAll
);


router.get(
    "/privacy",
    requireAuth,
    privacyPreferences
);


router.put(
    "/privacy",
    requireSameOrigin,
    requireAuth,
    savePrivacyPreferences
);


router.post(
    "/unlock",
    requireSameOrigin,
    requireAuth,
    authRateLimit,
    unlock
);

module.exports = router;
