
// backend/config/passport.js

import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

/* -------------------------------------------------------
   🔵 SERIALIZE USER → store user ID in session
---------------------------------------------------------*/
passport.serializeUser((user, done) => {
  done(null, user._id); // store MongoDB _id
});

/* -------------------------------------------------------
   🔵 DESERIALIZE USER → load user from session
---------------------------------------------------------*/
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean(); // lean = faster
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

/* -------------------------------------------------------
   🔵 GITHUB STRATEGY
---------------------------------------------------------*/
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email", "repo"], // REQUIRED for repo import
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        const githubId = profile.id;

        let user = await User.findOne({ githubId });

        if (!user) {
          // Create new user
          user = await User.create({
            githubId,
            name: profile.displayName || profile.username,
            email: profile.emails?.[0]?.value || "",
            avatar: profile.photos?.[0]?.value || "",
            accessToken, // store token for repo cloning / API
          });
        } else {
          // Update stored GitHub access token
          user.accessToken = accessToken;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

export default passport;
