/**
 * Fix Ownly ID Mismatch
 * 
 * This script fixes the mismatch where external_user_id contains a wallet address
 * but ownly_id contains the actual Ownly ID.
 * 
 * Strategy: Update external_user_id to match ownly_id when ownly_id is in correct format
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fixMismatch() {
  console.log('🔧 Fixing Ownly ID Mismatches...\n');

  try {
    // Find records with mismatches
    const { data: allRecords } = await supabase
      .from('kyc_verifications')
      .select('id, external_user_id, ownly_id, email')
      .not('ownly_id', 'is', null);

    if (!allRecords || allRecords.length === 0) {
      console.log('✅ No records with ownly_id found');
      return;
    }

    const mismatches = allRecords.filter(r => r.external_user_id !== r.ownly_id);

    if (mismatches.length === 0) {
      console.log('✅ No mismatches found');
      return;
    }

    console.log(`Found ${mismatches.length} mismatch(es):\n`);

    for (const record of mismatches) {
      console.log(`📝 Record ID: ${record.id}`);
      console.log(`   Current external_user_id: ${record.external_user_id}`);
      console.log(`   Current ownly_id: ${record.ownly_id}`);
      console.log(`   Email: ${record.email}`);

      // Verify ownly_id is in correct format
      const isValidOwnlyId = /^ow_[A-Z0-9]+$/.test(record.ownly_id);

      if (!isValidOwnlyId) {
        console.log(`   ⚠️  SKIPPED: ownly_id is not in valid format\n`);
        continue;
      }

      // Update external_user_id to match ownly_id
      console.log(`   ✅ Updating external_user_id to: ${record.ownly_id}`);

      const { error } = await supabase
        .from('kyc_verifications')
        .update({ external_user_id: record.ownly_id })
        .eq('id', record.id);

      if (error) {
        console.log(`   ❌ ERROR: ${error.message}\n`);
      } else {
        console.log(`   ✅ FIXED\n`);
      }
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ Mismatch Fix Complete');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixMismatch()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
