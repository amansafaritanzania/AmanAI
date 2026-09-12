// services/responseBuilder.js

/**
 * Aman AI - Response Builder
 *
 * PURPOSE:
 * Build the final messages array sent to Groq.
 *
 * Order:
 * 1. Core quality rules
 * 2. Expert instructions
 * 3. Language instructions
 * 4. Permanent/account memory
 * 5. Research instructions (web mode only)
 * 6. Recent chat history
 * 7. Current user message
 *
 * IMPORTANT:
 * - Does NOT call Groq
 * - Does NOT save memory
 * - Does NOT choose the expert
 * - Does NOT search the web
 */

const {
  getCoreQualityPrompt
} = require("../prompts/coreQuality");

const {
  getLanguageInstruction
} = require("./languageRouter");

const {
  getResearchPrompt
} = require("./researchPrompt");


/**
 * Only allow valid chat roles.
 */
const VALID_ROLES = new Set([
  "system",
  "user",
  "assistant"
]);


/**
 * Clean a single history message.
 */
function cleanHistoryMessage(item) {
  if (!item || typeof item !== "object") {
    return null;
  }

  const role =
    typeof item.role === "string"
      ? item.role.trim().toLowerCase()
      : "";

  const content =
    typeof item.content === "string"
      ? item.content.trim()
      : "";

  if (!VALID_ROLES.has(role)) {
    return null;
  }

  if (!content) {
    return null;
  }

  return {
    role,
    content
  };
}


/**
 * Clean history before sending it to the model.
 */
function cleanHistory(history = []) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .map(cleanHistoryMessage)
    .filter(Boolean);
}


/**
 * Prevent duplication of the current user message.
 *
 * Your existing controller may save the user's message
 * before loading history.
 *
 * That can cause:
 *
 * history:
 * user -> "hello"
 *
 * then controller adds:
 * user -> "hello"
 *
 * again.
 *
 * This function removes that final duplicate.
 */
function removeCurrentMessageDuplicate(
  history = [],
  currentMessage = ""
) {
  const cleaned =
    cleanHistory(history);

  if (!cleaned.length) {
    return cleaned;
  }

  const current =
    String(currentMessage).trim();

  if (!current) {
    return cleaned;
  }

  const last =
    cleaned[cleaned.length - 1];

  if (
    last.role === "user" &&
    last.content.trim() === current
  ) {
    return cleaned.slice(0, -1);
  }

  return cleaned;
}


/**
 * Convert memory into a safe system message.
 *
 * memoryText should already come from your
 * permanent-memory system.
 */
function buildMemoryPrompt(memoryText = "") {
  const memory =
    String(memoryText).trim();

  if (!memory) {
    return "";
  }

  return `
==================================================
USER MEMORY
==================================================

The following information comes from Aman AI's
stored memory for this user.

Use it only when relevant.

Do not invent additional memories.

If the user's newest message contradicts an older
memory, prefer the newest information.

Do not unnecessarily repeat private or personal
details.

STORED MEMORY:

${memory}
`;
}


/**
 * Build the final model messages.
 */
function buildResponseMessages({
  message = "",

  expertPrompt = "",

  expertName = "general",

  memoryText = "",

  history = [],

  webAvailable = false,

  researchMode = "fast",

  country = null,

  topic = "general"
} = {}) {

  const currentMessage =
    String(message).trim();

  if (!currentMessage) {
    throw new Error(
      "ResponseBuilder requires a user message."
    );
  }


  // ==========================================
  // 1. CORE QUALITY
  // ==========================================

  const corePrompt =
    getCoreQualityPrompt({
      webAvailable,
      expert: expertName
    });


  // ==========================================
  // 2. EXPERT PROMPT
  // ==========================================

  const expert =
    String(expertPrompt).trim();


  // ==========================================
  // 3. LANGUAGE RULES
  // ==========================================

  const languagePrompt =
    getLanguageInstruction();


  // ==========================================
  // 4. MEMORY
  // ==========================================

  const memoryPrompt =
    buildMemoryPrompt(memoryText);


  // ==========================================
  // 5. RESEARCH RULES
  // ==========================================

  let researchPrompt = "";

  if (webAvailable) {
    researchPrompt =
      getResearchPrompt({
        country,
        topic
      });
  }


  // ==========================================
  // BUILD SYSTEM PROMPTS
  // ==========================================

  const messages = [];


  if (corePrompt) {
    messages.push({
      role: "system",
      content: corePrompt
    });
  }


  if (expert) {
    messages.push({
      role: "system",
      content: `
==================================================
ACTIVE EXPERT INSTRUCTIONS
==================================================

${expert}
`
    });
  }


  if (languagePrompt) {
    messages.push({
      role: "system",
      content: languagePrompt
    });
  }


  if (memoryPrompt) {
    messages.push({
      role: "system",
      content: memoryPrompt
    });
  }


  if (researchPrompt) {
    messages.push({
      role: "system",
      content: researchPrompt
    });
  }


  // ==========================================
  // CHAT HISTORY
  // ==========================================

  const safeHistory =
    removeCurrentMessageDuplicate(
      history,
      currentMessage
    );


  messages.push(
    ...safeHistory
  );


  // ==========================================
  // CURRENT USER MESSAGE
  // ==========================================

  messages.push({
    role: "user",
    content: currentMessage
  });


  return messages;
}


/**
 * Small helper for logs.
 *
 * Does NOT expose actual memory contents.
 */
function getResponseBuildSummary({
  messages = [],
  expertName = "general",
  webAvailable = false,
  researchMode = "fast",
  memoryText = ""
} = {}) {

  const systemMessages =
    messages.filter(
      item => item.role === "system"
    ).length;

  const userMessages =
    messages.filter(
      item => item.role === "user"
    ).length;

  const assistantMessages =
    messages.filter(
      item => item.role === "assistant"
    ).length;

  return {
    expert: expertName,

    webAvailable:
      Boolean(webAvailable),

    researchMode,

    memoryLoaded:
      Boolean(
        String(memoryText).trim()
      ),

    totalMessages:
      messages.length,

    systemMessages,

    userMessages,

    assistantMessages
  };
}


module.exports = {
  buildResponseMessages,
  buildMemoryPrompt,
  cleanHistory,
  cleanHistoryMessage,
  removeCurrentMessageDuplicate,
  getResponseBuildSummary
};
