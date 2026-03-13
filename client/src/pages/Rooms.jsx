import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import axios from 'axios';

export default function Rooms() {
  const { state, dispatch } = useChat();
  const navigate = useNavigate();
  const [newRoom, setNewRoom] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [roomError, setRoomError] = useState('');

  useEffect(() => {
    if (!state.username) { navigate('/'); return; }
    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);
    return () => clearInterval(interval);
  }, [state.username]);

  const fetchRooms = async () => {
    try {
      const { data } = await axios.get('/api/rooms');
      dispatch({ type: 'SET_ROOMS', payload: data.rooms });
    } catch (e) { console.error(e); }
  };

  const handleJoinRoom = (roomName) => {
    dispatch({ type: 'SET_ROOM', payload: roomName });
    navigate('/chat');
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!newRoom.trim()) return;
    setCreating(true);
    setRoomError('');
    try {
      await axios.post('/api/rooms', { name: newRoom.trim(), description: newRoomDesc.trim() });
      setNewRoom(''); setNewRoomDesc(''); setShowForm(false);
      fetchRooms();
    } catch (err) {
      setRoomError(err.response?.data?.error || 'Failed to create room');
    } finally { setCreating(false); }
  };

  const roomIcons = { general: '💬', tech: '⚙️', random: '🎲', announcements: '📢' };
  const getIcon = (name) => roomIcons[name] || '🏠';

  return (
    <div className="rooms-page">
      <header className="rooms-header">
        <div className="rooms-header-left">
          <span className="logo-icon-sm">⚡</span>
          <span className="brand">FlashChat</span>
        </div>
        <div className="rooms-header-right">
          <span className="user-badge">👤 {state.username}</span>
        </div>
      </header>

      <main className="rooms-main">
        <div className="rooms-title-row">
          <div>
            <h2>Choose a Room</h2>
            <p className="rooms-subtitle">{state.rooms.length} rooms available</p>
          </div>
          <button className="create-room-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ New Room'}
          </button>
        </div>

        {showForm && (
          <form className="create-room-form" onSubmit={handleCreateRoom}>
            <input
              placeholder="Room name (e.g. design)"
              value={newRoom}
              onChange={e => { setNewRoom(e.target.value); setRoomError(''); }}
              className="room-input"
              maxLength={30}
              autoFocus
            />
            <input
              placeholder="Description (optional)"
              value={newRoomDesc}
              onChange={e => setNewRoomDesc(e.target.value)}
              className="room-input"
              maxLength={100}
            />
            {roomError && <span className="error-msg">{roomError}</span>}
            <button type="submit" disabled={creating} className="create-btn">
              {creating ? 'Creating...' : 'Create Room'}
            </button>
          </form>
        )}

        <div className="rooms-grid">
          {state.rooms.map((room) => (
            <div key={room._id} className="room-card" onClick={() => handleJoinRoom(room.name)}>
              <div className="room-card-icon">{getIcon(room.name)}</div>
              <div className="room-card-body">
                <h3 className="room-name">#{room.name}</h3>
                <p className="room-desc">{room.description || 'No description'}</p>
              </div>
              <div className="room-card-meta">
                <span className="active-users">
                  <span className="dot"></span> {room.activeUsers || 0} online
                </span>
                <button className="join-room-btn">Join →</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
