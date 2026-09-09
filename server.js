const express = require("express");
const cors = require("cors");

require("dotenv").config();

const {
    initDatabase
} = require("./memory/database");

const {
    requireAuth
} = require("./auth/authMiddleware");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("trust proxy", 1);

app.use(cors());

app.use(
    express.json({
        limit: "20mb"
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "20mb"
    })
);

const authRoutes =
    require("./auth/authRoutes");

app.use(
    "/api/auth",
    authRoutes
);

app.get(
    "/login",
    (req, res) => {
        res.sendFile(
            __dirname + "/login.html"
        );
    }
);

app.get(
    "/signup",
    (req, res) => {
        res.sendFile(
            __dirname + "/signup.html"
        );
    }
);

app.get(
    ["/dashboard", "/dashboard.html"],
    requireAuth,
    (req, res) => {
        res.sendFile(
            __dirname + "/dashboard.html"
        );
    }
);

app.get(
    "/",
    requireAuth,
    (req, res) => {
        res.sendFile(
            __dirname + "/index.html"
        );
    }
);

app.use(
    express.static(
        __dirname,
        {
            index: false
        }
    )
);

const chatRoutes =
    require("./routes/chatRoutes");

app.use(
    "/chat",
    chatRoutes
);

app.get(
    "/api/status",
    async (req, res) => {
        res.json({
            success: true,
            app: "Aman AI",
            version: "4.0.0",
            status: "Online",
            experts: 8,
            memory: "Permanent",
            database: "PostgreSQL",
            accounts: "Enabled",
            sessions: "Enabled",
            serverTime: new Date()
        });
    }
);

app.use(
    (req, res) => {
        res.status(404).json({
            success: false,
            message: "Endpoint not found."
        });
    }
);

async function startServer() {
    try {
        await initDatabase();

        app.listen(
            PORT,
            () => {
                console.log("");
                console.log(
                    "======================================"
                );
                console.log(
                    "🚀 Aman AI Server v4.0"
                );
                console.log(
                    "🌍 Port:",
                    PORT
                );
                console.log(
                    "🧠 Experts: 8"
                );
                console.log(
                    "🧠 Permanent Memory: ON"
                );
                console.log(
                    "🗄️ PostgreSQL: ON"
                );
                console.log(
                    "🔐 Accounts: ON"
                );
                console.log(
                    "🍪 Secure Sessions: ON"
                );
                console.log(
                    "⚡ Groq: ON"
                );
                console.log(
                    "✅ Server Online"
                );
                console.log(
                    "======================================"
                );
            }
        );
    } catch (error) {
        console.error(
            "❌ DATABASE STARTUP ERROR:",
            error
        );

        process.exit(1);
    }
}

startServer();
