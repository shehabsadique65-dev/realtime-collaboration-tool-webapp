import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../utils/api';
import { useAuth } from '../context/AuthContext';

const PARTICLES = [...Array(15)].map(() => ({
  size: Math.random() * 4 + 2,
  left: `${Math.random() * 100}%`,
  duration: `${Math.random() * 10 + 10}s`,
  delay: `${Math.random() * 5}s`,
  opacity: Math.random() * 0.4 + 0.1
}));

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    try {
      const res = await API.post('/auth/login', formData);
      if (res.data.success) {
        const { token, ...userData } = res.data.data;
        login(userData, token);
        toast.success(`Welcome back, ${userData.name}!`);
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* 3D Floating Particles Background */}
      <div className="auth-particles">
        {PARTICLES.map((p, i) => (
          <div
            key={i}
            className="auth-particle"
            style={{
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: p.duration,
              animationDelay: p.delay,
              opacity: p.opacity
            }}
          />
        ))}
      </div>

      {/* Crafted by Shehab Watermark */}
      <div className="auth-watermark">
        CRAFTED BY <span>SHEHAB</span>
      </div>

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <PenTool className="auth-brand-icon" />
          <span className="auth-brand-name">Drawft</span>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button className="auth-tab active">Sign in</button>
          <button className="auth-tab" onClick={() => navigate('/register')}>
            Create account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`auth-input ${fieldErrors.email ? 'error' : ''}`}
              autoComplete="email"
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`auth-input ${fieldErrors.password ? 'error' : ''}`}
                style={{ paddingRight: '44px' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                id="login-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
            id="login-submit-btn"
          >
            {loading ? <span className="btn-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign in to Drawft'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p className="auth-footer">
          No account?{' '}
          <Link to="/register" className="auth-link" id="login-register-link">
            Create one free
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
