const ActiveUsers = ({ activeUsers = [] }) => {
  const unique = Array.from(new Map(activeUsers.map(u => [u.userId, u])).values());

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <p className="sidebar-section-title" style={{ marginBottom: 0 }}>Online Now</p>
        <span style={{
          fontSize: '11px', fontWeight: 700, color: '#7b6bff',
          background: 'rgba(91,78,255,0.15)', padding: '2px 8px', borderRadius: '6px'
        }}>
          {unique.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {unique.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#4a4a6a', padding: '4px 0' }}>No one else here</p>
        ) : (
          unique.map((user, index) => (
            <div key={user.userId || index} className="active-user-row">
              <div
                className="active-user-avatar"
                style={{ background: user.color || '#5b4eff' }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="active-user-name">{user.name}</span>
              <div className="online-dot avatar-pulse" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActiveUsers;
