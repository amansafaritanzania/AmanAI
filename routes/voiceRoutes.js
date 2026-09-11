const express = require("express");
const groq = require("../config/groq");
const { requireAuth } = require("../auth/authMiddleware");

const router = express.Router();

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

function cleanMime(value = "") {
    return String(value)
        .split(";")[0]
        .trim()
        .toLowerCase();
}

function extensionForMime(mime) {
    const map = {
        "audio/webm": "webm",
        "audio/ogg": "ogg",
        "audio/mp4": "mp4",
        "audio/mpeg": "mp3",
        "audio/mp3": "mp3",
        "audio/wav": "wav",
        "audio/x-wav": "wav",
        "audio/m4a": "m4a",
        "audio/x-m4a": "m4a"
    };
    return map[mime] || null;
}

function cleanLanguage(value = "") {
    const code = String(value)
        .trim()
        .toLowerCase()
        .split("-")[0];

    return /^[a-z]{2}$/.test(code)
        ? code
        : undefined;
}

router.post(
    "/transcribe",
    requireAuth,
    async (req, res) => {
        try {
            const raw =
                String(req.body?.audioBase64 || "");

            const mime =
                cleanMime(req.body?.mimeType);

            const extension =
                extensionForMime(mime);

            if (!raw || !extension) {
                return res.status(400).json({
                    success: false,
                    message:
                        "A supported voice recording is required."
                });
            }

            const base64 =
                raw.includes(",")
                    ? raw.slice(raw.indexOf(",") + 1)
                    : raw;

            let buffer;

            try {
                buffer =
                    Buffer.from(base64, "base64");
            } catch {
                buffer = null;
            }

            if (
                !buffer ||
                buffer.length < 200
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "The voice recording was empty."
                });
            }

            if (
                buffer.length >
                MAX_AUDIO_BYTES
            ) {
                return res.status(413).json({
                    success: false,
                    message:
                        "That voice recording is too large. Try a shorter turn."
                });
            }

            const file =
                new File(
                    [buffer],
                    `aman-voice.${extension}`,
                    { type: mime }
                );

            const language =
                cleanLanguage(
                    req.body?.language
                );

            const request = {
                file,
                model:
                    process.env.AMAN_STT_MODEL ||
                    "whisper-large-v3-turbo",
                response_format: "json",
                temperature: 0,
                prompt:
                    "Aman AI voice conversation. Preserve names, school subjects, technical terms, English and Kiswahili exactly as spoken."
            };

            if (language) {
                request.language =
                    language;
            }

            const transcription =
                await groq.audio.transcriptions.create(
                    request
                );

            const text =
                String(
                    transcription?.text ||
                    ""
                ).trim();

            if (!text) {
                return res.status(422).json({
                    success: false,
                    message:
                        "I could not hear clear speech. Please try again."
                });
            }

            return res.json({
                success: true,
                text
            });

        } catch (error) {
            console.error(
                "VOICE TRANSCRIPTION ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Voice transcription is temporarily unavailable."
            });
        }
    }
);

module.exports = router;
