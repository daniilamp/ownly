/**
 * Migration Verification Script
 * 
 * This script verifies that the ownly_id migration was executed successfully.
 * Run this after executing migration-add-ownly-id.sql in Supabase.
 * 
 * Usage: node verify-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: SUPABASE_URL or SUPABASE_KEY not set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  console.log('🔍 Verifying ownly_id migration...\n');

  try {
    // Test 1: Check if ownly_id column exists by querying it
    console.log('Test 1: Checking if ownly_id column exists...');
    const { data: columnTest, error: columnError } = await supabase
      .from('kyc_verifications')
      .select('id, ownly_id')
      .limit(1);

    if (columnError) {
      console.error('❌ FAILED: ownly_id column does not exist');
      console.error('Error:', columnError.message);
      console.log('\n⚠️  Please execute migration-add-ownly-id.sql in Supabase SQL Editor first.\n');
      return false;
    }
    console.log('✅ PASSED: ownly_id column exists\n');

    // Test 2: Count total records
    console.log('Test 2: Counting total records...');
    const { count: totalCount, error: countError } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ FAILED:', countError.message);
      return false;
    }
    console.log(`✅ Total records in kyc_verifications: ${totalCount}\n`);

    // Test 3: Count records with ownly_id populated
    console.log('Test 3: Counting records with ownly_id populated...');
    const { count: ownlyIdCount, error: ownlyIdError } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .not('ownly_id', 'is', null);

    if (ownlyIdError) {
      console.error('❌ FAILED:', ownlyIdError.message);
      return false;
    }
    console.log(`✅ Records with ownly_id populated: ${ownlyIdCount}\n`);

    // Test 4: Check for Ownly ID format records (backfilled)
    console.log('Test 4: Checking backfilled records (Ownly ID format)...');
    const { data: backfilledRecords, error: backfillError } = await supabase
      .from('kyc_verifications')
      .select('id, external_user_id, ownly_id, email, verification_level')
      .like('ownly_id', 'ow_%')
      .limit(5);

    if (backfillError) {
      console.error('❌ FAILED:', backfillError.message);
      return false;
    }

    if (backfilledRecords && backfilledRecords.length > 0) {
      console.log(`✅ Found ${backfilledRecords.length} backfilled records (showing up to 5):`);
      backfilledRecords.forEach(record => {
        console.log(`   - ID: ${record.id}, Ownly ID: ${record.ownly_id}, Email: ${record.email}, Level: ${record.verification_level}`);
      });
    } else {
      console.log('ℹ️  No records with Ownly ID format found (this is OK if all records use email format)');
    }
    console.log('');

    // Test 5: Check the specific test case from bug report
    console.log('Test 5: Checking specific test case (danilamp@dlminvesting.com / ow_MEAYG4B)...');
    const { data: testCaseRecords, error: testCaseError } = await supabase
      .from('kyc_verifications')
      .select('id, external_user_id, ownly_id, email, verification_level')
      .or('email.eq.danilamp@dlminvesting.com,ownly_id.eq.ow_MEAYG4B,external_user_id.eq.ow_MEAYG4B');

    if (testCaseError) {
      console.error('❌ FAILED:', testCaseError.message);
      return false;
    }

    if (testCaseRecords && testCaseRecords.length > 0) {
      console.log('✅ Found test case record(s):');
      testCaseRecords.forEach(record => {
        console.log(`   - ID: ${record.id}`);
        console.log(`     External User ID: ${record.external_user_id}`);
        console.log(`     Ownly ID: ${record.ownly_id || '(null)'}`);
        console.log(`     Email: ${record.email}`);
        console.log(`     Verification Level: ${record.verification_level}`);
      });
    } else {
      console.log('ℹ️  Test case record not found in database');
    }
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 Migration Verification Summary');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Column exists: YES`);
    console.log(`✅ Total records: ${totalCount}`);
    console.log(`✅ Records with ownly_id: ${ownlyIdCount}`);
    console.log(`✅ Backfill rate: ${totalCount > 0 ? ((ownlyIdCount / totalCount) * 100).toFixed(1) : 0}%`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('✅ Migration verification completed successfully!\n');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error during verification:', error);
    return false;
  }
}

// Run verification
verifyMigration()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
