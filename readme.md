

# 🚀 VersionMind — AI-Powered Codebase Intelligence & Repository Analysis

VersionMind is a **modern, AI-driven code exploration platform** that helps developers understand any GitHub repository using:
- Real-time **RAG-powered chat**
- Automatic **code embeddings**
- Interactive **file tree & dependency graph**
- Ultra-modern **Futuristic UI (ChatGPT-level design)**

---

## ✨ Key Features

### 🧠 AI Chat for Codebases  
Ask questions about any imported repository:
- Folder/file explanations  
- Function breakdowns  
- Developer-level code summaries  
- Architecture insights  
- Hotspot detection (coming soon)

All responses stream in real-time using **SSE (Server-Sent Events)**.

---

### 📦 Repository Import  
Import any GitHub repository by simply pasting the repo URL.

Features:
- File-by-file parsing  
- Intelligent chunking  
- Automatic code/text classification  
- High-quality embeddings via **nomic-embed-text** & **mxbai-embed-large**

---

### 🛸 Ultra-modern UI  
Inspired by ChatGPT’s latest design:
- Liquid-glass interface  
- Beautiful gradients & shadows  
- Real-time auto scroll  
- Minimal & futuristic components  
- Smooth framer-motion animations

---

### 🗂️ File Explorer  
Browse imported repository:
- Full folder structure  
- Syntax-highlighted previews  
- Linked file references from AI chat

---

### 🕸️ Code Dependency Graph  
Interactive graph visualization:
- Function-level relationships  
- Arrows showing imports, calls, and references  
- Zoom + drag features  
- Powered by D3.js graph layout

---

### 🔐 Authentication (GitHub OAuth)
- Login with GitHub  
- Session-based authentication  
- MongoDB-backed secure session store  

---

## 🛠️ Tech Stack

### **Frontend**
- React + Vite  
- TailwindCSS  
- Framer Motion  
- Lucide Icons  
- EventSource Polyfill  
- Zustand / Context API

### **Backend**
- Node.js + Express  
- MongoDB + Mongoose  
- Passport (GitHub OAuth)  
- SSE for streaming  
- Custom RAG pipeline  
- Code embedding using **Ollama**

---

## 📁 Project Structure

```
VersionMind/
├── backend/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── middleware/
│   ├── server.js
│   └── ...
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   ├── layouts/
    │   └── App.jsx
    └── index.html
```

---

## ⚙️ Installation

### 1️⃣ Clone Project
```bash
git clone https://github.com/yourusername/VersionMind.git
cd VersionMind
```

---

### 2️⃣ Backend Setup  
```bash
cd backend
npm install
```

Create `.env` file:
```
MONGO_URI=mongodb://localhost:27017/versionmind
SESSION_SECRET=your_secret_key
GITHUB_CLIENT_ID=xxxx
GITHUB_CLIENT_SECRET=xxxx
FRONTEND_URL=http://localhost:5173
```

Run backend:
```bash
npm start
```

---

### 3️⃣ Frontend Setup  
```bash
cd frontend
npm install
npm run dev
```

---

## 🧮 RAG Pipeline Overview

```
User Query
   ↓
Vector Search (Embeddings)
   ↓
Top-k Relevant Code Chunks
   ↓
Context Reconstruction
   ↓
LLM (Ollama) Generates Answer
   ↓
Streaming Response → Frontend
```

---

## 🗄️ Database Schema

### Chat Messages
```js
{
  user: ObjectId,
  repo: ObjectId,
  sender: "user" | "ai",
  message: String,
  tokens: Number,
  contextUsed: [String],
  createdAt, updatedAt
}
```

### Repository & File Embeddings
```js
{
  repoId,
  filePath,
  content,
  chunks: [{ embedding, text }]
}
```

---

## 🧪 Development Flow

### Create new branch
```bash
git checkout -b dev
```

### Commit using Conventional Commit Rules
```bash
git commit -m "feat(ui): redesigned repo import progress modal with animations"
git commit -m "fix(chat): prevent duplicate AI message saving"
git commit -m "feat(api): added chat history loader"
```

---

## 🧩 Deployment (optional)
Supports:
- Docker  
- Render  
- Railway  
- Vercel (Frontend)  

---

## 📸 Screenshots (Add Later)
You can add:
- Login Screen  
- Dashboard  
- Chat UI  
- File Explorer  
- Dependency Graph  

---

## 🤝 Contributing

Want to contribute?  
Feel free to open:
- Issues  
- Feature Requests  
- Pull Requests  

---

## 📜 License
MIT License © 2025 VersionMind

---

## ⭐ Support the Project
Leave a star ⭐ if you like this project!

