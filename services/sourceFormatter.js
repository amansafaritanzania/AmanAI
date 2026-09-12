// services/sourceFormatter.js

/**
 * Aman AI - Source Formatter
 *
 * PURPOSE:
 * - Clean web-search sources
 * - Remove duplicates
 * - Rank more reliable sources higher
 * - Limit source count
 * - Prepare safe source objects for frontend display
 *
 * This file does NOT search the web.
 * It only processes sources returned by webSearch.js.
 */


/**
 * Remove tracking parameters and normalize URLs.
 */
function normalizeUrl(url = "") {
  try {
    const parsed = new URL(url);

    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid"
    ];

    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }

    parsed.hash = "";

    let normalized = parsed.toString();

    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    return String(url).trim();
  }
}


/**
 * Get hostname safely.
 */
function getDomain(url = "") {
  try {
    return new URL(url).hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return "";
  }
}


/**
 * Detect obviously weak/unwanted source types.
 */
function isWeakSource(domain = "") {
  const weakDomains = [
    "pinterest.com",
    "quora.com"
  ];

  return weakDomains.some(
    item =>
      domain === item ||
      domain.endsWith(`.${item}`)
  );
}


/**
 * Give sources a rough reliability priority.
 *
 * This is NOT a statement that every page on a domain
 * is automatically trustworthy.
 *
 * It only helps sorting.
 */
function getSourcePriority(source = {}) {
  const domain = getDomain(source.url);

  if (!domain) {
    return 0;
  }

  let score = 10;

  // Government domains
  if (
    domain.endsWith(".gov") ||
    domain.includes(".gov.") ||
    domain.endsWith(".go.tz")
  ) {
    score += 50;
  }

  // Education / universities
  if (
    domain.endsWith(".edu") ||
    domain.includes(".edu.") ||
    domain.endsWith(".ac.tz")
  ) {
    score += 40;
  }

  // International / institutional sources
  const institutionalDomains = [
    "who.int",
    "un.org",
    "worldbank.org",
    "imf.org",
    "unesco.org",
    "unicef.org",
    "fao.org"
  ];

  if (
    institutionalDomains.some(
      trusted =>
        domain === trusted ||
        domain.endsWith(`.${trusted}`)
    )
  ) {
    score += 45;
  }

  // Established scientific sources
  const scientificDomains = [
    "nature.com",
    "science.org",
    "nih.gov",
    "ncbi.nlm.nih.gov",
    "pubmed.ncbi.nlm.nih.gov"
  ];

  if (
    scientificDomains.some(
      trusted =>
        domain === trusted ||
        domain.endsWith(`.${trusted}`)
    )
  ) {
    score += 35;
  }

  // Recognized major news organizations
  const newsDomains = [
    "reuters.com",
    "apnews.com",
    "bbc.com",
    "bbc.co.uk"
  ];

  if (
    newsDomains.some(
      trusted =>
        domain === trusted ||
        domain.endsWith(`.${trusted}`)
    )
  ) {
    score += 25;
  }

  // Groq relevance score
  if (typeof source.score === "number") {
    score += Math.max(
      0,
      Math.min(source.score * 10, 10)
    );
  }

  if (isWeakSource(domain)) {
    score -= 15;
  }

  return score;
}


/**
 * Clean one source.
 */
function cleanSource(source = {}) {
  if (!source?.url) {
    return null;
  }

  const url = normalizeUrl(source.url);
  const domain = getDomain(url);

  if (!domain) {
    return null;
  }

  let title =
    typeof source.title === "string"
      ? source.title.trim()
      : "";

  if (!title) {
    title = domain;
  }

  let content =
    typeof source.content === "string"
      ? source.content.trim()
      : "";

  // Avoid sending giant search snippets to frontend.
  if (content.length > 500) {
    content =
      content.slice(0, 497).trim() + "...";
  }

  return {
    title,
    url,
    domain,
    content,
    score:
      typeof source.score === "number"
        ? source.score
        : null
  };
}


/**
 * Remove duplicate URLs.
 */
function deduplicateSources(sources = []) {
  const seen = new Set();
  const unique = [];

  for (const source of sources) {
    const cleaned = cleanSource(source);

    if (!cleaned) {
      continue;
    }

    const key = cleaned.url.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(cleaned);
  }

  return unique;
}


/**
 * Rank strongest sources first.
 */
function rankSources(sources = []) {
  return [...sources].sort((a, b) => {
    return (
      getSourcePriority(b) -
      getSourcePriority(a)
    );
  });
}


/**
 * Final formatter used by chatController later.
 */
function formatSources(
  sources = [],
  {
    maxSources = 6,
    includeContent = false
  } = {}
) {
  if (!Array.isArray(sources)) {
    return [];
  }

  const unique =
    deduplicateSources(sources);

  const ranked =
    rankSources(unique);

  return ranked
    .slice(0, maxSources)
    .map((source, index) => {
      const formatted = {
        id: index + 1,
        title: source.title,
        url: source.url,
        domain: source.domain
      };

      if (includeContent && source.content) {
        formatted.content = source.content;
      }

      return formatted;
    });
}


/**
 * Small summary useful for logging.
 */
function getSourceSummary(sources = []) {
  const formatted = formatSources(
    sources,
    {
      maxSources: 10,
      includeContent: false
    }
  );

  return formatted.map(source => ({
    title: source.title,
    domain: source.domain
  }));
}


module.exports = {
  normalizeUrl,
  getDomain,
  getSourcePriority,
  cleanSource,
  deduplicateSources,
  rankSources,
  formatSources,
  getSourceSummary
};
