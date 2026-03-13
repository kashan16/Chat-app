import React, { useState } from 'react';
import { format } from 'date-fns';
import EmojiPicker from './EmojiPicker';

export default function MessageBubble({ message, isOwn, onReact, onEdit, onDelete }) {
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  if (message.type === 'system') {
    return (
      <div className="system-message">
        <span>{message.text}</span>
      </div>
    );
  }

  const time = message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : '';

  const reactionGroups = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] || [];
    acc[r.emoji].push(r.username);
    return acc;
  }, {});

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editText.trim() && editText.trim() !== message.text) onEdit(message._id, editText.trim());
    setEditing(false);
  };

  if (message.deleted) {
    return (
      <div className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
        {!isOwn && <div className="msg-avatar deleted-avatar">✕</div>}
        <div className="message-content">
          <div className="bubble bubble-deleted">
            <span className="msg-text deleted-text">This message was deleted.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`message-wrapper ${isOwn ? 'own' : 'other'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && (
        <div className="msg-avatar">
          {message.username[0].toUpperCase()}
        </div>
      )}

      <div className="message-content">
        {!isOwn && <span className="msg-username">{message.username}</span>}

        {editing ? (
          <form onSubmit={handleEditSubmit} className="edit-form">
            <input
              className="edit-input"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              autoFocus
              onKeyDown={e => { if (e.key === 'Escape') setEditing(false); }}
            />
            <div className="edit-actions">
              <button type="submit" className="edit-save">Save</button>
              <button type="button" className="edit-cancel" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <div className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
            <span className="msg-text">{message.text}</span>
            {message.editedAt && <span className="edited-tag"> (edited)</span>}
          </div>
        )}

        {Object.keys(reactionGroups).length > 0 && (
          <div className="reactions-row">
            {Object.entries(reactionGroups).map(([emoji, users]) => (
              <button
                key={emoji}
                className="reaction-chip"
                onClick={() => onReact(message._id, emoji)}
                title={users.join(', ')}
              >
                {emoji} <span className="reaction-count">{users.length}</span>
              </button>
            ))}
          </div>
        )}

        <span className="msg-time">{time}</span>
      </div>

      {showActions && !editing && (
        <div className={`msg-actions ${isOwn ? 'actions-own' : 'actions-other'}`}>
          <button className="action-btn" title="React" onClick={() => setShowEmojiPicker(p => !p)}>😊</button>
          {isOwn && (
            <>
              <button className="action-btn" title="Edit" onClick={() => { setEditing(true); setEditText(message.text); }}>✏️</button>
              <button className="action-btn" title="Delete" onClick={() => onDelete(message._id)}>🗑️</button>
            </>
          )}
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => { onReact(message._id, emoji); setShowEmojiPicker(false); }}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
