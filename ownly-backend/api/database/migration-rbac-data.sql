-- RBAC Data Migration
-- Creates user records for existing Supabase auth users and links API keys
-- Run AFTER migration-rbac-schema.sql

-- ============================================
-- 1. Create users for existing Supabase auth accounts
-- ============================================

-- Insert users from Supabase auth.users that don't exist in our users table
-- Default role is 'user' for all existing accounts
INSERT INTO users (email, supabase_user_id, role, status, created_at)
SELECT 
  au.email,
  au.id AS supabase_user_id,
  'user' AS role,
  'active' AS status,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.supabase_user_id = au.id
)
ON CONFLICT (email) DO UPDATE SET
  supabase_user_id = EXCLUDED.supabase_user_id
WHERE users.supabase_user_id IS NULL;

-- ============================================
-- 2. Create business users for existing API keys
-- ============================================

-- For each API key that doesn't have a linked user, create a business user
-- Uses client_name and contact_email from api_keys table
DO $$
DECLARE
  key_record RECORD;
  new_user_id UUID;
BEGIN
  FOR key_record IN 
    SELECT id, client_id, client_name, contact_email
    FROM api_keys
    WHERE user_id IS NULL
  LOOP
    -- Check if user already exists with this email
    IF key_record.contact_email IS NOT NULL THEN
      SELECT id INTO new_user_id
      FROM users
      WHERE email = key_record.contact_email;
      
      IF new_user_id IS NULL THEN
        -- Create new business user
        INSERT INTO users (email, role, status)
        VALUES (key_record.contact_email, 'business', 'active')
        RETURNING id INTO new_user_id;
      ELSE
        -- Update existing user to business role if they have an API key
        UPDATE users SET role = 'business' WHERE id = new_user_id AND role = 'user';
      END IF;
      
      -- Link API key to user
      UPDATE api_keys SET user_id = new_user_id WHERE id = key_record.id;
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 3. Verify migration results
-- ============================================

-- Show user counts by role
SELECT role, COUNT(*) as count
FROM users
GROUP BY role
ORDER BY role;

-- Show API keys with linked users
SELECT 
  ak.client_name,
  ak.status,
  u.email,
  u.role
FROM api_keys ak
LEFT JOIN users u ON ak.user_id = u.id
ORDER BY ak.created_at DESC;

-- Show any API keys still without users
SELECT id, client_name, client_id
FROM api_keys
WHERE user_id IS NULL;
