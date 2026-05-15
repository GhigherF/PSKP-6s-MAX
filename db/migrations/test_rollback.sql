-- Test rollback procedure for email_change_tokens table
-- This script tests that the rollback works correctly

-- First, verify the table exists
SELECT 'Checking if email_change_tokens table exists...' as status;
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_name = 'email_change_tokens' AND table_schema = 'public';

-- Check indexes
SELECT 'Checking indexes on email_change_tokens table...' as status;
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'email_change_tokens' ORDER BY indexname;

-- Test data insertion (optional - for verification)
SELECT 'Testing data insertion...' as status;
INSERT INTO email_change_tokens (user_id, new_email, token, expires_at) 
VALUES (1, 'test@example.com', 'test-token-123', NOW() + INTERVAL '24 hours')
RETURNING id, user_id, new_email, token, expires_at, created_at;

-- Clean up test data
DELETE FROM email_change_tokens WHERE token = 'test-token-123';

-- Rollback test (comment out when not testing)
-- DROP INDEX IF EXISTS idx_email_change_tokens_user_id;
-- DROP INDEX IF EXISTS idx_email_change_tokens_expires_at;
-- DROP INDEX IF EXISTS idx_email_change_tokens_token;
-- DROP TABLE IF EXISTS email_change_tokens CASCADE;