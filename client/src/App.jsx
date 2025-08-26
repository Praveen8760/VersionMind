import { useState } from "react";
import axios from "axios";
import "./App.css"; // import your CSS

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [data, setData] = useState(null);

  const analyzeRepo = async () => {
    const res = await axios.post("http://localhost:5000/analyze", { repoUrl });
    setData(res.data);
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
      <button className="button" onClick={analyzeRepo}>
        Analyze Repo
      </button>
      {data && (
        <div className="result">
          <p><b>Name:</b> {data.name}</p>
          <p><b>Stars:</b> {data.stars}</p>
          <p><b>Forks:</b> {data.forks}</p>
        </div>
      )}
    </div>
  );
}

export default App;
