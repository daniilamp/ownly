#!/usr/bin/env node

/**
 * Observation Script - Email-Based Query Behavior
 * 
 * This script observes the CURRENT behavior of email-based queries on UNFIXED code.
 * We will use these observations to write preservation property tests.
 * 
 * Observing:
 * 1. GET /api/identity/:email (with email format)
 * 2. POST /api/identity/verify (with email format)
 * 3. GET /api/identity/email/:email
 * 4. GET /api/identity/:ownlyId/unique (with email format)
 */

import 'dotenv/config';
import axios from 'axios';
import * as dbService from './src/services/databaseService.js';

const API_URL = 'http://localhost:3001';
const API_KEY = 'ownly_4270f3e7667879fc6f6e84c40459cf6c907ab7f26b9c688f4c4772946d661859';

const TEST_EMAIL = 'danilamp@dlminvesting.com';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

async function observeEmailBehavior() {
  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║     Observing Email-Based Query Behavior (Baseline)       ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  const observations = {};

  // Observation 1: GET /api/identity/:email
  log(colors.cyan, '1. Observing GET /api/identity/:email');
  try {
    const response = await axios.get(`${API_URL}/api/identity/${TEST_EMAIL}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    observations.getIdentityByEmail = response.data;
    log(colors.green, '   Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    log(colors.yellow, '   Error:', err.message);
    observations.getIdentityByEmail = { error: err.message };
  }

  // Observation 2: POST /api/identity/verify with email
  log(colors.cyan, '\n2. Observing POST /api/identity/verify (with email)');
  try {
    const response = await axios.post(`${API_URL}/api/identity/verify`, {
      ownly_id: TEST_EMAIL,
    }, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    observations.postVerifyWithEmail = response.data;
    log(colors.green, '   Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    log(colors.yellow, '   Error:', err.message);
    observations.postVerifyWithEmail = { error: err.message };
  }

  // Observation 3: GET /api/identity/email/:email
  log(colors.cyan, '\n3. Observing GET /api/identity/email/:email');
  try {
    const response = await axios.get(`${API_URL}/api/identity/email/${TEST_EMAIL}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    observations.getIdentityEmailEndpoint = response.data;
    log(colors.green, '   Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    log(colors.yellow, '   Error:', err.message);
    observations.getIdentityEmailEndpoint = { error: err.message };
  }

  // Observation 4: GET /api/identity/:ownlyId/unique with email
  log(colors.cyan, '\n4. Observing GET /api/identity/:ownlyId/unique (with email)');
  try {
    const response = await axios.get(`${API_URL}/api/identity/${TEST_EMAIL}/unique`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    observations.getUniqueWithEmail = response.data;
    log(colors.green, '   Response:', JSON.stringify(response.data, null, 2));
  } catch (err) {
    log(colors.yellow, '   Error:', err.message);
    observations.getUniqueWithEmail = { error: err.message };
  }

  // Observation 5: Database query - getKYCByEmail
  log(colors.cyan, '\n5. Observing getKYCByEmail() database query');
  try {
    const verification = await dbService.getKYCByEmail(TEST_EMAIL);
    if (verification) {
      observations.dbGetKYCByEmail = {
        found: true,
        status: verification.status,
        review_answer: verification.review_answer,
        external_user_id: verification.external_user_id,
        email: verification.email,
        has_credential: !!verification.credential_id,
      };
      log(colors.green, '   Result:', JSON.stringify(observations.dbGetKYCByEmail, null, 2));
    } else {
      observations.dbGetKYCByEmail = { found: false };
      log(colors.yellow, '   Result: Not found');
    }
  } catch (err) {
    log(colors.yellow, '   Error:', err.message);
    observations.dbGetKYCByEmail = { error: err.message };
  }

  log(colors.blue, '\n╔════════════════════════════════════════════════════════════╗');
  log(colors.blue, '║                  Observation Summary                       ║');
  log(colors.blue, '╚════════════════════════════════════════════════════════════╝\n');

  log(colors.magenta, 'These observations represent the BASELINE behavior that must be preserved.');
  log(colors.magenta, 'We will write property-based tests to ensure this behavior remains unchanged.\n');

  return observations;
}

observeEmailBehavior()
  .then(observations => {
    log(colors.green, '\n✓ Observation complete');
    process.exit(0);
  })
  .catch(err => {
    log(colors.yellow, 'Fatal error:', err.message);
    console.error(err);
    process.exit(1);
  });
