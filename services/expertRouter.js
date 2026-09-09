// ======================================================
// Aman AI Smart Expert Router v5
// Primary Expert + Cross-Domain Collaboration
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
            "education", "learning"
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
            "animal feed"
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
            "zanzibar"
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
            "preaching", "preach"
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
            "medicine", "symptoms"
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
            "expenses", "investment",
            "invest", "commercial"
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

    return message
        .toLowerCase()
        .replace(/[\r\n]+/g, " ")
        .replace(/[^\w\s$€£¥+#.-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


// ======================================================
// SCORE NORMAL EXPERT
// ======================================================

function scoreExpert(
    text,
    expert
) {

    if (
        !expert ||
        !expert.keywords ||
        !expert.keywords.length
    ) {
        return 0;
    }

    let score = 0;

    for (
        const keyword
        of expert.keywords
    ) {

        if (
            text.includes(keyword)
        ) {

            score +=
                keyword.includes(" ")
                    ? 3
                    : 2;

        }

    }

    return score;

}


// ======================================================
// COLLABORATION SIGNALS
// ======================================================
//
// These determine whether a SECOND expert is genuinely
// useful for the request.
//
// Primary expert remains responsible for the answer.
//

const collaborationRules = {

    // --------------------------------------------------
    // SAFARI + BUSINESS
    // --------------------------------------------------

    safari: [

        {
            expert: "business",

            signals: [
                "budget",
                "cost",
                "costs",
                "price",
                "pricing",
                "expensive",
                "cheap",
                "affordable",
                "afford",
                "money",
                "profit",
                "quote",
                "quotation",
                "pricing",
                "per person",
                "per-person",
                "total",
                "usd",
                "tzs",
                "$"
            ]
        },

        {
            expert: "coder",

            signals: [
                "website",
                "web app",
                "booking system",
                "booking website",
                "api",
                "software"
            ]
        }

    ],


    // --------------------------------------------------
    // AGRICULTURE + BUSINESS
    // --------------------------------------------------

    agriculture: [

        {
            expert: "business",

            signals: [
                "budget",
                "cost",
                "profit",
                "profitability",
                "market",
                "marketing",
                "sell",
                "selling",
                "price",
                "pricing",
                "revenue",
                "income",
                "business",
                "investment",
                "capital",
                "customer",
                "customers"
            ]
        }
    ],


    // --------------------------------------------------
    // TEACHER + CODER
    // --------------------------------------------------

    teacher: [

        {
            expert: "coder",

            signals: [
                "website",
                "web",
                "app",
                "application",
                "software",
                "program",
                "programming",
                "code",
                "coding",
                "system",
                "platform",
                "dashboard",
                "online lesson",
                "learning app"
            ]
        }
    ],


    // --------------------------------------------------
    // BUSINESS + CODER
    // --------------------------------------------------

    business: [

        {
            expert: "coder",

            signals: [
                "website",
                "web",
                "app",
                "application",
                "software",
                "program",
                "programming",
                "code",
                "coding",
                "system",
                "platform",
                "dashboard",
                "api",
                "database",
                "automation"
            ]
        },

        {
            expert: "teacher",

            signals: [
                "training",
                "course",
                "lesson",
                "teaching",
                "school",
                "students",
                "education"
            ]
        }

    ],


    // --------------------------------------------------
    // CODER + BUSINESS
    // --------------------------------------------------

    coder: [

        {
            expert: "business",

            signals: [
                "business",
                "startup",
                "customers",
                "customer",
                "profit",
                "sell",
                "selling",
                "market",
                "marketing",
                "revenue",
                "pricing"
            ]
        },

        {
            expert: "teacher",

            signals: [
                "education",
                "school",
                "student",
                "students",
                "lesson",
                "learning",
                "teacher"
            ]
        }

    ],


    // --------------------------------------------------
    // HEALTH + BUSINESS
    // --------------------------------------------------
    //
    // Only activate this when the question is explicitly
    // about a business/financial side of healthcare.
    //

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
// FIND COLLABORATION PARTNER
// ======================================================

function findCollaboration(
    primaryExpert,
    text,
    scoredExperts
) {

    const rules =
        collaborationRules[
            primaryExpert.id
        ] || [];


    if (
        rules.length === 0
    ) {
        return null;
    }


    // --------------------------------------------------
    // Check explicit collaboration rules first
    // --------------------------------------------------

    for (
        const rule
        of rules
    ) {

        const hasSignal =
            rule.signals.some(
                signal =>
                    text.includes(signal)
            );


        if (
            !hasSignal
        ) {
            continue;
        }


        const secondary =
            scoredExperts.find(
                expert =>
                    expert.id ===
                    rule.expert
            );


        if (
            secondary
        ) {

            return {

                id:
                    secondary.id,

                name:
                    secondary.name,

                score:
                    Math.max(
                        secondary.score,
                        1
                    )
            };

        }

    }


    // --------------------------------------------------
    // No meaningful collaboration
    // --------------------------------------------------

    return null;

}


// ======================================================
// CHOOSE PRIMARY EXPERT
// ======================================================

function chooseExpert(
    message = ""
) {

    const text =
        normalizeText(
            message
        );


    // ==================================================
    // SCORE ALL EXPERTS
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
                    b.score -
                    a.score
            );


    const winner =
        scored[0];


    // ==================================================
    // FALLBACK TO GENERAL
    // ==================================================

    if (
        !winner ||
        winner.score === 0
    ) {

        return {

            id:
                "general",

            name:
                "General Expert",

            prompt:
                general,

            score:
                0,

            secondary:
                null

        };

    }


    // ==================================================
    // FIND COLLABORATION
    // ==================================================

    const collaboration =
        findCollaboration(
            winner,
            text,
            scored
        );


    // ==================================================
    // BUILD RESULT
    // ==================================================

    return {

        id:
            winner.id,

        name:
            winner.name,

        prompt:
            winner.prompt,

        score:
            winner.score,

        secondary:
            collaboration

    };

}


// ======================================================
// EXPORT
// ======================================================

module.exports =
    chooseExpert;
