import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Copy, Check, PenTool,
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, AlignCenter, RemoveFormatting
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocketContext } from '../context/SocketContext';
import TextEditor from '../components/Editor/TextEditor';
import CursorOverlay from '../components/Editor/CursorOverlay';
import ActiveUsers from '../components/Room/ActiveUsers';

const EditorPage = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, connected } = useSocketContext();

  const [document, setDocument] = useState(null);
  const [content, setContent] = useState(null);
  const [title, setTitle] = useState('Untitled Document');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [activeUsers, setActiveUsers] = useState([]);
  const [cursors, setCursors] = useState({});
  const [copied, setCopied] = useState(false);

  const quillRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await API.post('/rooms/join', { roomCode });
        if (res.data.success) {
          const docRes = await API.get(`/documents/${res.data.data.documentId}`);
          if (docRes.data.success) {
            setDocument(docRes.data.data);
            setTitle(docRes.data.data.title);
            setContent(docRes.data.data.content);
          }
        }
      } catch {
        toast.error('Failed to load document');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDocument();
  }, [roomCode, navigate]);

  useEffect(() => {
    if (!socket || !connected || !user || !roomCode) return;

    socket.emit('join-document', { roomCode, userId: user.id, userName: user.name });

    const handleLoadDocument = (docContent) => { if (docContent) setContent(docContent); };
    const handleReceiveChanges = (delta) => {
      if (quillRef.current) {
        const editor = quillRef.current.getEditor();
        if (editor) editor.updateContents(delta);
      }
    };
    const handleCursorUpdate = ({ userId, userName, range, color }) => {
      if (userId !== user.id) setCursors(prev => ({ ...prev, [userId]: { userName, range, color } }));
    };
    const handleUserJoined = ({ name, activeUsers: users }) => {
      if (name !== user.name) toast.success(`${name} joined`, { icon: '👋' });
      setActiveUsers(users);
    };
    const handleUserLeft = ({ name, activeUsers: users }) => {
      setActiveUsers(users);
      setCursors(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(k => { if (updated[k]?.userName === name) delete updated[k]; });
        return updated;
      });
    };
    const handleActiveUsersUpdate = (users) => setActiveUsers(users);

    socket.on('load-document', handleLoadDocument);
    socket.on('receive-changes', handleReceiveChanges);
    socket.on('cursor-update', handleCursorUpdate);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('active-users-update', handleActiveUsersUpdate);

    return () => {
      socket.emit('leave-document', { roomCode });
      socket.off('load-document', handleLoadDocument);
      socket.off('receive-changes', handleReceiveChanges);
      socket.off('cursor-update', handleCursorUpdate);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('active-users-update', handleActiveUsersUpdate);
    };
  }, [socket, connected, user, roomCode]);

  const handleContentChange = useCallback((newContent, delta, source) => {
    setContent(newContent);
    if (source === 'user') {
      setSaveStatus('saving');
      if (socket && roomCode) socket.emit('send-changes', { roomCode, delta });
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        if (socket && roomCode) {
          socket.emit('save-document', { roomCode, content: newContent, title });
          setSaveStatus('saved');
        }
      }, 2000);
    }
  }, [socket, roomCode, title]);

  const handleCursorChange = useCallback((range) => {
    if (socket && roomCode && user) {
      const userColor = activeUsers.find(u => u.userId === user.id)?.color || '#5b4eff';
      socket.emit('cursor-move', { roomCode, userId: user.id, userName: user.name, range, color: userColor });
    }
  }, [socket, roomCode, user, activeUsers]);

  const handleTitleBlur = () => {
    setSaveStatus('saving');
    if (socket && roomCode) {
      socket.emit('save-document', { roomCode, content, title });
      setTimeout(() => setSaveStatus('saved'), 1000);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  /* Toolbar helpers */
  const fmt = (type, value) => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();
    if (!editor) return;
    if (type === 'undo') { editor.history.undo(); return; }
    if (type === 'redo') { editor.history.redo(); return; }
    const cur = editor.getFormat();
    if (type === 'header') editor.format('header', cur.header === value ? false : value);
    else if (type === 'list') editor.format('list', cur.list === value ? false : value);
    else if (type === 'align') editor.format('align', cur.align === value ? false : value);
    else editor.format(type, !cur[type]);
  };

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  if (loading) {
    return (
      <div style={{ background: '#0d0d1e', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="drawft-loader">
          <div className="drawft-spinner" />
          <p className="drawft-loader-text">Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
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

      {/* Sub-header: title + status + room code */}
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

      {/* Body */}
      <div className="editor-body">
        <div className="editor-main">
          {/* Custom formatting toolbar */}
          <div className="editor-toolbar-bar">
            <button className="toolbar-btn" onClick={() => fmt('bold')} title="Bold" id="tb-bold"><Bold size={14} /></button>
            <button className="toolbar-btn" onClick={() => fmt('italic')} title="Italic" id="tb-italic"><Italic size={14} /></button>
            <button className="toolbar-btn" onClick={() => fmt('underline')} title="Underline" id="tb-underline"><Underline size={14} /></button>
            <button className="toolbar-btn" onClick={() => fmt('strike')} title="Strikethrough" id="tb-strike"><Strikethrough size={14} /></button>

            <div className="toolbar-divider" />

            <button className="toolbar-btn" onClick={() => fmt('header', 1)} title="Heading 1" id="tb-h1" style={{ fontSize: '11px', fontWeight: 800 }}>H1</button>
            <button className="toolbar-btn" onClick={() => fmt('header', 2)} title="Heading 2" id="tb-h2" style={{ fontSize: '11px', fontWeight: 800 }}>H2</button>

            <div className="toolbar-divider" />

            <button className="toolbar-btn" onClick={() => fmt('list', 'bullet')} title="Bullet List" id="tb-bullet"><List size={14} /></button>
            <button className="toolbar-btn" onClick={() => fmt('list', 'ordered')} title="Numbered List" id="tb-ordered"><ListOrdered size={14} /></button>

            <div className="toolbar-divider" />

            <button className="toolbar-btn" onClick={() => fmt('align', 'center')} title="Align Center" id="tb-center"><AlignCenter size={14} /></button>

            <div className="toolbar-divider" />

            <button className="toolbar-btn" onClick={() => fmt('clean')} title="Clear Formatting" id="tb-clean"><RemoveFormatting size={14} /></button>
          </div>

          {/* Editor */}
          <div className="editor-quill-wrap">
            <CursorOverlay cursors={cursors} />
            <TextEditor
              quillRef={quillRef}
              content={content}
              onContentChange={handleContentChange}
              onCursorChange={handleCursorChange}
            />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="drawft-sidebar">
          <div className="sidebar-section">
            <ActiveUsers activeUsers={activeUsers} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPage;
