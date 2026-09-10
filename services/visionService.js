// ======================================================
// Aman AI Vision Service v1
// ======================================================

const groq = require("../config/groq");

const VISION_MODEL =
    process.env.GROQ_VISION_MODEL ||
    "qwen/qwen3.6-27b";

const SUPPORTED_IMAGE_TYPES =
    new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif"
    ]);

const MAX_IMAGE_BYTES =
    20 * 1024 * 1024;


function validateImage(
    buffer,
    mimeType
) {

    if (
        !Buffer.isBuffer(buffer) ||
        buffer.length === 0
    ) {

        throw new Error(
            "Image data is missing."
        );
    }

    if (
        buffer.length >
        MAX_IMAGE_BYTES
    ) {

        const error =
            new Error(
                "Image exceeds the 20 MB limit."
            );

        error.code =
            "IMAGE_TOO_LARGE";

        throw error;
    }

    if (
        !SUPPORTED_IMAGE_TYPES.has(
            mimeType
        )
    ) {

        const error =
            new Error(
                "Unsupported image type."
            );

        error.code =
            "UNSUPPORTED_IMAGE_TYPE";

        throw error;
    }
}


function buildVisionPrompt(
    userMessage = ""
) {

    return `
You are Aman AI's internal visual understanding system.

Analyze the uploaded image carefully for another Aman AI
expert.

USER REQUEST:
${String(userMessage || "").trim() || "Analyze this image."}

Extract only what is supported by the image.

When relevant, include:
- visible objects, people, plants, animals or environment
- visible text, labels, error messages or code
- charts, diagrams, tables or handwritten work
- crop or plant symptoms that are visibly present
- UI/software details visible in screenshots
- uncertainty when details cannot be confirmed

Do not identify a real person's name from appearance.
Do not invent hidden details.
Do not turn a possible plant disease into a confirmed diagnosis.
Do not prescribe agricultural chemicals from an image alone.
Do not make a medical diagnosis from an image alone.
If text is unreadable, say so.

Return concise factual visual evidence.
`;
}


async function analyzeImage({
    buffer,
    mimeType,
    userMessage
}) {

    validateImage(
        buffer,
        mimeType
    );

    const base64 =
        buffer.toString(
            "base64"
        );

    const completion =
        await groq.chat.completions.create({

            model:
                VISION_MODEL,

            temperature:
                0.2,

            max_completion_tokens:
                1000,

            messages: [
                {
                    role:
                        "user",

                    content: [
                        {
                            type:
                                "text",

                            text:
                                buildVisionPrompt(
                                    userMessage
                                )
                        },
                        {
                            type:
                                "image_url",

                            image_url: {
                                url:
                                    `data:${mimeType};base64,${base64}`
                            }
                        }
                    ]
                }
            ]
        });

    const analysis =
        completion
            .choices?.[0]
            ?.message?.content
            ?.trim();

    if (!analysis) {

        throw new Error(
            "Vision model returned no analysis."
        );
    }

    return analysis;
}


module.exports = {
    VISION_MODEL,
    SUPPORTED_IMAGE_TYPES,
    MAX_IMAGE_BYTES,
    analyzeImage
};
