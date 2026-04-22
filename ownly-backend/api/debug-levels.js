#!/usr/bin/env node

/**
 * Debug script to list available Sumsub levels
 */

import axios from 'axios';
import crypto from 'crypto';

const APP_TOKEN = 'sbx:YZusfUx6nmgYQnE2VRrhrr75.ws6i16CesJSzfBJWuVCing7Dq6pd0Lj1';
const SECRET_KEY = '7YAX8ceFgucRX6lZGxBixjgqiQdE3VIK';
const BASE_URL = 'https://api.sumsub.com';

function generateSignature(method, url, timestamp, body = null) {
  const data = timestamp + method.toUpperCase() + url + (body || '');
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(data)
    .digest('hex');
}

async function getAvailableLevels() {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const path = '/resources/levels';
  const signature = generateSignature('GET', path, timestamp);

  try {
    const response = await axios.get(`${BASE_URL}${path}`, {
      headers: {
        'X-App-Token': APP_TOKEN,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': timestamp,
      },
    });

    console.log('\n✓ Available Sumsub Levels:\n');
    response.data.forEach((level, i) => {
      console.log(`${i + 1}. ${level.name}`);
    });
    console.log('\n');
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

getAvailableLevels();
