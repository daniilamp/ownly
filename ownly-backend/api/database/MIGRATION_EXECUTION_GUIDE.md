# Migration Execution Guide: Add ownly_id Column

## Overview
This guide provides step-by-step instructions for executing the `migration-add-ownly-id.sql` migration in Supabase.

**Migration File**: `ownly-backend/api/database/migration-add-ownly-id.sql`

**Purpose**: Fix Ownly ID verification inconsistency by adding a dedicated `ownly_id` column to the `kyc_verifications` table.

## Prerequisites
- Access to Supabase Dashboard
- Database URL: `https://jmbqtvmmldxgstabgpwh.supabase.co`
- Appropriate database permissions (service role or admin)

## Execution Steps

### Step 1: Access Supabase SQL Editor
1. Navigate to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `jmbqtvmmldxgstabgpwh`
3. Click on "SQL Editor" in the left sidebar

### Step 2: Execute the Migration
1. Click "New Query" to create a new SQL query
2. Copy the entire contents of `migration-add-ownly-id.sql`
3. Paste into the SQL Editor
4. Click "Run" or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)

### Step 3: Verify Migration Success
After execution, you should see success messages for:
- ✅ Column `ownly_id` added to `kyc_verifications` table
- ✅ Index `idx_kyc_ownly_id` created
- ✅ Existing records backfilled (where applicable)
- ✅ Column comment added

### Step 4: Verify Backfill Results
Run the following verification queries in the SQL Editor:

```sql
-- Check total records in kyc_verifications
SELECT COUNT(*) as total_records FROM kyc_verifications;

-- Check how many records have ownly_id populated
SELECT COUNT(*) as records_with_ownly_id 
FROM kyc_verifications 
WHERE ownly_id IS NOT NULL;

-- Check records that were backfilled (Ownly ID format)
SELECT COUNT(*) as backfilled_records 
FROM kyc_verifications 
WHERE ownly_id ~ '^ow_[A-Z0-9]+$';

-- View sample of backfilled records
SELECT id, external_user_id, ownly_id, email, verification_level 
FROM kyc_verifications 
WHERE ownly_id IS NOT NULL 
LIMIT 10;

-- Verify the specific test case from the bug report
SELECT id, external_user_id, ownly_id, email, verification_level 
FROM kyc_verifications 
WHERE email = 'danilamp@dlminvesting.com' 
   OR ownly_id = 'ow_MEAYG4B'
   OR external_user_id = 'ow_MEAYG4B';
```

## Expected Results

### Backfill Behavior
The migration includes automatic backfill logic:
- **Records with Ownly ID in `external_user_id`**: The `ownly_id` column will be populated with the value from `external_user_id`
- **Records with email in `external_user_id`**: The `ownly_id` column will remain `NULL` (will be populated on next update)

### Verification Checklist
- [ ] Migration executed without errors
- [ ] `ownly_id` column exists in `kyc_verifications` table
- [ ] Index `idx_kyc_ownly_id` created successfully
- [ ] Records with Ownly ID format in `external_user_id` have been backfilled
- [ ] Sample queries return expected results
- [ ] Test case record (email: `danilamp@dlminvesting.com`) is visible in results

## Troubleshooting

### Error: Column already exists
If you see "column already exists" error, the migration has already been run. You can verify by running:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'kyc_verifications' 
  AND column_name = 'ownly_id';
```

### Error: Permission denied
Ensure you're using the service role key or have admin permissions. Check your Supabase project settings.

### No records backfilled
If the backfill count is 0, it means no existing records have Ownly ID format in `external_user_id`. This is expected if all current records use email format.

## Next Steps
After successful migration execution:
1. Mark task 3.2 as complete
2. Proceed to task 3.3: Update `getKYCByUserId()` to query the new `ownly_id` field
3. Continue with remaining implementation tasks

## Rollback (If Needed)
If you need to rollback this migration:
```sql
-- Remove the index
DROP INDEX IF EXISTS idx_kyc_ownly_id;

-- Remove the column
ALTER TABLE kyc_verifications DROP COLUMN IF EXISTS ownly_id;
```

**⚠️ Warning**: Rollback will delete all data in the `ownly_id` column.
