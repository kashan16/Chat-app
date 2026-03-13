import React, { useRef, useEffect } from 'react';

const EMOJI_LIST = ['👍','❤️','😂','😮','😢','🔥','🎉','👀','🙌','💯','✅','🚀'];

export default function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="emoji-picker" ref={ref}>
      {EMOJI_LIST.map(emoji => (
        <button
          key={emoji}
          className="emoji-btn"
          onClick={() => { onSelect(emoji); onClose(); }}
          title={emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
