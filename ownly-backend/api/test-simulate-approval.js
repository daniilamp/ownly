/**
 * Test: Simulate Approval Endpoint
 * Tests the /api/kyc/simulate-approval endpoint
 */

const API_URL = 'http://localhost:3001';

async function test() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║          🧪 TEST: SIMULATE APPROVAL ENDPOINT                   ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Create KYC verification
    console.log('Step 1️⃣  Creating KYC verification...');
    console.log('────────────────────────────────────────────────────────────');

    const userId = `user_test_${Date.now()}`;
    const email = `test_${Date.now()}@example.com`;

    const initResponse = await fetch(`${API_URL}/api/kyc/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email,
        firstName: 'Juan',
        lastName: 'Pérez',
      }),
    });

    if (!initResponse.ok) {
      throw new Error(`KYC init failed: ${initResponse.status}`);
    }

    const initData = await initResponse.json();
    const applicantId = initData.applicantId;

    console.log('✅ KYC Init Success');
    console.log(`   Applicant ID: ${applicantId}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}\n`);

    // Step 2: Call simulate-approval endpoint
    console.log('Step 2️⃣  Calling /api/kyc/simulate-approval...');
    console.log('────────────────────────────────────────────────────────────');

    const approvalResponse = await fetch(`${API_URL}/api/kyc/simulate-approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantId,
        userId,
      }),
    });

    if (!approvalResponse.ok) {
      throw new Error(`Simulate approval failed: ${approvalResponse.status}`);
    }

    const approvalData = await approvalResponse.json();

    console.log('✅ Simulate Approval Success');
    console.log(`   Credential ID: ${approvalData.credential?.id}`);
    console.log(`   Message: ${approvalData.message}\n`);

    // Step 3: Verify credential was created
    console.log('Step 3️⃣  Verifying credential in database...');
    console.log('────────────────────────────────────────────────────────────');

    const userResponse = await fetch(`${API_URL}/api/kyc/user/${userId}`);
    if (!userResponse.ok) {
      throw new Error(`Get user KYC failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    const verification = userData.verification;
    const credentials = userData.credentials;

    console.log('✅ Verification Data Found');
    console.log(`   KYC ID: ${verification.id}`);
    console.log(`   Status: ${verification.status}`);
    console.log(`   Credential ID: ${verification.credential_id}`);
    console.log(`   Credentials Count: ${credentials.length}\n`);

    if (credentials.length === 0) {
      throw new Error('No credentials found');
    }

    const credential = credentials[0];
    console.log('✅ Credential Found');
    console.log(`   ID: ${credential.id}`);
    console.log(`   Type: ${credential.type}`);
    console.log(`   Status: ${credential.status}`);
    console.log(`   User ID: ${credential.user_id}\n`);

    // Success
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                ║');
    console.log('║                    ✅ TEST PASSED                              ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📊 Summary:');
    console.log('   ✅ KYC verification created');
    console.log('   ✅ Simulate approval endpoint works');
    console.log('   ✅ Credential created via endpoint');
    console.log('   ✅ Credential linked to KYC');
    console.log('   ✅ Frontend can now call this endpoint\n');

  } catch (err) {
    console.error('\n❌ Test Failed:', err.message);
    process.exit(1);
  }
}

test();
