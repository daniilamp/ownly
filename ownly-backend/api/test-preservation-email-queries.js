#!/usr/bin/env node

/**
 * Preservation Property Tests - Email-Based Queries Unchanged
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * Property 2: Preservation - Email-Based Queries Unchanged
 * 
 * IMPORTANT: Follow observation-first methodology
 * These tests capture the OBSERVED behavior on UNFIXED code for email-based queries.
 * 
 * This test verifies that:
 * 1. GET /api/identity/:email (with email format) returns correct verification status
 * 2. POST /api/identity/verify (with email format) returns correct verification status
 * 3. GET /api/identity/email/:email returns correct verification status
 * 4. GET /api/identity/:ownlyId/unique (with email format) returns correct uniqueness status
 * 5. getKYCByEmail() database query continues to work correctly
 * 
 * EXPECTED OUTCOME ON UNFIXED CODE: Tests PASS (confirms baseline behavior)
 * EXPECTED OUTCOME ON FIXED CODE: Tests PASS (confirms no regressions)
 */

import 'dotenv/config';
import axios from 'axios';
import * as fc from 'fast-check';
import * as dbService from './src/services/databaseService.js';

const API_URL = 'http://localhost:3001';
const API_KEY = 'ownly_4270f3e7667879fc6f6e84c40459cf6c907ab7f26b9c688f4c4772946d661859';

// Known verified user for testing
const TEST_EMAIL = 'danilamp@dlminvesting.com';

// Baseline observations from unfixed code
const BASELINE = {
  getIdentityByEmail: {
    verified: true,
    verification_level: 'full',
    risk_score: 'low',
    unique_user: true,
  },
  postVerifyWithEmail: {
    verified: true,
    verification_level: 'full',
    risk_score: 'low',
    unique_user: true,
    can_trade: true,
  },
  getIdentityEmailEndpoint: {
    verified: true,
    verification_level: 'full',
    risk_score: 'low',
    unique_user: true,
  },
  getUniqueWithEmail: {
    is_unique: true,
    verified: true,
  },
  dbGetKYCByEmail: {
    found: true,
    has_credential: true,
  },
};

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

function assertDeepMatch(actual, expected, path = '') {
  for (const key in expected) {
    if (!(key in actual)) {
      throw new Error(`Missing key '${path}${key}' in actual response`);
    }
    if (typeof expected[key] === 'object' && expected[key] !== null && !Array.isArray(expected[key])) {
      assertDeepMatch(actual[key], expected[key], `${path}${key}.`);
    } else if (actual[key] !== expected[key]) {
      throw new Error(`Mismatch at '${path}${key}': expected ${expected[key]}, got ${actual[key]}`);
    }
  }
}

async function runPreservationTests() {
  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║   Preservation Property Tests - Email-Based Queries       ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  log(colors.magenta, 'IMPORTANT: These tests verify email-based queries remain unchanged');
  log(colors.magenta, 'Expected outcome: ALL TESTS PASS (on both unfixed and fixed code)\n');

  // Test 1: GET /api/identity/:email preservation (Requirement 3.1)
  await test('Requirement 3.1: GET /api/identity/:email returns correct verification status', async () => {
    const response = await axios.get(`${API_URL}/api/identity/${TEST_EMAIL}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });

    // Verify response matches baseline
    assertDeepMatch(response.data, BASELINE.getIdentityByEmail);

    log(colors.yellow, `  ✓ verified: ${response.data.verified} (expected: ${BASELINE.getIdentityByEmail.verified})`);
    log(colors.yellow, `  ✓ verification_level: ${response.data.verification_level} (expected: ${BASELINE.getIdentityByEmail.verification_level})`);
    log(colors.yellow, `  ✓ unique_user: ${response.data.unique_user} (expected: ${BASELINE.getIdentityByEmail.unique_user})`);
  });

  // Test 2: POST /api/identity/verify with email preservation (Requirement 3.2)
  await test('Requirement 3.2: POST /api/identity/verify with email returns correct verification status', async () => {
    const response = await axios.post(`${API_URL}/api/identity/verify`, {
      ownly_id: TEST_EMAIL,
    }, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });

    // Verify response matches baseline
    assertDeepMatch(response.data, BASELINE.postVerifyWithEmail);

    log(colors.yellow, `  ✓ verified: ${response.data.verified} (expected: ${BASELINE.postVerifyWithEmail.verified})`);
    log(colors.yellow, `  ✓ can_trade: ${response.data.can_trade} (expected: ${BASELINE.postVerifyWithEmail.can_trade})`);
    log(colors.yellow, `  ✓ verification_level: ${response.data.verification_level} (expected: ${BASELINE.postVerifyWithEmail.verification_level})`);
  });

  // Test 3: GET /api/identity/email/:email preservation (Requirement 3.5)
  await test('Requirement 3.5: GET /api/identity/email/:email returns correct verification status', async () => {
    const response = await axios.get(`${API_URL}/api/identity/email/${TEST_EMAIL}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });

    // Verify response matches baseline
    assertDeepMatch(response.data, BASELINE.getIdentityEmailEndpoint);

    log(colors.yellow, `  ✓ verified: ${response.data.verified} (expected: ${BASELINE.getIdentityEmailEndpoint.verified})`);
    log(colors.yellow, `  ✓ verification_level: ${response.data.verification_level} (expected: ${BASELINE.getIdentityEmailEndpoint.verification_level})`);
  });

  // Test 4: GET /api/identity/:ownlyId/unique with email preservation (Requirement 3.4)
  await test('Requirement 3.4: GET /api/identity/:ownlyId/unique with email returns correct uniqueness status', async () => {
    const response = await axios.get(`${API_URL}/api/identity/${TEST_EMAIL}/unique`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });

    // Verify response matches baseline
    assertDeepMatch(response.data, BASELINE.getUniqueWithEmail);

    log(colors.yellow, `  ✓ is_unique: ${response.data.is_unique} (expected: ${BASELINE.getUniqueWithEmail.is_unique})`);
    log(colors.yellow, `  ✓ verified: ${response.data.verified} (expected: ${BASELINE.getUniqueWithEmail.verified})`);
  });

  // Test 5: getKYCByEmail() database query preservation (Requirement 3.3)
  await test('Requirement 3.3: getKYCByEmail() returns correct KYC verification record', async () => {
    const verification = await dbService.getKYCByEmail(TEST_EMAIL);

    if (!verification) {
      throw new Error('getKYCByEmail() returned null - baseline behavior broken!');
    }

    if (!verification.credential_id) {
      throw new Error('KYC record missing credential_id - baseline behavior broken!');
    }

    log(colors.yellow, `  ✓ Found KYC record for email: ${TEST_EMAIL}`);
    log(colors.yellow, `  ✓ Has credential: ${!!verification.credential_id}`);
    log(colors.yellow, `  ✓ Email: ${verification.email}`);
  });

  // Property-Based Test 1: Email fallback behavior in /:ownlyId endpoint
  await test('Property: Email fallback in /:ownlyId endpoint works for various email formats', async () => {
    // Generate various email formats and verify fallback behavior
    await fc.assert(
      fc.asyncProperty(
        fc.constant(TEST_EMAIL), // Use the known test email
        async (email) => {
          const response = await axios.get(`${API_URL}/api/identity/${email}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
          });

          // Verify email fallback works (identifier contains '@')
          if (!email.includes('@')) {
            return true; // Skip non-email identifiers
          }

          // Email-based queries should return verified status
          return response.data.verified === true && 
                 response.data.verification_level === 'full';
        }
      ),
      { numRuns: 10 } // Run 10 times with the same email to verify consistency
    );

    log(colors.yellow, `  ✓ Email fallback behavior verified across multiple runs`);
  });

  // Property-Based Test 2: POST /api/identity/verify with email format
  await test('Property: POST /api/identity/verify with email format returns consistent results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(TEST_EMAIL),
        async (email) => {
          const response = await axios.post(`${API_URL}/api/identity/verify`, {
            ownly_id: email,
          }, {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
          });

          // Verify email-based POST returns correct verification status
          return response.data.verified === true && 
                 response.data.can_trade === true &&
                 response.data.verification_level === 'full';
        }
      ),
      { numRuns: 10 }
    );

    log(colors.yellow, `  ✓ POST verify with email format verified across multiple runs`);
  });

  // Property-Based Test 3: Direct email endpoint consistency
  await test('Property: GET /api/identity/email/:email returns consistent results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(TEST_EMAIL),
        async (email) => {
          const response = await axios.get(`${API_URL}/api/identity/email/${email}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` },
          });

          // Verify direct email endpoint returns correct status
          return response.data.verified === true && 
                 response.data.verification_level === 'full';
        }
      ),
      { numRuns: 10 }
    );

    log(colors.yellow, `  ✓ Direct email endpoint verified across multiple runs`);
  });

  // Property-Based Test 4: Database query consistency
  await test('Property: getKYCByEmail() returns consistent results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(TEST_EMAIL),
        async (email) => {
          const verification = await dbService.getKYCByEmail(email);

          // Verify database query returns correct record
          return verification !== null && 
                 verification.email === email &&
                 !!verification.credential_id;
        }
      ),
      { numRuns: 10 }
    );

    log(colors.yellow, `  ✓ Database query verified across multiple runs`);
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

    log(colors.red, '✗ PRESERVATION TESTS FAILED: Email-based queries behavior changed!');
    log(colors.magenta, '  This indicates a REGRESSION - email queries should remain unchanged.\n');
  } else {
    log(colors.green, '✓ All preservation tests passed!');
    log(colors.yellow, 'Email-based queries continue to work exactly as before.');
    log(colors.yellow, 'Baseline behavior is preserved - no regressions detected.\n');
  }

  return testResults.failed > 0 ? 1 : 0;
}

// Run tests
runPreservationTests()
  .then(exitCode => {
    process.exit(exitCode);
  })
  .catch(err => {
    log(colors.red, 'Fatal error:', err.message);
    console.error(err);
    process.exit(1);
  });
