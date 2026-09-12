// services/webSearch.js

/**
 * Aman AI - Web Research Service
 *
 * PURPOSE:
 * - Search current information using Groq Compound
 * - Support fast and deep research
 * - Extract sources returned by Groq
 *
 * IMPORTANT:
 * - No memory modification
 * - No expert routing
 * - No citation_options parameter
 */

const FULL_WEB_MODEL =
    "groq/compound";

const FAST_WEB_MODEL =
    "groq/compound-mini";


/**
 * Validate messages.
 */
function validateMessages(
    messages
) {

    if (!Array.isArray(messages)) {

        throw new Error(
            "Web search requires a messages array."
        );
    }


    const valid =
        messages.filter(
            message =>
                message &&
                typeof message === "object" &&
                typeof message.role === "string" &&
                typeof message.content === "string" &&
                message.content.trim()
        );


    if (!valid.length) {

        throw new Error(
            "Web search received no valid messages."
        );
    }


    return valid;
}


/**
 * Select Compound system.
 */
function getWebModel(
    mode = "deep"
) {

    return mode === "fast"
        ? FAST_WEB_MODEL
        : FULL_WEB_MODEL;
}


/**
 * Extract web-search results from
 * Compound executed tools.
 */
function extractSearchResults(
    executedTools = []
) {

    if (
        !Array.isArray(
            executedTools
        )
    ) {

        return [];
    }


    const results = [];


    for (
        const tool
        of executedTools
    ) {

        const searchResults =
            tool
                ?.search_results
                ?.results;


        if (
            !Array.isArray(
                searchResults
            )
        ) {

            continue;
        }


        for (
            const result
            of searchResults
        ) {

            if (
                !result ||
                !result.url
            ) {

                continue;
            }


            results.push({

                title:
                    typeof result.title ===
                    "string"
                        ? result.title.trim()
                        : "Source",

                url:
                    result.url,

                content:
                    typeof result.content ===
                    "string"
                        ? result.content.trim()
                        : "",

                score:
                    typeof result.score ===
                    "number"
                        ? result.score
                        : null
            });
        }
    }


    return results;
}


/**
 * Extract websites visited directly
 * by Compound.
 */
function extractVisitedWebsites(
    executedTools = []
) {

    if (
        !Array.isArray(
            executedTools
        )
    ) {

        return [];
    }


    const results = [];


    for (
        const tool
        of executedTools
    ) {

        /**
         * Groq's executed tool structure
         * may differ depending on tool/version.
         *
         * Search results are our main source
         * extraction method.
         *
         * This block safely handles visited
         * website URLs when exposed.
         */

        const url =
            tool?.arguments?.url ||
            tool?.args?.url ||
            tool?.url;


        if (
            typeof url !== "string" ||
            !url.startsWith("http")
        ) {

            continue;
        }


        results.push({

            title:
                "Visited website",

            url,

            content:
                "",

            score:
                null
        });
    }


    return results;
}


/**
 * Remove duplicate URLs.
 */
function removeDuplicateSources(
    sources = []
) {

    const seen =
        new Set();

    const unique =
        [];


    for (
        const source
        of sources
    ) {

        if (
            !source ||
            !source.url
        ) {

            continue;
        }


        const normalized =
            String(source.url)
                .trim()
                .replace(
                    /\/$/,
                    ""
                )
                .toLowerCase();


        if (
            seen.has(
                normalized
            )
        ) {

            continue;
        }


        seen.add(
            normalized
        );


        unique.push(
            source
        );
    }


    return unique;
}


/**
 * Build optional search settings.
 */
function buildSearchSettings({
    country = null,
    includeDomains = [],
    excludeDomains = []
} = {}) {

    const settings =
        {};


    if (
        typeof country === "string" &&
        country.trim()
    ) {

        settings.country =
            country.trim();
    }


    if (
        Array.isArray(
            includeDomains
        ) &&
        includeDomains.length
    ) {

        settings.include_domains =
            includeDomains
                .filter(Boolean);
    }


    if (
        Array.isArray(
            excludeDomains
        ) &&
        excludeDomains.length
    ) {

        settings.exclude_domains =
            excludeDomains
                .filter(Boolean);
    }


    return settings;
}


/**
 * Main web research function.
 */
async function runWebResearch({

    groqClient,

    messages,

    mode = "deep",

    country = null,

    includeDomains = [],

    excludeDomains = []

} = {}) {


    if (
        !groqClient ||
        !groqClient.chat ||
        !groqClient.chat.completions ||
        typeof groqClient
            .chat
            .completions
            .create !== "function"
    ) {

        throw new Error(
            "A valid Groq client was not provided to webSearch."
        );
    }


    const validMessages =
        validateMessages(
            messages
        );


    const model =
        getWebModel(
            mode
        );


    const searchSettings =
        buildSearchSettings({

            country,

            includeDomains,

            excludeDomains
        });


    // ==========================================
    // REQUEST
    // ==========================================

    const request = {

        model,

        messages:
            validMessages,

        /**
         * IMPORTANT:
         *
         * DO NOT send:
         *
         * citation_options: "enabled"
         *
         * Compound web search already handles
         * source citations automatically.
         *
         * Explicit citation_options currently
         * causes compound-mini to return HTTP 400.
         */

        compound_custom: {

            tools: {

                enabled_tools: [
                    "web_search",
                    "visit_website"
                ]
            }
        }
    };


    if (
        Object.keys(
            searchSettings
        ).length > 0
    ) {

        request.search_settings =
            searchSettings;
    }


    // ==========================================
    // GROQ CALL
    // ==========================================

    let completion;


    try {

        console.log(
            "🌐 WEB MODEL:",
            model
        );


        completion =
            await groqClient
                .chat
                .completions
                .create(
                    request
                );


    } catch (error) {

        console.error(
            "🌐 WEB RESEARCH ERROR:",
            error?.status ||
            "",
            error?.message ||
            error
        );


        throw error;
    }


    // ==========================================
    // RESPONSE
    // ==========================================

    const aiMessage =
        completion
            ?.choices?.[0]
            ?.message;


    if (!aiMessage) {

        throw new Error(
            "Web research returned no AI message."
        );
    }


    const answer =
        typeof aiMessage.content ===
        "string"
            ? aiMessage
                .content
                .trim()
            : "";


    if (!answer) {

        throw new Error(
            "Web research returned an empty answer."
        );
    }


    // ==========================================
    // EXECUTED TOOLS
    // ==========================================

    const executedTools =
        Array.isArray(
            aiMessage
                .executed_tools
        )
            ? aiMessage
                .executed_tools
            : [];


    console.log(
        "🌐 TOOLS EXECUTED:",
        executedTools.length
    );


    // ==========================================
    // SOURCES
    // ==========================================

    const searchSources =
        extractSearchResults(
            executedTools
        );


    const visitedSources =
        extractVisitedWebsites(
            executedTools
        );


    const sources =
        removeDuplicateSources([
            ...searchSources,
            ...visitedSources
        ]);


    console.log(
        "🌐 SOURCES FOUND:",
        sources.length
    );


    // ==========================================
    // RESULT
    // ==========================================

    return {

        success:
            true,

        answer,

        model:
            completion?.model ||
            model,

        searchedWeb:
            executedTools.length > 0,

        sources,

        sourceCount:
            sources.length,

        executedToolCount:
            executedTools.length,

        usage:
            completion?.usage ||
            null
    };
}


module.exports = {

    runWebResearch,

    extractSearchResults,

    extractVisitedWebsites,

    removeDuplicateSources,

    buildSearchSettings,

    getWebModel
};
