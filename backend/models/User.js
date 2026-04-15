const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // Legacy support for single embedding
  embedding: { type: [Number] },
  // ✅ Primary storage for multiple DeepFace embeddings
  embeddings: { type: [[Number]], default: [] },
  notes: { type: String },
  relation: { type: String }
});

// Explicitly naming the collection 'users'
module.exports = mongoose.model("User", userSchema, 'users');