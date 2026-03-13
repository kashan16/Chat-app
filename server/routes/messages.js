const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET /api/messages/:room - fetch chat history for a room
router.get('/:room', async (req, res) => {
  try {
    const { room } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // cursor-based pagination

    const query = { room };
    if (before) query.createdAt = { $lt: new Date(before) };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
