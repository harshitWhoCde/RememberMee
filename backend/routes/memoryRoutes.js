const express = require('express');
const router = express.Router();
const { addMemory, getMemories } = require('../controllers/memoryController');

// Properly wired routes pointing to controller
router.post('/memory', addMemory);
router.get('/memories', getMemories);

module.exports = router;
