-- RBAC System Migration
-- Adds role-based access control tables and columns to Ownly database
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Add role column to users table (or create if doesn't exist)
-- ============================================

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  supabase_user_id UUID UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'active'
);

-- Add role column with default value and constraint
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

-- Add constraint to validate role values
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE users 
ADD CONSTRAINT valid_role CHECK (role IN ('user', 'business', 'admin'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================
-- 2. Link API keys to users
-- ============================================

-- Add user_id foreign key to api_keys table
ALTER TABLE api_keys 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- ============================================
-- 3. Create role_change_log table
-- ============================================

CREATE TABLE IF NOT EXISTS role_change_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  old_role VARCHAR(20),
  new_role VARCHAR(20),
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_log_user ON role_change_log(user_id);
CREATE INDEX IF NOT EXISTS idx_role_log_date ON role_change_log(created_at);
CREATE INDEX IF NOT EXISTS idx_role_log_changed_by ON role_change_log(changed_by);

-- ============================================
-- 4. Create access_control_log table
-- ============================================

CREATE TABLE IF NOT EXISTS access_control_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_role VARCHAR(20),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  access_granted BOOLEAN,
  reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_access_log_user ON access_control_log(user_id);
CREATE INDEX IF NOT EXISTS idx_access_log_date ON access_control_log(created_at);
CREATE INDEX IF NOT EXISTS idx_access_log_denied ON access_control_log(access_granted) WHERE access_granted = false;
CREATE INDEX IF NOT EXISTS idx_access_log_endpoint ON access_control_log(endpoint);

-- ============================================
-- 5. Create updated_at trigger for users table
-- ============================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. Grant permissions
-- ============================================

-- Grant permissions to service_role
GRANT ALL ON users TO service_role;
GRANT ALL ON role_change_log TO service_role;
GRANT ALL ON access_control_log TO service_role;

-- Grant read permissions to anon (for authenticated queries)
GRANT SELECT ON users TO anon;
GRANT SELECT ON role_change_log TO anon;
GRANT SELECT ON access_control_log TO anon;

-- ============================================
-- 7. Comments for documentation
-- ============================================

COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON COLUMN users.role IS 'User role: user, business, or admin';
COMMENT ON COLUMN users.status IS 'Account status: active, inactive, or suspended';

COMMENT ON TABLE role_change_log IS 'Audit log for role changes';
COMMENT ON COLUMN role_change_log.changed_by IS 'Admin user who made the change';

COMMENT ON TABLE access_control_log IS 'Security log for access control decisions';
COMMENT ON COLUMN access_control_log.access_granted IS 'Whether access was granted or denied';

-- ============================================
-- Migration complete
-- ============================================

-- Verify tables exist
SELECT 
  'users' as table_name, 
  COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'users'
UNION ALL
SELECT 
  'role_change_log' as table_name, 
  COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'role_change_log'
UNION ALL
SELECT 
  'access_control_log' as table_name, 
  COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'access_control_log';
