
// backend/routes/repo.js

import express from "express";
import {
  importRepo,
  listRepos,
  getRepoStatus
} from "../controllers/repoController.js";

const router = express.Router();

/**
 * ALL routes here already protected by isAuthenticated
 * because server.js uses:
 * 
 * app.use("/api/repo", isAuthenticated, repoRoutes);
 */

router.get("/list", listRepos);               // GET user repos
router.post("/import", importRepo);           // POST import new repo
router.get("/status/:repoId", getRepoStatus); // GET repo index progress

export default router;
