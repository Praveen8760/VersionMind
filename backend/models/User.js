

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
    },
    email: {
      type: String,
      lowercase: true,
    },
    avatar: {
      type: String,
    },
    accessToken: {
      type: String, // used for repo import, branches, files
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
