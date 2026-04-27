/**
 * API Key Management System
 * 
 * This script provides a CLI interface to manage API keys for B2B clients.
 * 
 * Commands:
 * - generate: Generate a new API key for a client
 * - list: List all API keys
 * - revoke: Revoke an API key
 * - update: Update API key permissions or rate limit
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Generate a secure API key
function generateApiKey() {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  return `ownly_${randomBytes}`;
}

// Hash API key for storage
function hashApiKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Generate new API key for a client
async function generateKey(clientId, clientName, permissions = ['verify:read'], rateLimit = 1000) {
  console.log('\n🔑 Generating New API Key...\n');

  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      key_hash: keyHash,
      client_id: clientId,
      client_name: clientName,
      permissions: permissions,
      status: 'active',
      rate_limit: rateLimit,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error generating API key:', error.message);
    return null;
  }

  console.log('✅ API Key Generated Successfully!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Client ID: ${clientId}`);
  console.log(`Client Name: ${clientName}`);
  console.log(`API Key: ${apiKey}`);
  console.log(`Permissions: ${permissions.join(', ')}`);
  console.log(`Rate Limit: ${rateLimit} requests/day`);
  console.log(`Status: active`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('⚠️  IMPORTANT: Save this API key securely!');
  console.log('   It will NOT be shown again.\n');

  return { apiKey, data };
}

// List all API keys
async function listKeys() {
  console.log('\n📋 Listing All API Keys...\n');

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error listing API keys:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('ℹ️  No API keys found\n');
    return;
  }

  console.log(`Found ${data.length} API key(s):\n`);

  data.forEach((key, index) => {
    console.log(`${index + 1}. ${key.client_name} (${key.client_id})`);
    console.log(`   ID: ${key.id}`);
    console.log(`   Permissions: ${key.permissions.join(', ')}`);
    console.log(`   Rate Limit: ${key.rate_limit} requests/day`);
    console.log(`   Status: ${key.status}`);
    console.log(`   Created: ${new Date(key.created_at).toLocaleDateString()}`);
    console.log(`   Last Used: ${key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}`);
    console.log('');
  });
}

// Revoke an API key
async function revokeKey(keyId) {
  console.log(`\n🚫 Revoking API Key ${keyId}...\n`);

  const { error } = await supabase
    .from('api_keys')
    .update({ status: 'revoked' })
    .eq('id', keyId);

  if (error) {
    console.error('❌ Error revoking API key:', error.message);
    return;
  }

  console.log('✅ API Key Revoked Successfully\n');
}

// Update API key
async function updateKey(keyId, updates) {
  console.log(`\n✏️  Updating API Key ${keyId}...\n`);

  const { error } = await supabase
    .from('api_keys')
    .update(updates)
    .eq('id', keyId);

  if (error) {
    console.error('❌ Error updating API key:', error.message);
    return;
  }

  console.log('✅ API Key Updated Successfully\n');
}

// Get API key usage stats
async function getUsageStats(keyId) {
  console.log(`\n📊 API Key Usage Stats...\n`);

  const { data, error } = await supabase
    .from('api_key_usage')
    .select('*')
    .eq('api_key_id', keyId)
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error) {
    console.error('❌ Error fetching usage stats:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('ℹ️  No usage data found\n');
    return;
  }

  console.log(`Found ${data.length} usage record(s):\n`);

  // Group by endpoint
  const byEndpoint = {};
  data.forEach(record => {
    if (!byEndpoint[record.endpoint]) {
      byEndpoint[record.endpoint] = { count: 0, totalDuration: 0 };
    }
    byEndpoint[record.endpoint].count++;
    byEndpoint[record.endpoint].totalDuration += record.response_time_ms || 0;
  });

  console.log('Usage by Endpoint:');
  Object.entries(byEndpoint).forEach(([endpoint, stats]) => {
    const avgDuration = stats.count > 0 ? (stats.totalDuration / stats.count).toFixed(2) : 0;
    console.log(`  ${endpoint}: ${stats.count} requests (avg ${avgDuration}ms)`);
  });

  console.log('');
}

// CLI Interface
async function main() {
  const command = process.argv[2];

  console.log('🔐 Ownly API Key Management System\n');

  switch (command) {
    case 'generate':
      const clientId = process.argv[3];
      const clientName = process.argv[4];
      const permissions = process.argv[5] ? process.argv[5].split(',') : ['verify:read'];
      const rateLimit = process.argv[6] ? parseInt(process.argv[6]) : 1000;

      if (!clientId || !clientName) {
        console.log('Usage: node manage-api-keys.js generate <client_id> <client_name> [permissions] [rate_limit]');
        console.log('Example: node manage-api-keys.js generate prop-firm-1 "Prop Firm Inc" verify:read,verify:write 5000\n');
        break;
      }

      await generateKey(clientId, clientName, permissions, rateLimit);
      break;

    case 'list':
      await listKeys();
      break;

    case 'revoke':
      const revokeId = process.argv[3];
      if (!revokeId) {
        console.log('Usage: node manage-api-keys.js revoke <key_id>\n');
        break;
      }
      await revokeKey(revokeId);
      break;

    case 'update':
      const updateId = process.argv[3];
      const updateField = process.argv[4];
      const updateValue = process.argv[5];

      if (!updateId || !updateField || !updateValue) {
        console.log('Usage: node manage-api-keys.js update <key_id> <field> <value>');
        console.log('Example: node manage-api-keys.js update 123 rate_limit 5000\n');
        break;
      }

      const updates = {};
      if (updateField === 'permissions') {
        updates[updateField] = updateValue.split(',');
      } else if (updateField === 'rate_limit') {
        updates[updateField] = parseInt(updateValue);
      } else {
        updates[updateField] = updateValue;
      }

      await updateKey(updateId, updates);
      break;

    case 'usage':
      const usageId = process.argv[3];
      if (!usageId) {
        console.log('Usage: node manage-api-keys.js usage <key_id>\n');
        break;
      }
      await getUsageStats(usageId);
      break;

    default:
      console.log('Available Commands:');
      console.log('  generate <client_id> <client_name> [permissions] [rate_limit] - Generate new API key');
      console.log('  list - List all API keys');
      console.log('  revoke <key_id> - Revoke an API key');
      console.log('  update <key_id> <field> <value> - Update API key');
      console.log('  usage <key_id> - View usage stats for an API key\n');
      console.log('Examples:');
      console.log('  node manage-api-keys.js generate prop-firm-1 "Prop Firm Inc"');
      console.log('  node manage-api-keys.js list');
      console.log('  node manage-api-keys.js revoke abc-123');
      console.log('  node manage-api-keys.js update abc-123 rate_limit 5000');
      console.log('  node manage-api-keys.js usage abc-123\n');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
