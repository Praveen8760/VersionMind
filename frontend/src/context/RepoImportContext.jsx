
// src/context/RepoImportContext.jsx

import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";
import { useRepo } from "./RepoContext";
import { EventSourcePolyfill } from "event-source-polyfill";

const RepoImportContext = createContext();

export const RepoImportProvider = ({ children }) => {
  const { fetchRepos } = useRepo();

  const [isImporting, setIsImporting] = useState(false);

  const [progress, setProgress] = useState({
    message: "",
    percent: 0,
    file: null,
    chunkIndex: 0,
    chunkTotal: 0,
    fileIndex: 0,
    fileTotal: 0,
  });

  const eventSourceRef = useRef(null);

  /* --------------------------------------------------------
      START IMPORT
  --------------------------------------------------------- */
  const startImport = async (repoUrl) => {
    try {
      setIsImporting(true);
      setProgress({
        message: "Preparing...",
        percent: 0,
        file: null,
      });

      const res = await axios.post(
        "http://localhost:3000/api/repo/import",
        { repoUrl },
        { withCredentials: true }
      );

      // If duplicate → show message and return
      if (res.data.alreadyImported) {
        setProgress({
          message: "⚠️ Repository already imported.",
          percent: 100,
        });

        setTimeout(() => {
          setIsImporting(false);
          setProgress(null);
        }, 1200);

        return;
      }

      if (!res.data.repoId) throw new Error("Import failed");

      const repoId = res.data.repoId;

      /* --------------------------------------------------------
          CONNECT SSE
      --------------------------------------------------------- */
      const ES = window.EventSource || EventSourcePolyfill;

      eventSourceRef.current = new ES(
        `http://localhost:3000/sse/repo-progress/${repoId}`,
        { withCredentials: true }
      );

      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        /* ===============================
           📌 1. FILE_START
        =============================== */
        if (data.type === "FILE_START") {
          setProgress({
            message: `📁 Importing ${data.file}`,
            percent: data.percent,
            file: data.file,
            fileIndex: data.index,
            fileTotal: data.totalFiles,
            chunkIndex: 0,
            chunkTotal: 0,
          });
        }

        /* ===============================
           📌 2. CHUNK_PROGRESS
        =============================== */
        if (data.type === "CHUNK_PROGRESS") {
          setProgress((prev) => ({
            ...prev,
            message: `Embedding chunks of ${data.file} (${data.chunkIndex}/${data.chunkTotal})`,
            percent: data.overallPercent,
            chunkIndex: data.chunkIndex,
            chunkTotal: data.chunkTotal,
            file: data.file,
          }));
        }

        /* ===============================
           📌 3. FILE_DONE
        =============================== */
        if (data.type === "FILE_DONE") {
          setProgress({
            message: `✔️ Completed: ${data.file}`,
            percent: data.overallPercent,
            file: data.file,
            chunkIndex: 0,
            chunkTotal: 0,
          });
        }

        /* ===============================
           📌 4. DONE — All Complete
        =============================== */
        if (data.type === "DONE") {
          setProgress({
            message: `🎉 Import Finished`,
            percent: 100,
            file: null,
          });

          eventSourceRef.current.close();
          eventSourceRef.current = null;

          setTimeout(async () => {
            await fetchRepos();
            setIsImporting(false);
            setProgress(null);
          }, 800);
        }

        /* ===============================
           ❌ 5. ERROR
        =============================== */
        if (data.type === "ERROR") {
          setProgress({
            message: `❌ Error: ${data.message}`,
            percent: 0,
          });
          setIsImporting(false);
        }
      };

      eventSourceRef.current.onerror = () => {
        console.log("❌ SSE connection lost");
        if (eventSourceRef.current) eventSourceRef.current.close();
        setIsImporting(false);
        setProgress(null);
      };
    } catch (err) {
      console.error("Repo import error:", err);
      setIsImporting(false);
      setProgress(null);
    }
  };

  /* Cleanup on unmount */
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
