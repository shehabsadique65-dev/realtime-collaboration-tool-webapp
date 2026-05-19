import { createContext, useContext, useState, useEffect } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = sessionStorage.getItem('drawft_token');
    const savedUser = sessionStorage.getItem('drawft_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      verifyToken(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (savedToken) => {
    try {
      const res = await API.get('/auth/me', {
        headers: { Authorization: `Bearer ${savedToken}` }
      });
      if (res.data.success) {
        setUser(res.data.data);
        sessionStorage.setItem('drawft_user', JSON.stringify(res.data.data));
      }
    } catch (error) {
      sessionStorage.removeItem('drawft_token');
      sessionStorage.removeItem('drawft_user');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    sessionStorage.setItem('drawft_token', userToken);
    sessionStorage.setItem('drawft_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('drawft_token');
    sessionStorage.removeItem('drawft_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
