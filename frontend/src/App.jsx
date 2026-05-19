import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';
import WhiteboardPage from './pages/WhiteboardPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="drawft-loader">
          <div className="drawft-spinner" />
          <p className="drawft-loader-text">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="drawft-loader">
          <div className="drawft-spinner" />
          <p className="drawft-loader-text">Loading...</p>
        </div>
      </div>
    );
  }
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/editor/:roomCode" element={<ProtectedRoute><EditorPage /></ProtectedRoute>} />
    <Route path="/whiteboard/:roomCode" element={<ProtectedRoute><WhiteboardPage /></ProtectedRoute>} />
    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

const App = () => (
  <Router>
    <AuthProvider>
      <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e1e38',
              color: '#ffffff',
              fontFamily: "'Inter', sans-serif",
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '12px',
              border: '1px solid #2e2e50',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1e1e38' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#1e1e38' } },
          }}
        />
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  </Router>
);

export default App;
