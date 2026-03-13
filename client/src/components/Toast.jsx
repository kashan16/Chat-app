import React, { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="toast">
      <span className="toast-icon">💬</span>
      <div className="toast-body">
        <strong>{message.from}</strong>
        <span>{message.text.slice(0, 60)}{message.text.length > 60 ? '…' : ''}</span>
      </div>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}
