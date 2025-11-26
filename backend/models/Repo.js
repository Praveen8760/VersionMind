

// backend/models/Repo.js

import mongoose from "mongoose";

const repoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    githubId: { type: String },   // <-- GitHub repo ID (numeric)
    repoName: String,
    owner: String,
    branch: String,

    status: {
      type: String,
      enum: ["pending", "importing", "indexing", "ready", "error"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Repo", repoSchema);
