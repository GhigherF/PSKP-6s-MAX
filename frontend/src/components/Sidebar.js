import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../App';

function Sidebar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Используем history для навигации без перезагрузки страницы
      window.history.pushState({}, '', `/?search=${encodeURIComponent(searchQuery)}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 60,
      width: '240px',
      height: 'calc(100vh - 60px)',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 90,
      boxShadow: 'var(--shadow-light)',
    }}>
      {/* Поиск */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              placeholder="Поиск постов..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px 10px 40px',
                background: 'var(--bg-input)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text)',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '16px'
            }}>
              🔍
            </span>
          </div>
          {searchQuery && (
            <button 
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Очистить поиск"
            >
              ✕
            </button>
          )}
        </form>
      </div>
      
      {/* Меню */}
      <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Link 
            to="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 20px',
              textDecoration: 'none',
              color: location.pathname === '/' ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '15px',
              fontWeight: location.pathname === '/' ? '700' : '600',
              background: location.pathname === '/' ? 'var(--bg-hover)' : 'transparent',
              borderLeft: location.pathname === '/' ? '4px solid var(--accent)' : '4px solid transparent',
              transition: 'all 0.2s',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
            }}
            onMouseEnter={e => {
              if (location.pathname !== '/') {
                e.target.style.color = 'var(--accent)';
                e.target.style.background = 'var(--bg-hover)';
              }
            }}
            onMouseLeave={e => {
              if (location.pathname !== '/') {
                e.target.style.color = 'var(--text-muted)';
                e.target.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>📰</span>
            <span>Лента</span>
          </Link>
          
          <Link 
            to="/users" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 20px',
              textDecoration: 'none',
              color: location.pathname === '/users' ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '15px',
              fontWeight: location.pathname === '/users' ? '700' : '600',
              background: location.pathname === '/users' ? 'var(--bg-hover)' : 'transparent',
              borderLeft: location.pathname === '/users' ? '4px solid var(--accent)' : '4px solid transparent',
              transition: 'all 0.2s',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
            }}
            onMouseEnter={e => {
              if (location.pathname !== '/users') {
                e.target.style.color = 'var(--accent)';
                e.target.style.background = 'var(--bg-hover)';
              }
            }}
            onMouseLeave={e => {
              if (location.pathname !== '/users') {
                e.target.style.color = 'var(--text-muted)';
                e.target.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>👥</span>
            <span>Люди</span>
          </Link>
          
          {user && (
            <>
              <div style={{ padding: '16px 20px 8px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Мой профиль
              </div>
              
              <Link 
                to={`/profile/${user.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px 12px 32px',
                  textDecoration: 'none',
                  color: location.pathname.startsWith('/profile/') && !location.search ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: location.pathname.startsWith('/profile/') && !location.search ? '700' : '600',
                  background: location.pathname.startsWith('/profile/') && !location.search ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: location.pathname.startsWith('/profile/') && !location.search ? '4px solid var(--accent)' : '4px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
                onMouseEnter={e => {
                  if (!(location.pathname.startsWith('/profile/') && !location.search)) {
                    e.target.style.color = 'var(--accent)';
                    e.target.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!(location.pathname.startsWith('/profile/') && !location.search)) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>👤</span>
                <span>Обзор</span>
              </Link>
              
              <Link 
                to={`/profile/${user.id}?tab=posts`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px 12px 32px',
                  textDecoration: 'none',
                  color: location.search.includes('tab=posts') ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: location.search.includes('tab=posts') ? '700' : '600',
                  background: location.search.includes('tab=posts') ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: location.search.includes('tab=posts') ? '4px solid var(--accent)' : '4px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
                onMouseEnter={e => {
                  if (!location.search.includes('tab=posts')) {
                    e.target.style.color = 'var(--accent)';
                    e.target.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!location.search.includes('tab=posts')) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>📝</span>
                <span>Мои посты</span>
              </Link>
              
              <Link 
                to={`/profile/${user.id}?tab=followers`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px 12px 32px',
                  textDecoration: 'none',
                  color: location.search.includes('tab=followers') ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: location.search.includes('tab=followers') ? '700' : '600',
                  background: location.search.includes('tab=followers') ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: location.search.includes('tab=followers') ? '4px solid var(--accent)' : '4px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
                onMouseEnter={e => {
                  if (!location.search.includes('tab=followers')) {
                    e.target.style.color = 'var(--accent)';
                    e.target.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!location.search.includes('tab=followers')) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>❤️</span>
                <span>Подписчики</span>
              </Link>
              
              <Link 
                to={`/profile/${user.id}?tab=following`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px 12px 32px',
                  textDecoration: 'none',
                  color: location.search.includes('tab=following') ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: location.search.includes('tab=following') ? '700' : '600',
                  background: location.search.includes('tab=following') ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: location.search.includes('tab=following') ? '4px solid var(--accent)' : '4px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
                onMouseEnter={e => {
                  if (!location.search.includes('tab=following')) {
                    e.target.style.color = 'var(--accent)';
                    e.target.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!location.search.includes('tab=following')) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>👁️</span>
                <span>Подписки</span>
              </Link>
              
              <Link 
                to={`/profile/${user.id}?tab=edit`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px 12px 32px',
                  textDecoration: 'none',
                  color: location.search.includes('tab=edit') ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: location.search.includes('tab=edit') ? '700' : '600',
                  background: location.search.includes('tab=edit') ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: location.search.includes('tab=edit') ? '4px solid var(--accent)' : '4px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
                onMouseEnter={e => {
                  if (!location.search.includes('tab=edit')) {
                    e.target.style.color = 'var(--accent)';
                    e.target.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!location.search.includes('tab=edit')) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '16px' }}>⚙️</span>
                <span>Настройки</span>
              </Link>
            </>
          )}
        </nav>
      </div>
      
      {/* Тема */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
        <button 
          onClick={toggleTheme} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
        >
          <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;