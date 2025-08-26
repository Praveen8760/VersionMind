import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyzeRepo = async () => {
    if (!repoUrl) {
      setError("Please enter a GitHub repository URL.");
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await axios.post("/api/analyze", { repoUrl });
      console.log("Response from backend:", res.data);
      setData(res.data);
    } 
    catch (err) {
      console.error("Error calling backend:", err);
      setError(err.response?.data?.error || "Failed to fetch repo data.");
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1 className="title">VersionMind</h1>

      <input
        className="input"
        type="text"
        placeholder="Enter GitHub repo URL"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
      />

      <button className="button" onClick={analyzeRepo} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze Repo"}
      </button>

      {error && <p className="error">{error}</p>}

      {data && (
        <div className="result">
          <p><b>Name:</b> {data.name}</p>
          <p><b>Description:</b> {data.description || "N/A"}</p>
          <p><b>Stars:</b> {data.stars}</p>
          <p><b>Forks:</b> {data.forks}</p>
          <p><b>Open Issues:</b> {data.open_issues}</p>
        </div>
      )}
    </div>
  );
}

export default App;
