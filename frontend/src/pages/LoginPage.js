import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <h2>Вход</h2>
      {error && <p className="auth-error">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email" placeholder="Email" required
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          className="auth-input"
        />
        <input
          type="password" placeholder="Пароль" required
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
          className="auth-input"
        />
        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <p className="auth-link">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}
