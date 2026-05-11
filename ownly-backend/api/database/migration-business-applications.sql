-- Business Applications Migration
-- Adds the business_applications table for the Business Portal registration lifecycle
-- Run this in Supabase SQL Editor

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Create business_applications table
-- ============================================

CREATE TABLE IF NOT EXISTS business_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name VARCHAR(200) NOT NULL,
  company_website VARCHAR(500),
  contact_email VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  use_case TEXT NOT NULL,
  expected_monthly_volume INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. Create indexes
-- ============================================

-- Index on status for efficient filtering of pending/approved/rejected applications
CREATE INDEX IF NOT EXISTS idx_business_applications_status 
  ON business_applications(status);

-- Index on contact_email for lookups by email
CREATE INDEX IF NOT EXISTS idx_business_applications_email 
  ON business_applications(contact_email);

-- Unique partial index: only one pending application per email
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_email 
  ON business_applications(contact_email) 
  WHERE status = 'pending';

-- ============================================
-- 3. Auto-update updated_at trigger
-- ============================================

-- The update_updated_at_column() function already exists from previous migrations.
-- Create trigger for business_applications table.
DROP TRIGGER IF EXISTS update_business_applications_updated_at ON business_applications;

CREATE TRIGGER update_business_applications_updated_at
  BEFORE UPDATE ON business_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Grant permissions
-- ============================================

GRANT ALL ON business_applications TO service_role;
GRANT SELECT ON business_applications TO anon;

-- ============================================
-- 5. Comments for documentation
-- ============================================

COMMENT ON TABLE business_applications IS 'Business registration applications for API access';
COMMENT ON COLUMN business_applications.status IS 'Application status: pending, approved, or rejected';
COMMENT ON COLUMN business_applications.reviewed_by IS 'Admin user who reviewed the application (FK to users.id)';
COMMENT ON COLUMN business_applications.rejection_reason IS 'Reason provided by admin when rejecting an application';

-- ============================================
-- Migration complete - Verify
-- ============================================

SELECT 
  'business_applications' as table_name, 
  COUNT(*) as column_count 
FROM information_schema.columns 
WHERE table_name = 'business_applications';
