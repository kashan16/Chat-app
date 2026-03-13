import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const { dispatch } = useChat();
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return setError('Please enter a username');
    if (trimmed.length < 2) return setError('Username must be at least 2 characters');
    if (trimmed.length > 20) return setError('Username must be under 20 characters');
    dispatch({ type: 'SET_USERNAME', payload: trimmed });
    navigate('/rooms');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="logo-icon">⚡</span>
          <h1>FlashChat</h1>
          <p>Real-time messaging, zero friction</p>
        </div>
        <form onSubmit={handleJoin} className="login-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Choose your username"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); }}
              className="login-input"
              maxLength={20}
              autoFocus
            />
            {error && <span className="error-msg">{error}</span>}
          </div>
          <button type="submit" className="join-btn">Enter FlashChat →</button>
        </form>
        <p className="login-hint">No account needed. Just pick a name and start chatting.</p>
      </div>
    </div>
  );
}
