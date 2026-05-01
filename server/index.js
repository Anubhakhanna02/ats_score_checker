const express = require("express");
const multer = require("multer");
const cors = require("cors");
const pdfParse = require("pdf-parse/lib/pdf-parse");
const fs = require("fs");

// NLP
const natural = require("natural");
const stopword = require("stopword");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

// 🔹 Synonyms (helps improve matching)
const synonyms = {
  js: "javascript",
  reactjs: "react",
  nodejs: "node",
  backend: "server",
  frontend: "client",
  dev: "developer",
  ml: "machine",
  ai: "artificial"
};

// 🔹 Useless/common words (to ignore)
const uselessWords = [
  "the","and","for","with","this","that","will","are","you",
  "we","our","your","from","have","has","had","was","were",
  "job","role","position","seeking","looking","candidate",
  "team","member","responsible","work","experience","skills",
  "ability","good","strong","knowledge"
];

// 🔹 Utility: check useful words
const isUsefulWord = (word) => {
  return word.length > 3 && /^[a-zA-Z]+$/.test(word);
};

app.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const jd = req.body.jd.toLowerCase();

    // 📄 Read Resume PDF
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text.toLowerCase();

    const tokenizer = new natural.WordTokenizer();

    // 🔹 Tokenize
    let jdTokens = tokenizer.tokenize(jd);
    let resumeTokens = tokenizer.tokenize(resumeText);

    // 🔹 Remove stopwords
    jdTokens = stopword.removeStopwords(jdTokens);
    resumeTokens = stopword.removeStopwords(resumeTokens);

    // 🔹 Normalize
    jdTokens = jdTokens.map(w => w.toLowerCase());
    resumeTokens = resumeTokens.map(w => w.toLowerCase());

    // 🔹 Unique JD keywords
    const uniqueJD = [...new Set(jdTokens)];

    // 🔹 Filter meaningful words dynamically
    const filteredJD = uniqueJD.filter(word =>
      isUsefulWord(word) && !uselessWords.includes(word)
    );

    let matchCount = 0;
    let matched = [];
    let missing = [];

    filteredJD.forEach(word => {
      if (
        resumeTokens.includes(word) ||
        resumeTokens.includes(synonyms[word])
      ) {
        matchCount++;
        matched.push(word);
      } else {
        missing.push(word);
      }
    });

    // 🔹 Score
    const score = filteredJD.length
      ? Math.round((matchCount / filteredJD.length) * 100)
      : 0;

    // 🔹 Response
    res.json({
      score,
      matched: matched.slice(0, 15),
      missing: missing.slice(0, 15),
      suggestion:
        "Improve your resume by adding missing keywords, tools, and relevant project experience from the job description."
    });

    // 🧹 Cleanup
    fs.unlinkSync(filePath);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error processing resume");
  }
});

// 🚀 Start server
app.listen(5000, () => {
  console.log("🚀 Dynamic ATS Server running on port 5000");
});