

import mongoose from "mongoose";

const RepoNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    repo: { type: mongoose.Schema.Types.ObjectId, ref: "Repo", required: true },
    note: { type: String, default: "" }
  },
  { timestamps: true }
);

RepoNoteSchema.index({ user: 1, repo: 1 }, { unique: true });

export default mongoose.model("RepoNote", RepoNoteSchema);
