const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

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

const authRoutes = require("./auth/authRoutes");
app.use("/api/auth", authRoutes);

/*
|--------------------------------------------------------------------------
| Public account pages
|--------------------------------------------------------------------------
*/

app.get("/login", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "login.html"
        )
    );
});

app.get("/signup", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "signup.html"
        )
    );
});

/*
|--------------------------------------------------------------------------
| Protected account pages
|--------------------------------------------------------------------------
*/

app.get(
    ["/dashboard", "/dashboard.html"],
    requireAuth,
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "dashboard.html"
            )
        );
    }
);

/*
|--------------------------------------------------------------------------
| Protected Aman AI homepage
|--------------------------------------------------------------------------
|
| IMPORTANT:
| The root route comes BEFORE express.static().
| This stops Express from automatically serving index.html
| to logged-out users.
|
*/

app.get(
    "/",
    requireAuth,
    (req, res) => {

        const indexPath =
            path.join(
                __dirname,
                "index.html"
            );

        fs.readFile(
            indexPath,
            "utf8",
            (error, html) => {

                if (error) {
                    console.error(
                        "INDEX READ ERROR:",
                        error
                    );

                    return res
                        .status(500)
                        .send(
                            "Could not load Aman AI."
                        );
                }

                /*
                 * Privacy guard is injected here so
                 * index.html does not need another manual edit.
                 */
                const privacyScript =
                    '<script src="/privacyGuard.js"></script>';

                if (
                    html.includes(
                        "</body>"
                    ) &&
                    !html.includes(
                        "/privacyGuard.js"
                    )
                ) {
                    html =
                        html.replace(
                            "</body>",
                            privacyScript +
                            "\n</body>"
                        );
                }

                res
                    .type("html")
                    .send(html);
            }
        );
    }
);

/*
|--------------------------------------------------------------------------
| Static assets
|--------------------------------------------------------------------------
|
| index:false is CRITICAL.
| It prevents express.static() from serving index.html automatically.
|
*/

app.use(
    express.static(
        __dirname,
        {
            index: false
        }
    )
);

/*
|--------------------------------------------------------------------------
| Chat API
|--------------------------------------------------------------------------
*/

const chatRoutes =
    require("./routes/chatRoutes");

app.use(
    "/chat",
    chatRoutes
);

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

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
            privacyLock: "Enabled",
            serverTime: new Date()
        });
    }
);

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
    (req, res) => {
        res.status(404).json({
            success: false,
            message:
                "Endpoint not found."
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
                    "🔒 Privacy Lock: ON"
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
