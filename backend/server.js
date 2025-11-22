
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

// TRUST PROXY (REQUIRED for GitHub OAuth)
app.set("trust proxy", 1);

// ------------------- DB -------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// ------------------- CORS -------------------

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Type"]
}));


app.use(express.json());

// ------------------- SESSION -------------------
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
      secure: false, // must be false on localhost
      sameSite: "lax", // REQUIRED for GitHub OAuth
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// ------------------- PASSPORT -------------------
app.use(passport.initialize());
app.use(passport.session());

// ------------------- ROUTES -------------------
app.use("/auth", authRoutes);
app.use("/api/repo", isAuthenticated, repoRoutes);
app.use("/sse", isAuthenticated, sseRoutes);


// ------------------- HEALTH CHECK -------------------
app.get("/", (req, res) => {
  res.send({ message: "Backend Running ✔" });
});

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
