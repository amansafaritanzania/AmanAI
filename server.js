// ======================================================
// Aman AI Server v3.2
// Production Ready
// ======================================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(express.json({ limit: "20mb" }));

app.use(express.urlencoded({
    extended: true,
    limit: "20mb"
}));

// ======================================================
// STATIC FILES
// ======================================================

app.use(express.static(__dirname));

// ======================================================
// ROUTES
// ======================================================

const chatRoutes = require("./routes/chatRoutes");

app.use("/chat", chatRoutes);

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

    res.sendFile(__dirname + "/index.html");

});

// ======================================================
// API STATUS
// ======================================================

app.get("/api/status", (req, res) => {

    res.json({

        success: true,

        app: "Aman AI",

        version: "3.2.0",

        status: "Online",

        experts: 8,

        serverTime: new Date()

    });

});

// ======================================================
// 404
// ======================================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "Endpoint not found."

    });

});

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {

    console.clear();

    console.log("");

    console.log("======================================");

    console.log("🚀 Aman AI Server v3.2");

    console.log("🌍 Running on Port:", PORT);

    console.log("🧠 Experts Loaded: 8");

    console.log("💾 Memory System Ready");

    console.log("⚡ Groq Connected");

    console.log("✅ Server Online");

    console.log("======================================");

});