import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);
const TOKEN_KEY = 'mb_token';

function setAxiosToken(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setLoading(false); return; }

    setAxiosToken(token);
    axios.get('/api/auth/me')
      .then(r => setUser(r.data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setAxiosToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setAxiosToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (nick, email, password) => {
    await axios.post('/api/auth/register', { nick, email, password });
    await login(email, password);
  }, [login]);

  const updateUser = useCallback((data) => setUser(prev => ({ ...prev, ...data })), []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAxiosToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
