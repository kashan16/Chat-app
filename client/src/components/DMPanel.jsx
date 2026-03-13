import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';

export default function DMPanel({ currentUser, targetUser, onClose }) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [targetTyping, setTargetTyping] = useState(false);
  const endRef = useRef(null);
  const typingRef = useRef(null);

  useEffect(() => {
    axios.get(`/api/dm/${currentUser}/${targetUser}`).then(({ data }) => {
      setMessages(data.messages);
    });

    if (socket) {
      socket.on('receive_dm', (dm) => {
        if (
          (dm.from === targetUser && dm.to === currentUser) ||
          (dm.from === currentUser && dm.to === targetUser)
        ) {
          setMessages(prev => [...prev, dm]);
        }
      });
      socket.on('dm_user_typing', ({ from, isTyping: t }) => {
        if (from === targetUser) setTargetTyping(t);
      });
      // Mark as read
      socket.emit('dm_read', { from: targetUser, to: currentUser });
    }

    return () => {
      if (socket) {
        socket.off('receive_dm');
        socket.off('dm_user_typing');
      }
    };
  }, [targetUser, currentUser, socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendDM = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('send_dm', { from: currentUser, to: targetUser, text: text.trim() });
    setText('');
    clearTimeout(typingRef.current);
    setIsTyping(false);
    socket.emit('dm_typing', { from: currentUser, to: targetUser, isTyping: false });
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('dm_typing', { from: currentUser, to: targetUser, isTyping: true });
    }
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('dm_typing', { from: currentUser, to: targetUser, isTyping: false });
    }, 1500);
  };

  return (
    <div className="dm-panel">
      <div className="dm-header">
        <div className="dm-header-left">
          <div className="dm-avatar">{targetUser[0].toUpperCase()}</div>
          <div>
            <div className="dm-target-name">{targetUser}</div>
            {targetTyping && <div className="dm-typing-hint">typing...</div>}
          </div>
        </div>
        <button className="dm-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="dm-messages">
        {messages.length === 0 && (
          <div className="dm-empty">Start a conversation with {targetUser}</div>
        )}
        {messages.map(msg => (
          <div key={msg._id} className={`dm-msg ${msg.from === currentUser ? 'dm-own' : 'dm-other'}`}>
            <div className={`dm-bubble ${msg.from === currentUser ? 'dm-bubble-own' : 'dm-bubble-other'}`}>
              {msg.text}
              {msg.read && msg.from === currentUser && (
                <span className="read-receipt" title="Read">✓✓</span>
              )}
            </div>
            <span className="dm-time">{format(new Date(msg.createdAt), 'HH:mm')}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="dm-form" onSubmit={sendDM}>
        <input
          className="dm-input"
          placeholder={`Message ${targetUser}`}
          value={text}
          onChange={handleTyping}
          onKeyDown={e => { if (e.key === 'Enter') sendDM(e); }}
          maxLength={2000}
          autoFocus
        />
        <button type="submit" className="dm-send-btn" disabled={!text.trim()}>→</button>
      </form>
    </div>
  );
}
