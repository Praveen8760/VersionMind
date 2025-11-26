

// src/context/RepoContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const RepoContext = createContext();

export const RepoProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();

  const [repos, setRepos] = useState([]);
  const [activeRepo, setActiveRepo] = useState(null);

  const [reposLoading, setReposLoading] = useState(true);
  const [activeRepoLoading, setActiveRepoLoading] = useState(true);

  const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
  });

  /* ====================================================
     FETCH USER REPOSITORIES
  ==================================================== */
  const fetchRepos = async () => {
    if (!user) return;

    setReposLoading(true);

    try {
      const res = await api.get("/api/repo/list");
      const items = res.data.repos || [];
      setRepos(items);

      // Restore active repo
      const saved = localStorage.getItem("activeRepo");

      if (saved) {
        const found = items.find((r) => r._id === saved);
        if (found) {
          setActiveRepo({
            id: found._id,
            name: found.repoName,
            githubId: found.repoId,
          });
        }
      }
    } catch (err) {
      console.error("❌ Failed to load repos:", err);
      setRepos([]);
    }

    setReposLoading(false);
    setActiveRepoLoading(false);
  };

  /* ====================================================
     SET ACTIVE REPO
  ==================================================== */
  const setActiveRepoSafe = (repo) => {
    localStorage.setItem("activeRepo", repo.id);
    setActiveRepo(repo);
  };

  /* ====================================================
     FILE TREE FETCH
  ==================================================== */
  const getFiles = async (repoMongoId) => {
    try {
      const res = await api.get(`/api/tree/${repoMongoId}`);
      return res.data.tree || [];
    } catch (err) {
      console.error("❌ Failed to fetch files:", err);
      return [];
    }
  };

  /* Load repos when logged in */
  useEffect(() => {
    if (!authLoading && user) fetchRepos();
    else if (!user) {
      setRepos([]);
      setActiveRepo(null);
    }
  }, [user, authLoading]);

  return (
    <RepoContext.Provider
      value={{
        repos,
        activeRepo,
        reposLoading,
        activeRepoLoading,
        setActiveRepo: setActiveRepoSafe,
        getFiles,
      }}
    >
      {children}
    </RepoContext.Provider>
  );
};

export const useRepo = () => useContext(RepoContext);
