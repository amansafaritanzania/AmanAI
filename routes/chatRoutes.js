const express = require("express");

const router =
    express.Router();

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


router.post("/", chat);


/*
========================================
NEW CHAT
========================================
*/

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

            console.error(error);

            res.status(500).json({

                success: false,

                message:
                    "Unable to create chat."

            });

        }

    }
);


/*
========================================
ALL CHATS
========================================
*/

router.get(
    "/chats/:userId",
    async (req, res) => {

        try {

            const {
                userId
            } = req.params;

            const chats =
                await getUserChats(userId);

            res.json(chats);

        } catch (error) {

            console.error(error);

            res.status(500).json([]);

        }

    }
);


/*
========================================
ONE CHAT
========================================
*/

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

            console.error(error);

            res.status(500).json({

                success: false,

                history: []

            });

        }

    }
);


/*
========================================
PERMANENT MEMORY
========================================
*/

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

            console.error(error);

            res.status(500).json({

                success: false,

                memory: {}

            });

        }

    }
);


/*
========================================
UPDATE MEMORY MANUALLY
========================================
*/

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

            console.error(error);

            res.status(500).json({

                success: false

            });

        }

    }
);


/*
========================================
DELETE ONE CHAT
========================================
*/

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

            console.error(error);

            res.status(500).json({

                success: false

            });

        }

    }
);


/*
========================================
DELETE ALL CHATS
========================================
*/

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

            console.error(error);

            res.status(500).json({

                success: false

            });

        }

    }
);


module.exports = router;
