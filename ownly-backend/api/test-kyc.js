#!/usr/bin/env node

/**
 * KYC API Testing Script
 * Ejecuta: node test-kyc.js
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001';

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

async function test(name, fn) {
  log(colors.cyan, `\n▶ ${name}`);
  try {
    await fn();
    log(colors.green, `✓ ${name} passed`);
  } catch (err) {
    log(colors.red, `✗ ${name} failed`);
    log(colors.red, err.message);
    if (err.response?.data) {
      log(colors.red, JSON.stringify(err.response.data, null, 2));
    }
  }
}

async function runTests() {
  log(colors.blue, '\n╔════════════════════════════════════════╗');
  log(colors.blue, '║     OWNLY KYC API - Testing Suite      ║');
  log(colors.blue, '╚════════════════════════════════════════╝\n');

  let applicantId = null;
  let userId = null;

  // Test 1: Init KYC
  await test('POST /api/kyc/init - Create applicant', async () => {
    userId = `user_test_${Date.now()}`;
    const response = await axios.post(`${API_URL}/api/kyc/init`, {
      userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });

    if (!response.data.success) throw new Error('Response not successful');
    if (!response.data.applicantId) throw new Error('No applicantId returned');
    if (!response.data.sdkToken) throw new Error('No sdkToken returned');

    applicantId = response.data.applicantId;
    log(colors.yellow, `  Applicant ID: ${applicantId}`);
    log(colors.yellow, `  SDK Token: ${response.data.sdkToken.substring(0, 20)}...`);
  });

  // Test 2: Get status
  await test('GET /api/kyc/status/:applicantId - Get verification status', async () => {
    if (!applicantId) throw new Error('No applicantId from previous test');

    const response = await axios.get(`${API_URL}/api/kyc/status/${applicantId}`);

    if (!response.data.success) throw new Error('Response not successful');
    if (!response.data.applicantId) throw new Error('No applicantId in response');

    log(colors.yellow, `  Status: ${response.data.status}`);
    log(colors.yellow, `  Review Answer: ${response.data.reviewResult?.reviewAnswer || 'pending'}`);
  });

  // Test 3: Get user KYC
  await test('GET /api/kyc/user/:userId - Get user verification', async () => {
    if (!userId) throw new Error('No userId from previous test');

    const response = await axios.get(`${API_URL}/api/kyc/user/${userId}`);

    if (!response.data.success) throw new Error('Response not successful');
    if (!response.data.verification) throw new Error('No verification in response');

    log(colors.yellow, `  Email: ${response.data.verification.email}`);
    log(colors.yellow, `  Status: ${response.data.verification.status}`);
    log(colors.yellow, `  Credentials: ${response.data.credentials.length}`);
  });

  // Test 4: Get stats
  await test('GET /api/kyc/stats - Get verification statistics', async () => {
    const response = await axios.get(`${API_URL}/api/kyc/stats`);

    if (!response.data.success) throw new Error('Response not successful');
    if (!response.data.stats) throw new Error('No stats in response');

    log(colors.yellow, `  Total: ${response.data.stats.total}`);
    log(colors.yellow, `  Approved: ${response.data.stats.approved}`);
    log(colors.yellow, `  Rejected: ${response.data.stats.rejected}`);
    log(colors.yellow, `  Pending: ${response.data.stats.pending}`);
  });

  // Test 5: Get recent
  await test('GET /api/kyc/recent - Get recent verifications', async () => {
    const response = await axios.get(`${API_URL}/api/kyc/recent?limit=5`);

    if (!response.data.success) throw new Error('Response not successful');
    if (!Array.isArray(response.data.verifications)) throw new Error('No verifications array');

    log(colors.yellow, `  Recent verifications: ${response.data.verifications.length}`);
  });

  // Test 6: Duplicate init (should return existing)
  await test('POST /api/kyc/init - Duplicate user (should return existing)', async () => {
    const response = await axios.post(`${API_URL}/api/kyc/init`, {
      userId,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
    });

    if (!response.data.success) throw new Error('Response not successful');
    if (response.data.applicantId !== applicantId) {
      throw new Error('Should return same applicantId for duplicate user');
    }
    if (!response.data.existing) {
      log(colors.yellow, `  Note: existing flag not set, but applicantId matches`);
    }

    log(colors.yellow, `  Returned existing applicant: ${applicantId}`);
  });

  log(colors.blue, '\n╔════════════════════════════════════════╗');
  log(colors.green, '║        All tests completed! ✓          ║');
  log(colors.blue, '╚════════════════════════════════════════╝\n');

  log(colors.yellow, 'Next steps:');
  log(colors.yellow, '1. Go to https://cockpit.sumsub.com/');
  log(colors.yellow, `2. Find applicant: ${applicantId}`);
  log(colors.yellow, '3. Simulate approval or wait for automatic review');
  log(colors.yellow, '4. Run this script again to see updated status');
  log(colors.yellow, '5. Check database in Supabase for records\n');
}

// Run tests
runTests().catch(err => {
  log(colors.red, 'Fatal error:', err.message);
  process.exit(1);
});
