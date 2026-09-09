// ======================================================
// Aman AI Smart Expert Router v6.1
// Primary Expert + Collaboration + Conversation Continuity
// ======================================================

const coder = require("../prompts/coder");
const teacher = require("../prompts/teacher");
const agriculture = require("../prompts/agriculture");
const safari = require("../prompts/safari");
const bible = require("../prompts/bible");
const health = require("../prompts/health");
const business = require("../prompts/business");
const general = require("../prompts/general");


// ======================================================
// EXPERT DEFINITIONS
// ======================================================

const experts = [

    {
        id: "coder",
        name: "Coding Expert",
        prompt: coder,

        keywords: [
            "html", "css", "javascript",
            "typescript", "react", "next",
            "node", "express", "python",
            "java", "php", "sql",
            "mongodb", "firebase", "api",
            "json", "github", "git",
            "linux", "terminal", "bug",
            "debug", "compile", "software",
            "website", "web", "login",
            "signup", "dashboard",
            "frontend", "backend",
            "code", "coding", "function",
            "class", "variable",
            "programming", "app",
            "application", "database",
            "server", "deploy",
            "deployment", "hosting"
        ]
    },

    {
        id: "teacher",
        name: "Teacher Expert",
        prompt: teacher,

        keywords: [
            "teach", "teacher",
            "lesson", "study",
            "school", "homework",
            "assignment", "math",
            "mathematics", "physics",
            "chemistry", "biology",
            "photosynthesis", "history",
            "geography", "english",
            "kiswahili", "formula",
            "calculate", "exam",
            "revision", "notes",
            "necta", "tie",
            "form one", "form two",
            "form three", "form four",
            "form five", "form six",
            "student", "students",
            "syllabus", "topic",
            "question", "questions",
            "education", "learning",

            // Kiswahili
            "somo", "masomo",
            "mwanafunzi", "wanafunzi",
            "mtihani", "mitihani",
            "hesabu", "fundisha",
            "nifundishe"
        ]
    },

    {
        id: "agriculture",
        name: "Agriculture Expert",
        prompt: agriculture,

        keywords: [
            "farm", "farmer",
            "crop", "maize",
            "rice", "beans",
            "cassava", "banana",
            "coffee", "tea",
            "cotton", "soil",
            "fertilizer", "goat",
            "cow", "pig",
            "chicken", "livestock",
            "poultry", "harvest",
            "seed", "agriculture",
            "irrigation", "pesticide",
            "planting", "field",
            "shamba", "mkulima",
            "mpunga", "mahindi",
            "maharage", "farmers",
            "farming", "crop disease",
            "plant disease",
            "livestock disease",
            "animal feed",

            // Kiswahili
            "kilimo", "mashamba",
            "zao", "mazao",
            "mbegu", "mbolea",
            "mavuno", "umwagiliaji",
            "mifugo", "ng'ombe",
            "kuku", "mbuzi"
        ]
    },

    {
        id: "safari",
        name: "Safari Expert",
        prompt: safari,

        keywords: [
            "safari", "tour",
            "tourism", "park",
            "serengeti", "ngorongoro",
            "ruaha", "mikumi",
            "wildlife", "lion",
            "elephant", "zebra",
            "giraffe", "hippo",
            "rhino", "cheetah",
            "camping", "hiking",
            "kilimanjaro", "manyara",
            "gombe", "saadani",
            "nyerere", "tarangire",
            "travel", "travelling",
            "traveling", "itinerary",
            "game drive",
            "national park",
            "beach safari",
            "zanzibar",

            // Tanzania travel / entry
            "tanzania visa",
            "visa tanzania",
            "enter tanzania",
            "entering tanzania",
            "entry requirements",
            "entry requirement",
            "travel to tanzania",
            "travelling to tanzania",
            "traveling to tanzania",

            // Kiswahili
            "utalii",
            "hifadhi",
            "wanyamapori",
            "watalii",
            "kuingia tanzania",
            "masharti ya kuingia"
        ]
    },

    {
        id: "bible",
        name: "Bible Expert",
        prompt: bible,

        keywords: [
            "bible", "jesus",
            "god", "holy spirit",
            "church", "pray",
            "prayer", "verse",
            "scripture", "gospel",
            "acts", "genesis",
            "psalm", "proverbs",
            "romans", "faith",
            "christian", "sermon",
            "devotion", "apostle",
            "christianity", "biblical",
            "preaching", "preach",

            // Kiswahili
            "biblia", "yesu",
            "mungu", "roho mtakatifu",
            "kanisa", "maombi",
            "ombi", "mstari",
            "injili", "imani",

            // Bible interpretation / theology / figurative language
            "christ", "parable", "parables",
            "revelation", "prophecy", "prophetic",
            "theology", "theological",
            "666", "good samaritan",
            "ellen g white", "ellen white",

            // Kiswahili Bible interpretation
            "kristo", "maandiko", "andiko",
            "mitume", "ufunuo", "unabii",
            "fumbo", "mafumbo", "mfano", "mifano",
            "kiroho", "msamaria"
        ]
    },

    {
        id: "health",
        name: "Health Expert",
        prompt: health,

        keywords: [
            "doctor", "hospital",
            "medicine", "health",
            "disease", "infection",
            "virus", "bacteria",
            "malaria", "fever",
            "headache", "nutrition",
            "exercise", "fitness",
            "blood", "heart",
            "pain", "treatment",
            "symptom", "first aid",
            "medical", "illness",
            "injury", "body",
            "symptoms",
            "vaccine", "vaccination",
            "vaccinated",

            // Kiswahili
            "afya", "daktari",
            "hospitali", "dawa",
            "ugonjwa", "homa",
            "maumivu", "dalili",
            "matibabu", "jeraha",
            "chanjo"
        ]
    },

    {
        id: "business",
        name: "Business Expert",
        prompt: business,

        keywords: [
            "business", "money",
            "profit", "income",
            "salary", "investment",
            "market", "marketing",
            "customer", "customers",
            "finance", "financial",
            "bank", "entrepreneur",
            "entrepreneurship",
            "startup", "company",
            "shop", "sell",
            "selling", "buy",
            "business idea",
            "sales", "revenue",
            "cost", "costs",
            "budget", "price",
            "pricing", "expensive",
            "cheap", "affordable",
            "afford", "quote",
            "quotation", "profitability",
            "capital", "expense",
            "expenses", "invest",
            "commercial",

            // Kiswahili
            "biashara", "pesa",
            "faida", "mapato",
            "bajeti", "gharama",
            "bei", "soko",
            "masoko", "mteja",
            "wateja", "mtaji",
            "uwekezaji", "mauzo",
            "matumizi ya pesa"
        ]
    },

    {
        id: "general",
        name: "General Expert",
        prompt: general,
        keywords: []
    }

];


// ======================================================
// NORMALIZE TEXT
// ======================================================

function normalizeText(message = "") {

    return String(message)
        .toLowerCase()
        .replace(/[\r\n]+/g, " ")
        .replace(/[^\w\s$€£¥+#.-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


// ======================================================
// SCORE EXPERT
// ======================================================

function scoreExpert(text, expert) {

    if (
        !expert ||
        !expert.keywords ||
        !expert.keywords.length
    ) {
        return 0;
    }

    let score = 0;

    for (const keyword of expert.keywords) {

        if (text.includes(keyword)) {

            score +=
                keyword.includes(" ")
                    ? 3
                    : 2;

        }

    }

    return score;

}


// ======================================================
// COLLABORATION RULES
// ======================================================

const collaborationRules = {

    safari: [

        {
            expert: "business",

            signals: [
                "budget", "bajeti",
                "cost", "costs", "gharama",
                "price", "pricing", "bei",
                "expensive", "cheap",
                "affordable", "afford",
                "money", "pesa",
                "profit", "faida",
                "quote", "quotation",
                "per person", "per-person",
                "total", "usd", "tzs", "$"
            ]
        },

        {
            expert: "health",

            signals: [
                "yellow fever",
                "yellow-fever",
                "vaccine",
                "vaccination",
                "vaccinated",
                "health requirement",
                "health requirements",
                "medical requirement",
                "medical requirements",
                "chanjo",
                "homa ya manjano"
            ]
        },

        {
            expert: "coder",

            signals: [
                "website", "web app",
                "booking system",
                "booking website",
                "api", "software"
            ]
        }

    ],


    agriculture: [

        {
            expert: "business",

            signals: [
                "budget", "bajeti",
                "cost", "costs", "gharama",
                "profit", "profitability", "faida",
                "market", "marketing",
                "soko", "masoko",
                "sell", "selling", "mauzo",
                "price", "pricing", "bei",
                "revenue", "income", "mapato",
                "business", "biashara",
                "investment", "uwekezaji",
                "capital", "mtaji",
                "customer", "customers",
                "mteja", "wateja",
                "money", "pesa",
                "expense", "expenses",
                "matumizi ya pesa"
            ]
        }

    ],


    teacher: [

        {
            expert: "coder",

            signals: [
                "website", "web",
                "app", "application",
                "software", "program",
                "programming", "code",
                "coding", "system",
                "platform", "dashboard",
                "online lesson",
                "learning app"
            ]
        }

    ],


    business: [

        {
            expert: "coder",

            signals: [
                "website", "web",
                "app", "application",
                "software", "program",
                "programming", "code",
                "coding", "system",
                "platform", "dashboard",
                "api", "database",
                "automation"
            ]
        },

        {
            expert: "teacher",

            signals: [
                "training", "course",
                "lesson", "teaching",
                "school", "students",
                "education"
            ]
        },

        {
            expert: "agriculture",

            signals: [
                "farm", "farming",
                "agriculture",
                "crop", "maize",
                "rice", "shamba",
                "kilimo", "mkulima",
                "mahindi", "mpunga",
                "mazao", "mifugo"
            ]
        }

    ],


    coder: [

        {
            expert: "business",

            signals: [
                "business", "startup",
                "customers", "customer",
                "profit", "sell",
                "selling", "market",
                "marketing", "revenue",
                "pricing", "biashara",
                "faida", "mteja",
                "soko", "mauzo"
            ]
        },

        {
            expert: "teacher",

            signals: [
                "education", "school",
                "student", "students",
                "lesson", "learning",
                "teacher"
            ]
        }

    ],


    health: [

        {
            expert: "business",

            signals: [
                "clinic business",
                "hospital business",
                "medical business",
                "health business",
                "clinic profit",
                "medical startup",
                "health startup",
                "clinic budget"
            ]
        }

    ]

};


// ======================================================
// FIND EXPERT BY ID
// ======================================================

function getExpertById(id) {

    return experts.find(
        expert =>
            expert.id === id
    ) || null;

}


// ======================================================
// FIND COLLABORATION
// ======================================================

function findCollaboration(
    primaryExpert,
    currentText,
    scoredExperts
) {

    const rules =
        collaborationRules[
            primaryExpert.id
        ] || [];

    if (!rules.length) {
        return null;
    }


    for (const rule of rules) {

        const hasSignal =
            rule.signals.some(
                signal =>
                    currentText.includes(signal)
            );

        if (!hasSignal) {
            continue;
        }


        const secondary =
            scoredExperts.find(
                expert =>
                    expert.id === rule.expert
            ) ||
            getExpertById(rule.expert);


        if (secondary) {

            return {
                id: secondary.id,
                name: secondary.name,
                score: Math.max(
                    secondary.score || 0,
                    1
                )
            };

        }

    }


    return null;

}


// ======================================================
// TANZANIA TRAVEL-ENTRY DETECTOR
// ======================================================
//
// These questions belong primarily to Safari because
// they concern entering / travelling to Tanzania.
//
// Health can still collaborate for vaccination or
// health-entry questions.
//

function isTanzaniaTravelEntryQuestion(text = "") {

    if (!text) {
        return false;
    }


    const directSignals = [

        "enter tanzania",
        "entering tanzania",

        "entry to tanzania",
        "entry into tanzania",

        "tanzania entry requirement",
        "tanzania entry requirements",

        "requirements to enter tanzania",
        "requirement to enter tanzania",

        "travel to tanzania",
        "travelling to tanzania",
        "traveling to tanzania",

        "visit tanzania",
        "visiting tanzania",

        "tanzania visa",
        "visa for tanzania",
        "visa to tanzania",
        "visa tanzania",

        "tanzania immigration",

        "tanzania passport requirement",
        "tanzania passport requirements",

        "kuingia tanzania",
        "masharti ya kuingia tanzania",
        "visa ya tanzania",
        "uhamiaji tanzania"

    ];


    if (
        directSignals.some(
            signal =>
                text.includes(signal)
        )
    ) {
        return true;
    }


    // --------------------------------------------------
    // Tanzania + travel-rule combination
    // --------------------------------------------------

    const mentionsTanzania =
        text.includes("tanzania");


    const travelRuleSignals = [

        "visa",
        "immigration",
        "passport",

        "entry requirement",
        "entry requirements",
        "entry rule",
        "entry rules",

        "yellow fever",
        "yellow-fever",

        "vaccine",
        "vaccination",
        "vaccinated",

        "health requirement",
        "health requirements",

        "medical requirement",
        "medical requirements",

        "travel requirement",
        "travel requirements",

        "government requirement",
        "government requirements",

        "chanjo",
        "homa ya manjano",

        "masharti ya kuingia",
        "uhamiaji"

    ];


    return (
        mentionsTanzania &&
        travelRuleSignals.some(
            signal =>
                text.includes(signal)
        )
    );

}


// ======================================================
// BIBLE DOMAIN DETECTOR
// ======================================================

function isBibleDomainQuestion(text = "") {

    if (!text) return false;

    const strongSignals = [
        "bible", "biblical", "scripture", "scriptures",
        "jesus", "christ", "holy spirit",
        "gospel", "apostle", "apostles",
        "genesis", "psalm", "proverbs", "romans",
        "revelation", "parable", "parables",
        "prophecy", "prophetic", "sermon", "devotion",
        "christian", "christianity",
        "theology", "theological",
        "666", "good samaritan",
        "ellen g white", "ellen white",
        "biblia", "yesu", "kristo", "roho mtakatifu",
        "injili", "mstari", "maandiko", "andiko",
        "mitume", "ufunuo", "unabii",
        "fumbo", "mafumbo", "mfano", "mifano",
        "kiroho", "msamaria"
    ];

    return strongSignals.some(signal => text.includes(signal));
}


// ======================================================
// APPLY DOMAIN PRIMARY PRIORITY
// ======================================================
//
// Normal keyword score still matters.
//
// This layer only protects clear specialist ownership.
//
// Examples:
//
// maize + budget
//     -> Agriculture primary
//
// safari + budget
//     -> Safari primary
//
// yellow fever + entering Tanzania
//     -> Safari primary
//
// Health can then collaborate on the travel-health part.
//

function applyDomainPrimaryPriority(
    scoredExperts,
    text
) {

    if (
        !scoredExperts ||
        !scoredExperts.length
    ) {
        return null;
    }


    let winner =
        scoredExperts[0];


    // ==================================================
    // TANZANIA TRAVEL-ENTRY PRIORITY
    // ==================================================

    if (
        isTanzaniaTravelEntryQuestion(text)
    ) {

        const safariCandidate =
            scoredExperts.find(
                expert =>
                    expert.id === "safari"
            ) ||
            getExpertById("safari");


        if (safariCandidate) {

            return {
                ...safariCandidate,

                // Ensure routing does not later fall back
                // merely because normal Safari keywords
                // scored zero.
                score:
                    Math.max(
                        safariCandidate.score || 0,
                        1
                    )
            };

        }

    }


    // ==================================================
    // BIBLE DOMAIN PRIORITY
    // ==================================================

    if (isBibleDomainQuestion(text)) {

        const bibleCandidate =
            scoredExperts.find(
                expert => expert.id === "bible"
            ) ||
            getExpertById("bible");

        if (bibleCandidate) {

            return {
                ...bibleCandidate,
                score: Math.max(
                    bibleCandidate.score || 0,
                    1
                )
            };

        }

    }


    // ==================================================
    // AGRICULTURE DOMAIN PRIORITY
    // ==================================================

    const agricultureCandidate =
        scoredExperts.find(
            expert =>
                expert.id === "agriculture"
        );


    if (
        agricultureCandidate &&
        agricultureCandidate.score > 0
    ) {

        return agricultureCandidate;

    }


    // ==================================================
    // SAFARI DOMAIN PRIORITY
    // ==================================================

    const safariCandidate =
        scoredExperts.find(
            expert =>
                expert.id === "safari"
        );


    if (
        safariCandidate &&
        safariCandidate.score > 0
    ) {

        return safariCandidate;

    }


    return winner;

}


// ======================================================
// CHOOSE PRIMARY EXPERT
// ======================================================
//
// message:
//     current user message
//
// context:
//     recent conversation text supplied by chatController
//
// The current message has priority.
// Context is used mainly for short follow-up continuity.
//

function chooseExpert(
    message = "",
    context = ""
) {

    const text =
        normalizeText(message);

    const contextText =
        normalizeText(context);


    // ==================================================
    // SCORE CURRENT MESSAGE
    // ==================================================

    const scored =
        experts
            .map(
                expert => ({
                    ...expert,

                    score:
                        scoreExpert(
                            text,
                            expert
                        )
                })
            )
            .sort(
                (a, b) =>
                    b.score - a.score
            );


    // ==================================================
    // CURRENT-MESSAGE DOMAIN PRIORITY
    // ==================================================

    let winner =
        applyDomainPrimaryPriority(
            scored,
            text
        );


    // ==================================================
    // FOLLOW-UP CONTINUITY
    // ==================================================
    //
    // If the current message has no specialist signal,
    // look at recent conversation context.
    //
    // This lets replies such as:
    //
    // "Mwanza"
    // "yes"
    // "continue"
    // "nisaidie sasa"
    //
    // remain with the active topic.
    //

    if (
        !winner ||
        winner.score === 0
    ) {

        if (contextText) {

            const contextScored =
                experts
                    .map(
                        expert => ({
                            ...expert,

                            score:
                                scoreExpert(
                                    contextText,
                                    expert
                                )
                        })
                    )
                    .sort(
                        (a, b) =>
                            b.score - a.score
                    );


            // Use the same domain-priority logic on
            // conversation context.
            //
            // This prevents financial words in an older
            // agriculture/safari discussion from stealing
            // primary ownership.

            const contextWinner =
                applyDomainPrimaryPriority(
                    contextScored,
                    contextText
                );


            if (
                contextWinner &&
                contextWinner.score > 0
            ) {

                winner = {
                    ...contextWinner,

                    // Mark context-based routing.
                    fromContext: true
                };

            }

        }

    }


    // ==================================================
    // FALLBACK TO GENERAL
    // ==================================================

    if (
        !winner ||
        winner.score === 0
    ) {

        return {
            id: "general",
            name: "General Expert",
            prompt: general,
            score: 0,
            secondary: null,
            fromContext: false
        };

    }


    // ==================================================
    // COLLABORATION
    // ==================================================
    //
    // Collaboration is triggered using the CURRENT
    // message.
    //
    // Old context does not automatically trigger a
    // secondary expert.
    //
    // This prevents an old budget/health discussion
    // from forcing collaboration forever.
    //

    const collaboration =
        findCollaboration(
            winner,
            text,
            scored
        );


    // ==================================================
    // RESULT
    // ==================================================

    return {
        id: winner.id,
        name: winner.name,
        prompt: winner.prompt,
        score: winner.score,
        secondary: collaboration,
        fromContext:
            winner.fromContext === true
    };

}


// ======================================================
// EXPORT
// ======================================================

module.exports = chooseExpert;
