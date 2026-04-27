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

const updateConversationContext = async (req, res) => {
  try {
    const { name, transcript } = req.body;

    if (!name || !transcript) {
      return res.status(400).json({ success: false, error: "Name and transcript are required" });
    }

    const prompt = `You are an AI assistant for a dementia patient. Summarize the following conversation transcript between the patient and their visitor into a single, concise sentence that captures the key topic discussed. Transcript: "${transcript}"`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3',
        prompt: prompt,
        stream: false
      })
    });

    const data = await response.json();
    const summary = data.response;

    // Find the latest memory for this visitor and update the event with the summary
    const updatedMemory = await Memory.findOneAndUpdate(
      { name: name },
      { event: summary },
      { new: true, sort: { createdAt: -1 } }
    );

    if (!updatedMemory) {
      return res.status(404).json({ success: false, error: "Visitor not found" });
    }

    res.json({ success: true, memory: updatedMemory });
  } catch (error) {
    console.error("Error in updateConversationContext:", error);
    res.status(500).json({ success: false, error: "Failed to update context" });
  }
};

module.exports = {
  addMemory,
  getMemories,
  updateConversationContext
};
