import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nick: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.nick, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <h2>Регистрация</h2>
      {error && <p className="auth-error">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          placeholder="Никнейм" required minLength={2}
          value={form.nick} onChange={e => setForm({ ...form, nick: e.target.value })}
          className="auth-input"
        />
        <input
          type="email" placeholder="Email" required
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          className="auth-input"
        />
        <input
          type="password" placeholder="Пароль (мин. 6 символов)" required minLength={6}
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
          className="auth-input"
        />
        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>
      <p className="auth-link">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}
