

import mongoose from "mongoose";

const functionNodeSchema = new mongoose.Schema({
  repoId: { type: mongoose.Schema.Types.ObjectId, ref: "Repo", required: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },

  name: { type: String, required: true },
  type: { type: String, enum: ["function", "method", "class"], default: "function" },

  startLine: Number,
  endLine: Number,

  calls: [String],     // functions it calls
  calledBy: [String],  // reversed relationships

}, { timestamps: true });

export default mongoose.model("FunctionNode", functionNodeSchema);
