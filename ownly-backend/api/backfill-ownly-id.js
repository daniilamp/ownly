#!/usr/bin/env node

/**
 * Backfill Script: Populate ownly_id field for existing records
 * 
 * This script backfills the ownly_id field for records where external_user_id
 * matches the Ownly ID format (ow_XXXXX).
 * 
 * Run this AFTER adding the ownly_id column via SQL migration.
 * 
 * Related Spec: ownly-id-verification-fix
 * Task: 3.2 Backfill existing records with ownly_id data
 */

import 'dotenv/config';
import { supabase } from './src/services/databaseService.js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function backfillOwnlyId() {
  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║         Backfill ownly_id Field - Existing Records        ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Check if column exists
    log(colors.cyan, '▶ Verifying ownly_id column exists...');
    const { error: columnCheckError } = await supabase
      .from('kyc_verifications')
      .select('ownly_id')
      .limit(1);

    if (columnCheckError) {
      if (columnCheckError.message.includes('column "ownly_id" does not exist')) {
        log(colors.red, '  ✗ Column does NOT exist\n');
        log(colors.yellow, 'Please run the migration SQL first:');
        log(colors.cyan, '  ownly-backend/api/database/migration-add-ownly-id.sql\n');
        log(colors.yellow, 'See MIGRATION_GUIDE_OWNLY_ID.md for instructions.\n');
        return;
      }
      throw columnCheckError;
    }

    log(colors.green, '  ✓ Column exists\n');

    // Get statistics before backfill
    log(colors.cyan, '▶ Gathering statistics...');
    
    const { count: totalCount } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true });

    const { count: ownlyIdCountBefore } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .not('ownly_id', 'is', null);

    const { count: externalUserIdOwnlyFormat } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .like('external_user_id', 'ow_%');

    log(colors.yellow, `  Total KYC records: ${totalCount}`);
    log(colors.yellow, `  Records with ownly_id populated (before): ${ownlyIdCountBefore}`);
    log(colors.yellow, `  Records with external_user_id in Ownly ID format: ${externalUserIdOwnlyFormat}\n`);

    if (externalUserIdOwnlyFormat === 0) {
      log(colors.yellow, '  ℹ No records to backfill (no Ownly IDs in external_user_id)\n');
      return;
    }

    if (ownlyIdCountBefore === externalUserIdOwnlyFormat) {
      log(colors.green, '  ✓ All records already backfilled!\n');
      return;
    }

    // Get records that need backfilling
    log(colors.cyan, '▶ Fetching records to backfill...');
    const { data: recordsToBackfill, error: fetchError } = await supabase
      .from('kyc_verifications')
      .select('id, external_user_id, email')
      .like('external_user_id', 'ow_%')
      .is('ownly_id', null);

    if (fetchError) {
      throw fetchError;
    }

    log(colors.yellow, `  Found ${recordsToBackfill.length} records to backfill\n`);

    if (recordsToBackfill.length === 0) {
      log(colors.green, '  ✓ No records need backfilling\n');
      return;
    }

    // Backfill records
    log(colors.cyan, '▶ Backfilling records...');
    let successCount = 0;
    let errorCount = 0;

    for (const record of recordsToBackfill) {
      const { error: updateError } = await supabase
        .from('kyc_verifications')
        .update({ ownly_id: record.external_user_id })
        .eq('id', record.id);

      if (updateError) {
        log(colors.red, `  ✗ Failed to update record ${record.id} (${record.email})`);
        errorCount++;
      } else {
        successCount++;
        if (successCount % 10 === 0) {
          log(colors.yellow, `  ✓ Backfilled ${successCount} records...`);
        }
      }
    }

    log(colors.green, `  ✓ Backfilled ${successCount} records\n`);

    if (errorCount > 0) {
      log(colors.red, `  ✗ Failed to backfill ${errorCount} records\n`);
    }

    // Get statistics after backfill
    const { count: ownlyIdCountAfter } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .not('ownly_id', 'is', null);

    log(colors.blue, '╔════════════════════════════════════════════════════════════╗');
    log(colors.blue, '║                   Backfill Complete                        ║');
    log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

    log(colors.green, '✓ Backfill completed successfully!');
    log(colors.yellow, `  Records with ownly_id (before): ${ownlyIdCountBefore}`);
    log(colors.yellow, `  Records with ownly_id (after): ${ownlyIdCountAfter}`);
    log(colors.yellow, `  Records backfilled: ${successCount}\n`);

    log(colors.cyan, 'Next steps:');
    log(colors.yellow, '1. Run bug condition test: node test-bug-ownly-id-verification.js');
    log(colors.yellow, '2. Run preservation tests: node test-preservation-email-queries.js\n');

  } catch (error) {
    log(colors.red, '\n✗ Backfill failed!');
    log(colors.red, `  Error: ${error.message}\n`);
    throw error;
  }
}

// Run backfill
backfillOwnlyId()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
