// services/aiOrchestrator.js

/**
 * Aman AI - Main AI Orchestrator
 *
 * PURPOSE:
 * - Coordinate normal AI responses
 * - Coordinate live web research
 * - Build prompts safely
 * - Format research sources
 * - Verify research quality
 *
 * IMPORTANT:
 * - Does NOT save chat memory
 * - Does NOT create chat IDs
 * - Does NOT choose the expert itself
 * - Does NOT modify database logic
 *
 * chatController.js will later pass everything into this service.
 */

const {
  getWebSearchDecision
} = require("./webRouter");

const {
  getResearchDecision
} = require("./researchRouter");

const {
  runWebResearch
} = require("./webSearch");

const {
  formatSources
} = require("./sourceFormatter");

const {
  verifyResearchAnswer,
  getVerificationSummary
} = require("./answerVerifier");

const {
  buildResponseMessages,
  getResponseBuildSummary
} = require("./responseBuilder");


/**
 * Get text from a normal Groq response safely.
 */
function extractNormalAnswer(completion) {
  const content =
    completion?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    return "";
  }

  return content.trim();
}


/**
 * Run the normal Aman AI model.
 */
async function runNormalAI({
  groqClient,
  model,
  messages
}) {

  if (
    !groqClient ||
    !groqClient.chat ||
    !groqClient.chat.completions ||
    typeof groqClient.chat.completions.create !== "function"
  ) {
    throw new Error(
      "A valid Groq client was not provided."
    );
  }

  if (!model) {
    throw new Error(
      "Normal AI model is missing."
    );
  }

  const completion =
    await groqClient.chat.completions.create({
      model,
      messages
    });

  const answer =
    extractNormalAnswer(completion);

  if (!answer) {
    throw new Error(
      "Normal AI returned an empty response."
    );
  }

  return {
    answer,
    model:
      completion?.model || model,
    usage:
      completion?.usage || null
  };
}


/**
 * Main Aman AI orchestration function.
 */
async function generateAIResponse({
  groqClient,

  normalModel,

  message,

  expertPrompt,

  expertName = "general",

  memoryText = "",

  history = [],

  country = null,

  topic = "general"
} = {}) {

  const currentMessage =
    String(message || "").trim();

  if (!currentMessage) {
    throw new Error(
      "AI orchestrator received an empty message."
    );
  }


  // ==========================================
  // 1. SHOULD WE SEARCH THE WEB?
  // ==========================================

  const webDecision =
    getWebSearchDecision(currentMessage);

  const shouldSearch =
    Boolean(webDecision.shouldSearch);


  // ==========================================
  // 2. CHOOSE FAST OR DEEP RESEARCH
  // ==========================================

  let researchDecision = {
    mode: "none",
    model: null,
    complexity: 0
  };

  if (shouldSearch) {
    researchDecision =
      getResearchDecision(currentMessage);
  }


  // ==========================================
  // 3. BUILD MODEL MESSAGES
  // ==========================================

  const messages =
    buildResponseMessages({
      message: currentMessage,

      expertPrompt,

      expertName,

      memoryText,

      history,

      webAvailable:
        shouldSearch,

      researchMode:
        shouldSearch
          ? researchDecision.mode
          : "none",

      country,

      topic
    });


  // ==========================================
  // DEBUG SUMMARY
  // ==========================================

  const buildSummary =
    getResponseBuildSummary({
      messages,
      expertName,
      webAvailable: shouldSearch,
      researchMode:
        researchDecision.mode,
      memoryText
    });


  console.log(
    "🧠 AI ORCHESTRATOR:",
    {
      expert:
        expertName,

      webSearch:
        shouldSearch,

      webReason:
        webDecision.reason,

      researchMode:
        researchDecision.mode,

      memoryLoaded:
        buildSummary.memoryLoaded,

      messageCount:
        buildSummary.totalMessages
    }
  );


  // ==========================================
  // 4. NORMAL AI PATH
  // ==========================================

  if (!shouldSearch) {

    const normalResult =
      await runNormalAI({
        groqClient,
        model: normalModel,
        messages
      });

    return {
      success: true,

      answer:
        normalResult.answer,

      model:
        normalResult.model,

      expert:
        expertName,

      searchedWeb: false,

      webReason:
        webDecision.reason,

      researchMode: "none",

      sources: [],

      verification: null,

      usage:
        normalResult.usage
    };
  }


  // ==========================================
  // 5. WEB RESEARCH PATH
  // ==========================================

  const research =
    await runWebResearch({
      groqClient,

      messages,

      mode:
        researchDecision.mode,

      country
    });


  // ==========================================
  // 6. FORMAT SOURCES
  // ==========================================

  const sources =
    formatSources(
      research.sources,
      {
        maxSources: 6,
        includeContent: false
      }
    );


  // ==========================================
  // 7. VERIFY RESEARCH QUALITY
  // ==========================================

  const verification =
    verifyResearchAnswer({
      message:
        currentMessage,

      answer:
        research.answer,

      sources,

      searchedWeb:
        research.searchedWeb,

      mode:
        researchDecision.mode
    });


  console.log(
    "🔎 RESEARCH VERIFICATION:",
    getVerificationSummary(
      verification
    )
  );


  // ==========================================
  // 8. RETURN FINAL RESULT
  // ==========================================

  return {
    success: true,

    answer:
      research.answer,

    model:
      research.model,

    expert:
      expertName,

    searchedWeb: true,

    webReason:
      webDecision.reason,

    researchMode:
      researchDecision.mode,

    sources,

    verification,

    usage:
      research.usage
  };
}


module.exports = {
  generateAIResponse,
  runNormalAI,
  extractNormalAnswer
};
