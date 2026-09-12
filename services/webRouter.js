// services/webRouter.js

/**
 * Decides whether a user's question probably needs
 * fresh/current information from the internet.
 */

const explicitSearchPatterns = [
  /\bsearch (the )?(web|internet|online)\b/i,
  /\bsearch for\b/i,
  /\blook (it )?up\b/i,
  /\bcheck online\b/i,
  /\bcheck the web\b/i,
  /\bfind online\b/i,
  /\bgoogle\b/i,
  /\bfrom the internet\b/i,
  /\bfrom websites?\b/i,
  /\baccording to (the )?latest\b/i
];

const currentTimePatterns = [
  /\blatest\b/i,
  /\bcurrently\b/i,
  /\bcurrent\b/i,
  /\btoday\b/i,
  /\btonight\b/i,
  /\byesterday\b/i,
  /\btomorrow\b/i,
  /\brecent\b/i,
  /\brecently\b/i,
  /\bthis week\b/i,
  /\bthis month\b/i,
  /\bthis year\b/i,
  /\bright now\b/i,
  /\bat the moment\b/i,
  /\bnewest\b/i,
  /\bup[- ]?to[- ]?date\b/i,
  /\bupdate[sd]?\b/i,
  /\bbreaking\b/i
];

const changingTopicPatterns = [
  /\bnews\b/i,

  // Weather
  /\bweather\b/i,
  /\bforecast\b/i,
  /\btemperature\b/i,

  // Politics / public positions
  /\bpresident\b/i,
  /\bprime minister\b/i,
  /\bminister\b/i,
  /\bgovernment\b/i,
  /\belection\b/i,

  // Prices / economics
  /\bprice\b/i,
  /\bcost\b/i,
  /\bexchange rate\b/i,
  /\bcurrency rate\b/i,
  /\binflation\b/i,

  // Sports
  /\bscore\b/i,
  /\bfixture\b/i,
  /\bstandings\b/i,
  /\bmatch result\b/i,

  // Technology
  /\bversion\b/i,
  /\brelease\b/i,
  /\bmodel available\b/i,
  /\bAPI update\b/i,

  // Rules / organizations
  /\blaw\b/i,
  /\bregulation\b/i,
  /\bpolicy\b/i,
  /\brequirements?\b/i,
  /\bdeadline\b/i,

  // Travel
  /\bflight\b/i,
  /\bvisa\b/i,
  /\bentry requirements?\b/i
];

const urlPattern = /https?:\/\/[^\s]+/i;

/**
 * Return detailed decision information.
 */
function getWebSearchDecision(message = "") {
  const text = String(message).trim();

  if (!text) {
    return {
      shouldSearch: false,
      reason: "empty_message"
    };
  }

  // User explicitly asks Aman AI to search online.
  if (explicitSearchPatterns.some(pattern => pattern.test(text))) {
    return {
      shouldSearch: true,
      reason: "explicit_web_request"
    };
  }

  // User supplied a webpage.
  if (urlPattern.test(text)) {
    return {
      shouldSearch: true,
      reason: "website_url"
    };
  }

  // Strong time-sensitive wording.
  if (currentTimePatterns.some(pattern => pattern.test(text))) {
    return {
      shouldSearch: true,
      reason: "current_information"
    };
  }

  // Topics whose answers frequently change.
  if (changingTopicPatterns.some(pattern => pattern.test(text))) {
    return {
      shouldSearch: true,
      reason: "dynamic_topic"
    };
  }

  return {
    shouldSearch: false,
    reason: "general_knowledge"
  };
}

/**
 * Simple boolean version for chatController.
 */
function needsWebSearch(message = "") {
  return getWebSearchDecision(message).shouldSearch;
}

module.exports = {
  needsWebSearch,
  getWebSearchDecision
};
