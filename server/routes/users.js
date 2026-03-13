const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /api/users — list all users (for DM contacts)
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ lastSeen: -1 }).lean();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users/register — upsert user on login
router.post('/register', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ success: false, error: 'Username required' });
    const user = await User.findOneAndUpdate(
      { username },
      { lastSeen: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
