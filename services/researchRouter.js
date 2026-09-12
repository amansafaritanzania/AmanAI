// services/researchRouter.js

/**
 * Aman AI - Research Router
 *
 * PURPOSE:
 * - Decide whether a web-enabled question needs:
 *      FAST research  -> groq/compound-mini
 *      DEEP research  -> groq/compound
 *
 * This file does NOT perform web search.
 * webSearch.js performs the actual request.
 */


/**
 * Patterns suggesting deeper verification.
 */
const deepResearchPatterns = [
  /\bcompare\b/i,
  /\bcomparison\b/i,
  /\bversus\b/i,
  /\bvs\b/i,

  /\bwhy\b/i,
  /\banalyze\b/i,
  /\banalysis\b/i,
  /\binvestigate\b/i,
  /\bresearch\b/i,
  /\bverify\b/i,
  /\bconfirm\b/i,
  /\bfact[- ]?check\b/i,

  /\bmultiple sources\b/i,
  /\breliable sources\b/i,
  /\bofficial sources\b/i,

  /\bwhat happened\b/i,
  /\bwhat caused\b/i,
  /\bwhat led to\b/i,

  /\blaw\b/i,
  /\bregulation\b/i,
  /\bpolicy\b/i,

  /\belection\b/i,
  /\bpolitics\b/i,
  /\bgovernment\b/i,

  /\bhealth\b/i,
  /\bmedical\b/i,
  /\bscientific\b/i,
  /\bresearch study\b/i,

  /\bvisa\b/i,
  /\btravel requirements?\b/i,
  /\bentry requirements?\b/i,

  /\bAPI\b/i,
  /\bdeprecated\b/i,
  /\bdecommissioned\b/i,
  /\bbreaking change\b/i
];


/**
 * Patterns usually suitable for one quick lookup.
 */
const fastResearchPatterns = [
  /\bweather\b/i,
  /\btemperature\b/i,

  /\bscore\b/i,
  /\bstandings\b/i,
  /\bfixture\b/i,

  /\bexchange rate\b/i,
  /\bcurrency rate\b/i,

  /\bcurrent time\b/i,
  /\btime in\b/i,

  /\bprice today\b/i,
  /\bcurrent price\b/i,

  /\bwho is the current\b/i,
  /\bwhat is the current\b/i
];


/**
 * Count question complexity.
 */
function getComplexityScore(message = "") {
  const text = String(message).trim();

  if (!text) {
    return 0;
  }

  let score = 0;

  const words = text.split(/\s+/).length;

  if (words > 25) {
    score += 1;
  }

  if (words > 60) {
    score += 1;
  }

  if (text.includes("?")) {
    const questionCount =
      (text.match(/\?/g) || []).length;

    if (questionCount >= 2) {
      score += 1;
    }
  }

  const deepMatches =
    deepResearchPatterns.filter(
      pattern => pattern.test(text)
    ).length;

  score += deepMatches * 2;

  return score;
}


/**
 * Decide research mode.
 *
 * Returns:
 * fast
 * deep
 */
function chooseResearchMode(message = "") {
  const text = String(message).trim();

  if (!text) {
    return "fast";
  }

  // Strong deep-research signals override everything.
  if (
    deepResearchPatterns.some(
      pattern => pattern.test(text)
    )
  ) {
    return "deep";
  }

  // Simple live-data questions should stay fast.
  if (
    fastResearchPatterns.some(
      pattern => pattern.test(text)
    )
  ) {
    return "fast";
  }

  const complexity =
    getComplexityScore(text);

  if (complexity >= 2) {
    return "deep";
  }

  return "fast";
}


/**
 * Return detailed routing information for logs/debugging.
 */
function getResearchDecision(message = "") {
  const mode =
    chooseResearchMode(message);

  return {
    mode,

    model:
      mode === "deep"
        ? "groq/compound"
        : "groq/compound-mini",

    complexity:
      getComplexityScore(message)
  };
}


module.exports = {
  chooseResearchMode,
  getResearchDecision,
  getComplexityScore
};
