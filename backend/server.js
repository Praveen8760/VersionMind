
// backend/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import MongoStore from "connect-mongo";

import authRoutes from "./routes/auth.js";
import repoRoutes from "./routes/repo.js";
import chatRoutes from "./routes/chat.js";              // /ask/stream
import chatHistoryRoutes from "./routes/chatHistory.js"; // /history/*
import sseRoutes from "./routes/sse.js";
import treeRoute from "./routes/repoTree.js";
import graphRoutes from "./routes/graph.js";
import aiRoutes from "./routes/ai.js";
import notesRoutes from "./routes/notes.js";
import changelogRoutes from "./routes/changelog.js";

import { isAuthenticated } from "./middleware/auth.js";
import "./config/passport.js";

dotenv.config();

const app = express();

/* -----------------------------------------------
   TRUST PROXY (OAuth requirement)
------------------------------------------------ */
app.set("trust proxy", 1);

/* -----------------------------------------------
   MONGO CONNECTION
------------------------------------------------ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* -----------------------------------------------
   CORS (IMPORTANT FOR SSE + COOKIES)
------------------------------------------------ */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());
app.use(express.json());

/* -----------------------------------------------
   SESSION (MongoDB)
------------------------------------------------ */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev_secret_key",
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),

    cookie: {
      httpOnly: true,
      secure: false, // LOCALHOST ONLY
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

/* -----------------------------------------------
   PASSPORT
------------------------------------------------ */
app.use(passport.initialize());
app.use(passport.session());

/* -----------------------------------------------
   ROUTES
------------------------------------------------ */

// 🔓 Public Auth routes
app.use("/auth", authRoutes);

// 🔐 Protected repo-related routes
app.use("/api/repo", isAuthenticated, repoRoutes);
app.use("/api/tree", isAuthenticated, treeRoute);
app.use("/api/graph", isAuthenticated, graphRoutes);
app.use("/api/notes", isAuthenticated, notesRoutes);
app.use("/api/changelog", changelogRoutes);


/* ===========================================================
   CHAT SYSTEM (IMPORTANT ORDER!)
   Mounted at:  /api/chat
=========================================================== */

// 1️⃣ Chat History Routes
// handles:
//   GET  /api/chat/history/:repoId
//   POST /api/chat/history/save
app.use("/api/chat", isAuthenticated, chatHistoryRoutes);

// 2️⃣ Chat Streaming Routes (RAG SSE)
// handles:
//   GET /api/chat/ask/stream
app.use("/api/chat", isAuthenticated, chatRoutes);

/* -----------------------------------------------
   SSE Repo Import Stream
------------------------------------------------ */
app.use("/sse", sseRoutes);

/* -----------------------------------------------
   AI Tools
------------------------------------------------ */
app.use("/api/ai", aiRoutes);

/* -----------------------------------------------
   HEALTH CHECK
------------------------------------------------ */
app.get("/", (req, res) => {
  res.send({ message: "Backend Running ✔" });
});

/* -----------------------------------------------
   SERVER
------------------------------------------------ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
