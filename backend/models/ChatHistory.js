
import mongoose from "mongoose";

const ChatHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },

  repoId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Repo",
    required: true 
  },

  sender: {
    type: String,
    enum: ["user", "ai"],
    required: true
  },

  text: {
    type: String,
    required: true
  },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("ChatHistory", ChatHistorySchema);
