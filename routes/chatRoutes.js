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
    pool,
    updateChatMetadata,
    searchUserChats
} = require("../memory/database");

const {
    requireAuth
} = require("../auth/authMiddleware");


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
