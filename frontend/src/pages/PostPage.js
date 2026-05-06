import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PostsPage from './PostsPage';

const API = '/api';

// Переиспользуем компоненты из PostsPage через отдельный экспорт
// Здесь рендерим один пост через PostCard логику напрямую
export default function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get(`${API}/posts/${id}`)
      .then(r => setPost(r.data))
      .catch(() => setError('Пост не найден'));
  }, [id]);

  if (error) return <div style={{ padding: 20 }}><Link to="/">← Назад</Link><p style={{ color: 'red' }}>{error}</p></div>;
  if (!post) return <div style={{ padding: 20 }}>Загрузка...</div>;

  // Рендерим через PostsPage с одним постом
  return <PostsPage singlePost={post} />;
}
