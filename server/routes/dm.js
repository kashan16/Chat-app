const express = require('express');
const router = express.Router();
const DirectMessage = require('../models/DirectMessage');

const convId = (a, b) => [a, b].sort().join(':');

// GET /api/dm/:userA/:userB — conversation history
router.get('/:userA/:userB', async (req, res) => {
  try {
    const { userA, userB } = req.params;
    const id = convId(userA, userB);
    const limit = parseInt(req.query.limit) || 50;
    const messages = await DirectMessage.find({ conversationId: id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/dm/read — mark messages as read
router.post('/read', async (req, res) => {
  try {
    const { userA, userB } = req.body;
    const id = convId(userA, userB);
    await DirectMessage.updateMany(
      { conversationId: id, to: userA, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/dm/unread/:username — count unread per conversation
router.get('/unread/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const unread = await DirectMessage.aggregate([
      { $match: { to: username, read: false } },
      { $group: { _id: '$from', count: { $sum: 1 } } },
    ]);
    const result = {};
    unread.forEach(u => { result[u._id] = u.count; });
    res.json({ success: true, unread: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
