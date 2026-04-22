-- SPRINT 3 Migration: Update credentials table for automatic generation
-- Run this in Supabase SQL Editor

-- Add new columns to credentials table
ALTER TABLE credentials 
ADD COLUMN IF NOT EXISTS user_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS type VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS credential_data JSONB,
ADD COLUMN IF NOT EXISTS blockchain_tx_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS blockchain_address VARCHAR(255),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS error VARCHAR(500),
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS revocation_reason VARCHAR(255);

-- Make commitment_hash nullable (for new credentials)
ALTER TABLE credentials 
ALTER COLUMN commitment_hash DROP NOT NULL;

-- Add columns to kyc_verifications for credential tracking
ALTER TABLE kyc_verifications
ADD COLUMN IF NOT EXISTS credential_id UUID REFERENCES credentials(id),
ADD COLUMN IF NOT EXISTS credential_status VARCHAR(50);

-- Create user_documents table for SPRINT 4
CREATE TABLE IF NOT EXISTS user_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Encryption info
  encryption_key_hash VARCHAR(255),
  iv VARCHAR(255),
  auth_tag VARCHAR(255),
  
  -- Storage
  storage_location VARCHAR(50) DEFAULT 'local',
  cloud_url VARCHAR(500),
  
  -- Metadata
  uploaded_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP,
  expires_at TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'local',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_hash VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for user_documents
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_status ON user_documents(status);

-- Update credentials table indexes
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON credentials(type);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON credentials(status);

-- Grant permissions
GRANT ALL ON user_documents TO service_role;
GRANT SELECT ON user_documents TO anon;

-- Update trigger for credentials
CREATE OR REPLACE FUNCTION update_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_credentials_updated_at ON credentials;
CREATE TRIGGER update_credentials_updated_at
  BEFORE UPDATE ON credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_credentials_updated_at();

-- Update trigger for user_documents
CREATE OR REPLACE FUNCTION update_user_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_documents_updated_at ON user_documents;
CREATE TRIGGER update_user_documents_updated_at
  BEFORE UPDATE ON user_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_user_documents_updated_at();
