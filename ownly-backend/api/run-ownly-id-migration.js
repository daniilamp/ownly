#!/usr/bin/env node

/**
 * Migration Script: Add ownly_id column and backfill data
 * 
 * This script:
 * 1. Adds ownly_id column to kyc_verifications table
 * 2. Creates index on ownly_id for query performance
 * 3. Backfills existing records where external_user_id matches Ownly ID format
 * 
 * Related Spec: ownly-id-verification-fix
 * Task: 3.2 Backfill existing records with ownly_id data
 */

import 'dotenv/config';
import { supabase } from './src/services/databaseService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

async function runMigration() {
  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║         Ownly ID Migration - Add ownly_id Column          ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Read migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migration-add-ownly-id.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    log(colors.cyan, '▶ Reading migration file...');
    log(colors.yellow, `  File: ${migrationPath}\n`);

    // Execute migration SQL
    log(colors.cyan, '▶ Executing migration SQL...');
    
    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        log(colors.yellow, `  Executing: ${statement.substring(0, 60)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase.from('kyc_verifications').select('ownly_id').limit(1);
          if (directError && directError.message.includes('column "ownly_id" does not exist')) {
            log(colors.red, '  ✗ Migration failed - column does not exist');
            log(colors.yellow, '\n  Please run the migration SQL manually in Supabase SQL Editor:');
            log(colors.cyan, `  ${migrationPath}\n`);
            throw new Error('Migration failed - please run SQL manually');
          }
        }
      }
    }

    log(colors.green, '  ✓ Migration SQL executed successfully\n');

    // Verify column exists
    log(colors.cyan, '▶ Verifying ownly_id column exists...');
    const { data: testData, error: testError } = await supabase
      .from('kyc_verifications')
      .select('ownly_id')
      .limit(1);

    if (testError) {
      log(colors.red, '  ✗ Column verification failed');
      log(colors.yellow, '\n  Please run the migration SQL manually in Supabase SQL Editor:');
      log(colors.cyan, `  ${migrationPath}\n`);
      throw testError;
    }

    log(colors.green, '  ✓ Column exists and is accessible\n');

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

    // Verify backfill
    if (externalUserIdOwnlyFormat > 0 && ownlyIdCount === 0) {
      log(colors.yellow, '▶ Backfill may not have completed. Running manual backfill...');
      
      // Get all records with Ownly ID format in external_user_id
      const { data: recordsToBackfill, error: fetchError } = await supabase
        .from('kyc_verifications')
        .select('id, external_user_id')
        .like('external_user_id', 'ow_%')
        .is('ownly_id', null);

      if (fetchError) {
        throw fetchError;
      }

      log(colors.yellow, `  Found ${recordsToBackfill.length} records to backfill`);

      // Update each record
      for (const record of recordsToBackfill) {
        const { error: updateError } = await supabase
          .from('kyc_verifications')
          .update({ ownly_id: record.external_user_id })
          .eq('id', record.id);

        if (updateError) {
          log(colors.red, `  ✗ Failed to update record ${record.id}`);
          throw updateError;
        }
      }

      log(colors.green, `  ✓ Backfilled ${recordsToBackfill.length} records\n`);
    } else if (ownlyIdCount > 0) {
      log(colors.green, '  ✓ Backfill completed successfully\n');
    } else {
      log(colors.yellow, '  ℹ No records to backfill (no Ownly IDs in external_user_id)\n');
    }

    // Final statistics
    const { count: finalOwnlyIdCount } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .not('ownly_id', 'is', null);

    log(colors.blue, '╔════════════════════════════════════════════════════════════╗');
    log(colors.blue, '║                   Migration Complete                       ║');
    log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

    log(colors.green, '✓ Migration completed successfully!');
    log(colors.yellow, `  Total records: ${totalCount}`);
    log(colors.yellow, `  Records with ownly_id: ${finalOwnlyIdCount}\n`);

    log(colors.cyan, 'Next steps:');
    log(colors.yellow, '1. Run bug condition test to verify fix: node test-bug-ownly-id-verification.js');
    log(colors.yellow, '2. Run preservation tests to verify no regressions\n');

  } catch (error) {
    log(colors.red, '\n✗ Migration failed!');
    log(colors.red, `  Error: ${error.message}\n`);
    
    if (error.message.includes('column "ownly_id" does not exist')) {
      log(colors.yellow, 'The ownly_id column does not exist yet.');
      log(colors.yellow, 'Please run the migration SQL manually in Supabase SQL Editor:\n');
      log(colors.cyan, '  ownly-backend/api/database/migration-add-ownly-id.sql\n');
    }
    
    throw error;
  }
}

// Run migration
runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
