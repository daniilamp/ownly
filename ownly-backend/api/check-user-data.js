#!/usr/bin/env node

/**
 * Check User Data - Inspect the test user's data
 */

import 'dotenv/config';
import { supabase } from './src/services/databaseService.js';

const TEST_EMAIL = 'danilamp@dlminvesting.com';
const TEST_OWNLY_ID = 'ow_MEAYG4B';

async function checkUserData() {
  console.log('\n=== Checking User Data ===\n');

  // Check by email
  const { data: byEmail, error: emailError } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('email', TEST_EMAIL)
    .single();

  if (emailError) {
    console.log('Error fetching by email:', emailError.message);
  } else {
    console.log('User found by email:');
    console.log('  ID:', byEmail.id);
    console.log('  Email:', byEmail.email);
    console.log('  External User ID:', byEmail.external_user_id);
    console.log('  Ownly ID:', byEmail.ownly_id);
    console.log('  Status:', byEmail.status);
    console.log('  Review Answer:', byEmail.review_answer);
    console.log('  Credential ID:', byEmail.credential_id);
  }

  // Check by Ownly ID
  console.log('\n--- Checking by Ownly ID ---\n');
  const { data: byOwnlyId, error: ownlyIdError } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('ownly_id', TEST_OWNLY_ID)
    .single();

  if (ownlyIdError) {
    console.log('Error fetching by Ownly ID:', ownlyIdError.message);
    console.log('Code:', ownlyIdError.code);
  } else {
    console.log('User found by Ownly ID:');
    console.log('  ID:', byOwnlyId.id);
    console.log('  Email:', byOwnlyId.email);
    console.log('  External User ID:', byOwnlyId.external_user_id);
    console.log('  Ownly ID:', byOwnlyId.ownly_id);
  }

  // Check by external_user_id
  console.log('\n--- Checking by External User ID ---\n');
  const { data: byExternalUserId, error: externalUserIdError } = await supabase
    .from('kyc_verifications')
    .select('*')
    .eq('external_user_id', '0x65c246d8b39fd72eec09e5fbe42dcfb76fc4e1fa')
    .single();

  if (externalUserIdError) {
    console.log('Error fetching by external_user_id:', externalUserIdError.message);
  } else {
    console.log('User found by external_user_id:');
    console.log('  ID:', byExternalUserId.id);
    console.log('  Email:', byExternalUserId.email);
    console.log('  External User ID:', byExternalUserId.external_user_id);
    console.log('  Ownly ID:', byExternalUserId.ownly_id);
  }

  console.log('\n=== Analysis ===\n');
  console.log('The user exists with email:', TEST_EMAIL);
  console.log('But their external_user_id is an Ethereum address, not an Ownly ID');
  console.log('The ownly_id field is:', byEmail?.ownly_id || 'null');
  console.log('\nTo fix this, we need to update the record to include the Ownly ID mapping.');
}

checkUserData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
