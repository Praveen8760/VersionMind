

// backend/model/File.js

import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    repoId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Repo",
      required: true 
    },

    filePath: { 
      type: String, 
      required: true 
    },

    extension: { 
      type: String, 
      default: "" 
    },

    content: { 
      type: String, 
      default: "" 
    },

    hash: { 
      type: String, 
      default: "" 
    },

    tokens: { 
      type: Number, 
      default: 0 
    }
  },
  { timestamps: true }
);

// Prevent duplicate file paths inside same repo
fileSchema.index({ repoId: 1, filePath: 1 }, { unique: true });

export default mongoose.model("File", fileSchema);
