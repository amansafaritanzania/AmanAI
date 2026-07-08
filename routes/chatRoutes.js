// ======================================================
// Chat Routes
// ======================================================

const express = require("express");

const router = express.Router();

const { chat } = require("../controllers/chatController");

const {
    createChat,
    getUserChats,
    getChat,
    deleteChat,
    deleteAllChats
} = require("../memory/chatMemory");

// ======================================================
// AI CHAT
// ======================================================

router.post("/", chat);

// ======================================================
// CREATE NEW CHAT
// ======================================================

router.post("/new-chat", (req, res) => {

    try {

        const { userId = "guest" } = req.body;

        const chatId = createChat(userId);

        res.json({

            success: true,
            chatId

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,
            message: "Unable to create chat."

        });

    }

});

// ======================================================
// GET USER CHATS
// ======================================================

router.get("/chats/:userId", (req, res) => {

    try {

        const { userId } = req.params;

        const chats = getUserChats(userId);

        res.json(chats);

    }

    catch (error) {

        console.error(error);

        res.status(500).json([]);

    }

});

// ======================================================
// GET SINGLE CHAT
// ======================================================

router.get("/:userId/:chatId", (req, res) => {

    try {

        const {

            userId,
            chatId

        } = req.params;

        const history = getChat(

            userId,
            chatId

        );

        res.json({

            success: true,
            history

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,
            history: []

        });

    }

});

// ======================================================
// DELETE ONE CHAT
// ======================================================

router.delete("/:userId/:chatId", (req, res) => {

    try {

        const {

            userId,
            chatId

        } = req.params;

        deleteChat(

            userId,
            chatId

        );

        res.json({

            success: true

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false

        });

    }

});

// ======================================================
// DELETE ALL CHATS
// ======================================================

router.delete("/chats/:userId", (req, res) => {

    try {

        const { userId } = req.params;

        deleteAllChats(userId);

        res.json({

            success: true

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false

        });

    }

});

module.exports = router;