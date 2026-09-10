const express = require("express");
const multer = require("multer");

const router = express.Router();

const {
    SUPPORTED_IMAGE_TYPES
} = require("../services/visionService");

const {
    MAX_FILE_BYTES,
    DOCUMENT_EXTENSIONS
} = require("../services/fileIntelligenceService");

const path = require("path");

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
    pool,
    updateChatMetadata,
    searchUserChats,
    getChatRecord,
    deleteLastAssistantMessage,
    branchChat,
    saveMessageFeedback
} = require("../memory/database");

const {
    requireAuth
} = require("../auth/authMiddleware");


// ======================================================
// FILE UPLOAD
// ======================================================

const fileUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_FILE_BYTES,
        files: 1
    },
    fileFilter: (req, file, callback) => {
        const ext = path
            .extname(file.originalname || "")
            .toLowerCase();

        const allowed =
            SUPPORTED_IMAGE_TYPES.has(file.mimetype) ||
            DOCUMENT_EXTENSIONS.has(ext);

        if (!allowed) {
            const error = new Error("Unsupported file type.");
            error.code = "UNSUPPORTED_FILE_TYPE";
            return callback(error);
        }

        callback(null, true);
    }
});

function singleFile(req, res, next) {
    fileUpload.single("file")(req, res, error => {
        if (!error) return next();

        if (error?.code === "LIMIT_FILE_SIZE") {
            return res.status(413).json({
                success: false,
                reply: "That file is too large. Use a file under 20 MB."
            });
        }

        if (error?.code === "UNSUPPORTED_FILE_TYPE") {
            return res.status(415).json({
                success: false,
                reply: "That file type is not supported yet."
            });
        }

        return res.status(400).json({
            success: false,
            reply: "The file could not be uploaded."
        });
    });
}


/*
======================================================
AMAN AI CHAT ROUTES v5
======================================================

Security rule:
- Every route requires authentication.
- The server decides user identity from req.auth.userId.
- Browser supplied userId is ignored.
- Chat ownership is checked in PostgreSQL.
======================================================
*/


function cleanWorkspace(
    value
) {

    const allowed =
        new Set([
            "general",
            "school",
            "coding",
            "business",
            "safari",
            "agriculture",
            "health",
            "bible"
        ]);

    const workspace =
        String(
            value || "general"
        )
            .trim()
            .toLowerCase();

    return allowed.has(
        workspace
    )
        ? workspace
        : "general";
}


// ======================================================
// AUTHENTICATED CHAT
// ======================================================

router.post(
    "/",
    requireAuth,
    singleFile,
    async (req, res, next) => {

        req.body =
            req.body || {};

        req.body.userId =
            req.auth.userId;

        req.body.workspace =
            cleanWorkspace(
                req.body.workspace
            );

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

            const workspace =
                cleanWorkspace(
                    req.body?.workspace
                );

            const chatId =
                await createChat(
                    userId
                );

            /*
            Persist workspace immediately.
            This works with the existing chatMemory layer
            without changing its public API.
            */

            await updateChatMetadata(
                userId,
                chatId,
                {
                    workspace
                }
            );

            res.json({
                success: true,
                chatId,
                workspace
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
// Optional: /chat/chats?workspace=coding
// ======================================================

router.get(
    "/chats",
    requireAuth,
    async (req, res) => {

        try {

            const userId =
                req.auth.userId;

            const workspace =
                req.query.workspace
                    ? cleanWorkspace(
                        req.query.workspace
                    )
                    : null;

            const chats =
                await getUserChats(
                    userId
                );

            const metadataResult =
                await pool.query(
                    `
                    SELECT
                        chat_id,
                        workspace,
                        is_pinned,
                        is_archived,
                        updated_at
                    FROM chats
                    WHERE user_id = $1
                    `,
                    [userId]
                );

            const metadataMap =
                new Map(
                    metadataResult.rows.map(
                        row => [
                            row.chat_id,
                            row
                        ]
                    )
                );

            let output =
                chats.map(
                    item => {

                        const meta =
                            metadataMap.get(
                                item.chat_id
                            ) || {};

                        return {
                            ...item,
                            workspace:
                                meta.workspace ||
                                "general",
                            is_pinned:
                                Boolean(
                                    meta.is_pinned
                                ),
                            is_archived:
                                Boolean(
                                    meta.is_archived
                                ),
                            updated_at:
                                meta.updated_at ||
                                item.created_at
                        };
                    }
                );

            if (workspace) {

                output =
                    output.filter(
                        item =>
                            item.workspace ===
                            workspace
                    );
            }

            output.sort(
                (a, b) => {

                    if (
                        a.is_pinned !==
                        b.is_pinned
                    ) {

                        return a.is_pinned
                            ? -1
                            : 1;
                    }

                    return (
                        new Date(
                            b.updated_at ||
                            b.created_at
                        ) -
                        new Date(
                            a.updated_at ||
                            a.created_at
                        )
                    );
                }
            );

            res.json(
                output
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
// SEARCH CHATS
// /chat/search?q=physics&workspace=school
// ======================================================

router.get(
    "/search",
    requireAuth,
    async (req, res) => {

        try {

            const query =
                String(
                    req.query.q || ""
                )
                    .trim()
                    .slice(
                        0,
                        120
                    );

            const workspace =
                req.query.workspace
                    ? cleanWorkspace(
                        req.query.workspace
                    )
                    : null;

            if (!query) {

                return res.json([]);
            }

            const results =
                await searchUserChats(
                    req.auth.userId,
                    query,
                    workspace
                );

            res.json(
                results
            );

        } catch (error) {

            console.error(
                "SEARCH CHATS ERROR:",
                error
            );

            res
                .status(500)
                .json([]);
        }
    }
);


// ======================================================
// PERMANENT MEMORY
// ======================================================

router.get(
    "/memory",
    requireAuth,
    async (req, res) => {

        try {

            const memory =
                await getUserMemory(
                    req.auth.userId
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

            const memory =
                req.body.memory || {};

            await saveUserMemory(
                req.auth.userId,
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
// UPDATE CHAT METADATA
// Rename / pin / archive / move workspace
// ======================================================

router.patch(
    "/:chatId",
    requireAuth,
    async (req, res) => {

        try {

            const {
                chatId
            } = req.params;

            const changes = {};

            if (
                typeof req.body?.title ===
                "string"
            ) {

                changes.title =
                    req.body.title;
            }

            if (
                typeof req.body?.workspace ===
                "string"
            ) {

                changes.workspace =
                    cleanWorkspace(
                        req.body.workspace
                    );
            }

            if (
                typeof req.body?.isPinned ===
                "boolean"
            ) {

                changes.isPinned =
                    req.body.isPinned;
            }

            if (
                typeof req.body?.isArchived ===
                "boolean"
            ) {

                changes.isArchived =
                    req.body.isArchived;
            }

            const updated =
                await updateChatMetadata(
                    req.auth.userId,
                    chatId,
                    changes
                );

            if (!updated) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Chat not found."
                    });
            }

            res.json({
                success: true,
                chat: updated
            });

        } catch (error) {

            console.error(
                "UPDATE CHAT ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to update chat."
            });
        }
    }
);


// ======================================================
// REGENERATE LAST RESPONSE
// ======================================================

router.post(
    "/:chatId/regenerate",
    requireAuth,
    async (req, res, next) => {

        try {

            const userId =
                req.auth.userId;

            const chatId =
                req.params.chatId;

            const history =
                await getChat(
                    userId,
                    chatId
                );

            const lastUserMessage =
                [...history]
                    .reverse()
                    .find(
                        item =>
                            item.role ===
                            "user"
                    );

            if (!lastUserMessage) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "No user message to regenerate from."
                    });
            }

            await deleteLastAssistantMessage(
                userId,
                chatId
            );

            /*
            chatController will save the user message again,
            so remove the previous copy first to avoid duplicates.
            */

            await pool.query(
                `
                DELETE FROM messages
                WHERE id = $1
                AND chat_id = $2
                `,
                [
                    lastUserMessage.id,
                    chatId
                ]
            );

            req.body = {
                message:
                    lastUserMessage.content,
                chatId,
                workspace:
                    req.body?.workspace ||
                    "general",
                visionContext:
                    lastUserMessage.vision_context ||
                    "",
                userId
            };

            return chat(
                req,
                res,
                next
            );

        } catch (error) {

            console.error(
                "REGENERATE ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to regenerate response."
            });
        }
    }
);


// ======================================================
// BRANCH CHAT FROM MESSAGE
// ======================================================

router.post(
    "/:chatId/branch",
    requireAuth,
    async (req, res) => {

        try {

            const messageId =
                Number(
                    req.body?.messageId
                );

            if (
                !Number.isInteger(
                    messageId
                ) ||
                messageId <= 0
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid message."
                    });
            }

            const newChatId =
                await branchChat(
                    req.auth.userId,
                    req.params.chatId,
                    messageId
                );

            if (!newChatId) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Could not branch this chat."
                    });
            }

            res.json({
                success: true,
                chatId:
                    newChatId
            });

        } catch (error) {

            console.error(
                "BRANCH ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    "Unable to create branch."
            });
        }
    }
);


// ======================================================
// RATE RESPONSE
// ======================================================

router.post(
    "/:chatId/feedback",
    requireAuth,
    async (req, res) => {

        try {

            const messageId =
                Number(
                    req.body?.messageId
                );

            const rating =
                Number(
                    req.body?.rating
                );

            if (
                !Number.isInteger(
                    messageId
                ) ||
                ![-1, 1].includes(
                    rating
                )
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid feedback."
                    });
            }

            const saved =
                await saveMessageFeedback(
                    req.auth.userId,
                    req.params.chatId,
                    messageId,
                    rating
                );

            if (!saved) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "Response not found."
                    });
            }

            res.json({
                success: true
            });

        } catch (error) {

            console.error(
                "FEEDBACK ERROR:",
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

            const history =
                await getChat(
                    req.auth.userId,
                    req.params.chatId
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

            await deleteChat(
                req.auth.userId,
                req.params.chatId
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

            await deleteAllChats(
                req.auth.userId
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
