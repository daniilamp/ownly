-- Migration: Add ownly_id column to kyc_verifications table
-- Purpose: Fix Ownly ID verification inconsistency bug
-- Date: 2024
-- Related Spec: ownly-id-verification-fix

-- Add ownly_id column (nullable to support existing records)
ALTER TABLE kyc_verifications 
ADD COLUMN IF NOT EXISTS ownly_id VARCHAR(255);

-- Create index on ownly_id for query performance
CREATE INDEX IF NOT EXISTS idx_kyc_ownly_id ON kyc_verifications(ownly_id);

-- Backfill existing records where external_user_id matches Ownly ID format (ow_*)
UPDATE kyc_verifications
SET ownly_id = external_user_id
WHERE external_user_id ~ '^ow_[A-Z0-9]+$'
  AND ownly_id IS NULL;

-- Add comment to document the column purpose
COMMENT ON COLUMN kyc_verifications.ownly_id IS 'Ownly ID in format ow_XXXXX - used for identity verification queries';
