const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  embedding: [Number],      // legacy single embedding
  embeddings: [[Number]],   // ✅ add this — array of embeddings
  notes: String,
});

module.exports = mongoose.model("User", userSchema);