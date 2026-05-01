import React, { useState } from "react";
import axios from "axios";

function highlightText(text, keywords) {
  if (!keywords || keywords.length === 0) return text;

  let highlighted = text;
  keywords.forEach((word) => {
    const regex = new RegExp(`(${word})`, "gi");
    highlighted = highlighted.replace(
      regex,
      `<span class="bg-green-200 text-green-800 px-1 rounded">$1</span>`
    );
  });
  return highlighted;
}

function App() {
  const [file, setFile] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file || !jd) {
      alert("Please upload resume and add job description");
      return;
    }

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jd", jd);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/analyze", formData);
      setResult(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
      setLoading(false);
    }
  };

  const getScoreColor = () => {
    if (!result) return "bg-gray-400";
    if (result.score > 70) return "bg-green-500";
    if (result.score > 40) return "bg-yellow-400";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-gray-200 flex flex-col items-center p-6">

      {/* Title */}
      <h1 className="text-4xl font-bold mb-8 text-gray-800">
        ATS Resume Analyzer 🚀
      </h1>

      {/* Upload Card */}
      <div className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-xl">

        {/* File Upload */}
        <input
          type="file"
          className="mb-2 w-full border p-2 rounded"
          onChange={(e) => setFile(e.target.files[0])}
        />

        {file && (
          <p className="text-sm text-gray-600 mb-3">
            📄 {file.name}
          </p>
        )}

        {/* JD Input */}
        <textarea
          placeholder="Paste Job Description..."
          className="w-full p-3 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
          rows="5"
          value={jd}
          onChange={(e) => setJd(e.target.value)}
        />

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

          <button
            onClick={() => {
              setFile(null);
              setJd("");
              setResult(null);
            }}
            className="bg-gray-300 px-4 rounded-lg"
          >
            Reset
          </button>
        </div>
      </div>

      {/* RESULT */}
      {result && (
        <div className="mt-8 bg-white shadow-xl rounded-2xl p-6 w-full max-w-xl">

          {/* Score */}
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">ATS Score</h2>
            <span className="text-lg font-bold">{result.score}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div
              className={`h-4 rounded-full ${getScoreColor()}`}
              style={{ width: `${result.score}%` }}
            ></div>
          </div>

          {/* Matched Skills */}
          {result.matched && result.matched.length > 0 && (
            <>
              <h3 className="text-green-600 font-semibold mb-2">
                ✅ Matched Skills
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {result.matched.map((word, i) => (
                  <span
                    key={i}
                    className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Missing Skills */}
          <h3 className="text-red-600 font-semibold mb-2">
            ❌ Missing Skills
          </h3>

          <div className="flex flex-wrap gap-2 mb-4">
            {result.missing.map((word, index) => (
              <span
                key={index}
                className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm hover:bg-red-200"
              >
                {word}
              </span>
            ))}
          </div>

          {/* Highlighted JD */}
          <h3 className="font-semibold mb-2">📌 Job Description Analysis</h3>
          <div
            className="text-sm bg-gray-50 p-3 rounded border"
            dangerouslySetInnerHTML={{
              __html: highlightText(jd, result.matched),
            }}
          />

          {/* Suggestion */}
          <p className="mt-4 text-gray-600">
            💡 {result.suggestion}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;