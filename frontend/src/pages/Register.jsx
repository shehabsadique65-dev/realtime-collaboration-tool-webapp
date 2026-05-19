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

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 4) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) || /\d/.test(password)) score++;
  if (/[A-Z]/.test(password) && /\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password) && password.length >= 10) score++;
  const levels = [
    { label: 'Very Weak', color: '#ef4444' },
    { label: 'Weak',      color: '#f97316' },
    { label: 'Fair',      color: '#eab308' },
    { label: 'Strong',    color: '#22c55e' },
    { label: 'Very Strong', color: '#16a34a' },
  ];
  return { score, ...levels[Math.min(score, 4)] };
};

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const strength = getPasswordStrength(formData.password);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name) errors.name = 'Full name is required';
    if (!formData.email) errors.email = 'Email is required';
    if (!formData.password) errors.password = 'Password is required';
    if (!formData.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    if (formData.password.length < 6) { setFieldErrors({ password: 'Minimum 6 characters' }); return; }
    if (formData.password !== formData.confirmPassword) { setFieldErrors({ confirmPassword: 'Passwords do not match' }); return; }

    setLoading(true);
    try {
      const res = await API.post('/auth/register', {
        name: formData.name, email: formData.email, password: formData.password
      });
      if (res.data.success) {
        const loginRes = await API.post('/auth/login', { email: formData.email, password: formData.password });
        if (loginRes.data.success) {
          const { token, ...userData } = loginRes.data.data;
          login(userData, token);
          toast.success(`Welcome to Drawft, ${userData.name}!`);
          navigate('/dashboard');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
          <button className="auth-tab" onClick={() => navigate('/login')}>Sign in</button>
          <button className="auth-tab active">Create account</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-name">Full name</label>
            <input
              id="register-name" type="text" name="name" value={formData.name}
              onChange={handleChange} placeholder="Your full name"
              className={`auth-input ${fieldErrors.name ? 'error' : ''}`}
              autoComplete="name"
            />
            {fieldErrors.name && <p className="field-error">{fieldErrors.name}</p>}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-email">Email address</label>
            <input
              id="register-email" type="email" name="email" value={formData.email}
              onChange={handleChange} placeholder="you@example.com"
              className={`auth-input ${fieldErrors.email ? 'error' : ''}`}
              autoComplete="email"
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-password">Password</label>
            <div className="auth-input-wrap">
              <input
                id="register-password" type={showPassword ? 'text' : 'password'}
                name="password" value={formData.password}
                onChange={handleChange} placeholder="Create a password"
                className={`auth-input ${fieldErrors.password ? 'error' : ''}`}
                style={{ paddingRight: '44px' }} autoComplete="new-password"
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)} id="register-toggle-password">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
            {formData.password && (
              <div style={{ marginTop: '8px' }}>
                <div className="strength-bars">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="strength-bar"
                      style={{ background: i <= strength.score ? strength.color : '#2a2a42' }} />
                  ))}
                </div>
                <p className="strength-label" style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-confirm">Confirm password</label>
            <div className="auth-input-wrap">
              <input
                id="register-confirm" type={showConfirm ? 'text' : 'password'}
                name="confirmPassword" value={formData.confirmPassword}
                onChange={handleChange} placeholder="Confirm your password"
                className={`auth-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                style={{ paddingRight: '44px' }} autoComplete="new-password"
              />
              <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm(!showConfirm)} id="register-toggle-confirm">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="field-error">{fieldErrors.confirmPassword}</p>}
            {formData.confirmPassword && !fieldErrors.confirmPassword && formData.password === formData.confirmPassword && (
              <p className="field-error" style={{ color: '#22c55e' }}>Passwords match ✓</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="auth-submit-btn" id="register-submit-btn">
            {loading ? <span className="btn-spin" /> : null}
            {loading ? 'Creating account...' : 'Create your account'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link" id="register-login-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
