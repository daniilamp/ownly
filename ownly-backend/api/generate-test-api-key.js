#!/usr/bin/env node

/**
 * Generate a test API key for bug condition exploration
 */

import 'dotenv/config';
import * as apiKeyService from './src/services/apiKeyService.js';

async function generateTestKey() {
  try {
    console.log('Generating test API key...');
    
    const result = await apiKeyService.generateApiKey(
      'test-client-bugfix',
      'Test Client for Bugfix Testing',
      {
        permissions: ['verify:read', '*'],
        rateLimit: 10000,
        description: 'Test API key for bug condition exploration',
      }
    );

    console.log('\n✓ API Key generated successfully!');
    console.log('\nAPI Key:', result.apiKey);
    console.log('\nClient ID:', result.record.client_id);
    console.log('Client Name:', result.record.client_name);
    console.log('Permissions:', result.record.permissions);
    console.log('\nSave this API key - it will not be shown again!');
    
  } catch (err) {
    console.error('Error generating API key:', err.message);
    process.exit(1);
  }
}

generateTestKey();
