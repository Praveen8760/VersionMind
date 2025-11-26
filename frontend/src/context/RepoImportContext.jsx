

// src/context/RepoImportContext.jsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

import axios from "axios";
import { EventSourcePolyfill } from "event-source-polyfill";
import { useRepo } from "./RepoContext";

const RepoImportContext = createContext();

export const RepoImportProvider = ({ children }) => {
  const { fetchRepos } = useRepo();

  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(null);

  const eventSourceRef = useRef(null);

  /* -------------------------------------------------------------
       SAFELY CLOSE SSE
  ------------------------------------------------------------- */
  const closeSSE = () => {
    if (eventSourceRef.current) {
      console.log("%c[IMPORT] SSE closed", "color: red");
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  /* -------------------------------------------------------------
       START IMPORT PROCESS
  ------------------------------------------------------------- */
  const startImport = async (repoUrl) => {
    if (!repoUrl.trim()) return;

    try {
      setIsImporting(true);
      setProgress({
        message: "Preparing import...",
        percent: 0,
        file: null,
        fileIndex: 0,
        fileTotal: 0,
        chunkIndex: 0,
        chunkTotal: 0,
        mode: "start",
      });

      /* -------------------------------------------
          KICKOFF IMPORT REQUEST
      ------------------------------------------- */
      const res = await axios.post(
        "http://localhost:3000/api/repo/import",
        { repoUrl },
        { withCredentials: true }
      );

      // Duplicate import
      if (res.data.alreadyImported) {
        setProgress({
          message: "⚠️ Repository already imported.",
          percent: 100,
          file: null,
        });

        setTimeout(() => {
          setIsImporting(false);
          setProgress(null);
        }, 1000);

        return;
      }

      const repoId = res.data.repoId;
      if (!repoId) throw new Error("Import failed — missing repoId");

      /* -------------------------------------------
          OPEN SSE CONNECTION
      ------------------------------------------- */
      const ES = window.EventSource || EventSourcePolyfill;

      console.log("%c[IMPORT] SSE Connected", "color: cyan");

      eventSourceRef.current = new ES(
        `http://localhost:3000/sse/repo-progress/${repoId}`,
        { withCredentials: true }
      );

      /* -------------------------------------------
          HANDLE EVENTS FROM BACKEND
      ------------------------------------------- */
      eventSourceRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);

        // -------------------- FILE_START --------------------
        if (data.type === "FILE_START") {
          setProgress({
            message: `📁 Importing ${data.file}`,
            percent: data.percent || 0,
            file: data.file,
            fileIndex: data.index,
            fileTotal: data.totalFiles,
            chunkIndex: 0,
            chunkTotal: 0,
            mode: "file",
          });
        }

        // -------------------- CHUNK_PROGRESS --------------------
        if (data.type === "CHUNK_PROGRESS") {
          setProgress((prev) => ({
            ...prev,
            message: `Embedding ${data.file} (${data.chunkIndex}/${data.chunkTotal})`,
            percent: data.overallPercent,
            chunkIndex: data.chunkIndex,
            chunkTotal: data.chunkTotal,
          }));
        }

        // -------------------- FILE_DONE --------------------
        if (data.type === "FILE_DONE") {
          setProgress((prev) => ({
            ...prev,
            message: `✔️ Completed ${data.file}`,
            percent: data.overallPercent,
            chunkIndex: 0,
            chunkTotal: 0,
            mode: "file_done",
          }));
        }

        // -------------------- DONE --------------------
        if (data.type === "DONE") {
          setProgress({
            message: "🎉 Import Complete!",
            percent: 100,
            file: null,
          });

          closeSSE();

          setTimeout(async () => {
            await fetchRepos();
            setIsImporting(false);
            setProgress(null);
          }, 800);
        }

        // -------------------- ERROR --------------------
        if (data.type === "ERROR") {
          console.error("[IMPORT ERROR]", data.message);

          setProgress({
            message: `❌ Error: ${data.message}`,
            percent: 0,
          });

          setIsImporting(false);
          closeSSE();
        }
      };

      eventSourceRef.current.onerror = () => {
        console.log("%c❌ [IMPORT] SSE Lost", "color: red");
        closeSSE();
        setIsImporting(false);
        setProgress(null);
      };
    } catch (err) {
      console.error("[IMPORT ERROR]", err);
      setIsImporting(false);
      setProgress(null);
      closeSSE();
    }
  };

  /* -------------------------------------------------------------
       CLEANUP ON UNMOUNT
  ------------------------------------------------------------- */
  useEffect(() => {
    return () => closeSSE();
  }, []);

  /* -------------------------------------------------------------
       PROVIDER
  ------------------------------------------------------------- */
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
