# Quick Start: Execute Migration

## 🚀 Quick Steps

### 1. Execute Migration in Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → SQL Editor
2. Copy contents of `migration-add-ownly-id.sql`
3. Paste and click "Run"

### 2. Verify Migration Success
```bash
cd ownly-backend/api
node database/verify-migration.js
```

## 📋 What the Migration Does

✅ Adds `ownly_id` column to `kyc_verifications` table  
✅ Creates index for query performance  
✅ Backfills existing records where `external_user_id` matches Ownly ID format (`ow_*`)  
✅ Adds documentation comment to column  

## 🔍 Expected Output

After running the verification script, you should see:
```
✅ Column exists: YES
✅ Total records: [count]
✅ Records with ownly_id: [count]
✅ Backfill rate: [percentage]%
```

## 📚 Detailed Documentation

See `MIGRATION_EXECUTION_GUIDE.md` for:
- Detailed step-by-step instructions
- Verification queries
- Troubleshooting tips
- Rollback procedure

## ⚠️ Important Notes

- The migration is **idempotent** (safe to run multiple times)
- Existing records with email format in `external_user_id` will have `ownly_id = NULL`
- These will be populated when the record is next updated
- No data loss will occur

## 🐛 Related Bug Fix

This migration is part of the fix for: **Ownly ID Verification Inconsistency**

**Issue**: Querying by Ownly ID (`ow_MEAYG4B`) returns `verified: false`, while querying by email returns `verified: true` for the same user.

**Root Cause**: `external_user_id` field doesn't contain Ownly ID format, causing database queries to fail.

**Solution**: Add dedicated `ownly_id` column and update query logic.
