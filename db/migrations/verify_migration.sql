-- Verification script for email_change_tokens migration
-- Run this after applying the migration to verify everything works

-- 1. Check if table exists
SELECT '1. Checking table existence...' as test_step;
SELECT 
    table_name,
    CASE WHEN table_name = 'email_change_tokens' THEN '✓ Table exists' 
         ELSE '✗ Table missing' 
    END as status
FROM information_schema.tables 
WHERE table_name = 'email_change_tokens' AND table_schema = 'public';

-- 2. Check columns
SELECT '2. Checking table columns...' as test_step;
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name = 'id' AND data_type = 'integer' THEN '✓'
        WHEN column_name = 'user_id' AND data_type = 'integer' AND is_nullable = 'NO' THEN '✓'
        WHEN column_name = 'new_email' AND data_type = 'character varying' AND is_nullable = 'NO' THEN '✓'
        WHEN column_name = 'token' AND data_type = 'text' AND is_nullable = 'NO' THEN '✓'
        WHEN column_name = 'expires_at' AND data_type = 'timestamp without time zone' AND is_nullable = 'NO' THEN '✓'
        WHEN column_name = 'created_at' AND data_type = 'timestamp without time zone' THEN '✓'
        ELSE '✗'
    END as validation
FROM information_schema.columns 
WHERE table_name = 'email_change_tokens' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check foreign key constraint
SELECT '3. Checking foreign key constraint...' as test_step;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE WHEN tc.constraint_type = 'FOREIGN KEY' THEN '✓ Foreign key exists'
         ELSE '✗ Foreign key missing'
    END as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_name = 'email_change_tokens' 
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'user_id';

-- 4. Check indexes
SELECT '4. Checking indexes...' as test_step;
SELECT 
    indexname,
    indexdef,
    CASE 
        WHEN indexname LIKE 'idx_email_change_tokens_%' THEN '✓ Index exists'
        ELSE '✗ Index missing'
    END as status
FROM pg_indexes 
WHERE tablename = 'email_change_tokens'
ORDER BY indexname;

-- 5. Test data insertion and retrieval
SELECT '5. Testing data operations...' as test_step;

-- Insert test data
INSERT INTO email_change_tokens (user_id, new_email, token, expires_at) 
VALUES 
    (1, 'test1@example.com', 'test-token-1', NOW() + INTERVAL '24 hours'),
    (2, 'test2@example.com', 'test-token-2', NOW() + INTERVAL '12 hours')
ON CONFLICT (token) DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as inserted_count FROM email_change_tokens WHERE token LIKE 'test-token-%';

-- Test UNIQUE constraint on token
SELECT '6. Testing UNIQUE constraint...' as test_step;
BEGIN;
    -- This should fail due to duplicate token
    INSERT INTO email_change_tokens (user_id, new_email, token, expires_at) 
    VALUES (1, 'test3@example.com', 'test-token-1', NOW() + INTERVAL '24 hours');
    
    -- If we get here, the constraint failed
    ROLLBACK;
    SELECT '✗ UNIQUE constraint not working' as status;
EXCEPTION WHEN unique_violation THEN
    ROLLBACK;
    SELECT '✓ UNIQUE constraint working correctly' as status;
END;

-- 7. Clean up test data
SELECT '7. Cleaning up test data...' as test_step;
DELETE FROM email_change_tokens WHERE token LIKE 'test-token-%';
SELECT COUNT(*) as remaining_test_data FROM email_change_tokens WHERE token LIKE 'test-token-%';

-- 8. Final summary
SELECT '8. Migration verification complete!' as final_step;
SELECT 
    'email_change_tokens table migration' as migration,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_change_tokens') 
        THEN 'SUCCESS' 
        ELSE 'FAILED' 
    END as status,
    NOW() as verified_at;