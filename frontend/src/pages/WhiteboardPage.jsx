import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, Check, PenTool, Pen, Eraser, Square, Circle, Minus, Trash2, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import Canvas from '../components/Whiteboard/Canvas';
import ActiveUsers from '../components/Room/ActiveUsers';

const TOOLS = [
  { id: 'pen',       icon: Pen,          label: 'Pen' },
  { id: 'eraser',    icon: Eraser,       label: 'Eraser' },
  { id: 'rectangle', icon: Square,       label: 'Rectangle' },
  { id: 'circle',    icon: Circle,       label: 'Circle' },
  { id: 'line',      icon: Minus,        label: 'Line' },
  { id: 'arrow',     icon: ArrowUpRight, label: 'Arrow' },
];

const COLORS = [
  '#000000', '#5b4eff', '#ef4444', '#22c55e', '#f97316', '#ec4899',
];

const WhiteboardPage = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocketContext();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Untitled Whiteboard');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [activeTool, setActiveTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeSize, setStrokeSize] = useState(3);
  const [activeUsers, setActiveUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  const canvasRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await API.post('/rooms/join', { roomCode });
        if (res.data.success) {
          const docRes = await API.get(`/documents/${res.data.data.documentId}`);
          if (docRes.data.success) {
            setTitle(docRes.data.data.title || 'Untitled Whiteboard');
          }
          setLoading(false);
        }
      } catch {
        toast.error('Failed to load whiteboard');
        navigate('/dashboard');
      }
    };
    fetchDocument();
  }, [roomCode, navigate]);

  useEffect(() => {
    if (loading || !socket || !connected || !user || !roomCode) return;

    socket.emit('join-document', { roomCode, userId: user.id, userName: user.name });

    const handleUserJoined = ({ name, activeUsers: users }) => {
      if (name !== user.name) toast.success(`${name} joined`, { icon: '👋' });
      setActiveUsers(users);
    };
    const handleUserLeft = ({ activeUsers: users }) => setActiveUsers(users);
    const handleActiveUsersUpdate = (users) => setActiveUsers(users);
    const handleBoardCleared = ({ userName }) => {
      if (canvasRef.current) canvasRef.current.clearCanvas();
      if (userName !== user.name) toast(`${userName} cleared the board`, { icon: '🗑️' });
      setHasStrokes(false);
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('active-users-update', handleActiveUsersUpdate);
    socket.on('board-cleared', handleBoardCleared);

    return () => {
      socket.emit('leave-document', { roomCode });
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('active-users-update', handleActiveUsersUpdate);
      socket.off('board-cleared', handleBoardCleared);
    };
  }, [socket, connected, user, roomCode, loading]);

  const handleStroke = useCallback((stroke) => {
    if (socket && roomCode) {
      socket.emit('draw-stroke', { roomCode, stroke });
      setHasStrokes(true);
      if (canvasRef.current) {
        socket.emit('save-whiteboard', { roomCode, whiteboardData: canvasRef.current.getStrokes() });
      }
    }
  }, [socket, roomCode]);

  const handleClearBoard = useCallback(() => {
    if (window.confirm('Clear the entire board? This cannot be undone.')) {
      if (canvasRef.current) canvasRef.current.clearCanvas();
      if (socket && roomCode) socket.emit('clear-board', { roomCode, userName: user.name });
      setHasStrokes(false);
      toast.success('Board cleared!');
    }
  }, [socket, roomCode, user]);

  const handleTitleBlur = () => {
    setSaveStatus('saving');
    if (socket && roomCode) {
      socket.emit('save-document', { roomCode, title });
      setTimeout(() => setSaveStatus('saved'), 1000);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  if (loading) {
    return (
      <div style={{ background: '#0d0d1e', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="drawft-loader">
          <div className="drawft-spinner" />
          <p className="drawft-loader-text">Loading whiteboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wb-page">
      {/* Navbar */}
      <nav className="drawft-nav">
        <button className="drawft-nav-brand" onClick={() => navigate('/dashboard')}>
          <PenTool size={18} />
          Drawft
        </button>
        <div className="drawft-nav-right">
          <span className="drawft-nav-greeting">Hi, {user?.name?.split(' ')[0]}</span>
          <div className="drawft-nav-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
          <button className="drawft-nav-btn" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
        </div>
      </nav>

      {/* Subheader: title + status + room code */}
      <div className="editor-subheader">
        <input
          className="editor-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          id="editor-title-input"
        />

        <div className={`editor-status-badge ${saveStatus}`}>
          {saveStatus === 'saving' ? (
            <>Saving...</>
          ) : (
            <><Check size={12} /> Saved</>
          )}
        </div>

        <button className="editor-room-badge" onClick={copyCode} title="Copy room code" id="editor-room-code-btn">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {roomCode}
        </button>
      </div>

      <div className="wb-body">
        {/* Left tool sidebar */}
        <div className="wb-tools">
          {TOOLS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`wb-tool-btn ${activeTool === id ? 'active' : ''}`}
              onClick={() => setActiveTool(id)}
              title={label}
              id={`wb-tool-${id}`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="wb-canvas-wrap">
          <div className="wb-canvas-inner">
            <Canvas
              ref={canvasRef}
              activeTool={activeTool}
              strokeColor={strokeColor}
              strokeSize={strokeSize}
              onStroke={handleStroke}
              onLoadStrokes={() => setHasStrokes(true)}
              socket={socket}
              roomCode={roomCode}
            />
            {!hasStrokes && (
              <div className="wb-canvas-placeholder">
                Draw anything here — syncs live for everyone
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="drawft-sidebar">
          {/* Online users */}
          <div className="sidebar-section">
            <ActiveUsers activeUsers={activeUsers} />
          </div>

          {/* Colors */}
          <div className="sidebar-section">
            <p className="sidebar-section-title">Colors</p>
            <div className="color-swatches">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${strokeColor === color ? 'active' : ''}`}
                  style={{ background: color }}
                  onClick={() => setStrokeColor(color)}
                  title={color}
                  id={`wb-color-${color.replace('#', '')}`}
                />
              ))}
            </div>
          </div>

          {/* Stroke size */}
          <div className="sidebar-section">
            <p className="sidebar-section-title" style={{ marginBottom: '10px' }}>
              Stroke size
            </p>
            <input
              type="range"
              min="1"
              max="20"
              value={strokeSize}
              onChange={(e) => setStrokeSize(parseInt(e.target.value))}
              className="stroke-slider"
              id="wb-stroke-size"
            />
          </div>

          {/* Clear board */}
          <div className="sidebar-section" style={{ borderBottom: 'none' }}>
            <button className="clear-board-btn" onClick={handleClearBoard} id="wb-clear-btn">
              <Trash2 size={15} />
              Clear board
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhiteboardPage;
