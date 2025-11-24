
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const RepoContext = createContext();

export const RepoProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const [repos, setRepos] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null); 
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState(null);

  const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
  });

  /* ===========================================================
     FETCH USER REPOS
  =========================================================== */
  const fetchRepos = async () => {
    if (!user) return;

    try {
      setLoadingRepos(true);

      const res = await api.get("/api/repo/list");
      const items = res.data.repos || [];

      setRepos(items);

      // Restore previously selected repo
      const saved = localStorage.getItem("activeRepo");
      if (saved) {
        const found = items.find(r => r.repoId === saved);
        if (found) {
          setActiveRepo({
            id: found.repoId,
            name: found.repoName
          });
        }
      }

      setError(null);
    } catch (err) {
      console.error("❌ Failed to load repos:", err);
      setError("Failed to load repositories");
      setRepos([]);
    }

    setLoadingRepos(false);
  };

  /* ===========================================================
     IMPORT REPO (SSE handles live progress)
  =========================================================== */
  const importRepo = async (repoUrl) => {
    try {
      const res = await api.post("/api/repo/import", { repoUrl });

      // Already imported
      if (res.data.alreadyImported) {
        return {
          success: false,
          alreadyImported: true,
          repoId: res.data.repoId,
          message: res.data.message,
        };
      }

      // New import triggered
      return {
        success: true,
        repoId: res.data.repoId,
      };

    } catch (err) {
      console.error("Repo import failed:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Import failed",
      };
    }
  };

  /* ===========================================================
     LOAD REPOS AFTER LOGIN
  =========================================================== */
  useEffect(() => {
    if (!authLoading && user) {
      fetchRepos();
    } else if (!user) {
      setRepos([]);
      setActiveRepo(null);
    }
  }, [user, authLoading]);

  /* ===========================================================
     SET ACTIVE REPO (stores both id + name)
  =========================================================== */
  const setActiveRepoSafe = (repo) => {
    // repo = { id, name }
    setActiveRepo(repo);
    localStorage.setItem("activeRepo", repo.id);
  };

  return (
    <RepoContext.Provider
      value={{
        repos,
        activeRepo,
        loadingRepos,
        error,
        fetchRepos,
        importRepo,
        setActiveRepo: setActiveRepoSafe,
      }}
    >
      {children}
    </RepoContext.Provider>
  );
};

export const useRepo = () => useContext(RepoContext);
