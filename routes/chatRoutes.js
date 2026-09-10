const express = require("express");

const router = express.Router();

const {
    chat
} = require("../controllers/chatController");

const {
    createChat,
    getUserChats,
    getChat,
    deleteChat,
    deleteAllChats,
    getUserMemory,
    saveUserMemory
} = require("../memory/chatMemory");

const {
    requireAuth
} = require("../auth/authMiddleware");


/*
======================================================
SECURITY RULE
======================================================

Every chat route requires a valid Aman AI session.

The browser is NEVER trusted to choose userId.
The authenticated session decides the real userId.

This binds:
- chats
- memory
- new chats
- delete actions
- AI messages

to the signed-in Aman AI account.
======================================================
*/


// ======================================================
// AUTHENTICATED CHAT
// ======================================================

router.post(
    "/",
    requireAuth,
    async (req, res, next) => {

        /*
        chatController currently expects req.body.userId.

        We overwrite it here with the authenticated
        account ID before chatController receives it.
        */

        req.body =
            req.body || {};

        req.body.userId =
            req.auth.userId;

        return chat(
            req,
            res,
            next
        );
    }
);


// ======================================================
// NEW CHAT
// ======================================================

router.post(
    "/new-chat",
    requireAuth,
    async (req, res) => {

        try {

            const userId =
                req.auth.userId;

            const chatId =
                await createChat(
                    userId
                );

            res.json({
                success: true,
                chatId
            });

        } catch (error) {

            console.error(
                "NEW CHAT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to create chat."
            });
        }
    }
);


// ======================================================
// ALL CHATS FOR SIGNED-IN USER
// ======================================================

router.get(
    "/chats",
    requireAuth,
    async (req, res) => {

        try {

            const userId =
                req.auth.userId;

            const chats =
                await getUserChats(
                    userId
                );

            res.json(
                chats
            );

        } catch (error) {

            console.error(
                "GET CHATS ERROR:",
                error
            );

            res
                .status(500)
                .json([]);
        }
    }
);


// ======================================================
// PERMANENT MEMORY FOR SIGNED-IN USER
// ======================================================

router.get(
    "/memory",
    requireAuth,
    async (req, res) => {

        try {

            const userId =
                req.auth.userId;

            const memory =
                await getUserMemory(
                    userId
                );

            res.json({
                success: true,
                memory
            });

        } catch (error) {

            console.error(
                "GET MEMORY ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                memory: {}
            });
        }
    }
);


// ======================================================
// UPDATE PERMANENT MEMORY
// ======================================================

router.put(
    "/memory",
    requireAuth,
    async (req, res) => {

        try {

            const userId =
                req.auth.userId;

            const memory =
                req.body.memory || {};

            await saveUserMemory(
                userId,
                memory
            );

            res.json({
                success: true,
                memory
            });

        } catch (error) {

            console.error(
                "UPDATE MEMORY ERROR:",
                error
            );

            res.status(500).json({
                success: false
            });
        }
    }
);


// ======================================================
// ONE CHAT
// ======================================================

router.get(
    "/:chatId",
    requireAuth,
    async (req, res) => {

        try {

            const userId =
                req.auth.userId;

            const {
                chatId
            } = req.params;

            const history =
                await getChat(
                    userId,
                    chatId
                );

            res.json({
                success: true,
                history
            });

        } catch (error) {

            console.error(
                "GET CHAT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                history: []
            });
        }
    }
);


// ======================================================
// DELETE ONE CHAT
// ======================================================

router.delete(
    "/:chatId",
    requireAuth,
    async (req, res) => {

        try {

            const userId =
                req.auth.userId;

            const {
                chatId
            } = req.params;

            await deleteChat(
                userId,
                chatId
            );

            res.json({
                success: true
            });

        } catch (error) {

            console.error(
                "DELETE CHAT ERROR:",
                error
            );

            res.status(500).json({
                success: false
            });
        }
    }
);


// ======================================================
// DELETE ALL CHATS
// ======================================================

router.delete(
    "/chats",
    requireAuth,
    async (req, res) => {

        try {

            const userId =
                req.auth.userId;

            await deleteAllChats(
                userId
            );

            res.json({
                success: true
            });

        } catch (error) {

            console.error(
                "DELETE ALL CHATS ERROR:",
                error
            );

            res.status(500).json({
                success: false
            });
        }
    }
);


module.exports = router;
