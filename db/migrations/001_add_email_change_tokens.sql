-- Migration: Add email_change_tokens table
-- Description: Creates table for storing email change verification tokens
-- Created: 2024-01-01

-- UP Migration: Create table and indexes
CREATE TABLE IF NOT EXISTS email_change_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email VARCHAR(100) NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_user_id ON email_change_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_expires_at ON email_change_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_token ON email_change_tokens(token);

-- DOWN Migration: Rollback procedure
-- DROP TABLE email_change_tokens CASCADE;