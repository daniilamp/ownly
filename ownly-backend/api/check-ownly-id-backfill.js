/**
 * Check Ownly ID Backfill Status
 * 
 * This script checks how many records have ownly_id populated
 * and identifies records that might need manual backfill.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkBackfillStatus() {
  console.log('🔍 Checking Ownly ID Backfill Status...\n');

  try {
    // 1. Total records
    const { count: totalCount } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Total KYC Records: ${totalCount}`);

    // 2. Records with ownly_id populated
    const { count: withOwnlyId } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .not('ownly_id', 'is', null);

    console.log(`✅ Records with ownly_id: ${withOwnlyId}`);

    // 3. Records without ownly_id
    const { count: withoutOwnlyId } = await supabase
      .from('kyc_verifications')
      .select('*', { count: 'exact', head: true })
      .is('ownly_id', null);

    console.log(`❌ Records without ownly_id: ${withoutOwnlyId}`);

    // 4. Backfill percentage
    const backfillPercentage = totalCount > 0 ? ((withOwnlyId / totalCount) * 100).toFixed(1) : 0;
    console.log(`📈 Backfill Rate: ${backfillPercentage}%\n`);

    // 5. Sample records without ownly_id
    console.log('📋 Sample Records Without ownly_id (first 10):');
    const { data: samplesWithout } = await supabase
      .from('kyc_verifications')
      .select('id, external_user_id, email, status, review_answer')
      .is('ownly_id', null)
      .limit(10);

    if (samplesWithout && samplesWithout.length > 0) {
      samplesWithout.forEach((record, index) => {
        console.log(`\n${index + 1}. ID: ${record.id}`);
        console.log(`   External User ID: ${record.external_user_id}`);
        console.log(`   Email: ${record.email}`);
        console.log(`   Status: ${record.status}`);
        console.log(`   Review: ${record.review_answer || 'pending'}`);
        
        // Check if external_user_id matches Ownly ID format
        const isOwnlyIdFormat = /^ow_[A-Z0-9]+$/.test(record.external_user_id);
        if (isOwnlyIdFormat) {
          console.log(`   ⚠️  SHOULD HAVE OWNLY_ID: ${record.external_user_id}`);
        } else {
          console.log(`   ℹ️  Email format (expected to be null)`);
        }
      });
    } else {
      console.log('   (No records without ownly_id)');
    }

    // 6. Sample records with ownly_id
    console.log('\n\n📋 Sample Records With ownly_id (first 5):');
    const { data: samplesWith } = await supabase
      .from('kyc_verifications')
      .select('id, external_user_id, ownly_id, email, status')
      .not('ownly_id', 'is', null)
      .limit(5);

    if (samplesWith && samplesWith.length > 0) {
      samplesWith.forEach((record, index) => {
        console.log(`\n${index + 1}. ID: ${record.id}`);
        console.log(`   External User ID: ${record.external_user_id}`);
        console.log(`   Ownly ID: ${record.ownly_id}`);
        console.log(`   Email: ${record.email}`);
        console.log(`   Match: ${record.external_user_id === record.ownly_id ? '✅' : '⚠️'}`);
      });
    }

    // 7. Check for mismatches (external_user_id != ownly_id when both are Ownly ID format)
    console.log('\n\n🔍 Checking for Mismatches...');
    const { data: allRecords } = await supabase
      .from('kyc_verifications')
      .select('id, external_user_id, ownly_id')
      .not('ownly_id', 'is', null);

    let mismatches = 0;
    if (allRecords) {
      allRecords.forEach(record => {
        if (record.external_user_id !== record.ownly_id) {
          mismatches++;
          console.log(`⚠️  Mismatch found:`);
          console.log(`   ID: ${record.id}`);
          console.log(`   External User ID: ${record.external_user_id}`);
          console.log(`   Ownly ID: ${record.ownly_id}`);
        }
      });
    }

    if (mismatches === 0) {
      console.log('✅ No mismatches found');
    } else {
      console.log(`\n⚠️  Found ${mismatches} mismatches`);
    }

    // Summary
    console.log('\n\n═══════════════════════════════════════════════════════');
    console.log('📊 BACKFILL STATUS SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total Records: ${totalCount}`);
    console.log(`With ownly_id: ${withOwnlyId} (${backfillPercentage}%)`);
    console.log(`Without ownly_id: ${withoutOwnlyId}`);
    console.log(`Mismatches: ${mismatches}`);
    console.log('═══════════════════════════════════════════════════════\n');

    // Recommendations
    if (withoutOwnlyId > 0) {
      console.log('💡 RECOMMENDATIONS:');
      console.log(`   - ${withoutOwnlyId} records don't have ownly_id populated`);
      console.log('   - Most are likely email format (expected behavior)');
      console.log('   - Check samples above to verify');
      console.log('   - If any have Ownly ID format in external_user_id, run manual backfill\n');
    }

    if (mismatches > 0) {
      console.log('⚠️  ACTION REQUIRED:');
      console.log('   - Found mismatches between external_user_id and ownly_id');
      console.log('   - Review and fix manually\n');
    }

    if (withoutOwnlyId === 0 && mismatches === 0) {
      console.log('✅ ALL GOOD! Backfill is complete and consistent.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkBackfillStatus()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
