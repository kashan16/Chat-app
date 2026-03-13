require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const messageRoutes = require('./routes/messages');
const roomRoutes = require('./routes/rooms');
const dmRoutes = require('./routes/dm');
const userRoutes = require('./routes/users');
const setupSocket = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'], credentials: true },
  pingTimeout: 60000,
});

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

connectDB().then(async () => {
  const Room = require('./models/Room');
  const defaultRooms = [
    { name: 'general',       description: 'General discussion for everyone' },
    { name: 'tech',          description: 'Tech talk & coding help' },
    { name: 'random',        description: 'Off-topic fun stuff' },
    { name: 'announcements', description: 'Important updates' },
    { name: 'design',        description: 'UI/UX and design chat' },
  ];
  for (const r of defaultRooms) {
    await Room.findOneAndUpdate({ name: r.name }, r, { upsert: true, new: true });
  }
  console.log('🏠 Default rooms ready');
});

app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/users', userRoutes);
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
