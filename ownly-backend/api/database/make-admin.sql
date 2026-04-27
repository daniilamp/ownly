-- Make danilamp@dlminvesting.com an ADMIN user
-- Run this script in Supabase SQL Editor

-- Simple approach: Update or insert the user with admin role

-- If user exists, update role to admin
UPDATE users 
SET role = 'admin', 
    updated_at = NOW()
WHERE email = 'danilamp@dlminvesting.com';

-- If user doesn't exist, create them with admin role
INSERT INTO users (email, role, status, created_at)
SELECT 
  'danilamp@dlminvesting.com',
  'admin',
  'active',
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'danilamp@dlminvesting.com'
);

-- Verify the change
SELECT id, email, role, status, created_at, updated_at
FROM users
WHERE email = 'danilamp@dlminvesting.com';
