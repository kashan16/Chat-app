const Message = require('../models/Message');
const DirectMessage = require('../models/DirectMessage');
const User = require('../models/User');
const Room = require('../models/Room');

const connectedUsers = new Map();   // socketId -> { username, room, color }
const userSockets   = new Map();   // username -> socketId
const roomUsers     = new Map();   // roomName -> Set<{ socketId, username, color }>

const convId = (a, b) => [a, b].sort().join(':');

const getRoomUserList = (room) => {
  const users = roomUsers.get(room);
  if (!users) return [];
  return Array.from(users).map(u => ({ username: u.username, color: u.color }));
};

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('join_room', async ({ username, room, color }) => {
      if (!username || !room) return;

      const prev = connectedUsers.get(socket.id);
      if (prev && prev.room !== room) {
        socket.leave(prev.room);
        const prevSet = roomUsers.get(prev.room);
        if (prevSet) {
          prevSet.forEach(u => { if (u.socketId === socket.id) prevSet.delete(u); });
          io.to(prev.room).emit('room_users', { room: prev.room, users: getRoomUserList(prev.room) });
        }
        const leftMsg = await Message.create({ room: prev.room, username: 'System', text: `${prev.username} left the room.`, type: 'system' });
        io.to(prev.room).emit('receive_message', leftMsg);
        await Room.updateOne({ name: prev.room }, { $inc: { activeUsers: -1 } });
      }

      socket.join(room);
      const userColor = color || '#7c6fff';
      connectedUsers.set(socket.id, { username, room, color: userColor });
      userSockets.set(username, socket.id);

      if (!roomUsers.has(room)) roomUsers.set(room, new Set());
      roomUsers.get(room).add({ socketId: socket.id, username, color: userColor });

      await Room.updateOne({ name: room }, { $inc: { activeUsers: 1 } }, { upsert: false });
      await User.findOneAndUpdate({ username }, { lastSeen: new Date() }, { upsert: true });

      io.to(room).emit('room_users', { room, users: getRoomUserList(room) });
      const joinMsg = await Message.create({ room, username: 'System', text: `${username} joined the room.`, type: 'system' });
      io.to(room).emit('receive_message', joinMsg);
    });

    socket.on('send_message', async ({ room, username, text }) => {
      if (!room || !username || !text?.trim()) return;
      try {
        const message = await Message.create({ room, username, text: text.trim(), type: 'message' });
        await User.updateOne({ username }, { $inc: { messageCount: 1 } });
        io.to(room).emit('receive_message', message);
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('edit_message', async ({ messageId, newText, room }) => {
      try {
        const msg = await Message.findByIdAndUpdate(
          messageId,
          { text: newText.trim(), editedAt: new Date() },
          { new: true }
        );
        if (msg) io.to(room).emit('message_edited', msg);
      } catch {}
    });

    socket.on('delete_message', async ({ messageId, room }) => {
      try {
        await Message.findByIdAndUpdate(messageId, { deleted: true, text: 'This message was deleted.' });
        io.to(room).emit('message_deleted', { messageId, room });
      } catch {}
    });

    socket.on('add_reaction', async ({ messageId, emoji, username, room }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        const idx = msg.reactions.findIndex(r => r.emoji === emoji && r.username === username);
        if (idx !== -1) {
          msg.reactions.splice(idx, 1);
        } else {
          msg.reactions.push({ emoji, username });
        }
        await msg.save();
        io.to(room).emit('reaction_updated', { messageId, reactions: msg.reactions });
      } catch {}
    });

    socket.on('send_dm', async ({ from, to, text }) => {
      if (!from || !to || !text?.trim()) return;
      try {
        const dm = await DirectMessage.create({ conversationId: convId(from, to), from, to, text: text.trim() });
        socket.emit('receive_dm', dm);
        const recipientSocketId = userSockets.get(to);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receive_dm', dm);
          io.to(recipientSocketId).emit('dm_notification', { from, text: text.trim() });
        }
      } catch {}
    });

    socket.on('dm_read', async ({ from, to }) => {
      try {
        await DirectMessage.updateMany(
          { conversationId: convId(from, to), to, read: false },
          { $set: { read: true } }
        );
        const senderSocketId = userSockets.get(from);
        if (senderSocketId) io.to(senderSocketId).emit('dm_read_ack', { by: to });
      } catch {}
    });

    socket.on('typing', ({ room, username, isTyping }) => {
      socket.to(room).emit('user_typing', { username, isTyping });
    });

    socket.on('dm_typing', ({ from, to, isTyping }) => {
      const sid = userSockets.get(to);
      if (sid) io.to(sid).emit('dm_user_typing', { from, isTyping });
    });

    socket.on('disconnect', async () => {
      const user = connectedUsers.get(socket.id);
      if (user) {
        const { username, room } = user;
        connectedUsers.delete(socket.id);
        if (userSockets.get(username) === socket.id) userSockets.delete(username);

        const users = roomUsers.get(room);
        if (users) {
          users.forEach(u => { if (u.socketId === socket.id) users.delete(u); });
          io.to(room).emit('room_users', { room, users: getRoomUserList(room) });
        }

        const leftMsg = await Message.create({ room, username: 'System', text: `${username} disconnected.`, type: 'system' });
        io.to(room).emit('receive_message', leftMsg);
        await Room.updateOne({ name: room }, { $inc: { activeUsers: -1 } });
        await User.updateOne({ username }, { lastSeen: new Date() });
      }
    });
  });
};

module.exports = setupSocket;
