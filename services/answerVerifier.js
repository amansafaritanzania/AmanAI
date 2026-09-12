// services/answerVerifier.js

/**
 * Aman AI - Answer Verifier
 *
 * PURPOSE:
 * - Check whether a researched answer has enough supporting evidence
 * - Detect empty / weak research responses
 * - Detect suspiciously confident answers with no sources
 * - Return warnings to chatController
 *
 * IMPORTANT:
 * This verifier does NOT change memory.
 * It does NOT perform web search.
 * It does NOT call another AI model.
 */


/**
 * Topics where stronger evidence is especially important.
 */
const highImportancePatterns = [
  /\blaw\b/i,
  /\blegal\b/i,
  /\bregulation\b/i,
  /\bgovernment\b/i,
  /\belection\b/i,
  /\bpresident\b/i,
  /\bminister\b/i,

  /\bhealth\b/i,
  /\bmedical\b/i,
  /\bdisease\b/i,
  /\bmedicine\b/i,

  /\bvisa\b/i,
  /\bentry requirements?\b/i,

  /\bprice\b/i,
  /\bexchange rate\b/i,

  /\bscientific\b/i,
  /\bresearch\b/i,

  /\bdeadline\b/i,
  /\brequirements?\b/i
];


/**
 * Detect whether question deserves stronger verification.
 */
function isHighImportanceQuestion(message = "") {
  const text = String(message);

  return highImportancePatterns.some(
    pattern => pattern.test(text)
  );
}


/**
 * Detect whether an answer looks usable.
 */
function hasUsableAnswer(answer = "") {
  const text = String(answer).trim();

  if (!text) {
    return false;
  }

  // Prevent tiny or broken outputs being treated as valid.
  return text.length >= 20;
}


/**
 * Count unique valid domains.
 */
function countUniqueDomains(sources = []) {
  const domains = new Set();

  for (const source of sources) {
    if (
      source &&
      typeof source.domain === "string" &&
      source.domain.trim()
    ) {
      domains.add(
        source.domain.trim().toLowerCase()
      );
    }
  }

  return domains.size;
}


/**
 * Detect whether at least one stronger source exists.
 *
 * This is intentionally broad.
 * It does NOT claim every matching domain is automatically correct.
 */
function hasStrongSource(sources = []) {
  return sources.some(source => {
    const domain =
      String(source?.domain || "")
        .toLowerCase();

    if (!domain) {
      return false;
    }

    return (
      domain.endsWith(".gov") ||
      domain.includes(".gov.") ||
      domain.endsWith(".go.tz") ||

      domain.endsWith(".edu") ||
      domain.includes(".edu.") ||
      domain.endsWith(".ac.tz") ||

      domain.endsWith(".int") ||

      domain === "who.int" ||
      domain.endsWith(".who.int") ||

      domain === "un.org" ||
      domain.endsWith(".un.org") ||

      domain === "worldbank.org" ||
      domain.endsWith(".worldbank.org") ||

      domain === "fao.org" ||
      domain.endsWith(".fao.org") ||

      domain === "reuters.com" ||
      domain.endsWith(".reuters.com") ||

      domain === "apnews.com" ||
      domain.endsWith(".apnews.com") ||

      domain === "bbc.com" ||
      domain.endsWith(".bbc.com")
    );
  });
}


/**
 * Main verification function.
 */
function verifyResearchAnswer({
  message = "",
  answer = "",
  sources = [],
  searchedWeb = false,
  mode = "fast"
} = {}) {

  const warnings = [];

  const highImportance =
    isHighImportanceQuestion(message);

  const usableAnswer =
    hasUsableAnswer(answer);

  const sourceCount =
    Array.isArray(sources)
      ? sources.length
      : 0;

  const uniqueDomains =
    countUniqueDomains(sources);

  const strongSource =
    hasStrongSource(sources);


  // ------------------------------
  // Answer checks
  // ------------------------------

  if (!usableAnswer) {
    warnings.push(
      "missing_or_incomplete_answer"
    );
  }


  // ------------------------------
  // Search checks
  // ------------------------------

  if (!searchedWeb) {
    warnings.push(
      "web_search_not_executed"
    );
  }

  if (sourceCount === 0) {
    warnings.push(
      "no_sources_returned"
    );
  }


  // ------------------------------
  // High-importance checks
  // ------------------------------

  if (highImportance) {

    if (sourceCount < 2) {
      warnings.push(
        "insufficient_sources_for_important_topic"
      );
    }

    if (uniqueDomains < 2) {
      warnings.push(
        "insufficient_independent_sources"
      );
    }

    if (!strongSource) {
      warnings.push(
        "no_strong_source_detected"
      );
    }
  }


  // ------------------------------
  // Deep research checks
  // ------------------------------

  if (
    mode === "deep" &&
    sourceCount < 2
  ) {
    warnings.push(
      "deep_research_has_too_few_sources"
    );
  }


  // ------------------------------
  // Confidence level
  // ------------------------------

  let confidence = "high";

  if (warnings.length >= 3) {
    confidence = "low";
  } else if (warnings.length > 0) {
    confidence = "medium";
  }


  // Critical problems mean controller should
  // avoid presenting the result as fully verified.
  const criticalWarnings = [
    "missing_or_incomplete_answer",
    "web_search_not_executed",
    "no_sources_returned"
  ];

  const hasCriticalProblem =
    warnings.some(warning =>
      criticalWarnings.includes(warning)
    );


  return {
    verified:
      usableAnswer &&
      !hasCriticalProblem,

    confidence,

    highImportance,

    sourceCount,

    uniqueDomains,

    hasStrongSource:
      strongSource,

    warnings
  };
}


/**
 * Human-readable log helper.
 */
function getVerificationSummary(result = {}) {
  return {
    verified:
      Boolean(result.verified),

    confidence:
      result.confidence || "unknown",

    sources:
      result.sourceCount || 0,

    uniqueDomains:
      result.uniqueDomains || 0,

    warnings:
      Array.isArray(result.warnings)
        ? result.warnings
        : []
  };
}


module.exports = {
  verifyResearchAnswer,
  getVerificationSummary,
  isHighImportanceQuestion,
  hasUsableAnswer,
  countUniqueDomains,
  hasStrongSource
};
