# Migration Guide: Add ownly_id Column

## Overview

This migration adds the `ownly_id` column to the `kyc_verifications` table to fix the Ownly ID verification inconsistency bug.

**Related Spec**: ownly-id-verification-fix  
**Tasks**: 3.1, 3.2

## What This Migration Does

1. Adds `ownly_id VARCHAR(255)` column to `kyc_verifications` table
2. Creates an index on `ownly_id` for query performance
3. Backfills existing records where `external_user_id` matches Ownly ID format (`ow_*`)

## Prerequisites

- Access to Supabase Dashboard
- SQL Editor permissions

## Migration Steps

### Step 1: Run Migration SQL

1. Open your Supabase Dashboard: https://app.supabase.com
2. Navigate to your project: `jmbqtvmmldxgstabgpwh`
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `database/migration-add-ownly-id.sql`
6. Click **Run** to execute the migration

### Step 2: Verify Migration

After running the migration, verify it was successful:

```sql
-- Check if column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'kyc_verifications' AND column_name = 'ownly_id';

-- Check if index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'kyc_verifications' AND indexname = 'idx_kyc_ownly_id';

-- Check backfill results
SELECT 
  COUNT(*) as total_records,
  COUNT(ownly_id) as records_with_ownly_id,
  COUNT(CASE WHEN external_user_id ~ '^ow_[A-Z0-9]+$' THEN 1 END) as external_user_id_ownly_format
FROM kyc_verifications;
```

Expected results:
- Column `ownly_id` exists with type `character varying(255)` and `is_nullable = YES`
- Index `idx_kyc_ownly_id` exists
- `records_with_ownly_id` should equal `external_user_id_ownly_format` (all Ownly IDs backfilled)

### Step 3: Test the Fix

Run the bug condition exploration test to verify the fix works:

```bash
cd ownly-backend/api
node test-bug-ownly-id-verification.js
```

**Expected outcome**: All tests should PASS (previously they failed on unfixed code)

### Step 4: Run Preservation Tests

Verify that email-based queries still work correctly:

```bash
node test-preservation-email-queries.js
```

**Expected outcome**: All tests should PASS (no regressions)

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Remove index
DROP INDEX IF EXISTS idx_kyc_ownly_id;

-- Remove column
ALTER TABLE kyc_verifications DROP COLUMN IF EXISTS ownly_id;
```

## Troubleshooting

### Issue: Column already exists

If you see an error like `column "ownly_id" already exists`, the migration has already been run. You can skip to Step 2 to verify.

### Issue: Backfill didn't complete

If the backfill didn't complete (records_with_ownly_id < external_user_id_ownly_format), run this SQL:

```sql
UPDATE kyc_verifications
SET ownly_id = external_user_id
WHERE external_user_id ~ '^ow_[A-Z0-9]+$'
  AND ownly_id IS NULL;
```

### Issue: Permission denied

If you see a permission error, make sure you're using the Supabase SQL Editor with admin privileges, not the JavaScript client.

## Code Changes

The following code changes have been made to support the `ownly_id` field:

1. **databaseService.js - getKYCByUserId()**: Now detects Ownly ID format and queries `ownly_id` field first, with fallback to `external_user_id`
2. **databaseService.js - createKYCVerification()**: Populates `ownly_id` field when `externalUserId` is in Ownly ID format
3. **schema.sql**: Updated to include `ownly_id` column and index for new installations

## Next Steps

After successful migration:

1. ✅ Run bug condition test (should pass)
2. ✅ Run preservation tests (should pass)
3. ✅ Deploy updated code to production
4. ✅ Monitor identity API endpoints for correct behavior

## Support

If you encounter any issues, refer to:
- Spec: `.kiro/specs/ownly-id-verification-fix/`
- Design document: `.kiro/specs/ownly-id-verification-fix/design.md`
- Bug report: `.kiro/specs/ownly-id-verification-fix/bugfix.md`
