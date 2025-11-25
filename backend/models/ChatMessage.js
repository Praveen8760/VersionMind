


// backend/models/ChatMessage.js
import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    repo: { type: mongoose.Schema.Types.ObjectId, ref: "Repo", required: true },

    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true
    },

    message: {
      type: String,
      required: true,
      default: ""
    },

    // optional: store metadata for future improvements
    tokens: Number,
    contextUsed: Array,  // chunk IDs used
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", chatMessageSchema);
