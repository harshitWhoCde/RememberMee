const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  relation: { type: String },
  event: { type: String, required: true },
  faceDescriptor: { type: String, required: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Memory', memorySchema);
