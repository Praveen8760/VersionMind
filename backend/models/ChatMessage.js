
// backend/models/ChatMessage.js

import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,           // Fast user-based searching
    },

    repo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repo",
      required: true,
      index: true,           // Fast repo-based searching
    },

    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    
    tokens: {
      type: Number,
      default: null,
    },

    contextUsed: {
      type: [String],
      default: [],
    },
  },

  {
    timestamps: true,          
  }
);

// Compound index for rapid history lookup
ChatMessageSchema.index({ user: 1, repo: 1, createdAt: 1 });

export default mongoose.model("ChatMessage", ChatMessageSchema);
