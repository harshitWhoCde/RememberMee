const Memory = require('../models/Memory');

const addMemory = async (req, res) => {
  try {
    const { text, name, relation, faceDescriptor } = req.body;
    
    // Defaulting event logic from previous mock implementation if raw text is provided
    const event = text || `${name} is my ${relation} and they are visiting me today.`;
    
    const newMemory = new Memory({ name, relation, event, faceDescriptor });
    await newMemory.save();
    
    res.status(201).json({ success: true, memory: newMemory });
  } catch (error) {
    console.error("Error in addMemory:", error);
    res.status(500).json({ success: false, error: "Failed to add memory" });
  }
};

const getMemories = async (req, res) => {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 });
    res.json({ success: true, data: memories });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch memories" });
  }
};

module.exports = {
  addMemory,
  getMemories
};
