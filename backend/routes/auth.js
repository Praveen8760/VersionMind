
// backend/routes/auth.js

import express from "express";
import passport from "passport";

const router = express.Router();

/**
 * 1️⃣ Start GitHub OAuth
 */
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email", "repo"],   // required for repo access
  })
);

/**
 * 2️⃣ GitHub OAuth Callback
 */

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: "http://localhost:5173/login",
  }),
  (req, res, next) => {
    // Wait for session to save before redirect
    req.session.save((err) => {
      if (err) return next(err);

      console.log("✅ SESSION SAVED FOR USER:", req.user?.name);

      res.redirect("http://localhost:5173/dashboard");
    });
  }
);


/**
 * 3️⃣ Authenticated User Data
 */
router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }

  res.json({ user: req.user });
});

/**
 * 4️⃣ Logout User
 */
router.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true, message: "Logged out" });
    });
  });
});

export default router;
