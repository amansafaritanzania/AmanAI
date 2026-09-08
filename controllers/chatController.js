const groq = require("../config/groq");
const chooseExpert = require("../services/expertRouter");
const {
  createChat,
  getChat,
  saveMessage
} = require("../memory/chatMemory");

async function chat(req, res) {
  try {
    let {
      message,
      userId = "guest",
      chatId
    } = req.body;

    console.log("USER ID:", userId);
    console.log("CHAT ID:", chatId);

    // Validate message
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        reply: "Please enter a message."
      });
    }

    message = message.trim();

    if (!message) {
      return res.status(400).json({
        reply: "Message cannot be empty."
      });
    }

    // Create a chat automatically if no chatId exists
    if (!chatId) {
      chatId = createChat(userId);
      console.log("NEW CHAT CREATED:", chatId);
    }

    // Load previous history BEFORE saving current message
    let history = getChat(userId, chatId);

    console.log("OLD HISTORY:", history);

    // Save current user message
    saveMessage(
      userId,
      chatId,
      "user",
      message
    );

    console.log("SAVED USER MESSAGE:", message);

    // Add current message to the history sent to the AI
    history = [
      ...history,
      {
        role: "user",
        content: message
      }
    ];

    // Choose the correct expert
    const expert = chooseExpert(message);

    // Build messages for Groq
    const messages = [
      {
        role: "system",
        content: expert
      }
    ];

    history
      .slice(-20)
      .forEach((msg) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

    console.log("\n========== MESSAGES SENT TO GROQ ==========");

    messages.forEach((msg, index) => {
      console.log(
        `\n----- ${index + 1} (${msg.role}) -----`
      );

      console.log(msg.content);
    });

    console.log(
      "\n===========================================\n"
    );

    // Ask Groq
    const completion =
      await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        max_tokens: 2048,
        messages
      });

    // Get AI response
    let reply =
      completion.choices?.[0]?.message?.content;

    if (!reply) {
      reply =
        "Sorry, I couldn't generate a response.";
    }

    // Save AI response
    saveMessage(
      userId,
      chatId,
      "assistant",
      reply
    );

    // Send response to frontend
    res.json({
      success: true,
      chatId,
      reply
    });

  } catch (error) {

    console.error("CHAT ERROR:", error);

    res.status(500).json({
      success: false,
      reply: "Internal AI server error."
    });

  }
}

module.exports = {
  chat
};
```
