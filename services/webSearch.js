// services/webSearch.js

/**
 * Aman AI - Web Research Service
 *
 * PURPOSE:
 * - Search current information using Groq Compound
 * - Visit websites when deeper verification is needed
 * - Return the final answer
 * - Return raw source information
 *
 * IMPORTANT:
 * This file does NOT modify chat memory.
 * This file does NOT modify expert routing.
 * This file does NOT modify the normal AI model.
 *
 * chatController.js will connect to it later.
 */

const FULL_WEB_MODEL = "groq/compound";
const FAST_WEB_MODEL = "groq/compound-mini";


/**
 * Make sure we received valid messages.
 */
function validateMessages(messages) {
  if (!Array.isArray(messages)) {
    throw new Error("Web search requires a messages array.");
  }

  if (messages.length === 0) {
    throw new Error("Web search received an empty messages array.");
  }

  return messages.filter(
    msg =>
      msg &&
      typeof msg === "object" &&
      typeof msg.role === "string" &&
      typeof msg.content === "string"
  );
}


/**
 * Extract search results returned by Groq Compound.
 *
 * We keep this fairly raw for now.
 * sourceFormatter.js will improve formatting later.
 */
function extractSearchResults(executedTools = []) {
  const results = [];

  if (!Array.isArray(executedTools)) {
    return results;
  }

  for (const tool of executedTools) {
    const searchResults = tool?.search_results?.results;

    if (!Array.isArray(searchResults)) {
      continue;
    }

    for (const result of searchResults) {
      if (!result?.url) {
        continue;
      }

      results.push({
        title:
          typeof result.title === "string"
            ? result.title.trim()
            : "Source",

        url: result.url,

        content:
          typeof result.content === "string"
            ? result.content.trim()
            : "",

        score:
          typeof result.score === "number"
            ? result.score
            : null
      });
    }
  }

  return results;
}


/**
 * Remove duplicate URLs.
 *
 * Final advanced source filtering will still live
 * inside sourceFormatter.js later.
 */
function removeDuplicateSources(sources = []) {
  const seen = new Set();

  return sources.filter(source => {
    if (!source?.url) {
      return false;
    }

    const normalizedUrl = source.url
      .trim()
      .replace(/\/$/, "")
      .toLowerCase();

    if (seen.has(normalizedUrl)) {
      return false;
    }

    seen.add(normalizedUrl);

    return true;
  });
}


/**
 * Decide which Compound model to use.
 *
 * FAST:
 * groq/compound-mini
 * - one tool call
 * - lower latency
 *
 * DEEP:
 * groq/compound
 * - multiple tool calls
 * - better for research / verification
 */
function getWebModel(mode = "deep") {
  return mode === "fast"
    ? FAST_WEB_MODEL
    : FULL_WEB_MODEL;
}


/**
 * Main web research function.
 *
 * groqClient:
 * We receive the existing Groq client from chatController later.
 * This means this file does NOT need to know how config/groq.js exports it.
 */
async function runWebResearch({
  groqClient,
  messages,
  mode = "deep",
  country = null,
  includeDomains = [],
  excludeDomains = []
}) {
  if (
    !groqClient ||
    !groqClient.chat ||
    !groqClient.chat.completions ||
    typeof groqClient.chat.completions.create !== "function"
  ) {
    throw new Error(
      "A valid Groq client was not provided to webSearch."
    );
  }

  const validMessages = validateMessages(messages);

  if (validMessages.length === 0) {
    throw new Error(
      "No valid messages were available for web research."
    );
  }

  const model = getWebModel(mode);

  const searchSettings = {};

  // Country is optional.
  // We won't hardcode Tanzania yet.
  if (
    typeof country === "string" &&
    country.trim()
  ) {
    searchSettings.country = country.trim();
  }

  if (
    Array.isArray(includeDomains) &&
    includeDomains.length > 0
  ) {
    searchSettings.include_domains =
      includeDomains.filter(Boolean);
  }

  if (
    Array.isArray(excludeDomains) &&
    excludeDomains.length > 0
  ) {
    searchSettings.exclude_domains =
      excludeDomains.filter(Boolean);
  }

  const request = {
    model,

    messages: validMessages,

    // Ask Groq to include citations in generated answers.
    citation_options: "enabled",

    // For this service we ONLY need internet research.
    // No code execution or Wolfram here.
    compound_custom: {
      tools: {
        enabled_tools: [
          "web_search",
          "visit_website"
        ]
      }
    }
  };

  if (Object.keys(searchSettings).length > 0) {
    request.search_settings = searchSettings;
  }

  let completion;

  try {
    completion =
      await groqClient.chat.completions.create(request);
  } catch (error) {
    console.error(
      "🌐 WEB RESEARCH ERROR:",
      error?.message || error
    );

    throw new Error(
      "Aman AI could not complete web research."
    );
  }

  const aiMessage =
    completion?.choices?.[0]?.message;

  if (!aiMessage) {
    throw new Error(
      "Web research returned no AI message."
    );
  }

  const answer =
    typeof aiMessage.content === "string"
      ? aiMessage.content.trim()
      : "";

  const executedTools = Array.isArray(
    aiMessage.executed_tools
  )
    ? aiMessage.executed_tools
    : [];

  const rawSources =
    extractSearchResults(executedTools);

  const sources =
    removeDuplicateSources(rawSources);

  return {
    success: true,

    answer,

    model:
      completion?.model ||
      model,

    searchedWeb:
      executedTools.length > 0,

    sources,

    sourceCount:
      sources.length,

    usage:
      completion?.usage || null
  };
}


module.exports = {
  runWebResearch,
  extractSearchResults,
  removeDuplicateSources,
  getWebModel
};
