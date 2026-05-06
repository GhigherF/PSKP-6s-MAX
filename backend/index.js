require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Pool } = require('pg');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { WebSocketServer } = require('ws');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(express.json());

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

const pool = new Pool({
  host: process.env.PGHOST || 'postgres',
  port: 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'microblog',
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 300 * 1024 * 1024 } });

function handleMulterError(err, req, res, next) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Файл слишком большой. Максимальный размер — 300 МБ.' });
  }
  next(err);
}

function resolveFileType(mime) {
  if (mime === 'image/gif') return 'gif';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('application/')) return 'document';
  return 'other';
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// clients: Map<postId, Set<ws>>
const roomClients = new Map();

function broadcast(postId, data) {
  const room = roomClients.get(postId);
  if (!room) return;
  const msg = JSON.stringify(data);
  room.forEach(ws => { if (ws.readyState === 1) ws.send(msg); });
}

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.replace('/ws?', ''));
  const postId = parseInt(params.get('postId'));
  if (!postId) { ws.close(); return; }

  if (!roomClients.has(postId)) roomClients.set(postId, new Set());
  roomClients.get(postId).add(ws);

  ws.on('close', () => {
    const room = roomClients.get(postId);
    if (room) { room.delete(ws); if (!room.size) roomClients.delete(postId); }
  });
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.post('/auth/register', async (req, res) => {
  const { nick, email, password } = req.body;
  if (!nick || !email || !password)
    return res.status(400).json({ error: 'nick, email и password обязательны' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Пароль минимум 6 символов' });
  try {
    const hashed_password = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (nick, email, hashed_password, salt, role)
       VALUES ($1, $2, $3, '', 'user') RETURNING id, nick, email, role, created_at`,
      [nick.trim(), email.trim().toLowerCase(), hashed_password]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const field = err.detail?.includes('nick') ? 'nick' : 'email';
      return res.status(409).json({ error: `Пользователь с таким ${field} уже существует` });
    }
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'email и password обязательны' });
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.trim().toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });
    const valid = await bcrypt.compare(password, user.hashed_password);
    if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' });
    const token = jwt.sign(
      { user_id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({ token, user: { id: user.id, nick: user.nick, email: user.email, role: user.role, avatar_url: user.avatar_url } });
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nick, email, role, avatar_url, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// ─── POSTS ────────────────────────────────────────────────────────────────────

async function enrichPosts(posts, viewerId) {
  if (!posts.length) return [];
  const postIds = posts.map(p => p.id);

  const { rows: files } = await pool.query(
    'SELECT * FROM post_files WHERE post_id = ANY($1)', [postIds]
  );
  const { rows: likesRows } = await pool.query(
    'SELECT post_id, COUNT(*) AS cnt FROM likes_posts WHERE post_id = ANY($1) GROUP BY post_id', [postIds]
  );
  const { rows: commentsRows } = await pool.query(
    'SELECT post_id, COUNT(*) AS cnt FROM comments WHERE post_id = ANY($1) AND deleted = FALSE GROUP BY post_id', [postIds]
  );
  const { rows: viewsRows } = await pool.query(
    'SELECT post_id, COUNT(*) AS cnt FROM post_views WHERE post_id = ANY($1) GROUP BY post_id', [postIds]
  );

  let myLikes = new Set();
  if (viewerId) {
    const { rows } = await pool.query(
      'SELECT post_id FROM likes_posts WHERE user_id = $1 AND post_id = ANY($2)', [viewerId, postIds]
    );
    myLikes = new Set(rows.map(r => r.post_id));
  }

  const filesMap = {}, likesMap = {}, commentsMap = {}, viewsMap = {};
  files.forEach(f => { if (!filesMap[f.post_id]) filesMap[f.post_id] = []; filesMap[f.post_id].push(f); });
  likesRows.forEach(r => { likesMap[r.post_id] = parseInt(r.cnt); });
  commentsRows.forEach(r => { commentsMap[r.post_id] = parseInt(r.cnt); });
  viewsRows.forEach(r => { viewsMap[r.post_id] = parseInt(r.cnt); });

  return posts.map(p => ({
    ...p,
    files: filesMap[p.id] || [],
    likes_count: likesMap[p.id] || 0,
    comments_count: commentsMap[p.id] || 0,
    views_count: viewsMap[p.id] || 0,
    liked_by_me: myLikes.has(p.id),
  }));
}

app.get('/posts', async (req, res) => {
  try {
    const viewerId = req.headers['authorization']
      ? (() => { try { return jwt.verify(req.headers['authorization'].slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
      : null;

    // ID просмотренных постов из query-параметра (comma-separated)
    const viewedIds = (req.query.viewed || '').split(',').map(Number).filter(Boolean);

    let followedIds = [];
    if (viewerId) {
      const { rows } = await pool.query(
        'SELECT followee_id FROM subscriptions WHERE follower_id = $1', [viewerId]
      );
      followedIds = rows.map(r => r.followee_id);
    }

    const { rows: posts } = await pool.query(
      `SELECT p.*, u.nick AS username, u.avatar_url AS user_avatar
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.deleted = FALSE
       ORDER BY p.created_at DESC`
    );

    const enriched = await enrichPosts(posts, viewerId);

    // Сортировка по лайкам убывающе, просмотренные в конец
    const sortByLikes = (arr) => {
      const unseen = arr.filter(p => !viewedIds.includes(p.id));
      const seen = arr.filter(p => viewedIds.includes(p.id));
      unseen.sort((a, b) => b.likes_count - a.likes_count);
      seen.sort((a, b) => b.likes_count - a.likes_count);
      return [...unseen, ...seen];
    };

    if (followedIds.length) {
      const followed = sortByLikes(enriched.filter(p => followedIds.includes(p.user_id)));
      const others = sortByLikes(enriched.filter(p => !followedIds.includes(p.user_id)));
      return res.json({ followed, others });
    }

    res.json({ followed: [], others: sortByLikes(enriched) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /posts/:id
app.get('/posts/:id', async (req, res) => {
  try {
    const viewerId = req.headers['authorization']
      ? (() => { try { return jwt.verify(req.headers['authorization'].slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
      : null;
    const { rows } = await pool.query(
      `SELECT p.*, u.nick AS username, u.avatar_url AS user_avatar
       FROM posts p JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.deleted = FALSE`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Пост не найден' });
    const [enriched] = await enrichPosts(rows, viewerId);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/posts', authMiddleware, upload.array('files', 20), handleMulterError, async (req, res) => {
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'body обязателен' });
  const user_id = req.user.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'INSERT INTO posts (user_id, body) VALUES ($1, $2) RETURNING *',
      [user_id, body]
    );
    const post = rows[0];
    const savedFiles = [];
    for (const file of req.files || []) {
      const { rows: fr } = await client.query(
        `INSERT INTO post_files (post_id, file_url, file_type, original_name, mime_type, size_bytes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [post.id, `/uploads/${file.filename}`, resolveFileType(file.mimetype),
         file.originalname, file.mimetype, file.size]
      );
      savedFiles.push(fr[0]);
    }
    await client.query('COMMIT');
    res.status(201).json({ ...post, files: savedFiles });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// DELETE /posts/:id
app.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Пост не найден' });
    const post = rows[0];
    const byAdmin = req.user.role === 'admin' && post.user_id !== req.user.id;
    if (req.user.role !== 'admin' && post.user_id !== req.user.id)
      return res.status(403).json({ error: 'Нет доступа' });
    await pool.query('UPDATE posts SET deleted = TRUE, deleted_by_admin = $1 WHERE id = $2', [byAdmin, req.params.id]);
    if (byAdmin) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'post_deleted_by_admin', $2)`,
        [post.user_id, `Ваш пост «${post.body.slice(0, 60)}${post.body.length > 60 ? '...' : ''}» был удалён администратором.`]
      );
    }
    res.json({ ok: true, deleted_by_admin: byAdmin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── VIEWS ────────────────────────────────────────────────────────────────────

// POST /posts/:id/view — отметить пост просмотренным
app.post('/posts/:id/view', authMiddleware, async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'INSERT INTO post_views (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, req.user.id]
    );
    if (rowCount > 0) {
      const { rows } = await pool.query(
        'SELECT COUNT(*) AS cnt FROM post_views WHERE post_id = $1', [req.params.id]
      );
      broadcast(parseInt(req.params.id), { type: 'view', post_id: parseInt(req.params.id), views_count: parseInt(rows[0].cnt) });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── LIKES ────────────────────────────────────────────────────────────────────

// POST /posts/:id/like — toggle лайк поста
app.post('/posts/:id/like', authMiddleware, async (req, res) => {
  const post_id = parseInt(req.params.id);
  const user_id = req.user.id;
  try {
    const { rows } = await pool.query(
      'SELECT id FROM likes_posts WHERE post_id = $1 AND user_id = $2', [post_id, user_id]
    );
    let liked;
    if (rows.length) {
      await pool.query('DELETE FROM likes_posts WHERE post_id = $1 AND user_id = $2', [post_id, user_id]);
      liked = false;
    } else {
      await pool.query('INSERT INTO likes_posts (post_id, user_id) VALUES ($1, $2)', [post_id, user_id]);
      liked = true;
    }
    const { rows: cnt } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM likes_posts WHERE post_id = $1', [post_id]
    );
    const likes_count = parseInt(cnt[0].cnt);
    broadcast(post_id, { type: 'like', post_id, likes_count });
    res.json({ liked, likes_count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /comments/:id/like — toggle лайк комментария
app.post('/comments/:id/like', authMiddleware, async (req, res) => {
  const comment_id = parseInt(req.params.id);
  const user_id = req.user.id;
  try {
    const { rows: commentRows } = await pool.query('SELECT post_id FROM comments WHERE id = $1', [comment_id]);
    if (!commentRows.length) return res.status(404).json({ error: 'Комментарий не найден' });
    const post_id = commentRows[0].post_id;

    const { rows } = await pool.query(
      'SELECT id FROM likes_comments WHERE comment_id = $1 AND user_id = $2', [comment_id, user_id]
    );
    let liked;
    if (rows.length) {
      await pool.query('DELETE FROM likes_comments WHERE comment_id = $1 AND user_id = $2', [comment_id, user_id]);
      liked = false;
    } else {
      await pool.query('INSERT INTO likes_comments (comment_id, user_id) VALUES ($1, $2)', [comment_id, user_id]);
      liked = true;
    }
    const { rows: cnt } = await pool.query(
      'SELECT COUNT(*) AS cnt FROM likes_comments WHERE comment_id = $1', [comment_id]
    );
    const likes_count = parseInt(cnt[0].cnt);
    broadcast(post_id, { type: 'comment_like', comment_id, likes_count });
    res.json({ liked, likes_count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

// GET /posts/:id/comments
app.get('/posts/:id/comments', async (req, res) => {
  try {
    const viewerId = req.headers['authorization']
      ? (() => { try { return jwt.verify(req.headers['authorization'].slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
      : null;

    const { rows: comments } = await pool.query(
      `SELECT c.*, u.nick AS username, u.avatar_url AS user_avatar
       FROM comments c JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    const ids = comments.map(c => c.id);
    let myLikes = new Set();
    const likesMap = {};
    if (ids.length) {
      const { rows: lc } = await pool.query(
        'SELECT comment_id, COUNT(*) AS cnt FROM likes_comments WHERE comment_id = ANY($1) GROUP BY comment_id', [ids]
      );
      lc.forEach(r => { likesMap[r.comment_id] = parseInt(r.cnt); });
      if (viewerId) {
        const { rows: ml } = await pool.query(
          'SELECT comment_id FROM likes_comments WHERE user_id = $1 AND comment_id = ANY($2)', [viewerId, ids]
        );
        myLikes = new Set(ml.map(r => r.comment_id));
      }
    }

    res.json(comments.map(c => ({
      ...c,
      likes_count: likesMap[c.id] || 0,
      liked_by_me: myLikes.has(c.id),
    })).sort((a, b) => {
      // top-level сортируем по лайкам, replies тоже по лайкам
      if (a.parent_id === b.parent_id) return b.likes_count - a.likes_count;
      return 0;
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /posts/:id/comments
app.post('/posts/:id/comments', authMiddleware, async (req, res) => {
  const { body, parent_id } = req.body;
  if (!body) return res.status(400).json({ error: 'body обязателен' });
  const post_id = parseInt(req.params.id);
  try {
    const { rows } = await pool.query(
      `INSERT INTO comments (post_id, user_id, body, parent_id) VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [post_id, req.user.id, body, parent_id || null]
    );
    const comment = rows[0];
    const { rows: uRows } = await pool.query(
      'SELECT nick, avatar_url FROM users WHERE id = $1', [req.user.id]
    );
    const full = { ...comment, username: uRows[0].nick, user_avatar: uRows[0].avatar_url, likes_count: 0, liked_by_me: false };
    broadcast(post_id, { type: 'comment', comment: full });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /comments/:id
app.delete('/comments/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Комментарий не найден' });
    const comment = rows[0];
    if (req.user.role === 'admin' && comment.user_id !== req.user.id) {
      await pool.query('UPDATE comments SET deleted = TRUE, deleted_by_admin = TRUE WHERE id = $1', [req.params.id]);
      broadcast(comment.post_id, { type: 'comment_deleted', comment_id: comment.id, deleted_by_admin: true });
      await pool.query(
        `INSERT INTO notifications (user_id, type, message) VALUES ($1, 'comment_deleted_by_admin', $2)`,
        [comment.user_id, `Ваш комментарий «${comment.body.slice(0, 60)}${comment.body.length > 60 ? '...' : ''}» был удалён администратором.`]
      );
    } else if (comment.user_id === req.user.id) {
      await pool.query('UPDATE comments SET deleted = TRUE WHERE id = $1', [req.params.id]);
      broadcast(comment.post_id, { type: 'comment_deleted', comment_id: comment.id, deleted_by_admin: false });
    } else {
      return res.status(403).json({ error: 'Нет доступа' });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

app.get('/notifications', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/notifications/read', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/notifications/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────

// POST /users/:id/subscribe — toggle подписка
app.post('/users/:id/subscribe', authMiddleware, async (req, res) => {
  const followee_id = parseInt(req.params.id);
  const follower_id = req.user.id;
  if (followee_id === follower_id) return res.status(400).json({ error: 'Нельзя подписаться на себя' });
  try {
    const { rows } = await pool.query(
      'SELECT id FROM subscriptions WHERE follower_id = $1 AND followee_id = $2', [follower_id, followee_id]
    );
    if (rows.length) {
      await pool.query('DELETE FROM subscriptions WHERE follower_id = $1 AND followee_id = $2', [follower_id, followee_id]);
      res.json({ subscribed: false });
    } else {
      await pool.query('INSERT INTO subscriptions (follower_id, followee_id) VALUES ($1, $2)', [follower_id, followee_id]);
      res.json({ subscribed: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── USERS ────────────────────────────────────────────────────────────────────

// GET /users — список всех пользователей
app.get('/users', async (req, res) => {
  try {
    const viewerId = req.headers['authorization']
      ? (() => { try { return jwt.verify(req.headers['authorization'].slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
      : null;

    const { rows } = await pool.query(
      'SELECT id, nick, role, avatar_url FROM users WHERE role != $1 ORDER BY created_at ASC',
      ['admin']
    );

    if (viewerId) {
      const { rows: subs } = await pool.query(
        'SELECT followee_id FROM subscriptions WHERE follower_id = $1', [viewerId]
      );
      const followingSet = new Set(subs.map(r => r.followee_id));
      return res.json(rows.map(u => ({ ...u, is_following: followingSet.has(u.id) })));
    }

    res.json(rows.map(u => ({ ...u, is_following: false })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/:id', async (req, res) => {
  try {
    const viewerId = req.headers['authorization']
      ? (() => { try { return jwt.verify(req.headers['authorization'].slice(7), process.env.JWT_SECRET).user_id; } catch { return null; } })()
      : null;

    const { rows } = await pool.query(
      'SELECT id, nick, email, role, avatar_url, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Пользователь не найден' });
    const user = rows[0];

    // Статистика
    const { rows: s } = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM posts WHERE user_id = $1 AND deleted = FALSE) AS posts_count,
        (SELECT COUNT(*) FROM comments WHERE user_id = $1 AND deleted = FALSE) AS comments_count,
        (SELECT COUNT(*) FROM likes_posts lp JOIN posts p ON lp.post_id = p.id WHERE p.user_id = $1) AS received_post_likes,
        (SELECT COUNT(*) FROM likes_comments lc JOIN comments c ON lc.comment_id = c.id WHERE c.user_id = $1) AS received_comment_likes,
        (SELECT COUNT(*) FROM post_views pv JOIN posts p ON pv.post_id = p.id WHERE p.user_id = $1) AS received_views,
        (SELECT COUNT(*) FROM subscriptions WHERE followee_id = $1) AS followers_count,
        (SELECT COUNT(*) FROM subscriptions WHERE follower_id = $1) AS following_count
    `, [req.params.id]);

    let is_following = false;
    if (viewerId && viewerId !== parseInt(req.params.id)) {
      const { rows: sub } = await pool.query(
        'SELECT id FROM subscriptions WHERE follower_id = $1 AND followee_id = $2', [viewerId, req.params.id]
      );
      is_following = sub.length > 0;
    }

    res.json({ ...user, ...s[0], is_following });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /users/me — обновить ник, email и/или аватарку
app.patch('/users/me', authMiddleware, upload.single('avatar'), handleMulterError, async (req, res) => {
  try {
    const { nick, email } = req.body;
    let avatar_url;
    if (req.file) avatar_url = `/uploads/${req.file.filename}`;

    const fields = [];
    const vals = [];
    if (nick) { fields.push(`nick = $${fields.length + 1}`); vals.push(nick.trim()); }
    if (email) { fields.push(`email = $${fields.length + 1}`); vals.push(email.trim().toLowerCase()); }
    if (avatar_url) { fields.push(`avatar_url = $${fields.length + 1}`); vals.push(avatar_url); }
    if (!fields.length) return res.status(400).json({ error: 'Нечего обновлять' });

    vals.push(req.user.id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${vals.length} RETURNING id, nick, email, role, avatar_url, created_at`,
      vals
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      const field = err.detail?.includes('nick') ? 'Никнейм' : 'Email';
      return res.status(409).json({ error: `${field} уже занят` });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id/comments — комментарии пользователя
app.get('/users/:id/comments', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, p.body AS post_body
       FROM comments c JOIN posts p ON c.post_id = p.id
       WHERE c.user_id = $1 AND c.deleted = FALSE
       ORDER BY c.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id/activity — активность по дням за последние 30 дней
app.get('/users/:id/activity', async (req, res) => {
  try {
    const uid = req.params.id;
    const { rows: posts } = await pool.query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS cnt FROM posts WHERE user_id=$1 AND deleted=FALSE AND created_at > NOW()-INTERVAL '30 days' GROUP BY day`, [uid]
    );
    const { rows: comments } = await pool.query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS cnt FROM comments WHERE user_id=$1 AND deleted=FALSE AND created_at > NOW()-INTERVAL '30 days' GROUP BY day`, [uid]
    );
    const { rows: likes } = await pool.query(
      `SELECT DATE(lp.created_at) AS day, COUNT(*) AS cnt FROM likes_posts lp JOIN posts p ON lp.post_id=p.id WHERE p.user_id=$1 AND lp.created_at > NOW()-INTERVAL '30 days' GROUP BY day`, [uid]
    );
    const { rows: views } = await pool.query(
      `SELECT DATE(pv.created_at) AS day, COUNT(*) AS cnt FROM post_views pv JOIN posts p ON pv.post_id=p.id WHERE p.user_id=$1 AND pv.created_at > NOW()-INTERVAL '30 days' GROUP BY day`, [uid]
    );
    res.json({ posts, comments, likes, views });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /users/:id/views — просмотренные посты
app.get('/users/:id/views', authMiddleware, async (req, res) => {
  if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin')
    return res.status(403).json({ error: 'Нет доступа' });
  try {
    const { rows: viewRows } = await pool.query(
      `SELECT pv.viewed_at, p.*, u.nick AS username, u.avatar_url AS user_avatar
       FROM post_views pv
       JOIN posts p ON pv.post_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE pv.user_id = $1 AND p.deleted = FALSE
       ORDER BY pv.viewed_at DESC`,
      [req.params.id]
    );
    const enriched = await enrichPosts(viewRows, req.user.id);
    res.json(enriched.map((p, i) => ({ ...p, viewed_at: viewRows[i].viewed_at })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Backend запущен на порту ${PORT}`));
