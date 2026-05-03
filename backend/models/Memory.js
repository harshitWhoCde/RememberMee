const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  name: { type: String, required: true },
  relation: { type: String },
  event: { type: String },
  lastConversation: { type: String, default: "" },
  faceDescriptor: {
    type: [Number],
    required: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Explicitly naming the collection 'memories'
module.exports = mongoose.model('Memory', memorySchema, 'memories');
