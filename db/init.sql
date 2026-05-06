-- db/init.sql

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  nick            VARCHAR(50)  UNIQUE NOT NULL,
  email           VARCHAR(100) UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL DEFAULT '',
  salt            TEXT NOT NULL DEFAULT '',
  role            VARCHAR(10)  NOT NULL DEFAULT 'user',
  avatar_url      TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS posts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  deleted    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_files (
  id            SERIAL PRIMARY KEY,
  post_id       INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  file_url      TEXT NOT NULL,
  file_type     VARCHAR(20) NOT NULL DEFAULT 'other',
  original_name TEXT NOT NULL DEFAULT '',
  mime_type     VARCHAR(100) NOT NULL DEFAULT '',
  size_bytes    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id             SERIAL PRIMARY KEY,
  post_id        INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id      INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  body           TEXT NOT NULL,
  deleted        BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_by_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS likes_posts (
  id         SERIAL PRIMARY KEY,
  post_id    INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS likes_comments (
  id         SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id          SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);

CREATE TABLE IF NOT EXISTS post_views (
  id        SERIAL PRIMARY KEY,
  post_id   INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

INSERT INTO users (nick, email, hashed_password, salt, role) VALUES
  ('alice', 'alice@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '', 'admin'),
  ('bob',   'bob@example.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '', 'user')
ON CONFLICT DO NOTHING;

-- Migration: add parent_id to comments if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='comments' AND column_name='parent_id') THEN
    ALTER TABLE comments ADD COLUMN parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(50) NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='deleted_by_admin') THEN
    ALTER TABLE posts ADD COLUMN deleted_by_admin BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
END $$;

INSERT INTO posts (user_id, body) VALUES
  (1, 'Hello from Alice!'),
  (2, 'Hello from Bob!')
ON CONFLICT DO NOTHING;
