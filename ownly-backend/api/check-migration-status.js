#!/usr/bin/env node

/**
 * Check Migration Status - Verify if ownly_id column exists
 * 
 * This script checks if the migration has been run by attempting to query the ownly_id column.
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

async function checkMigrationStatus() {
  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║            Migration Status Check - ownly_id              ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Try to query the ownly_id column
    log(colors.cyan, '▶ Checking if ownly_id column exists...');
    const { data, error } = await supabase
      .from('kyc_verifications')
      .select('ownly_id')
      .limit(1);

    if (error) {
      if (error.message.includes('column "ownly_id" does not exist')) {
        log(colors.red, '  ✗ Column does NOT exist\n');
        log(colors.yellow, '╔════════════════════════════════════════════════════════════╗');
        log(colors.yellow, '║              Migration Required                            ║');
        log(colors.yellow, '╚════════════════════════════════════════════════════════════╝\n');
        log(colors.yellow, 'The ownly_id column has not been added yet.');
        log(colors.yellow, 'Please run the migration manually in Supabase SQL Editor:\n');
        log(colors.cyan, '  1. Open Supabase Dashboard: https://app.supabase.com');
        log(colors.cyan, '  2. Go to SQL Editor');
        log(colors.cyan, '  3. Run the SQL from: ownly-backend/api/database/migration-add-ownly-id.sql\n');
        log(colors.yellow, 'See MIGRATION_GUIDE_OWNLY_ID.md for detailed instructions.\n');
        return false;
      }
      throw error;
    }

    log(colors.green, '  ✓ Column exists!\n');

    // Get statistics
    log(colors.cyan, '▶ Gathering statistics...');
    
    const { count: totalCount } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true });

    const { count: ownlyIdCount } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .not('ownly_id', 'is', null);

    const { count: externalUserIdOwnlyFormat } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .like('external_user_id', 'ow_%');

    log(colors.yellow, `  Total KYC records: ${totalCount}`);
    log(colors.yellow, `  Records with ownly_id populated: ${ownlyIdCount}`);
    log(colors.yellow, `  Records with external_user_id in Ownly ID format: ${externalUserIdOwnlyFormat}\n`);

    // Check if backfill is needed
    if (externalUserIdOwnlyFormat > ownlyIdCount) {
      log(colors.yellow, '╔════════════════════════════════════════════════════════════╗');
      log(colors.yellow, '║              Backfill Required                             ║');
      log(colors.yellow, '╚════════════════════════════════════════════════════════════╝\n');
      log(colors.yellow, `${externalUserIdOwnlyFormat - ownlyIdCount} records need to be backfilled.`);
      log(colors.yellow, 'Run this SQL in Supabase SQL Editor:\n');
      log(colors.cyan, `UPDATE kyc_verifications`);
      log(colors.cyan, `SET ownly_id = external_user_id`);
      log(colors.cyan, `WHERE external_user_id ~ '^ow_[A-Z0-9]+$'`);
      log(colors.cyan, `  AND ownly_id IS NULL;\n`);
      return false;
    }

    log(colors.green, '╔════════════════════════════════════════════════════════════╗');
    log(colors.green, '║              Migration Complete                            ║');
    log(colors.green, '╚════════════════════════════════════════════════════════════╝\n');
    log(colors.green, '✓ Migration has been successfully applied!');
    log(colors.green, '✓ All records have been backfilled.\n');

    log(colors.cyan, 'Next steps:');
    log(colors.yellow, '1. Run bug condition test: node test-bug-ownly-id-verification.js');
    log(colors.yellow, '2. Run preservation tests: node test-preservation-email-queries.js\n');

    return true;

  } catch (error) {
    log(colors.red, '\n✗ Error checking migration status!');
    log(colors.red, `  Error: ${error.message}\n`);
    throw error;
  }
}

// Run check
checkMigrationStatus()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
