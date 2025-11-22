
import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    repo: { type: mongoose.Schema.Types.ObjectId, ref: "Repo" },
    path: String,        // src/routes/api.js
    extension: String,   // .js
    size: Number,
    content: String,     // raw text
  },
  { timestamps: true }
);

export default mongoose.model("File", fileSchema);
