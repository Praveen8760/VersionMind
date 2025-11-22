import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const RepoContext = createContext();

export const RepoProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();   // 👈 depends on auth
  const [repos, setRepos] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState(null);

  // Base axios config (only need once)
  const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
  });

  // -----------------------------
  // Fetch user repos (ONLY after login)
  // -----------------------------
  const fetchRepos = async () => {
    if (!user) return;              // ❌ don't call backend if user not logged in
    try {
      setLoadingRepos(true);

      const res = await api.get("/api/repo/list");

      setRepos(res.data.repos || []);

      // Restore last opened repo
      const saved = localStorage.getItem("activeRepo");
      if (saved && res.data.repos.find(r => r.repoId === saved)) {
        setActiveRepo(saved);
      } else {
        setActiveRepo(null);
      }

      setError(null);
    } catch (err) {
      console.error("❌ Failed to load repos:", err);
      setError("Failed to load repositories");
      setRepos([]);
    }

    setLoadingRepos(false);
  };

  // -----------------------------
  // Import a repo
  // -----------------------------
  const importRepo = async (repoUrl) => {
    try {
      const res = await api.post("/api/repo/import", { repoUrl });

      // Refresh repos after import
      await fetchRepos();

      if (res.data.repoId) {
        setActiveRepo(res.data.repoId);
        localStorage.setItem("activeRepo", res.data.repoId);
      }

      return { success: true, repo: res.data };
    } catch (err) {
      console.error("Repo import failed:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Import failed",
      };
    }
  };

  // -----------------------------
  // Auto fetch repos ONLY after user loads
  // -----------------------------
  useEffect(() => {
    if (!authLoading && user) {
      fetchRepos();    // 👈 ONLY runs after user authenticated
    }
  }, [user, authLoading]);

  return (
    <RepoContext.Provider
      value={{
        repos,
        activeRepo,
        loadingRepos,
        error,
        fetchRepos,
        importRepo,
        setActiveRepo: (id) => {
          setActiveRepo(id);
          localStorage.setItem("activeRepo", id);
        }
      }}
    >
      {children}
    </RepoContext.Provider>
  );
};

export const useRepo = () => useContext(RepoContext);
