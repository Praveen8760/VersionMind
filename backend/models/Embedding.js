
// backend/models/Embedding.js

import mongoose from "mongoose";

const embeddedSchema = new mongoose.Schema(
  {
    repoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Repo",
      required: true,
    },

    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    embedding: {
      type: [Number],   // vector values from Ollama
      required: true,
    },

    tokenCount: {
      type: Number,
      default: 0,
    },

    model: {
      type: String,
      default: "nomic-embed-text", // or "llama-embed"
    },

    hash: {
      type: String, // sha256 to detect duplicate chunks
    }
  },
  { timestamps: true }
);

// ----------- Indexes -----------
embeddedSchema.index({ repoId: 1 });
embeddedSchema.index({ fileId: 1 });
embeddedSchema.index({ chunkIndex: 1 });

// MongoDB Atlas Vector Index support
embeddedSchema.index({ embedding: "vector" });

export default mongoose.model("Embedded", embeddedSchema);
