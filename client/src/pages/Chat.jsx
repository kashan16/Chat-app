import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import MessageBubble from '../components/MessageBubble';
import DMPanel from '../components/DMPanel';
import Toast from '../components/Toast';

const USER_COLORS = ['#7c6fff','#ff6b9d','#00d9ff','#ffd166','#06d6a0','#ff9f1c','#a8dadc'];
const getColor = (username) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
};

export default function Chat() {
  const { state, dispatch } = useChat();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isTypingEmit, setIsTypingEmit] = useState(false);
  const [dmTarget, setDmTarget] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(() => {
    if (!state.username || !state.currentRoom) { navigate('/rooms'); return; }

    // Register user
    axios.post('/api/users/register', { username: state.username });

    // Fetch history
    axios.get(`/api/messages/${state.currentRoom}`).then(({ data }) => {
      dispatch({ type: 'SET_MESSAGES', payload: data.messages });
    });

    if (!socket) return;

    socket.emit('join_room', {
      username: state.username,
      room: state.currentRoom,
      color: getColor(state.username),
    });

    socket.on('receive_message', (msg) => dispatch({ type: 'ADD_MESSAGE', payload: msg }));
    socket.on('room_users', ({ users }) => dispatch({ type: 'SET_ROOM_USERS', payload: users }));
    socket.on('user_typing', ({ username, isTyping }) =>
      dispatch({ type: 'SET_TYPING', payload: { username, isTyping } })
    );
    socket.on('message_edited', (updatedMsg) =>
      dispatch({ type: 'UPDATE_MESSAGE', payload: updatedMsg })
    );
    socket.on('message_deleted', ({ messageId }) =>
      dispatch({ type: 'DELETE_MESSAGE', payload: messageId })
    );
    socket.on('reaction_updated', ({ messageId, reactions }) =>
      dispatch({ type: 'UPDATE_REACTIONS', payload: { messageId, reactions } })
    );
    socket.on('dm_notification', (notif) => {
      setToasts(prev => [...prev, { id: Date.now(), ...notif }]);
    });

    return () => {
      socket.off('receive_message');
      socket.off('room_users');
      socket.off('user_typing');
      socket.off('message_edited');
      socket.off('message_deleted');
      socket.off('reaction_updated');
      socket.off('dm_notification');
    };
  }, [state.username, state.currentRoom, socket]);

  useEffect(scrollToBottom, [state.messages]);

  const sendMessage = useCallback((e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('send_message', { room: state.currentRoom, username: state.username, text: text.trim() });
    setText('');
    clearTimeout(typingTimeoutRef.current);
    if (isTypingEmit) {
      socket.emit('typing', { room: state.currentRoom, username: state.username, isTyping: false });
      setIsTypingEmit(false);
    }
  }, [text, socket, state.currentRoom, state.username, isTypingEmit]);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!socket) return;
    if (!isTypingEmit) {
      setIsTypingEmit(true);
      socket.emit('typing', { room: state.currentRoom, username: state.username, isTyping: true });
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingEmit(false);
      socket.emit('typing', { room: state.currentRoom, username: state.username, isTyping: false });
    }, 1500);
  };

  const handleReact = (messageId, emoji) => {
    socket?.emit('add_reaction', { messageId, emoji, username: state.username, room: state.currentRoom });
  };

  const handleEdit = (messageId, newText) => {
    socket?.emit('edit_message', { messageId, newText, room: state.currentRoom });
  };

  const handleDelete = (messageId) => {
    socket?.emit('delete_message', { messageId, room: state.currentRoom });
  };

  const leaveRoom = () => {
    dispatch({ type: 'SET_ROOM', payload: null });
    navigate('/rooms');
  };

  const typingList = state.typingUsers.filter(u => u !== state.username);

  const filteredMessages = showSearch && searchQuery
    ? state.messages.filter(m =>
        m.type !== 'system' &&
        m.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : state.messages;

  return (
    <div className="chat-page">
      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <Toast
            key={t.id}
            message={t}
            onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          />
        ))}
      </div>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-icon-sm">⚡</span>
          <span className="brand">FlashChat</span>
        </div>

        <button className="back-btn" onClick={leaveRoom}>← All Rooms</button>

        <div className="sidebar-room">
          <h3 className="current-room-label">Current Room</h3>
          <div className="current-room-tag">#{state.currentRoom}</div>
        </div>

        <div className="sidebar-users">
          <h3 className="users-label">Online ({state.roomUsers.length})</h3>
          <ul className="users-list">
            {state.roomUsers.map((u) => {
              const name = typeof u === 'string' ? u : u.username;
              const color = typeof u === 'object' ? u.color : getColor(name);
              const isSelf = name === state.username;
              return (
                <li
                  key={name}
                  className={`user-item ${isSelf ? 'self' : 'clickable'}`}
                  onClick={() => !isSelf && setDmTarget(name)}
                  title={isSelf ? '' : `DM ${name}`}
                >
                  <span className="user-dot" style={{ background: color }}></span>
                  <span>{name}</span>
                  {isSelf
                    ? <span className="you-tag">(you)</span>
                    : <span className="dm-hint">DM</span>
                  }
                </li>
              );
            })}
          </ul>
        </div>

        <div className="sidebar-footer">
          <span className={`conn-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
      </aside>

      {/* Main Chat */}
      <main className="chat-main">
        <header className="chat-header">
          <div className="chat-header-left">
            <h2 className="chat-room-title">#{state.currentRoom}</h2>
            <span className="chat-room-users">{state.roomUsers.length} online</span>
          </div>
          <div className="chat-header-right">
            <button
              className={`search-toggle-btn ${showSearch ? 'active' : ''}`}
              onClick={() => setShowSearch(s => !s)}
              title="Search messages"
            >
              🔍
            </button>
            <span className="user-badge">👤 {state.username}</span>
          </div>
        </header>

        {showSearch && (
          <div className="search-bar">
            <input
              className="search-input"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <span className="search-results-count">
                {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        <div className="messages-area">
          {filteredMessages.length === 0 && !showSearch && (
            <div className="empty-chat">
              <span className="empty-icon">💬</span>
              <p>No messages yet. Be the first to say something!</p>
            </div>
          )}
          {filteredMessages.length === 0 && showSearch && searchQuery && (
            <div className="empty-chat">
              <span className="empty-icon">🔍</span>
              <p>No messages match "{searchQuery}"</p>
            </div>
          )}
          {filteredMessages.map((msg) => (
            <MessageBubble
              key={msg._id || msg.tempId || Math.random()}
              message={msg}
              isOwn={msg.username === state.username && msg.type !== 'system'}
              onReact={handleReact}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}

          {typingList.length > 0 && (
            <div className="typing-indicator">
              <span className="typing-dots"><span></span><span></span><span></span></span>
              <span className="typing-text">
                {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form className="message-form" onSubmit={sendMessage}>
          <textarea
            className="message-input"
            placeholder={`Message #${state.currentRoom} — press Enter to send`}
            value={text}
            onChange={handleTyping}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(e); }}
            rows={1}
            maxLength={2000}
          />
          <div className="char-count">{text.length}/2000</div>
          <button type="submit" className="send-btn" disabled={!text.trim()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </main>

      {/* DM Panel */}
      {dmTarget && (
        <DMPanel
          currentUser={state.username}
          targetUser={dmTarget}
          onClose={() => setDmTarget(null)}
        />
      )}
    </div>
  );
}
