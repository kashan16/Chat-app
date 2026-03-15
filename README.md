# FlashChat — MERN Stack Real-Time Chat App

A full-featured real-time chat application built with MongoDB, Express, React, and Node.js, powered by Socket.io for instant messaging.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Real-time messaging** | Bidirectional Socket.io events with instant delivery |
| **Chat rooms** | Browse, join, and create public rooms |
| **Direct messages (DM)** | Private 1-to-1 conversations with any online user |
| **Message reactions** | React to messages with emoji (toggle on/off) |
| **Edit messages** | Edit your own messages in-place |
| **Delete messages** | Soft-delete your own messages |
| **Typing indicators** | See when others are typing (with debounce) |
| **Online users list** | Live sidebar showing who's in the room |
| **Chat history** | All messages persisted to MongoDB, loaded on join |
| **Read receipts** | DM messages show ✓✓ when read |
| **DM notifications** | Toast popups for incoming DMs |
| **Message search** | Filter messages in the current room |
| **Connection status** | Live indicator showing socket connection health |
| **Persistent users** | User profiles with message counts stored in DB |

---

## 🛠 Tech Stack

```
Frontend          Backend           Database          Real-time
─────────────     ─────────────     ─────────────     ─────────────
React 18          Node.js 20        MongoDB 7         Socket.io 4
React Router 6    Express 4         Mongoose 8
Context + Hooks   REST API
date-fns          CORS / dotenv
axios
```

---

## 📁 Project Structure

```
chat-app/
├── docker-compose.yml
├── server/
│   ├── index.js                 ← Entry point, Express + Socket.io setup
│   ├── config/
│   │   └── db.js                ← Mongoose connection
│   ├── models/
│   │   ├── Message.js           ← Room messages (with reactions, soft-delete)
│   │   ├── Room.js              ← Chat rooms
│   │   ├── User.js              ← User profiles
│   │   └── DirectMessage.js     ← Private messages
│   ├── routes/
│   │   ├── messages.js          ← GET /api/messages/:room
│   │   ├── rooms.js             ← GET/POST /api/rooms
│   │   ├── users.js             ← GET /api/users, POST /api/users/register
│   │   └── dm.js               ← GET /api/dm/:userA/:userB
│   └── socket/
│       └── socketHandler.js     ← All Socket.io event handlers
└── client/
    ├── public/index.html
    └── src/
        ├── index.js
        ├── App.js               ← Router + providers
        ├── App.css              ← Full dark theme (Space Mono + DM Sans)
        ├── context/
        │   ├── SocketContext.jsx ← Socket.io client singleton
        │   └── ChatContext.jsx   ← Global state (useReducer)
        ├── pages/
        │   ├── Login.jsx         ← Username entry
        │   ├── Rooms.jsx         ← Room browser + create room
        │   └── Chat.jsx          ← Main chat (messages, DM, search)
        └── components/
            ├── MessageBubble.jsx ← Message with reactions/edit/delete
            ├── EmojiPicker.jsx   ← Emoji reaction picker
            ├── DMPanel.jsx       ← Slide-in DM conversation panel
            └── Toast.jsx         ← DM notification toasts
```

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas URI)

### 1. Clone & install

```bash
git clone <your-repo-url>
cd chat-app

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
# Edit .env — set MONGODB_URI if not using localhost
```

### 3. Run

Open two terminals:

```bash
# Terminal 1 — server (port 5000)
cd server
npm run dev

# Terminal 2 — client (port 3000)
cd client
npm start
```

Open **http://localhost:3000**, enter a username, and start chatting.
Open multiple tabs to test real-time features.

---

## 🐳 Docker (Full Stack)

Run everything — MongoDB, server, and client — with a single command:

```bash
docker-compose up --build
```

Then open **http://localhost**.

To stop:
```bash
docker-compose down
# Remove volumes too:
docker-compose down -v
```

---

## 🔌 Socket.io Event Reference

### Client → Server

| Event | Payload | Description |
|---|---|---|
| `join_room` | `{ username, room, color }` | Join a chat room |
| `send_message` | `{ room, username, text }` | Send a room message |
| `edit_message` | `{ messageId, newText, room }` | Edit own message |
| `delete_message` | `{ messageId, room }` | Soft-delete own message |
| `add_reaction` | `{ messageId, emoji, username, room }` | Toggle emoji reaction |
| `send_dm` | `{ from, to, text }` | Send a direct message |
| `dm_read` | `{ from, to }` | Mark DMs as read |
| `typing` | `{ room, username, isTyping }` | Typing indicator for rooms |
| `dm_typing` | `{ from, to, isTyping }` | Typing indicator for DMs |

### Server → Client

| Event | Payload | Description |
|---|---|---|
| `receive_message` | `Message` | New room message |
| `room_users` | `{ room, users[] }` | Updated online users list |
| `user_typing` | `{ username, isTyping }` | Someone typing in room |
| `message_edited` | `Message` | A message was edited |
| `message_deleted` | `{ messageId }` | A message was deleted |
| `reaction_updated` | `{ messageId, reactions[] }` | Reactions changed |
| `receive_dm` | `DirectMessage` | New DM received |
| `dm_notification` | `{ from, text }` | Toast trigger for DM |
| `dm_read_ack` | `{ by }` | DM marked as read |
| `dm_user_typing` | `{ from, isTyping }` | Typing in DM |

---

## 🗃 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/rooms` | List all rooms (sorted by active users) |
| `POST` | `/api/rooms` | Create a new room `{ name, description }` |
| `GET` | `/api/messages/:room` | Chat history (last 50, supports `?before=` cursor) |
| `GET` | `/api/dm/:userA/:userB` | DM conversation history |
| `POST` | `/api/dm/read` | Mark DMs as read `{ userA, userB }` |
| `GET` | `/api/dm/unread/:username` | Unread DM counts per sender |
| `GET` | `/api/users` | List all registered users |
| `POST` | `/api/users/register` | Register/update user `{ username }` |
| `GET` | `/api/health` | Server health check |

---

## 🗄 MongoDB Schemas

### Message
```js
{
  room: String,          // room name
  username: String,      // sender
  text: String,          // content (max 2000 chars)
  type: 'message' | 'system',
  reactions: [{ emoji, username }],
  editedAt: Date | null,
  deleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Room
```js
{
  name: String,          // unique room name
  description: String,
  activeUsers: Number,   // live count (tracked by socket events)
  createdAt: Date
}
```

### DirectMessage
```js
{
  conversationId: String, // "userA:userB" sorted alphabetically
  from: String,
  to: String,
  text: String,
  read: Boolean,
  createdAt: Date
}
```

### User
```js
{
  username: String,       // unique
  color: String,          // assigned hex color
  lastSeen: Date,
  messageCount: Number,
  createdAt: Date
}
```

---

## 🎨 UI & Design

- **Theme:** Dark — `#0a0a0f` background, purple accent (`#7c6fff`)
- **Fonts:** Space Mono (headings/brand) + DM Sans (body)
- **Animations:** Message fade-in, toast slide-in, DM panel slide-in, typing bounce
- **Responsive:** Sidebar collapses on mobile, DM panel goes full-width

---

## 🔧 Development Tips

**Run MongoDB locally with Docker (no full docker-compose):**
```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

**Watch server logs for socket events:**
```bash
cd server && npm run dev
```

**Test with multiple users:**
Open several browser tabs or use incognito windows to simulate multiple users joining rooms.

---

## 📈 Possible Extensions

- File/image uploads (multer + S3)
- JWT authentication with persistent sessions
- Push notifications (Web Push API)
- Message pagination / infinite scroll
- Room moderation (admin roles, kick/ban)
- End-to-end encryption for DMs
- Voice/video calls (WebRTC)
