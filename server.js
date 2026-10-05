// Simple Express server for the GPU usage tracker
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data.json");

// GPU price list ($ per hour)
const GPUS = [
  { name: "NVIDIA T4", rate: 0.35 },
  { name: "NVIDIA A10", rate: 0.75 },
  { name: "NVIDIA A100", rate: 2.5 },
  { name: "NVIDIA H100", rate: 4.0 }
];

// Middleware
app.use(express.json());                              // read JSON bodies
app.use(express.static(path.join(__dirname, "public"))); // serve the frontend

// Helpers to read/write sessions from a JSON file
function readSessions() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (err) {
    return []; // file missing or empty
  }
}
function writeSessions(sessions) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(sessions, null, 2));
}

// GET /api/gpus -> list of GPUs and prices
app.get("/api/gpus", (req, res) => {
  res.json(GPUS);
});

// GET /api/sessions -> all saved sessions
app.get("/api/sessions", (req, res) => {
  res.json(readSessions());
});

// POST /api/sessions -> save a finished session
app.post("/api/sessions", (req, res) => {
  const { gpu, seconds } = req.body;
  const found = GPUS.find(g => g.name === gpu);

  if (!found || typeof seconds !== "number" || seconds < 0) {
    return res.status(400).json({ error: "Invalid gpu or seconds" });
  }

  const session = {
    id: Date.now(),
    gpu: found.name,
    date: new Date().toLocaleString(),
    seconds: seconds,
    cost: (seconds / 3600) * found.rate // cost is calculated on the server
  };

  const sessions = readSessions();
  sessions.unshift(session);
  writeSessions(sessions);
  res.status(201).json(session);
});

// DELETE /api/sessions -> clear all history
app.delete("/api/sessions", (req, res) => {
  writeSessions([]);
  res.json({ message: "History cleared" });
});

app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
