const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  relation: { type: String },
  // 'event' can store the auto-generated text (e.g., "Rishi is my son")
  event: { type: String, required: true },
  // ✅ Changed from String to Array of Numbers for DeepFace compatibility
  faceDescriptor: { type: [Number], required: false },
  createdAt: { type: Date, default: Date.now }
});

// Explicitly naming the collection 'memories'
module.exports = mongoose.model('Memory', memorySchema, 'memories');