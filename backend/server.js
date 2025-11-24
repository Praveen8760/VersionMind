
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
import sseRoutes from "./routes/sse.js";
import { isAuthenticated } from "./middleware/auth.js";

import "./config/passport.js";

dotenv.config();

const app = express();

// ---------------------------------------------------------
// 1. TRUST PROXY (Required for GitHub OAuth)
// ---------------------------------------------------------
app.set("trust proxy", 1);

// ---------------------------------------------------------
// 2. CONNECT MONGO
// ---------------------------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ---------------------------------------------------------
// 3. CORS — SSE + Cookies Fully Supported
// ---------------------------------------------------------
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

// ---------------------------------------------------------
// 4. SESSION STORE
// ---------------------------------------------------------
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
      secure: false, // localhost only
      sameSite: "lax", // required for GitHub OAuth
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ---------------------------------------------------------
// 5. PASSPORT AUTH
// ---------------------------------------------------------
app.use(passport.initialize());
app.use(passport.session());

// ---------------------------------------------------------
// 6. ROUTES
// ---------------------------------------------------------
app.use("/auth", authRoutes);

// REPO APIs require authentication
app.use("/api/repo", isAuthenticated, repoRoutes);

// SSE MUST NOT use isAuthenticated — EventSource sends cookies later
app.use("/sse", sseRoutes);

// ---------------------------------------------------------
// 7. HEALTH CHECK
// ---------------------------------------------------------
app.get("/", (req, res) => {
  res.send({ message: "Backend Running ✔" });
});

// ---------------------------------------------------------
// 8. START SERVER
// ---------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
