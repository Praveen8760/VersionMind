
// src/context/RepoImportContext.jsx

import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRepo } from "./RepoContext";

import { EventSourcePolyfill } from 'event-source-polyfill';

const RepoImportContext = createContext();

export const RepoImportProvider = ({ children }) => {
  const { fetchRepos } = useRepo();

  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(null);

  const eventSourceRef = useRef(null);

  /* ---------------------- START IMPORT ---------------------- */
  const startImport = async (repoUrl) => {
    try {
      setIsImporting(true);
      setProgress({ message: "Connecting...", percent: 0 });

      // Trigger backend import start
      const res = await axios.post(
        "http://localhost:3000/api/repo/import",
        { repoUrl },
        { withCredentials: true }
      );

      if (!res.data.repoId) {
        throw new Error("Import request failed");
      }

      const repoId = res.data.repoId;

      /* ---------------------- OPEN SSE STREAM ---------------------- */

      eventSourceRef.current = new EventSourcePolyfill(
        `http://localhost:3000/sse/repo-progress/${repoId}`,
        {
          withCredentials: true
        }
      );



      eventSourceRef.current.onmessage = (e) => {
        const data = JSON.parse(e.data);

        setProgress({
          message: data.message,
          percent: data.percent,
        });

        // If done → cleanup
        if (data.percent === 100) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;

          setTimeout(async () => {
            await fetchRepos(); // refresh sidebar
            setIsImporting(false);
            setProgress(null);
          }, 600);
        }
      };

      eventSourceRef.current.onerror = () => {
        console.log("SSE connection lost");
        setIsImporting(false);
        setProgress(null);
        if (eventSourceRef.current) eventSourceRef.current.close();
      };
    } catch (err) {
      console.error("Repo import error:", err);
      setIsImporting(false);
    }
  };

  /* ---------------------- CLEANUP ON UNMOUNT ---------------------- */
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

  return (
    <RepoImportContext.Provider
      value={{
        isImporting,
        progress,
        startImport,
      }}
    >
      {children}
    </RepoImportContext.Provider>
  );
};

export const useRepoImport = () => useContext(RepoImportContext);
