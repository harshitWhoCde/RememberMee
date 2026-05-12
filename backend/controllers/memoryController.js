const Memory = require('../models/Memory');
const fetch = global.fetch || require('node-fetch');

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildNameFilter = (name) => ({
  name: new RegExp(`^${escapeRegExp(name.trim())}$`, 'i')
});

const buildFallbackSummary = (name, transcript) => {
  const cleanedTranscript = transcript.replace(/\s+/g, ' ').trim();
  if (cleanedTranscript.length <= 220) {
    return `You and ${name} talked about ${cleanedTranscript}`;
  }

  return `You and ${name} talked about ${cleanedTranscript.slice(0, 217)}...`;
};

const addMemory = async (req, res) => {
  try {
    const { text, name, relation, faceDescriptor } = req.body;

    // Defaulting event logic from previous mock implementation if raw text is provided
    const event = text || `${name} is my ${relation} and they are visiting me today.`;

    // Safely check for user ID without crashing
    const userId = (req.user && req.user.id) ? req.user.id : null;

    const newMemory = new Memory({
      name,
      relation,
      event,
      faceDescriptor,
      ownerId: userId // Will safely be null if no user is logged in
    });
    await newMemory.save();

    res.status(201).json({ success: true, memory: newMemory });
  } catch (error) {
    console.error("🚨 BACKEND CRASH:", error.message);
    // Actually send the error message to the frontend so Chrome can see it
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMemories = async (req, res) => {
  try {
    const memories = await Memory.find().sort({ updatedAt: -1, createdAt: -1 });
    res.json({ success: true, data: memories });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch memories" });
  }
};

const getMemoryByName = async (req, res) => {
  try {
    const visitorName = decodeURIComponent(req.params.name || '').trim();
    const memory = await Memory.findOne(buildNameFilter(visitorName)).sort({ updatedAt: -1, createdAt: -1 });

    if (memory) {
      // Use lastConversation if it exists, otherwise fallback to the old 'event' field
      const contextText =
        memory.context ||
        memory.event ||
        "No previous memory recorded.";
      res.json({ success: true, lastConversation: contextText });
    } else {
      res.json({ success: true, lastConversation: "This is your first time recording a memory here." });
    }
  } catch (error) {
    console.error("🚨 Server Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const cleanTranscript = (text) => {

  if (!text) return "";

  // remove repeated words
  const words = text.split(/\s+/);

  const cleaned = [];

  let prev = "";

  for (const word of words) {

    const lower = word.toLowerCase();

    if (lower !== prev) {
      cleaned.push(word);
    }

    prev = lower;
  }

  let finalText = cleaned.join(" ");

  // remove filler patterns
  finalText = finalText.replace(/\b(um+|uh+|hmm+)\b/gi, "");

  // remove excessive spaces
  finalText = finalText.replace(/\s+/g, " ").trim();

  return finalText;
};

const updateConversationContext = async (req, res) => {
  try {
    const { name, transcript } = req.body;

    if (!name?.trim() || !transcript?.trim()) {
      return res.status(400).json({ success: false, error: "Name and transcript are required" });
    }

    const visitorName = name.trim();
    const cleanedTranscript = cleanTranscript(transcript);
    const prompt = `
You are a memory assistant.

Summarize the conversation naturally.

Rules:
- Ignore repeated words
- Ignore speech recognition mistakes
- Ignore filler words
- Keep summary short and human-like
- Mention important topics only

Conversation:
${cleanedTranscript}

Summary:`;

    // console.log("🚀 Sending to Ollama:", prompt);
    let summary = "";

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'phi3',
          prompt,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}`);
      }

      const data = await response.json();
      summary = (data.response || "").trim();
    } catch (summaryError) {
      console.warn("Summary generation failed, saving fallback memory:", summaryError.message);
    }

    if (!summary) {
      summary = buildFallbackSummary(visitorName, cleanedTranscript);
    }

    // Keep event in sync because the archive displays event cards.
    const updatedMemory = await Memory.findOneAndUpdate(
      buildNameFilter(visitorName),
      {
        $set: {
          // FULL STT CONVERSATION
          lastConversation: cleanedTranscript,

          // AI GENERATED MEMORY
          context: summary,

          // OPTIONAL
          event: summary,

          updatedAt: new Date()
        }
      },
      { returnDocument: 'after', sort: { updatedAt: -1, createdAt: -1 } }
    );

    if (!updatedMemory) {
      console.error("🚨 SILENT FAILURE: No user found in DB with name:", visitorName);
      return res.status(404).json({ success: false, message: "Face not found in DB." });
    }

    res.json({ success: true, memory: updatedMemory });
  } catch (error) {
    console.error("🚨 Server Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addMemory,
  getMemories,
  updateConversationContext,
  getMemoryByName
};
