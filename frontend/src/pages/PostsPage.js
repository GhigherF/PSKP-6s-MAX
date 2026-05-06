import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { useToast } from '../App';
import { saveDraftFiles, loadDraftFiles, clearDraftFiles } from '../draftStorage';
import './PostsPage.css';

const API = '/api';
const VIEWED_KEY = 'viewed_posts';

const MAX_FILE_SIZE = 300 * 1024 * 1024;

function getViewed() {
  try { return new Set((JSON.parse(localStorage.getItem(VIEWED_KEY)) || []).map(Number)); }
  catch { return new Set(); }
}
function addViewed(id) {
  const s = getViewed(); s.add(Number(id));
  localStorage.setItem(VIEWED_KEY, JSON.stringify([...s]));
}

function MediaModal({ file, onClose }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} className="overlay">
      <div className="modal-content">
        {file.file_type === 'video'
          ? <video controls src={file.file_url} className="modal-media" />
          : <img src={file.file_url} alt={file.original_name} className="modal-media" />}
        <div className="modal-buttons">
          <button onClick={() => { const a = document.createElement('a'); a.href = file.file_url; a.download = file.original_name; a.click(); }} className="btn-download">⬇ Скачать</button>
          <button onClick={onClose} className="btn-close">✕ Закрыть</button>
        </div>
      </div>
    </div>
  );
}

function PostFiles({ files }) {
  const [modalFile, setModalFile] = useState(null);
  if (!files || !files.length) return null;
  const mediaTypes = ['image', 'gif', 'video'];
  return (
    <div className="files-container">
      {files.map(file => {
        if (mediaTypes.includes(file.file_type)) {
          if (file.file_type === 'video') return (
            <div key={file.id} className="media-thumb">
              <video controls src={file.file_url} className="thumb-media" />
            </div>
          );
          return (
            <div key={file.id} className="media-thumb" onClick={() => setModalFile(file)} title="Открыть на весь экран">
              <img src={file.file_url} alt={file.original_name} className="thumb-media" />
              <div className="thumb-overlay">🔍</div>
            </div>
          );
        }
        if (file.file_type === 'audio') return (
          <div key={file.id} className="doc-file">
            <span className="doc-icon">🎵</span>
            <span className="doc-name">{file.original_name}</span>
            <audio controls src={file.file_url} style={{ marginLeft: 8, height: 28 }} />
          </div>
        );
        return (
          <div key={file.id} className="doc-file">
            <span className="doc-icon">{file.file_type === 'document' ? '📄' : '📎'}</span>
            <span className="doc-name">{file.original_name}</span>
            <span className="doc-size">({formatSize(file.size_bytes)})</span>
            <a href={file.file_url} download={file.original_name} className="btn-download-inline">⬇ Скачать</a>
          </div>
        );
      })}
      {modalFile && <MediaModal file={modalFile} onClose={() => setModalFile(null)} />}
    </div>
  );
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function makePreview(f) {
  return {
    name: f.name,
    isImage: f.type.startsWith('image/'),
    isAudio: f.type.startsWith('audio/'),
    isVideo: f.type.startsWith('video/'),
    url: (f.type.startsWith('image/') || f.type.startsWith('video/')) ? URL.createObjectURL(f) : null,
  };
}

function CommentsSection({ post, user }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null); // { id, username }
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const wsRef = useRef(null);

  useEffect(() => {
    axios.get(`${API}/posts/${post.id}/comments`).then(r => setComments(r.data)).catch(() => {});
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/ws?postId=${post.id}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'comment') setComments(prev => [...prev, msg.comment]);
      else if (msg.type === 'comment_deleted') setComments(prev => prev.map(c =>
        c.id === msg.comment_id || c.parent_id === msg.comment_id
          ? { ...c, deleted: true, deleted_by_admin: msg.deleted_by_admin }
          : c
      ));
      else if (msg.type === 'comment_like') setComments(prev => prev.map(c => c.id === msg.comment_id ? { ...c, likes_count: msg.likes_count } : c));
    };
    return () => ws.close();
  }, [post.id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await axios.post(`${API}/posts/${post.id}/comments`, { body: text, parent_id: replyTo?.id || null });
    if (replyTo) {
      setExpandedReplies(prev => new Set([...prev, replyTo.id]));
    }
    setText('');
    setReplyTo(null);
  };

  const likeComment = async (id) => {
    const { data } = await axios.post(`${API}/comments/${id}/like`);
    setComments(prev => prev.map(c => c.id === id ? { ...c, liked_by_me: data.liked, likes_count: data.likes_count } : c));
  };

  const deleteComment = async (id) => { await axios.delete(`${API}/comments/${id}`); };

  const toggleReplies = (id) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const topLevel = comments.filter(c => !c.parent_id);
  const repliesMap = {};
  comments.forEach(c => {
    if (c.parent_id) {
      if (!repliesMap[c.parent_id]) repliesMap[c.parent_id] = [];
      repliesMap[c.parent_id].push(c);
    }
  });

  const renderComment = (c, isReply = false) => (
    <div key={c.id} className={`comment ${c.deleted ? 'comment-deleted' : ''} ${isReply ? 'comment-reply' : ''}`}>
      {c.deleted ? (
        <span className="comment-deleted-text">{c.deleted_by_admin ? '🚫 Удалено администратором' : 'Комментарий удалён'}</span>
      ) : (
        <>
          <Link to={`/profile/${c.user_id}`} className="comment-author">
            {c.user_avatar ? <img src={c.user_avatar} alt="" className="comment-avatar" /> : <div className="comment-avatar-placeholder">{c.username?.[0]?.toUpperCase()}</div>}
            {c.username}
          </Link>
          <span className="comment-body">{c.body}</span>
          <span className="comment-actions">
            {user ? (
              <button className={`btn-like-comment ${c.liked_by_me ? 'liked' : ''}`} onClick={() => likeComment(c.id)} title={`${c.likes_count} лайков`}>
                <span className="like-icon" aria-hidden>❤</span>
                <span className="like-count">{c.likes_count}</span>
              </button>
            ) : (
              <span className="post-stat" style={{ fontSize: 12 }}>❤ {c.likes_count}</span>
            )}
            {user && !isReply && (
              <button className="btn-reply-comment" onClick={() => setReplyTo(replyTo?.id === c.id ? null : { id: c.id, username: c.username })}>↩ Ответить</button>
            )}
            {user && user.id === c.user_id && <button className="btn-delete-comment" onClick={() => deleteComment(c.id)}>🗑</button>}
            {user && user.role === 'admin' && user.id !== c.user_id && <button className="btn-delete-comment" onClick={() => deleteComment(c.id)}>🚫</button>}
          </span>
        </>
      )}
    </div>
  );

  return (
    <div className="comments-section">
      {topLevel.map(c => (
        <div key={c.id} className="comment-thread">
          {renderComment(c, false)}

          {replyTo?.id === c.id && user && (
            <form onSubmit={submit} className="comment-form comment-reply-form">
              <span className="reply-hint">↩ {replyTo.username}</span>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Ваш ответ..." className="comment-input" autoFocus />
              <button type="submit" className="comment-submit">Отправить</button>
              <button type="button" className="comment-cancel" onClick={() => { setReplyTo(null); setText(''); }}>✕</button>
            </form>
          )}

          {repliesMap[c.id]?.length > 0 && (
            <>
              <button className="btn-toggle-replies" onClick={() => toggleReplies(c.id)}>
                {expandedReplies.has(c.id)
                  ? `▲ Свернуть ответы`
                  : `▼ Показать ответы (${repliesMap[c.id].length})`}
              </button>
              {expandedReplies.has(c.id) && (
                <div className="replies-list">
                  {repliesMap[c.id].map(r => renderComment(r, true))}
                </div>
              )}
            </>
          )}
        </div>
      ))}

      {user ? (
        !replyTo && (
          <form onSubmit={submit} className="comment-form">
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Написать комментарий..." className="comment-input" />
            <button type="submit" className="comment-submit">Отправить</button>
          </form>
        )
      ) : (
        <p className="comments-guest-hint"><Link to="/login">Войдите</Link>, чтобы комментировать.</p>
      )}
    </div>
  );
}

function PostCard({ post, user, onDelete, onLike }) {
  const [showComments, setShowComments] = useState(false);
  const [likes, setLikes] = useState(post.likes_count);
  const [liked, setLiked] = useState(post.liked_by_me);
  const [views, setViews] = useState(post.views_count);
  const cardRef = useRef(null);
  const viewedRef = useRef(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${window.location.host}/ws?postId=${post.id}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'like') setLikes(msg.likes_count);
      if (msg.type === 'view') setViews(msg.views_count);
    };
    return () => ws.close();
  }, [post.id]);

  useEffect(() => {
    if (!cardRef.current || viewedRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          addViewed(post.id);
          if (user) axios.post(`${API}/posts/${post.id}/view`).catch(() => {});
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [post.id, user]);

  const handleLike = async () => {
    const { data } = await axios.post(`${API}/posts/${post.id}/like`);
    setLiked(data.liked);
    setLikes(data.likes_count);
    onLike(post.id, data.likes_count);
  };

  const canDelete = user && (user.id === post.user_id || user.role === 'admin');

  return (
    <div className="post-card" ref={cardRef}>
      <div className="post-header">
        <Link to={`/profile/${post.user_id}`} className="post-author-link">
          {post.user_avatar
            ? <img src={post.user_avatar} alt="" className="post-avatar" />
            : <div className="post-avatar-placeholder">{post.username?.[0]?.toUpperCase()}</div>}
          <span className="post-author">{post.username}</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link to={`/posts/${post.id}`} className="post-permalink" title="Открыть пост отдельно">🔗</Link>
          <small className="post-date">{new Date(post.created_at).toLocaleString()}</small>
        </div>
      </div>
      <p className="post-body">{post.body}</p>
      <PostFiles files={post.files} />
      <div className="post-actions">
        {user ? (
          <button className={`btn-like ${liked ? 'liked' : ''}`} onClick={handleLike} title={`${likes} лайков`}>
            <span className="like-icon" aria-hidden>❤</span>
            <span className="like-count">{likes}</span>
          </button>
        ) : (
          <span className="btn-like-guest">
            ❤ {likes}
            <span className="like-tooltip"><Link to="/login">Войдите</Link>, чтобы поставить лайк</span>
          </span>
        )}
        <button className="btn-comments" onClick={() => setShowComments(v => !v)} title={`${post.comments_count} комментариев`}>
          <span className="comment-icon" aria-hidden>💬</span>
          <span className="comment-count">{post.comments_count}</span>
        </button>
        <span className="post-stat">👁 {views}</span>
        {canDelete && (
          <button className="btn-delete-post" onClick={() => onDelete(post.id)}>
            {user.role === 'admin' && user.id !== post.user_id ? '🚫' : '🗑'}
          </button>
        )}
      </div>
      {showComments && <CommentsSection post={post} user={user} />}
    </div>
  );
}

export default function PostsPage({ singlePost }) {
  const { user } = useAuth();
  const toast = useToast();
  const [followed, setFollowed] = useState([]);
  const [others, setOthers] = useState([]);
  const [form, setForm] = useState(() => {
    try { return JSON.parse(localStorage.getItem('draft_post')) || { body: '' }; }
    catch { return { body: '' }; }
  });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (singlePost) return;
    try {
      const viewed = getViewed();
      const viewedParam = [...viewed].join(',');
      const { data } = await axios.get(`${API}/posts${viewedParam ? `?viewed=${viewedParam}` : ''}`);
      setFollowed(data.followed || []);
      setOthers(data.others || []);
    } catch {
      toast('Ошибка загрузки постов');
    }
  }, [singlePost, toast]);

  useEffect(() => {
    if (singlePost) setOthers([singlePost]);
    else fetchPosts();
  }, [singlePost, fetchPosts]);

  useEffect(() => { localStorage.setItem('draft_post', JSON.stringify(form)); }, [form]);

  useEffect(() => {
    loadDraftFiles().then(saved => {
      if (!saved.length) return;
      setFiles(saved);
      setPreviews(saved.map(makePreview));
    }).catch(() => {});
  }, []);

  const handleFilesChange = (added) => {
    const oversized = added.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length) {
      toast(`Файл «${oversized[0].name}» превышает 300 МБ. Загрузка отменена.`);
      return;
    }
    setFiles(prev => { const u = [...prev, ...added]; saveDraftFiles(u).catch(() => {}); return u; });
    setPreviews(prev => [...prev, ...added.map(makePreview)]);
  };

  const handleFileRemove = (i) => {
    setFiles(prev => { const u = prev.filter((_, fi) => fi !== i); saveDraftFiles(u).catch(() => {}); return u; });
    setPreviews(prev => prev.filter((_, pi) => pi !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('body', form.body);
      files.forEach(f => fd.append('files', f));
      await axios.post(`${API}/posts`, fd);
      setForm({ body: '' });
      setFiles([]);
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      clearDraftFiles().catch(() => {});
      localStorage.removeItem('draft_post');
      toast('Пост опубликован ✓');
      fetchPosts();
    } catch (err) {
      if (err.response?.status === 413) {
        toast('Файл слишком большой. Максимальный размер — 300 МБ.');
      } else {
        toast('Ошибка создания поста');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/posts/${id}`);
    setFollowed(prev => prev.filter(p => p.id !== id));
    setOthers(prev => prev.filter(p => p.id !== id));
    toast('Пост удалён');
  };

  const handleLike = (id, likes_count) => {
    const update = posts => posts.map(p => p.id === id ? { ...p, likes_count } : p);
    setFollowed(update);
    setOthers(update);
  };

  return (
    <div className="posts-wrap">
      {singlePost ? (
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 14 }}>← Все посты</Link>
        </div>
      ) : (
        <>
          {user ? (
            <form onSubmit={handleSubmit} className="posts-form">
              <textarea
                placeholder="Что происходит?"
                value={form.body}
                onChange={e => setForm({ ...form, body: e.target.value })}
                required
              />
              <div className="posts-form-footer">
                <label className="file-chooser">
                  <input ref={fileInputRef} type="file" multiple onChange={e => { handleFilesChange(Array.from(e.target.files)); e.target.value = ''; }} />
                  <span className="file-chooser-btn">📎 Добавить файлы</span>
                </label>
                <button type="submit" className="btn-post-submit" disabled={loading}>
                  {loading ? 'Публикация...' : 'Опубликовать'}
                </button>
              </div>
              {previews.length > 0 && (
                <div className="preview-list">
                  {previews.map((p, i) => (
                    <div key={i} className="preview-item">
                      {p.isImage ? <img src={p.url} alt={p.name} className="preview-img" />
                        : p.isVideo ? <video src={p.url} className="preview-img" muted />
                        : <div className="preview-file"><span>{p.isAudio ? '🎵' : '📄'}</span><span>{p.name}</span></div>}
                      <button type="button" className="preview-remove" onClick={() => handleFileRemove(i)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          ) : (
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 14 }}>
              <Link to="/login">Войдите</Link> или <Link to="/register">зарегистрируйтесь</Link>, чтобы публиковать посты.
            </div>
          )}
        </>
      )}

      {!singlePost && followed.length > 0 && (
        <>
          <div className="feed-divider">📌 Подписки</div>
          {followed.map(post => (
            <PostCard key={post.id} post={post} user={user} onDelete={handleDelete} onLike={handleLike} />
          ))}
          <div className="feed-divider">🌐 Все посты</div>
        </>
      )}
      {others.map(post => (
        <PostCard key={post.id} post={post} user={user} onDelete={handleDelete} onLike={handleLike} />
      ))}
    </div>
  );
}
