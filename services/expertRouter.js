// ======================================================
// Aman AI Smart Scored Expert Router
// ======================================================

const coder = require("../prompts/coder");
const teacher = require("../prompts/teacher");
const agriculture = require("../prompts/agriculture");
const safari = require("../prompts/safari");
const bible = require("../prompts/bible");
const health = require("../prompts/health");
const business = require("../prompts/business");
const general = require("../prompts/general");

const experts = [
    {
        id: "coder",
        name: "Coding Expert",
        prompt: coder,
        keywords: [
            "html", "css", "javascript", "typescript",
            "react", "next", "node", "express",
            "python", "java", "php", "sql",
            "mongodb", "firebase", "api", "json",
            "github", "git", "linux", "terminal",
            "bug", "debug", "compile", "software",
            "website", "web", "login", "signup",
            "dashboard", "frontend", "backend",
            "code", "coding", "function", "class",
            "variable", "programming"
        ]
    },

    {
        id: "teacher",
        name: "Teacher Expert",
        prompt: teacher,
        keywords: [
            "teach", "lesson", "study", "school",
            "homework", "assignment", "math",
            "mathematics", "physics", "chemistry",
            "biology", "photosynthesis", "history",
            "geography", "english", "kiswahili",
            "formula", "calculate", "exam",
            "revision", "notes", "necta", "tie",
            "form one", "form two", "form three",
            "form four", "form five", "form six"
        ]
    },

    {
        id: "agriculture",
        name: "Agriculture Expert",
        prompt: agriculture,
        keywords: [
            "farm", "farmer", "crop", "maize",
            "rice", "beans", "cassava", "banana",
            "coffee", "tea", "cotton", "soil",
            "fertilizer", "goat", "cow", "pig",
            "chicken", "livestock", "poultry",
            "harvest", "seed", "agriculture",
            "irrigation", "pesticide", "planting",
            "field", "shamba", "mkulima", "mpunga",
            "mahindi", "maharage"
        ]
    },

    {
        id: "safari",
        name: "Safari Expert",
        prompt: safari,
        keywords: [
            "safari", "tour", "tourism", "park",
            "serengeti", "ngorongoro", "ruaha",
            "mikumi", "wildlife", "lion",
            "elephant", "zebra", "giraffe",
            "hippo", "rhino", "cheetah",
            "camping", "hiking", "kilimanjaro",
            "manyara", "gombe", "saadani",
            "nyerere", "tarangire", "travel"
        ]
    },

    {
        id: "bible",
        name: "Bible Expert",
        prompt: bible,
        keywords: [
            "bible", "jesus", "god", "holy spirit",
            "church", "pray", "prayer", "verse",
            "scripture", "gospel", "acts",
            "genesis", "psalm", "proverbs",
            "romans", "faith", "christian",
            "sermon", "devotion", "apostle"
        ]
    },

    {
        id: "health",
        name: "Health Expert",
        prompt: health,
        keywords: [
            "doctor", "hospital", "medicine",
            "health", "disease", "infection",
            "virus", "bacteria", "malaria",
            "fever", "headache", "nutrition",
            "exercise", "fitness", "blood",
            "heart", "pain", "treatment",
            "symptom", "first aid"
        ]
    },

    {
        id: "business",
        name: "Business Expert",
        prompt: business,
        keywords: [
            "business", "money", "profit",
            "income", "salary", "investment",
            "market", "marketing", "customer",
            "finance", "bank", "entrepreneur",
            "startup", "company", "shop",
            "sell", "selling", "buy", "business idea",
            "customers", "sales"
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
// SCORE EXPERT
// ======================================================

function scoreExpert(text, expert) {
    if (!expert.keywords.length) {
        return 0;
    }

    let score = 0;

    for (const keyword of expert.keywords) {
        if (text.includes(keyword)) {
            score += keyword.includes(" ")
                ? 3
                : 2;
        }
    }

    return score;
}

// ======================================================
// CHOOSE EXPERT
// ======================================================

function chooseExpert(message = "") {
    const text = message
        .toLowerCase()
        .replace(/[^\w\s-]/g, " ");

    const scored = experts
        .map(expert => ({
            ...expert,
            score: scoreExpert(text, expert)
        }))
        .sort((a, b) => b.score - a.score);

    const winner = scored[0];

    if (!winner || winner.score === 0) {
        return {
            id: "general",
            name: "General Expert",
            prompt: general,
            score: 0,
            secondary: null
        };
    }

    return {
        id: winner.id,
        name: winner.name,
        prompt: winner.prompt,
        score: winner.score,
        secondary:
            scored[1] && scored[1].score > 0
                ? {
                    id: scored[1].id,
                    name: scored[1].name,
                    score: scored[1].score
                }
                : null
    };
}

module.exports = chooseExpert;
