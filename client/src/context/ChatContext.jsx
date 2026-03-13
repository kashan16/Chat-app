import React, { createContext, useContext, useReducer } from 'react';

const ChatContext = createContext(null);

const initialState = {
  username: '',
  currentRoom: null,
  messages: [],
  rooms: [],
  roomUsers: [],
  typingUsers: [],
  unreadDMs: {},
};

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USERNAME':
      return { ...state, username: action.payload };

    case 'SET_ROOM':
      return { ...state, currentRoom: action.payload, messages: [], typingUsers: [] };

    case 'SET_ROOMS':
      return { ...state, rooms: action.payload };

    case 'ADD_MESSAGE':
      // Deduplicate by _id
      if (action.payload._id && state.messages.find(m => m._id === action.payload._id)) {
        return state;
      }
      return { ...state, messages: [...state.messages, action.payload] };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m._id === action.payload._id ? action.payload : m
        ),
      };

    case 'DELETE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(m =>
          m._id === action.payload
            ? { ...m, deleted: true, text: 'This message was deleted.' }
            : m
        ),
      };

    case 'UPDATE_REACTIONS':
      return {
        ...state,
        messages: state.messages.map(m =>
          m._id === action.payload.messageId
            ? { ...m, reactions: action.payload.reactions }
            : m
        ),
      };

    case 'SET_ROOM_USERS':
      return { ...state, roomUsers: action.payload };

    case 'SET_TYPING': {
      const { username, isTyping } = action.payload;
      if (isTyping) {
        return {
          ...state,
          typingUsers: [...new Set([...state.typingUsers, username])],
        };
      }
      return {
        ...state,
        typingUsers: state.typingUsers.filter(u => u !== username),
      };
    }

    case 'SET_UNREAD_DM':
      return {
        ...state,
        unreadDMs: {
          ...state.unreadDMs,
          [action.payload.from]: (state.unreadDMs[action.payload.from] || 0) + 1,
        },
      };

    case 'CLEAR_UNREAD_DM': {
      const next = { ...state.unreadDMs };
      delete next[action.payload];
      return { ...state, unreadDMs: next };
    }

    default:
      return state;
  }
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
