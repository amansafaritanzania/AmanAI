// ======================================================
// Aman AI Smart Expert Router v6
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

            // Kiswahili
            "utalii",
            "hifadhi",
            "wanyamapori",
            "watalii"
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
            "injili", "imani"
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

            // Kiswahili
            "afya", "daktari",
            "hospitali", "dawa",
            "ugonjwa", "homa",
            "maumivu", "dalili",
            "matibabu", "jeraha"
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


    let winner =
        scored[0];


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


            const contextWinner =
                contextScored[0];


            if (
                contextWinner &&
                contextWinner.score > 0
            ) {

                winner = {
                    ...contextWinner,

                    // Mark this as context-based routing.
                    // The score remains useful for logs.
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
    // Collaboration should be triggered primarily by
    // the CURRENT message, not old context.
    //
    // This prevents an old budget discussion from
    // forcing Business into every later reply.
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
