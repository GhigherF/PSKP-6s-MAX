import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = '/api';

function UserPostsTab({ userId, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/users/${userId}/posts`)
      .then(r => setPosts(r.data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleDelete = async (id) => {
    await axios.delete(`${API}/posts/${id}`);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  if (loading) return <p style={{ padding: 20, color: 'var(--text-muted)' }}>Загрузка постов...</p>;
  if (posts.length === 0) return <p style={{ padding: 20, color: 'var(--text-muted)' }}>Нет постов</p>;

  return (
    <div className="user-posts-tab">
      {posts.map(post => (
        <div key={post.id} className="user-post-card">
          <div className="user-post-header">
            <Link to={`/posts/${post.id}`} className="user-post-link">
              <span className="user-post-title">Пост от {new Date(post.created_at).toLocaleDateString()}</span>
            </Link>
            <div className="user-post-stats">
              <span className="user-post-stat">❤ {post.likes_count}</span>
              <span className="user-post-stat">💬 {post.comments_count}</span>
              <span className="user-post-stat">👁 {post.views_count}</span>
            </div>
          </div>
          <p className="user-post-body">{post.body?.slice(0, 200)}{post.body?.length > 200 ? '...' : ''}</p>
          {post.files && post.files.length > 0 && (
            <div className="user-post-files">
              <span className="user-post-files-count">📎 {post.files.length} файл(ов)</span>
            </div>
          )}
          <div className="user-post-actions">
            <Link to={`/posts/${post.id}`} className="user-post-view-btn">Открыть пост</Link>
            {user && (user.id === post.user_id || user.role === 'admin') && (
              <button 
                className="user-post-delete-btn"
                onClick={() => handleDelete(post.id)}
              >
                {user.role === 'admin' && user.id !== post.user_id ? '🚫 Удалить' : '🗑 Удалить'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserPostsTab;