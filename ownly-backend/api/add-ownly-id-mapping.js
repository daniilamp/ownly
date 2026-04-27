#!/usr/bin/env node

/**
 * Add Ownly ID Mapping - Link Ownly ID to existing user
 * 
 * This script adds the Ownly ID mapping to the test user's record.
 * This simulates the scenario where a user has an Ownly ID that needs to be queryable.
 */

import 'dotenv/config';
import { supabase } from './src/services/databaseService.js';

const TEST_EMAIL = 'danilamp@dlminvesting.com';
const TEST_OWNLY_ID = 'ow_MEAYG4B';
const TEST_EXTERNAL_USER_ID = '0x65c246d8b39fd72eec09e5fbe42dcfb76fc4e1fa';

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

async function addOwnlyIdMapping() {
  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║         Add Ownly ID Mapping to Test User                 ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Find the user by external_user_id
    log(colors.cyan, '▶ Finding user by external_user_id...');
    const { data: user, error: findError } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('external_user_id', TEST_EXTERNAL_USER_ID)
      .single();

    if (findError) {
      log(colors.red, '  ✗ User not found');
      throw findError;
    }

    log(colors.green, '  ✓ User found');
    log(colors.yellow, `    Email: ${user.email}`);
    log(colors.yellow, `    External User ID: ${user.external_user_id}`);
    log(colors.yellow, `    Current Ownly ID: ${user.ownly_id || 'null'}\n`);

    // Update the user with Ownly ID
    log(colors.cyan, '▶ Adding Ownly ID mapping...');
    const { data: updated, error: updateError } = await supabase
      .from('kyc_verifications')
      .update({ ownly_id: TEST_OWNLY_ID })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      log(colors.red, '  ✗ Failed to update user');
      throw updateError;
    }

    log(colors.green, '  ✓ Ownly ID mapping added successfully\n');
    log(colors.yellow, `    Email: ${updated.email}`);
    log(colors.yellow, `    External User ID: ${updated.external_user_id}`);
    log(colors.yellow, `    Ownly ID: ${updated.ownly_id}\n`);

    // Verify the mapping works
    log(colors.cyan, '▶ Verifying mapping...');
    const { data: verified, error: verifyError } = await supabase
      .from('kyc_verifications')
      .select('*')
      .eq('ownly_id', TEST_OWNLY_ID)
      .single();

    if (verifyError) {
      log(colors.red, '  ✗ Verification failed');
      throw verifyError;
    }

    log(colors.green, '  ✓ Mapping verified - user can now be queried by Ownly ID\n');

    log(colors.blue, '╔════════════════════════════════════════════════════════════╗');
    log(colors.blue, '║                   Mapping Complete                         ║');
    log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

    log(colors.green, '✓ Ownly ID mapping added successfully!');
    log(colors.yellow, `  User: ${TEST_EMAIL}`);
    log(colors.yellow, `  Ownly ID: ${TEST_OWNLY_ID}`);
    log(colors.yellow, `  External User ID: ${TEST_EXTERNAL_USER_ID}\n`);

    log(colors.cyan, 'Next steps:');
    log(colors.yellow, '1. Run bug condition test: node test-bug-ownly-id-verification.js');
    log(colors.yellow, '   (This should now PASS - the bug is fixed!)');
    log(colors.yellow, '2. Run preservation tests: node test-preservation-email-queries.js\n');

  } catch (error) {
    log(colors.red, '\n✗ Failed to add Ownly ID mapping!');
    log(colors.red, `  Error: ${error.message}\n`);
    throw error;
  }
}

// Run script
addOwnlyIdMapping()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
