import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, PenTool, Copy, Trash2, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => { fetchDocuments(); }, []);

  const fetchDocuments = async () => {
    try {
      const res = await API.get('/documents');
      if (res.data.success) setDocuments(res.data.data);
    } catch {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (type) => {
    setCreating(true);
    try {
      const res = await API.post('/documents', { type });
      if (res.data.success) {
        const doc = res.data.data;
        navigate(type === 'whiteboard' ? `/whiteboard/${doc.roomCode}` : `/editor/${doc.roomCode}`);
      }
    } catch {
      toast.error('Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = async () => {
    if (!joinCode.trim()) return;
    setJoining(true);
    try {
      const res = await API.post('/rooms/join', { roomCode: joinCode.trim().toUpperCase() });
      if (res.data.success) {
        const { type, roomCode } = res.data.data;
        navigate(type === 'whiteboard' ? `/whiteboard/${roomCode}` : `/editor/${roomCode}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  const copyRoomCode = (roomCode) => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  const deleteDocument = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      const res = await API.delete(`/documents/${docId}`);
      if (res.data.success) setDocuments(documents.filter(d => d._id !== docId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const openDocument = (doc) => {
    navigate(doc.type === 'whiteboard' ? `/whiteboard/${doc.roomCode}` : `/editor/${doc.roomCode}`);
  };

  const formatDate = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="dash-page">
      {/* Navbar */}
      <nav className="drawft-nav">
        <div className="drawft-nav-brand">
          <PenTool size={18} />
          Drawft
        </div>
        <div className="drawft-nav-right">
          <span className="drawft-nav-greeting">Hi, {user?.name?.split(' ')[0]}</span>
          <div className="drawft-nav-avatar" id="dash-avatar">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <button className="drawft-nav-btn" onClick={handleLogout} id="dash-logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="dash-content">
        {/* Welcome */}
        <h1 className="dash-welcome-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="dash-welcome-sub">What would you like to create today?</p>

        {/* Create cards */}
        <div className="create-cards-grid">
          <button
            className="create-card"
            onClick={() => createDocument('document')}
            disabled={creating}
            id="create-doc-btn"
          >
            <div className="create-card-icon">
              <FileText size={22} />
            </div>
            <div>
              <div className="create-card-title">New Document</div>
              <div className="create-card-sub">Collaborative rich text</div>
            </div>
          </button>

          <button
            className="create-card"
            onClick={() => createDocument('whiteboard')}
            disabled={creating}
            id="create-wb-btn"
          >
            <div className="create-card-icon">
              <Share2 size={22} />
            </div>
            <div>
              <div className="create-card-title">New Whiteboard</div>
              <div className="create-card-sub">Draw and sketch freely</div>
            </div>
          </button>
        </div>

        {/* Join room */}
        <div className="join-bar">
          <input
            className="join-input"
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter room code e.g. XYZ123"
            maxLength={6}
            onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
            id="join-room-input"
          />
          <button
            className="join-btn"
            onClick={joinRoom}
            disabled={joining || !joinCode.trim()}
            id="join-room-btn"
          >
            {joining ? '...' : 'Join'}
          </button>
        </div>

        {/* Documents */}
        <p className="section-title">Your Documents</p>

        {loading ? (
          <div className="drawft-loader">
            <div className="drawft-spinner" />
            <p className="drawft-loader-text">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} className="empty-state-icon" style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p className="empty-state-text">No documents yet. Create one above!</p>
          </div>
        ) : (
          <div className="docs-grid">
            {documents.map((doc) => (
              <div key={doc._id} className="doc-card">
                <div className="doc-card-header">
                  <div className="doc-card-icon">
                    {doc.type === 'whiteboard'
                      ? <Share2 size={18} />
                      : <FileText size={18} />
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="doc-card-title">{doc.title}</div>
                    <div className="doc-card-time">{formatDate(doc.lastModified)}</div>
                  </div>
                </div>

                <div className="doc-card-actions">
                  <button className="doc-open-btn" onClick={() => openDocument(doc)}>
                    Open
                  </button>
                  <button
                    className="doc-icon-btn"
                    onClick={() => copyRoomCode(doc.roomCode)}
                    title="Copy room code"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="doc-icon-btn danger"
                    onClick={() => deleteDocument(doc._id)}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
