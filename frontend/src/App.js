import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import PostsPage from './pages/PostsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UsersPage from './pages/UsersPage';
import PostPage from './pages/PostPage';


// ─── Theme ────────────────────────────────────────────────────────────────────
export const ThemeContext = createContext(null);

export function useTheme() { return useContext(ThemeContext); }

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export const ToastContext = createContext(null);

export function useToast() { return useContext(ToastContext); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };
  
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'var(--bg-card)',
      backdropFilter: 'blur(12px)',
      borderBottom: '2px solid var(--border)',
      padding: '0 20px', display: 'flex', alignItems: 'center',
      height: 60, gap: 24,
      boxShadow: 'var(--shadow-light)',
    }}>
      <Link to="/" style={{ fontWeight: 800, fontSize: 24, color: 'var(--accent)', textDecoration: 'none' }}>✦</Link>
      <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 15, textDecoration: 'none', fontWeight: 600, padding: '8px 12px', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s' }}
        onMouseEnter={e => e.target.style.color = 'var(--accent)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
        Лента
      </Link>
      <Link to="/users" style={{ color: 'var(--text-muted)', fontSize: 15, textDecoration: 'none', fontWeight: 600, padding: '8px 12px', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s' }}
        onMouseEnter={e => e.target.style.color = 'var(--accent)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
        Люди
      </Link>
      <span style={{ flex: 1 }} />
      
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          {/* Выпадающее меню профиля */}
          <div 
            ref={profileMenuRef} 
            style={{ position: 'relative' }}
            onMouseEnter={() => setShowProfileMenu(true)}
            onMouseLeave={() => setShowProfileMenu(false)}
          >
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--radius)', transition: 'background 0.2s', background: showProfileMenu ? 'var(--bg-hover)' : 'transparent' }}
            >
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '10px', objectFit: 'cover' }} />
                : <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{user.nick?.[0]?.toUpperCase()}</div>}
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user.nick}</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>▼</span>
            </div>
            
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                minWidth: 200,
                zIndex: 1000,
              }}>
                <Link 
                  to={`/profile/${user.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    textDecoration: 'none',
                    color: 'var(--text)',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 16 }}>👤</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Мой профиль</span>
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 16 }}>🚪</span>
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <Link 
            to="/login" 
            style={{ 
              padding: '8px 20px', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius)', 
              color: 'var(--text)', 
              fontSize: 14, 
              fontWeight: 600, 
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = 'var(--accent)';
              e.target.style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.color = 'var(--text)';
            }}
          >
            Войти
          </Link>
          <Link 
            to="/register" 
            style={{ 
              padding: '8px 20px', 
              background: 'var(--accent)', 
              borderRadius: 'var(--radius)', 
              color: '#fff', 
              fontSize: 14, 
              fontWeight: 700, 
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              border: 'none'
            }}
            onMouseEnter={e => e.target.style.opacity = '0.9'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            Регистрация
          </Link>
        </div>
      )}
    </nav>
  );
}

function AppRoutes() {
  const { loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>;

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        background: 'var(--bg)'
      }}>
        <Routes>
          <Route path="/" element={<PostsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      
      {/* Theme Toggle in Bottom Right Corner */}
      <button 
        className="theme-toggle-corner"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
