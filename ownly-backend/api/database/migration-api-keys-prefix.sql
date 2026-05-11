-- Migration: Add key_prefix column to api_keys table
-- This stores the last 4 characters of the API key for display purposes (masked key)
-- Run this in Supabase SQL Editor

ALTER TABLE api_keys
ADD COLUMN IF NOT EXISTS key_prefix VARCHAR(4);

-- Comment for documentation
COMMENT ON COLUMN api_keys.key_prefix IS 'Last 4 characters of the API key, stored at generation time for masked display in the Business Portal';
