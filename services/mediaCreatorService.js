// ======================================================
// Aman AI v8
// Creator Mode - Image + Video Generation
// fal.ai queue backend
//
// No API key is exposed to the browser.
// Set FAL_KEY only in Render environment variables.
// ======================================================

const {
    pool
} = require("../memory/database");


const IMAGE_MODEL =
    process.env.AMAN_IMAGE_MODEL ||
    "fal-ai/flux-2";

const VIDEO_MODEL =
    process.env.AMAN_VIDEO_MODEL ||
    "fal-ai/kling-video/v3/standard/text-to-video";


const ALLOWED_IMAGE_SIZES =
    new Set([
        "square_hd",
        "square",
        "portrait_4_3",
        "portrait_16_9",
        "landscape_4_3",
        "landscape_16_9"
    ]);

const ALLOWED_VIDEO_RATIOS =
    new Set([
        "16:9",
        "9:16",
        "1:1"
    ]);

const ALLOWED_VIDEO_DURATIONS =
    new Set([
        "3","4","5","6","7","8",
        "9","10","11","12","13","14","15"
    ]);


let creatorTableReady = false;


// ======================================================
// DATABASE
// ======================================================

async function ensureCreatorJobsTable() {

    if (creatorTableReady) {
        return;
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS creator_jobs (
            request_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
            media_type TEXT NOT NULL,
            model TEXT NOT NULL,
            prompt TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'IN_QUEUE',
            result_url TEXT,
            result_content_type TEXT,
            error_message TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_creator_jobs_user_created
        ON creator_jobs(user_id, created_at DESC)
    `);

    creatorTableReady = true;
}


// ======================================================
// HELPERS
// ======================================================

function requireFalKey() {

    const key =
        String(
            process.env.FAL_KEY || ""
        ).trim();

    if (!key) {

        const error =
            new Error(
                "Creator Mode is not configured yet. Add FAL_KEY to the server environment."
            );

        error.code =
            "CREATOR_NOT_CONFIGURED";

        throw error;
    }

    return key;
}


function normalizePrompt(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 4000);
}


function validatePrompt(
    prompt
) {

    if (!prompt) {

        const error =
            new Error(
                "Please describe what you want to create."
            );

        error.code =
            "INVALID_PROMPT";

        throw error;
    }

    /*
    Keep a small application-level safety gate.
    The generation providers still apply their own
    safety systems as the final moderation layer.
    */
    const lower =
        prompt.toLowerCase();

    const blockedSignals = [
        "sexualized minor",
        "nude child",
        "naked child",
        "child pornography",
        "self harm instructions",
        "suicide instructions"
    ];

    if (
        blockedSignals.some(
            signal =>
                lower.includes(signal)
        )
    ) {

        const error =
            new Error(
                "That media request cannot be generated."
            );

        error.code =
            "UNSAFE_CREATOR_PROMPT";

        throw error;
    }
}


function safeImageSize(
    value
) {

    const size =
        String(
            value || ""
        ).trim();

    return ALLOWED_IMAGE_SIZES.has(
        size
    )
        ? size
        : "landscape_4_3";
}


function safeVideoRatio(
    value
) {

    const ratio =
        String(
            value || ""
        ).trim();

    return ALLOWED_VIDEO_RATIOS.has(
        ratio
    )
        ? ratio
        : "16:9";
}


function safeVideoDuration(
    value
) {

    const duration =
        String(
            value || ""
        ).trim();

    return ALLOWED_VIDEO_DURATIONS.has(
        duration
    )
        ? duration
        : "5";
}


function endpointUrl(
    model,
    suffix = ""
) {

    return (
        "https://queue.fal.run/" +
        model +
        suffix
    );
}


async function falFetch(
    url,
    options = {}
) {

    const key =
        requireFalKey();

    const response =
        await fetch(
            url,
            {
                ...options,

                headers: {
                    "Authorization":
                        `Key ${key}`,

                    "Content-Type":
                        "application/json",

                    ...(options.headers || {})
                }
            }
        );

    let data = {};

    try {

        data =
            await response.json();

    } catch (_) {

        data = {};
    }

    if (!response.ok) {

        const message =
            data?.detail ||
            data?.message ||
            data?.error ||
            `Creator provider returned ${response.status}.`;

        const error =
            new Error(
                typeof message === "string"
                    ? message
                    : JSON.stringify(message)
            );

        error.status =
            response.status;

        error.providerData =
            data;

        throw error;
    }

    return data;
}


async function saveJob({
    requestId,
    userId,
    mediaType,
    model,
    prompt,
    status = "IN_QUEUE"
}) {

    await ensureCreatorJobsTable();

    await pool.query(
        `
        INSERT INTO creator_jobs (
            request_id,
            user_id,
            media_type,
            model,
            prompt,
            status,
            created_at,
            updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
        ON CONFLICT (request_id)
        DO UPDATE SET
            status = EXCLUDED.status,
            updated_at = NOW()
        `,
        [
            requestId,
            userId,
            mediaType,
            model,
            prompt,
            status
        ]
    );
}


async function getOwnedJob(
    userId,
    requestId
) {

    await ensureCreatorJobsTable();

    const result =
        await pool.query(
            `
            SELECT
                request_id,
                user_id,
                media_type,
                model,
                prompt,
                status,
                result_url,
                result_content_type,
                error_message,
                created_at,
                updated_at
            FROM creator_jobs
            WHERE user_id = $1
            AND request_id = $2
            LIMIT 1
            `,
            [
                userId,
                requestId
            ]
        );

    return (
        result.rows[0] ||
        null
    );
}


async function updateJob(
    userId,
    requestId,
    {
        status,
        resultUrl,
        resultContentType,
        errorMessage
    }
) {

    await ensureCreatorJobsTable();

    await pool.query(
        `
        UPDATE creator_jobs
        SET
            status = COALESCE($3, status),
            result_url = COALESCE($4, result_url),
            result_content_type = COALESCE($5, result_content_type),
            error_message = COALESCE($6, error_message),
            updated_at = NOW()
        WHERE user_id = $1
        AND request_id = $2
        `,
        [
            userId,
            requestId,
            status || null,
            resultUrl || null,
            resultContentType || null,
            errorMessage || null
        ]
    );
}


// ======================================================
// CREATE IMAGE JOB
// ======================================================

async function createImageJob({
    userId,
    prompt,
    imageSize
}) {

    const cleanPrompt =
        normalizePrompt(
            prompt
        );

    validatePrompt(
        cleanPrompt
    );

    const input = {

        prompt:
            cleanPrompt,

        image_size:
            safeImageSize(
                imageSize
            ),

        num_images:
            1,

        enable_prompt_expansion:
            true,

        enable_safety_checker:
            true,

        output_format:
            "png"
    };


    const submitted =
        await falFetch(
            endpointUrl(
                IMAGE_MODEL
            ),
            {
                method:
                    "POST",

                body:
                    JSON.stringify(
                        input
                    )
            }
        );


    const requestId =
        submitted.request_id;

    if (!requestId) {

        throw new Error(
            "Image provider did not return a request ID."
        );
    }


    await saveJob({
        requestId,
        userId,
        mediaType:
            "image",
        model:
            IMAGE_MODEL,
        prompt:
            cleanPrompt,
        status:
            "IN_QUEUE"
    });


    return {
        requestId,
        mediaType:
            "image",
        status:
            "IN_QUEUE",
        model:
            IMAGE_MODEL
    };
}


// ======================================================
// CREATE VIDEO JOB
// ======================================================

async function createVideoJob({
    userId,
    prompt,
    duration,
    aspectRatio,
    generateAudio
}) {

    const cleanPrompt =
        normalizePrompt(
            prompt
        );

    validatePrompt(
        cleanPrompt
    );

    const input = {

        prompt:
            cleanPrompt,

        duration:
            safeVideoDuration(
                duration
            ),

        aspect_ratio:
            safeVideoRatio(
                aspectRatio
            ),

        generate_audio:
            Boolean(
                generateAudio
            ),

        shot_type:
            "intelligent",

        negative_prompt:
            "blur, distort, low quality"
    };


    const submitted =
        await falFetch(
            endpointUrl(
                VIDEO_MODEL
            ),
            {
                method:
                    "POST",

                body:
                    JSON.stringify(
                        input
                    )
            }
        );


    const requestId =
        submitted.request_id;

    if (!requestId) {

        throw new Error(
            "Video provider did not return a request ID."
        );
    }


    await saveJob({
        requestId,
        userId,
        mediaType:
            "video",
        model:
            VIDEO_MODEL,
        prompt:
            cleanPrompt,
        status:
            "IN_QUEUE"
    });


    return {
        requestId,
        mediaType:
            "video",
        status:
            "IN_QUEUE",
        model:
            VIDEO_MODEL
    };
}


// ======================================================
// STATUS + RESULT
// ======================================================

async function getCreatorJobStatus({
    userId,
    requestId
}) {

    const job =
        await getOwnedJob(
            userId,
            requestId
        );

    if (!job) {

        const error =
            new Error(
                "Creator job not found."
            );

        error.code =
            "CREATOR_JOB_NOT_FOUND";

        throw error;
    }


    if (
        job.result_url
    ) {

        return {
            requestId:
                job.request_id,

            mediaType:
                job.media_type,

            status:
                "COMPLETED",

            url:
                job.result_url,

            contentType:
                job.result_content_type ||
                (
                    job.media_type === "video"
                        ? "video/mp4"
                        : "image/png"
                )
        };
    }


    const statusData =
        await falFetch(
            endpointUrl(
                job.model,
                `/requests/${encodeURIComponent(requestId)}/status?logs=1`
            ),
            {
                method:
                    "GET"
            }
        );


    const status =
        String(
            statusData.status ||
            job.status ||
            "IN_QUEUE"
        );


    if (
        status !== "COMPLETED"
    ) {

        await updateJob(
            userId,
            requestId,
            {
                status,
                errorMessage:
                    statusData.error ||
                    null
            }
        );


        return {
            requestId,
            mediaType:
                job.media_type,
            status,
            queuePosition:
                statusData.queue_position ??
                null
        };
    }


    /*
    fal's REST queue result endpoint is:
    /requests/{request_id}
    */
    const result =
        await falFetch(
            endpointUrl(
                job.model,
                `/requests/${encodeURIComponent(requestId)}`
            ),
            {
                method:
                    "GET"
            }
        );


    let media = null;


    if (
        job.media_type ===
        "image"
    ) {

        media =
            result?.images?.[0] ||
            null;

    } else {

        media =
            result?.video ||
            null;
    }


    const url =
        media?.url ||
        null;


    if (!url) {

        const error =
            new Error(
                "Generation completed but no media URL was returned."
            );

        await updateJob(
            userId,
            requestId,
            {
                status:
                    "FAILED",
                errorMessage:
                    error.message
            }
        );

        throw error;
    }


    const contentType =
        media?.content_type ||
        (
            job.media_type ===
            "video"
                ? "video/mp4"
                : "image/png"
        );


    await updateJob(
        userId,
        requestId,
        {
            status:
                "COMPLETED",

            resultUrl:
                url,

            resultContentType:
                contentType
        }
    );


    return {
        requestId,
        mediaType:
            job.media_type,
        status:
            "COMPLETED",
        url,
        contentType
    };
}


// ======================================================
// EXPORTS
// ======================================================

module.exports = {

    IMAGE_MODEL,
    VIDEO_MODEL,

    ensureCreatorJobsTable,

    createImageJob,
    createVideoJob,
    getCreatorJobStatus
};
