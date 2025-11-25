


// backend/models/Repo.js

import mongoose from "mongoose";

const repoSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    repoId: { type: String },     // github user/repo
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
