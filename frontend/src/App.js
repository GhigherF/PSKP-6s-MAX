import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import PostsPage from './pages/PostsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UsersPage from './pages/UsersPage';
import PostPage from './pages/PostPage';

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
function NotificationsMenu({ onClose }) {
  const [notifs, setNotifs] = useState([]);
  useEffect(() => {
    axios.get('/api/notifications').then(r => setNotifs(r.data)).catch(() => {});
    axios.post('/api/notifications/read').catch(() => {});
  }, []);
  const remove = async (id) => {
    await axios.delete(`/api/notifications/${id}`).catch(() => {});
    setNotifs(prev => prev.filter(n => n.id !== id));
  };
  return (
    <div className="notif-menu">
      <div className="notif-header">
        <span style={{ fontWeight: 700, fontSize: 15 }}>Уведомления</span>
        <button className="notif-close" onClick={onClose}>✕</button>
      </div>
      {notifs.length === 0
        ? <p className="notif-empty">Нет уведомлений</p>
        : notifs.map(n => (
          <div key={n.id} className={`notif-item ${n.is_read ? '' : 'notif-unread'}`}>
            <span className="notif-msg">{n.message}</span>
            <span className="notif-time">{new Date(n.created_at).toLocaleString()}</span>
            <button className="notif-del" onClick={() => remove(n.id)}>✕</button>
          </div>
        ))}
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  useEffect(() => {
    if (!user) return;
    const load = () => axios.get('/api/notifications').then(r => setUnread(r.data.filter(n => !n.is_read).length)).catch(() => {});
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [user]);
  const openNotifs = () => { setShowNotifs(true); setUnread(0); };
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px', display: 'flex', alignItems: 'center',
      height: 53, gap: 24,
    }}>
      <Link to="/" style={{ fontWeight: 800, fontSize: 20, color: 'var(--text)', textDecoration: 'none' }}>✦</Link>
      <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 15, textDecoration: 'none', fontWeight: 500 }}
        onMouseEnter={e => e.target.style.color = 'var(--text)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
        Лента
      </Link>
      <Link to="/users" style={{ color: 'var(--text-muted)', fontSize: 15, textDecoration: 'none', fontWeight: 500 }}
        onMouseEnter={e => e.target.style.color = 'var(--text)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
        Люди
      </Link>
      <span style={{ flex: 1 }} />
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <button className="notif-bell" onClick={openNotifs} title="Уведомления">
            🔔
            {unread > 0 && <span className="notif-badge">{unread}</span>}
          </button>
          {showNotifs && <NotificationsMenu onClose={() => setShowNotifs(false)} />}
          <Link to={`/profile/${user.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--text)' }}>
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{user.nick?.[0]?.toUpperCase()}</div>}
            <span style={{ fontSize: 14, fontWeight: 600 }}>{user.nick}</span>
          </Link>
          <button onClick={logout} style={{ padding: '6px 14px', background: 'none', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
            Выйти
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" style={{ padding: '6px 16px', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>Войти</Link>
          <Link to="/register" style={{ padding: '6px 16px', background: 'var(--text)', borderRadius: 20, color: 'var(--bg)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Регистрация</Link>
        </div>
      )}
    </nav>
  );
}

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>;

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<PostsPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/posts/:id" element={<PostPage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
