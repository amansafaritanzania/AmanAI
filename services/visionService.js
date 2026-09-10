// ======================================================
// Vision Service
// ======================================================

const groq = require("../config/groq");

async function analyzeImage({
    prompt,
    imageBase64,
    mimeType = "image/jpeg"
}) {
    if (!imageBase64) {
        throw new Error("Missing imageBase64");
    }

    const completion =
        await groq.chat.completions.create({
            model: "qwen/qwen3.6-27b-vision",
            temperature: 0.2,
            max_tokens: 1200,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text:
                                prompt ||
                                "Analyze this image carefully and describe what is visible."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:${mimeType};base64,${imageBase64}`
                            }
                        }
                    ]
                }
            ]
        });

    return (
        completion.choices?.[0]?.message?.content ||
        "I could not analyze the image."
    );
}

module.exports = {
    analyzeImage
};
