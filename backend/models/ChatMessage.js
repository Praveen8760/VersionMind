
// backend/models/ChatMessage.js

import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    /* ============================================================
       User who sent/received this message
    ============================================================ */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,                 // Fast user lookup
    },

    /* ============================================================
       Repository this chat belongs to
    ============================================================ */
    repo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repo",
      required: true,
      index: true,                 // Fast repo lookup
    },

    /* ============================================================
       Sender → "user" or "ai"
    ============================================================ */
    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },

    /* ============================================================
       The actual stored chat message
    ============================================================ */
    message: {
      type: String,
      required: true,
      trim: true,
    },

    /* ============================================================
       Optional analytics data
    ============================================================ */
    tokens: {
      type: Number,
      default: null,
    },

    contextUsed: {
      type: [String],              // Stores chunk/file references
      default: [],
    },
  },

  /* ============================================================
     Timestamps for sorting/history
  ============================================================ */
  {
    timestamps: true,
  }
);

/* ============================================================
   Compound index → Fast chronological chat fetch
============================================================ */
ChatMessageSchema.index({ user: 1, repo: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", ChatMessageSchema);
