const express = require('express');
const router = express.Router();
const { addMemory, getMemories, updateConversationContext } = require('../controllers/memoryController');

// Properly wired routes pointing to controller
router.post('/memory', addMemory);
router.get('/memories', getMemories);
router.post('/update-context', updateConversationContext);

module.exports = router;
