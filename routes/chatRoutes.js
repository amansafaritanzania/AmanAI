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


// ======================================================
// CHAT
// ======================================================

router.post(
    "/",
    chat
);


// ======================================================
// NEW CHAT
// ======================================================

router.post(
    "/new-chat",
    async (req, res) => {

        try {

            const {
                userId = "guest"
            } = req.body;

            const chatId =
                await createChat(userId);

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
// ALL CHATS
// ======================================================

router.get(
    "/chats/:userId",
    async (req, res) => {

        try {

            const {
                userId
            } = req.params;

            const chats =
                await getUserChats(
                    userId
                );

            res.json(chats);

        } catch (error) {

            console.error(
                "GET CHATS ERROR:",
                error
            );

            res.status(500).json([]);
        }
    }
);


// ======================================================
// PERMANENT MEMORY
// IMPORTANT:
// This MUST be before /:userId/:chatId
// ======================================================

router.get(
    "/memory/:userId",
    async (req, res) => {

        try {

            const {
                userId
            } = req.params;

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
    "/memory/:userId",
    async (req, res) => {

        try {

            const {
                userId
            } = req.params;

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
// IMPORTANT:
// Keep this AFTER the specific routes above.
// ======================================================

router.get(
    "/:userId/:chatId",
    async (req, res) => {

        try {

            const {
                userId,
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
    "/:userId/:chatId",
    async (req, res) => {

        try {

            const {
                userId,
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
    "/chats/:userId",
    async (req, res) => {

        try {

            const {
                userId
            } = req.params;

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
