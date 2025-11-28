
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
import chatRoutes from "./routes/chat.js";          // ✅ ADDED
import sseRoutes from "./routes/sse.js";
import treeRoute from "./routes/repoTree.js";
import graphRoutes from "./routes/graph.js";

import aiRoutes from "./routes/ai.js";

import { isAuthenticated } from "./middleware/auth.js";
import "./config/passport.js";

dotenv.config();

const app = express();

/* ============================================================================
   1. TRUST PROXY (GitHub OAuth requirement)
============================================================================= */
app.set("trust proxy", 1);

/* ============================================================================
   2. MONGO CONNECTION
============================================================================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* ============================================================================
   3. CORS (Full SSE + Cookie Support)
============================================================================= */
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.options("*", cors());
app.use(express.json());

/* ============================================================================
   4. SESSION STORAGE (Mongo)
============================================================================= */
app.use(session({
  secret: process.env.SESSION_SECRET || "dev_secret_key",
  resave: false,
  saveUninitialized: false,

  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: "sessions",
  }),

  cookie: {
    httpOnly: true,
    secure: false,       // only false for localhost development
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

/* ============================================================================
   5. PASSPORT AUTH
============================================================================= */
app.use(passport.initialize());
app.use(passport.session());

/* ============================================================================
   6. ROUTES
============================================================================= */

// 🔐 AUTH ROUTES (NO PROTECTION)
app.use("/auth", authRoutes);

// 🔐 PROTECTED API ROUTES
app.use("/api/repo", isAuthenticated, repoRoutes);

// 🧠 CHAT RAG PIPELINE (protected)
app.use("/api/chat", chatRoutes);    // ✅ FIXED & ADDED

// 🟦 SSE IMPORT STREAM (NO AUTH because EventSource sends cookie later)
app.use("/sse", sseRoutes);


// Need to be tested

app.use("/api/tree",isAuthenticated, treeRoute);

app.use("/api/graph", isAuthenticated, graphRoutes);


app.use("/api/ai", aiRoutes);




/* ============================================================================
   7. HEALTH CHECK
============================================================================= */
app.get("/", (req, res) => {
  res.send({ message: "Backend Running ✔" });
});

/* ============================================================================
   8. START SERVER
============================================================================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at: http://localhost:${PORT}`)
);
