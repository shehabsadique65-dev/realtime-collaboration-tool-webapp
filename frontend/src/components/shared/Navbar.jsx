import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(229,231,235,0.6)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(79,70,229,0.05)'
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2.5 no-underline" id="navbar-logo">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
              <PenTool className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold text-[#1E1B4B] tracking-tight">Drawft</span>
          </Link>

          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2.5 bg-[#F4F3FF] rounded-xl px-3 py-1.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
                  id="navbar-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-semibold text-[#1E1B4B]">{user.name}</span>
              </div>
              <button onClick={handleLogout} className="btn-icon" id="navbar-logout-btn" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
