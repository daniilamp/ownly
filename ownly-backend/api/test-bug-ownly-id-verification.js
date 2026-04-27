#!/usr/bin/env node

/**
 * Bug Condition Exploration Test - Ownly ID Verification Fix
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3**
 * 
 * Property 1: Bug Condition - Ownly ID Queries Return Incorrect Verification Status
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * DO NOT attempt to fix the test or the code when it fails
 * 
 * This test verifies that:
 * 1. Querying /api/identity/ow_MEAYG4B returns verified: true and verification_level: 'full'
 * 2. POST /api/identity/verify with ownly_id: "ow_MEAYG4B" returns verified: true and can_trade: true
 * 3. getKYCByUserId('ow_MEAYG4B') returns non-null KYC record
 * 
 * EXPECTED OUTCOME ON UNFIXED CODE: Tests FAIL (this proves the bug exists)
 * EXPECTED OUTCOME ON FIXED CODE: Tests PASS (this confirms the fix works)
 */

import 'dotenv/config';
import axios from 'axios';
import * as dbService from './src/services/databaseService.js';

const API_URL = 'http://localhost:3001';
const API_KEY = 'ownly_4270f3e7667879fc6f6e84c40459cf6c907ab7f26b9c688f4c4772946d661859'; // Test API key

// Test user data - this is a known verified user in the system
const TEST_OWNLY_ID = 'ow_MEAYG4B';
const TEST_EMAIL = 'danilamp@dlminvesting.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

let testResults = {
  passed: 0,
  failed: 0,
  counterexamples: [],
};

async function test(name, fn) {
  log(colors.cyan, `\n▶ ${name}`);
  try {
    await fn();
    log(colors.green, `✓ ${name} passed`);
    testResults.passed++;
  } catch (err) {
    log(colors.red, `✗ ${name} failed`);
    log(colors.red, `  Error: ${err.message}`);
    testResults.failed++;
    testResults.counterexamples.push({
      test: name,
      error: err.message,
      details: err.details || null,
    });
  }
}

async function runBugConditionTests() {
  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║  Bug Condition Exploration Test - Ownly ID Verification   ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  log(colors.magenta, 'CRITICAL: This test MUST FAIL on unfixed code');
  log(colors.magenta, 'Failure confirms the bug exists - DO NOT fix the test!\n');

  // First, verify the user exists and is verified when queried by email (baseline)
  await test('Baseline: Verify user exists and is verified by email', async () => {
    const verification = await dbService.getKYCByEmail(TEST_EMAIL);
    
    if (!verification) {
      throw new Error(`User with email ${TEST_EMAIL} not found in database`);
    }

    const isVerified = verification.review_answer === 'GREEN' || 
                      verification.status === 'completed' || 
                      !!verification.credential_id;

    if (!isVerified) {
      throw new Error(`User ${TEST_EMAIL} is not verified (status: ${verification.status}, review_answer: ${verification.review_answer})`);
    }

    log(colors.yellow, `  ✓ User ${TEST_EMAIL} is verified`);
    log(colors.yellow, `  ✓ Status: ${verification.status}`);
    log(colors.yellow, `  ✓ Review Answer: ${verification.review_answer}`);
    log(colors.yellow, `  ✓ External User ID in DB: ${verification.external_user_id}`);
  });

  // Test 1: Database query - getKYCByUserId with Ownly ID
  await test('Test 1.3: getKYCByUserId("ow_MEAYG4B") returns non-null KYC record', async () => {
    const verification = await dbService.getKYCByUserId(TEST_OWNLY_ID);
    
    if (!verification) {
      const err = new Error(`getKYCByUserId('${TEST_OWNLY_ID}') returned null - bug confirmed!`);
      err.details = {
        expected: 'Non-null KYC record',
        actual: 'null',
        rootCause: 'external_user_id field does not contain Ownly ID format',
      };
      throw err;
    }

    log(colors.yellow, `  ✓ Found KYC record for Ownly ID: ${TEST_OWNLY_ID}`);
    log(colors.yellow, `  ✓ External User ID: ${verification.external_user_id}`);
  });

  // Test 2: GET /api/identity/:ownlyId
  await test('Test 1.1: GET /api/identity/ow_MEAYG4B returns verified: true', async () => {
    try {
      const response = await axios.get(`${API_URL}/api/identity/${TEST_OWNLY_ID}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      });
      
      if (!response.data.verified) {
        const err = new Error(`GET /api/identity/${TEST_OWNLY_ID} returned verified: false - bug confirmed!`);
        err.details = {
          expected: { verified: true, verification_level: 'full' },
          actual: response.data,
          rootCause: 'Identity API cannot find user by Ownly ID',
        };
        throw err;
      }

      if (response.data.verification_level !== 'full') {
        const err = new Error(`Verification level is '${response.data.verification_level}', expected 'full'`);
        err.details = {
          expected: 'full',
          actual: response.data.verification_level,
        };
        throw err;
      }

      log(colors.yellow, `  ✓ Verified: ${response.data.verified}`);
      log(colors.yellow, `  ✓ Verification Level: ${response.data.verification_level}`);
    } catch (err) {
      if (err.response) {
        // API returned an error response
        const apiErr = new Error(`API request failed: ${err.response.status} ${err.response.statusText}`);
        apiErr.details = {
          status: err.response.status,
          data: err.response.data,
        };
        throw apiErr;
      }
      throw err;
    }
  });

  // Test 3: POST /api/identity/verify with Ownly ID
  await test('Test 1.2: POST /api/identity/verify with ownly_id returns verified: true', async () => {
    try {
      const response = await axios.post(`${API_URL}/api/identity/verify`, {
        ownly_id: TEST_OWNLY_ID,
      }, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      });
      
      if (!response.data.verified) {
        const err = new Error(`POST /api/identity/verify returned verified: false - bug confirmed!`);
        err.details = {
          expected: { verified: true, can_trade: true },
          actual: response.data,
          rootCause: 'Identity API cannot find user by Ownly ID',
        };
        throw err;
      }

      if (!response.data.can_trade) {
        const err = new Error(`can_trade is false, expected true`);
        err.details = {
          expected: true,
          actual: response.data.can_trade,
        };
        throw err;
      }

      log(colors.yellow, `  ✓ Verified: ${response.data.verified}`);
      log(colors.yellow, `  ✓ Can Trade: ${response.data.can_trade}`);
    } catch (err) {
      if (err.response) {
        const apiErr = new Error(`API request failed: ${err.response.status} ${err.response.statusText}`);
        apiErr.details = {
          status: err.response.status,
          data: err.response.data,
        };
        throw apiErr;
      }
      throw err;
    }
  });

  // Summary
  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║                    Test Results Summary                    ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  log(colors.cyan, `Total Tests: ${testResults.passed + testResults.failed}`);
  log(colors.green, `Passed: ${testResults.passed}`);
  log(colors.red, `Failed: ${testResults.failed}\n`);

  if (testResults.counterexamples.length > 0) {
    log(colors.magenta, '╔════════════════════════════════════════════════════════════╗');
    log(colors.magenta, '║                  Counterexamples Found                     ║');
    log(colors.magenta, '╚════════════════════════════════════════════════════════════╝\n');

    testResults.counterexamples.forEach((ce, index) => {
      log(colors.yellow, `${index + 1}. ${ce.test}`);
      log(colors.red, `   Error: ${ce.error}`);
      if (ce.details) {
        log(colors.cyan, `   Details:`, JSON.stringify(ce.details, null, 2));
      }
      console.log();
    });

    log(colors.magenta, '╔════════════════════════════════════════════════════════════╗');
    log(colors.magenta, '║                    Bug Analysis                            ║');
    log(colors.magenta, '╚════════════════════════════════════════════════════════════╝\n');

    log(colors.yellow, 'Root Cause Analysis:');
    log(colors.yellow, '1. The external_user_id field in kyc_verifications table does NOT contain Ownly ID format');
    log(colors.yellow, '2. getKYCByUserId() queries external_user_id directly, which fails for Ownly ID queries');
    log(colors.yellow, '3. Identity API endpoints rely on getKYCByUserId(), so they also fail\n');

    log(colors.yellow, 'Expected Fix:');
    log(colors.yellow, '1. Add ownly_id column to kyc_verifications table');
    log(colors.yellow, '2. Update getKYCByUserId() to query ownly_id field when Ownly ID format detected');
    log(colors.yellow, '3. Backfill existing records with ownly_id data');
    log(colors.yellow, '4. Update createKYCVerification() to populate ownly_id field\n');

    log(colors.red, '✗ BUG CONFIRMED: Tests failed as expected on unfixed code');
    log(colors.magenta, '  This is CORRECT - the test proves the bug exists!\n');
  } else {
    log(colors.green, '✓ All tests passed!');
    log(colors.yellow, 'If this is UNFIXED code, the bug may not exist or root cause is incorrect.');
    log(colors.yellow, 'If this is FIXED code, the bug has been successfully resolved!\n');
  }

  return testResults.failed > 0 ? 1 : 0;
}

// Run tests
runBugConditionTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(err => {
    log(colors.red, 'Fatal error:', err.message);
    console.error(err);
    process.exit(1);
  });
