const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const fetch = require("node-fetch");
const FormData = require("form-data");

const User = require("./models/User");
const Memory = require("./models/Memory");
const app = express();
const upload = multer();

app.use(cors());

app.use(express.json());

// ✅ MOUNT ROUTES
const memoryRoutes = require("./routes/memoryRoutes");
app.use("/api", memoryRoutes);

// ✅ CONNECT MONGODB
mongoose
  .connect("mongodb://localhost:27017/face")
  .then(() => console.log("MongoDB connected ✅"))
  .catch((err) => console.log(err));

// ✅ COSINE SIMILARITY FUNCTION
const cosineSimilarity = (a, b) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

app.post("/update-user", async (req, res) => {
  const { id, name, notes } = req.body;

  const updated = await User.findByIdAndUpdate(id, { name, notes });

  console.log("Updated user:", updated);

  res.json({ success: true });
});

// ✅ MAIN API
app.post("/recognize", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    const FormData = require("form-data");
    const formData = new FormData();
    formData.append("file", file.buffer, "face.jpg");

    const response = await fetch("http://localhost:8000/embed", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    const embedding = data.embedding;

    const users = await User.find();

    let bestMatch = null;
    let bestScore = 0;
    for (let user of users) {
      let maxScore = 0;

      // ✅ HANDLE OLD USERS
      if (!user.embeddings && user.embedding) {
        const score = cosineSimilarity(embedding, user.embedding);
        if (score > maxScore) maxScore = score;
      }

      // ✅ HANDLE NEW USERS
      if (user.embeddings) {
        for (let emb of user.embeddings) {
          const score = cosineSimilarity(embedding, emb);
          if (score > maxScore) {
            maxScore = score;
          }
        }
      }

      if (maxScore > bestScore) {
        bestScore = maxScore;
        bestMatch = user;
      }
    }

    // ✅ HANDLE MATCH
    if (bestScore > 0.8 && bestMatch) {
      if (bestMatch.name === "Unknown") {
        return res.json({
          recognized: false,
          userId: bestMatch._id,
        });
      }

      // ✅ LEARNING STEP (VERY IMPORTANT)
      await User.findByIdAndUpdate(bestMatch._id, {
        $push: { embeddings: embedding },
      });

      return res.json({
        recognized: true,
        name: bestMatch.name,
        notes: bestMatch.notes,
      });
    }

    // ✅ NEW USER
    const newUser = await User.create({
      name: "Unknown",
      embeddings: [embedding],
      notes: "New person",
    });

    res.json({
      recognized: false,
      userId: newUser._id,
    });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).send("Error");
  }
});

// ✅ ASK API (Mock for Hackathon MVP)
const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    let contextResponse = "Scanning memories... no specific context found.";

    if (question && question.toLowerCase().includes("rahul")) {
      contextResponse = "Rahul is your son. You played chess.";
    }

    res.json({ success: true, response: contextResponse });
  } catch (err) {
    console.error("ERROR in askQuestion:", err);
    res.status(500).json({ success: false, error: "Error processing question" });
  }
};

app.get("/test", (req, res) => {
  res.send("Server working");
});

app.post("/api/ask", askQuestion);
// ✅ MATCH FACE ROUTE
app.post("/api/match-face", async (req, res) => {
  try {
    const { embedding } = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ found: false, error: "Invalid embedding" });
    }

    const users = await User.find();

    let memories = [];
    try {
      memories = await Memory.find();
    } catch (e) {
      console.warn("⚠️ Memory collection not available:", e.message);
    }

    const allPeople = [...users, ...memories];

    let bestMatch = null;
    let bestScore = 0;
    const threshold = 0.75;

    for (let person of allPeople) {
      let targetEmbeddings = [];

      if (person.embeddings?.length) {
        targetEmbeddings = person.embeddings;
      } else if (person.faceDescriptor) {
        targetEmbeddings = [person.faceDescriptor];
      } else if (person.embedding) {
        targetEmbeddings = [person.embedding];
      }

      for (let emb of targetEmbeddings) {
        if (!Array.isArray(emb)) continue;

        const score = cosineSimilarity(embedding, emb);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = person;
        }
      }
    }

    if (bestScore > threshold && bestMatch?.name !== "Unknown") {
      return res.json({
        found: true,
        name: bestMatch.name,
        source: bestMatch.constructor.modelName,
      });
    }

    return res.json({ found: false, isUnknown: true });

  } catch (err) {
    console.error("Match Route Error:", err);

    // ✅ Always return JSON (important)
    res.status(500).json({
      found: false,
      error: err.message,
    });
  }
});
// ✅ START SERVER
app.listen(5000, () => console.log("Backend running on 5000 🚀"));
