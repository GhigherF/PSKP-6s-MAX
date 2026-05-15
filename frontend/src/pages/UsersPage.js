import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './UsersPage.css';

const API = '/api';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/users`).then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (id) => {
    const { data } = await axios.post(`${API}/users/${id}/subscribe`);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, is_following: data.subscribed } : u));
  };

  if (loading) return <p style={{ padding: 20 }}>Загрузка...</p>;

  return (
    <div className="users-wrap">
      <h1>Пользователи</h1>
      <div className="users-list">
        {users.map(u => (
          <div key={u.id} className="user-card">
            <Link to={`/profile/${u.id}`} className="user-card-link">
              {u.avatar_url
                ? <img src={u.avatar_url} alt="" className="user-avatar" />
                : <div className="user-avatar-placeholder">{u.nick[0].toUpperCase()}</div>}
              <div className="user-info">
                <span className="user-nick">{u.nick}</span>
                {u.role === 'admin' && <span className="user-role">👑 Администратор</span>}
              </div>
            </Link>
            {user && user.id !== u.id && (
              <button
                className={`btn-subscribe ${u.is_following ? 'subscribed' : ''}`}
                onClick={() => handleSubscribe(u.id)}
              >
                {u.is_following ? 'Отписаться' : 'Подписаться'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
