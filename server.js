const express = require("express");
const cors = require("cors");

require("dotenv").config();

const {
    initDatabase
} = require("./memory/database");


const app = express();

const PORT =
    process.env.PORT || 3000;


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


app.use(
    express.static(__dirname)
);


const chatRoutes =
    require("./routes/chatRoutes");


app.use(
    "/chat",
    chatRoutes
);


app.get(
    "/",
    (req, res) => {

        res.sendFile(
            __dirname + "/index.html"
        );

    }
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

            serverTime:
                new Date()

        });

    }
);


app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "Endpoint not found."

        });

    }
);


/*
========================================
START SERVER
========================================
*/

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
