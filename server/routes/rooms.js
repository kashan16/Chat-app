const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// GET /api/rooms - list all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ activeUsers: -1, createdAt: 1 }).lean();
    res.json({ success: true, rooms });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/rooms - create a new room
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Room name is required' });

    const existing = await Room.findOne({ name: name.trim() });
    if (existing) return res.status(409).json({ success: false, error: 'Room already exists' });

    const room = await Room.create({ name: name.trim(), description: description?.trim() || '' });
    res.status(201).json({ success: true, room });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
