# 🤖 Aman AI

## Tanzania-Focused AI Assistant

Aman AI is a multi-expert artificial intelligence platform designed to help people learn, create, and solve real-world problems.

It is built with the vision of creating an AI assistant that understands local needs, languages, education systems, and everyday life.

---

# 🌍 Vision

Aman AI is not just a chatbot.

It is a collection of specialised experts:

- 🎓 Teacher
- 🌾 Agriculture
- 💻 Coding
- 🏥 Health
- 🦁 Safari
- 💼 Business
- ✍️ Content Creator
- 📖 Bible

Each expert has a different purpose and communication style.

---

# ⭐ Main Features

## 💬 AI Chat

- Natural conversations
- Expert selection
- Chat memory

---

## 🎓 Teacher Expert

Designed for students.

Features:

- TIE syllabus support
- NECTA-style preparation
- Simple explanations
- Revision notes
- Practice questions
- Step-by-step learning

---

## 🌾 Agriculture Expert

Designed for farmers.

Features:

- Kiswahili communication
- Crop guidance
- Farming methods
- Disease support
- Modern farming advice
- Agriculture business guidance

---

## 💻 Coding Expert

Features:

- Programming help
- Debugging
- Code explanations
- Software guidance

---

# 🛠️ Technology Stack

## Frontend

- HTML
- CSS
- JavaScript

## Backend

- Node.js
- Express.js

## AI

- Groq API

## Storage

- JSON-based chat memory system

---

# 📂 Project Structure
AmanAI
├── config │   └── groq.js │ ├── controllers │   └── chatController.js │ ├── memory │   ├── chatMemory.js │   └── chats.json │ ├── prompts │   ├── teacher.js │   ├── agriculture.js │   └── other experts │ ├── routes │   └── chatRoutes.js │ ├── services │   └── expertRouter.js │ ├── index.html ├── script.js ├── style.css ├── server.js ├── package.json └── .env

---

# 🚀 Installation

## 1. Clone the project
git clone your-project-link

---

## 2. Install dependencies
npm install

---

## 3. Create environment variables

Create a `.env` file:
GROQ_API_KEY=your_api_key_here

---

## 4. Start the server
node server.js
The server will run locally.

AMAN AI v8 CREATOR MODE

Replace:

routes/chatRoutes.js

index.html

script.js

style.css

Add:

services/mediaCreatorService.js

No npm dependency was added; Node 24 built-in fetch is used.

Render environment variable required:
FAL_KEY=<your fal API key>

Optional:
AMAN_IMAGE_MODEL=fal-ai/flux-2
AMAN_VIDEO_MODEL=fal-ai/kling-video/v3/standard/text-to-video

Creator endpoints are mounted under the existing /chat router:
POST /chat/creator/image
POST /chat/creator/video
GET  /chat/creator//status

Image jobs use FLUX.2.
Video jobs use Kling Video v3 Standard.
Both run asynchronously through fal queue.
Creator jobs are ownership-bound to the authenticated Aman AI account and persisted in PostgreSQL.

---

# 🧪 Testing

Test:

- Chat messages
- Expert selection
- Chat history
- New conversations
- Delete chat
- Code copying

---

# 📌 Development Status

Current Version:

## Aman AI v3.2

Completed:

✅ Multi-expert system  
✅ Chat memory  
✅ Premium interface  
✅ Teacher Expert upgrade  
✅ Agriculture Expert upgrade  
✅ Code copy feature  

---

# 🔮 Future Plans

- Public beta release
- Mobile application
- Voice interaction
- Image analysis
- More local languages
- More expert knowledge

---

# 🤝 Contribution

Aman AI is continuously improving through testing, feedback and new ideas.

The goal is to build technology that helps people learn, work and grow.

---

# 🇹🇿 Built With Purpose

Aman AI is created with the vision of making useful artificial intelligence accessible and practical for Tanzania and beyond.
