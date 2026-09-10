// ======================================================
// Aman AI File Intelligence Service v1
// PDF, DOCX, TXT, Markdown, CSV, JSON and code files
// ======================================================

const path = require("path");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_EXTRACTED_CHARS = 50000;

const IMAGE_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
]);

const DOCUMENT_EXTENSIONS = new Set([
    ".pdf", ".docx", ".txt", ".md", ".csv", ".json",
    ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
    ".html", ".htm", ".css", ".scss",
    ".py", ".java", ".php", ".rb", ".go", ".rs",
    ".c", ".h", ".cpp", ".hpp", ".cs", ".sql",
    ".xml", ".yaml", ".yml", ".sh", ".bat", ".ps1",
    ".ini", ".toml"
]);

function extensionOf(filename = "") {
    return path.extname(String(filename)).toLowerCase();
}

function isImageFile(file) {
    return Boolean(file && IMAGE_TYPES.has(file.mimetype));
}

function isDocumentFile(file) {
    return Boolean(
        file &&
        DOCUMENT_EXTENSIONS.has(extensionOf(file.originalname))
    );
}

function cleanText(text) {
    const value = String(text || "")
        .replace(/\u0000/g, "")
        .trim();

    if (value.length <= MAX_EXTRACTED_CHARS) {
        return value;
    }

    return (
        value.slice(0, MAX_EXTRACTED_CHARS) +
        "\n\n[Document content truncated for this request.]"
    );
}

async function extractDocument(file) {
    if (!file || !Buffer.isBuffer(file.buffer)) {
        const error = new Error("Uploaded file is missing.");
        error.code = "FILE_MISSING";
        throw error;
    }

    if (file.size > MAX_FILE_BYTES) {
        const error = new Error("File is too large.");
        error.code = "FILE_TOO_LARGE";
        throw error;
    }

    const ext = extensionOf(file.originalname);

    if (!DOCUMENT_EXTENSIONS.has(ext)) {
        const error = new Error("Unsupported file type.");
        error.code = "UNSUPPORTED_FILE_TYPE";
        throw error;
    }

    let text = "";
    let kind = "text";

    if (ext === ".pdf") {
        const parsed = await pdfParse(file.buffer);
        text = parsed.text || "";
        kind = "pdf";
    } else if (ext === ".docx") {
        const parsed = await mammoth.extractRawText({
            buffer: file.buffer
        });
        text = parsed.value || "";
        kind = "docx";
    } else {
        text = file.buffer.toString("utf8");

        if ([
            ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx",
            ".html", ".htm", ".css", ".scss",
            ".py", ".java", ".php", ".rb", ".go", ".rs",
            ".c", ".h", ".cpp", ".hpp", ".cs", ".sql",
            ".sh", ".bat", ".ps1"
        ].includes(ext)) {
            kind = "code";
        } else if (ext === ".csv") {
            kind = "csv";
        } else if (ext === ".json") {
            kind = "json";
        } else if (ext === ".md") {
            kind = "markdown";
        }
    }

    text = cleanText(text);

    if (!text) {
        const error = new Error(
            "No readable text could be extracted from this file."
        );
        error.code = "EMPTY_DOCUMENT";
        throw error;
    }

    return {
        filename: file.originalname,
        extension: ext,
        kind,
        text
    };
}

function buildDocumentContext(documentData) {
    if (!documentData) return "";

    return `
==================================================
UPLOADED FILE
==================================================

Name: ${documentData.filename}
Type: ${documentData.kind}

CONTENT:
${documentData.text}

RULES:
- Treat this file as user-provided evidence.
- Answer from the actual extracted content.
- Do not invent missing pages, rows, fields, code or facts.
- For code, inspect the uploaded code itself before proposing changes.
- For CSV/JSON, reason from the provided data only.
- If extraction is incomplete, say so.
`;
}

module.exports = {
    MAX_FILE_BYTES,
    IMAGE_TYPES,
    DOCUMENT_EXTENSIONS,
    isImageFile,
    isDocumentFile,
    extractDocument,
    buildDocumentContext
};
