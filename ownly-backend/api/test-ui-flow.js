/**
 * Test: UI Flow Simulation
 * Simulates exactly what the frontend does
 */

const API_URL = 'http://localhost:3001';

async function test() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                ║');
  console.log('║          🧪 TEST: UI FLOW SIMULATION                           ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: User fills form and clicks "Continuar"
    console.log('Step 1️⃣  User fills form and clicks "Continuar"...');
    console.log('────────────────────────────────────────────────────────────');

    const userId = `user_${Date.now()}`;
    const email = `test_${Date.now()}@example.com`;
    const firstName = 'Juan';
    const lastName = 'Pérez';

    console.log(`   User ID: ${userId}`);
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${firstName} ${lastName}\n`);

    // Step 2: Frontend calls /api/kyc/init
    console.log('Step 2️⃣  Frontend calls POST /api/kyc/init...');
    console.log('────────────────────────────────────────────────────────────');

    const initResponse = await fetch(`${API_URL}/api/kyc/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email,
        firstName,
        lastName,
      }),
    });

    if (!initResponse.ok) {
      throw new Error(`KYC init failed: ${initResponse.status}`);
    }

    const initData = await initResponse.json();
    const applicantId = initData.applicantId;
    const sdkToken = initData.sdkToken;

    console.log('✅ KYC Init Success');
    console.log(`   Applicant ID: ${applicantId}`);
    console.log(`   SDK Token: ${sdkToken}`);
    console.log(`   Mock Mode: ${initData.mock}\n`);

    // Step 3: User sees verification button and clicks it
    console.log('Step 3️⃣  User clicks "✓ Simular Verificación Exitosa"...');
    console.log('────────────────────────────────────────────────────────────');

    // This is what SumsubSDK sends in the onSuccess callback
    const payload = {
      applicantId: applicantId,  // This should be the applicantId, not sdkToken
      status: 'completed',
      mock: true,
    };

    console.log(`   Payload sent to handleVerificationSuccess:`);
    console.log(`   - applicantId: ${payload.applicantId}`);
    console.log(`   - status: ${payload.status}`);
    console.log(`   - mock: ${payload.mock}\n`);

    // Step 4: Frontend calls /api/kyc/simulate-approval
    console.log('Step 4️⃣  Frontend calls POST /api/kyc/simulate-approval...');
    console.log('────────────────────────────────────────────────────────────');

    const approvalResponse = await fetch(`${API_URL}/api/kyc/simulate-approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantId: payload.applicantId,
        userId: userId,
      }),
    });

    if (!approvalResponse.ok) {
      const errorText = await approvalResponse.text();
      console.error('❌ Approval failed:', errorText);
      throw new Error(`Simulate approval failed: ${approvalResponse.status}`);
    }

    const approvalData = await approvalResponse.json();

    console.log('✅ Simulate Approval Success');
    console.log(`   Message: ${approvalData.message}`);
    console.log(`   Credential ID: ${approvalData.credential?.id}\n`);

    // Step 5: User clicks "Ver mis credenciales →"
    console.log('Step 5️⃣  User clicks "Ver mis credenciales →"...');
    console.log('────────────────────────────────────────────────────────────');

    const userResponse = await fetch(`${API_URL}/api/kyc/user/${userId}`);
    if (!userResponse.ok) {
      throw new Error(`Get user KYC failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    const credentials = userData.credentials;

    console.log(`✅ Credentials Found: ${credentials.length}`);
    if (credentials.length > 0) {
      const cred = credentials[0];
      console.log(`   ID: ${cred.id}`);
      console.log(`   Type: ${cred.type}`);
      console.log(`   Status: ${cred.status}\n`);
    } else {
      console.log('   ❌ NO CREDENTIALS FOUND\n');
    }

    // Success
    if (credentials.length > 0) {
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║                                                                ║');
      console.log('║                    ✅ TEST PASSED                              ║');
      console.log('║                                                                ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
    } else {
      console.log('╔════════════════════════════════════════════════════════════════╗');
      console.log('║                                                                ║');
      console.log('║                    ❌ TEST FAILED                              ║');
      console.log('║                    No credentials found                        ║');
      console.log('║                                                                ║');
      console.log('╚════════════════════════════════════════════════════════════════╝\n');
      process.exit(1);
    }

  } catch (err) {
    console.error('\n❌ Test Failed:', err.message);
    process.exit(1);
  }
}

test();
