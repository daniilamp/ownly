-- Ownly KYC Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: kyc_verifications
CREATE TABLE kyc_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  applicant_id VARCHAR(255) UNIQUE NOT NULL,
  external_user_id VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  review_answer VARCHAR(50),
  review_reject_type VARCHAR(100),
  reject_labels TEXT[],
  document_type VARCHAR(50),
  document_number VARCHAR(100),
  date_of_birth DATE,
  expiry_date DATE,
  country VARCHAR(3),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  inspection_id VARCHAR(255),
  correlation_id VARCHAR(255)
);

-- Table: credentials
CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kyc_id UUID REFERENCES kyc_verifications(id) ON DELETE CASCADE,
  commitment_hash VARCHAR(66) NOT NULL,
  merkle_root VARCHAR(66),
  batch_id INTEGER,
  tx_hash VARCHAR(66),
  credential_type VARCHAR(50) NOT NULL,
  credential_name VARCHAR(255),
  issued_to VARCHAR(255),
  issuer VARCHAR(255) DEFAULT 'Ownly KYC',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_kyc_applicant ON kyc_verifications(applicant_id);
CREATE INDEX idx_kyc_user ON kyc_verifications(external_user_id);
CREATE INDEX idx_kyc_email ON kyc_verifications(email);
CREATE INDEX idx_kyc_status ON kyc_verifications(status);
CREATE INDEX idx_cred_kyc ON credentials(kyc_id);
CREATE INDEX idx_cred_issued_to ON credentials(issued_to);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_kyc_verifications_updated_at
  BEFORE UPDATE ON kyc_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON kyc_verifications TO service_role;
GRANT ALL ON credentials TO service_role;
GRANT SELECT ON kyc_verifications TO anon;
GRANT SELECT ON credentials TO anon;
