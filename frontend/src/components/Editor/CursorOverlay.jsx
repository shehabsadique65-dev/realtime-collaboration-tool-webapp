import { useEffect, useState } from 'react';

const CursorOverlay = ({ cursors = {} }) => {
  const [visibleCursors, setVisibleCursors] = useState({});

  useEffect(() => {
    setVisibleCursors(cursors);
  }, [cursors]);

  return (
    <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, zIndex: 10, overflow: 'hidden' }}>
      {Object.entries(visibleCursors).map(([userId, cursor]) => {
        if (!cursor || !cursor.range) return null;
        return (
          <div
            key={userId}
            style={{
              position: 'absolute',
              left: `${cursor.range.left || 0}px`,
              top: `${cursor.range.top || 0}px`,
              transition: 'left 0.15s ease-out, top 0.15s ease-out',
            }}
          >
            {/* Cursor line */}
            <div style={{
              width: '2px',
              height: '20px',
              borderRadius: '2px',
              background: cursor.color || '#5b4eff',
            }} />
            {/* Name tag */}
            <div style={{
              position: 'absolute',
              top: '-22px',
              left: '0',
              background: cursor.color || '#5b4eff',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              fontFamily: 'Inter, sans-serif',
              padding: '2px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}>
              {cursor.userName}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CursorOverlay;
