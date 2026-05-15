# Database Migrations

This directory contains database migration scripts for the application.

## Current Migrations

### 001_add_email_change_tokens.sql
- **Purpose**: Creates `email_change_tokens` table for email change verification
- **Table Schema**:
  - `id` (SERIAL PRIMARY KEY)
  - `user_id` (INTEGER, REFERENCES users(id) ON DELETE CASCADE)
  - `new_email` (VARCHAR(100), NOT NULL)
  - `token` (TEXT, NOT NULL, UNIQUE)
  - `expires_at` (TIMESTAMP, NOT NULL)
  - `created_at` (TIMESTAMP, DEFAULT NOW())
- **Indexes**:
  - `idx_email_change_tokens_user_id` (user_id)
  - `idx_email_change_tokens_expires_at` (expires_at)
  - `idx_email_change_tokens_token` (token)

## Usage

### Applying Migrations
Migrations are automatically applied via the `db/init.sql` file which is mounted to the PostgreSQL container's initialization directory.

### Manual Application
To manually apply a migration:

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d microblog

# Run migration
\i db/migrations/001_add_email_change_tokens.sql
```

### Testing Rollback
To test rollback procedure:

```bash
# Run test script
psql -h localhost -U postgres -d microblog -f db/migrations/test_rollback.sql

# Or manually rollback
DROP INDEX IF EXISTS idx_email_change_tokens_user_id;
DROP INDEX IF EXISTS idx_email_change_tokens_expires_at;
DROP INDEX IF EXISTS idx_email_change_tokens_token;
DROP TABLE IF EXISTS email_change_tokens CASCADE;
```

### Verification
To verify migration was applied correctly:

```bash
psql -h localhost -U postgres -d microblog -f db/migrations/verify_migration.sql
```

## Migration Guidelines

1. **Idempotency**: All migrations should be idempotent (can be run multiple times)
2. **Rollback**: Include rollback instructions in comments
3. **Testing**: Create verification scripts for important migrations
4. **Documentation**: Update this README with new migrations
5. **Backup**: Always backup database before applying migrations in production

## Database Initialization
The main initialization script is `db/init.sql` which:
- Creates all tables with `IF NOT EXISTS` clauses
- Adds sample data for development
- Includes conditional migrations for existing databases
- Is automatically executed when PostgreSQL container starts