/**
 * Monitoring Dashboard
 * 
 * This script provides real-time monitoring and metrics for the Ownly B2B API.
 * 
 * Metrics tracked:
 * - API key usage
 * - Endpoint performance
 * - Error rates
 * - Rate limit violations
 * - Client activity
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Get API key usage summary
async function getUsageSummary(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('api_key_usage')
    .select('*')
    .gte('timestamp', startDate.toISOString());

  if (error) {
    console.error('Error fetching usage data:', error);
    return null;
  }

  return data;
}

// Get active API keys
async function getActiveKeys() {
  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching API keys:', error);
    return [];
  }

  return data || [];
}

// Calculate metrics
function calculateMetrics(usageData) {
  if (!usageData || usageData.length === 0) {
    return {
      totalRequests: 0,
      successRate: 0,
      avgResponseTime: 0,
      errorRate: 0,
      topEndpoints: [],
      topClients: [],
    };
  }

  const totalRequests = usageData.length;
  const successfulRequests = usageData.filter(r => r.status_code >= 200 && r.status_code < 300).length;
  const successRate = ((successfulRequests / totalRequests) * 100).toFixed(2);
  const errorRate = (((totalRequests - successfulRequests) / totalRequests) * 100).toFixed(2);

  const totalResponseTime = usageData.reduce((sum, r) => sum + (r.response_time_ms || 0), 0);
  const avgResponseTime = (totalResponseTime / totalRequests).toFixed(2);

  // Top endpoints
  const endpointCounts = {};
  usageData.forEach(r => {
    endpointCounts[r.endpoint] = (endpointCounts[r.endpoint] || 0) + 1;
  });
  const topEndpoints = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([endpoint, count]) => ({ endpoint, count }));

  // Top clients
  const clientCounts = {};
  usageData.forEach(r => {
    clientCounts[r.api_key_id] = (clientCounts[r.api_key_id] || 0) + 1;
  });
  const topClients = Object.entries(clientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([keyId, count]) => ({ keyId, count }));

  return {
    totalRequests,
    successRate,
    avgResponseTime,
    errorRate,
    topEndpoints,
    topClients,
  };
}

// Display dashboard
async function displayDashboard(days = 7) {
  console.log('\n📊 Ownly B2B API Monitoring Dashboard\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Get data
  const usageData = await getUsageSummary(days);
  const activeKeys = await getActiveKeys();

  if (!usageData) {
    console.log('❌ Failed to fetch usage data\n');
    return;
  }

  const metrics = calculateMetrics(usageData);

  // Display metrics
  console.log(`📅 Period: Last ${days} days\n`);

  console.log('🔑 API Keys:');
  console.log(`   Active: ${activeKeys.length}`);
  console.log(`   Total Requests: ${metrics.totalRequests}\n`);

  console.log('📈 Performance:');
  console.log(`   Success Rate: ${metrics.successRate}%`);
  console.log(`   Error Rate: ${metrics.errorRate}%`);
  console.log(`   Avg Response Time: ${metrics.avgResponseTime}ms\n`);

  if (metrics.topEndpoints.length > 0) {
    console.log('🔥 Top Endpoints:');
    metrics.topEndpoints.forEach((endpoint, index) => {
      console.log(`   ${index + 1}. ${endpoint.endpoint}: ${endpoint.count} requests`);
    });
    console.log('');
  }

  if (metrics.topClients.length > 0) {
    console.log('👥 Top Clients (by API Key ID):');
    for (const client of metrics.topClients) {
      // Get client name
      const key = activeKeys.find(k => k.id === client.keyId);
      const clientName = key ? key.client_name : 'Unknown';
      console.log(`   ${clientName}: ${client.count} requests`);
    }
    console.log('');
  }

  // Alerts
  console.log('⚠️  Alerts:');
  let hasAlerts = false;

  if (parseFloat(metrics.errorRate) > 5) {
    console.log(`   🚨 High error rate: ${metrics.errorRate}%`);
    hasAlerts = true;
  }

  if (parseFloat(metrics.avgResponseTime) > 1000) {
    console.log(`   🚨 Slow response time: ${metrics.avgResponseTime}ms`);
    hasAlerts = true;
  }

  // Check for rate limit violations
  for (const key of activeKeys) {
    const keyUsage = usageData.filter(r => r.api_key_id === key.id);
    const dailyUsage = keyUsage.length / days;

    if (dailyUsage > key.rate_limit * 0.9) {
      console.log(`   ⚠️  ${key.client_name} approaching rate limit (${dailyUsage.toFixed(0)}/${key.rate_limit} per day)`);
      hasAlerts = true;
    }
  }

  if (!hasAlerts) {
    console.log('   ✅ No alerts\n');
  } else {
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════\n');

  // Recent activity
  if (usageData.length > 0) {
    console.log('📝 Recent Activity (last 10 requests):\n');
    const recentActivity = usageData.slice(-10).reverse();

    recentActivity.forEach((record, index) => {
      const timestamp = new Date(record.timestamp).toLocaleString();
      const statusEmoji = record.status_code >= 200 && record.status_code < 300 ? '✅' : '❌';
      console.log(`${index + 1}. ${statusEmoji} ${record.method} ${record.endpoint}`);
      console.log(`   Status: ${record.status_code} | Time: ${record.response_time_ms}ms | ${timestamp}`);
    });
    console.log('');
  }
}

// Export metrics to JSON
async function exportMetrics(days = 7, outputFile = 'metrics.json') {
  const usageData = await getUsageSummary(days);
  const activeKeys = await getActiveKeys();
  const metrics = calculateMetrics(usageData);

  const report = {
    generatedAt: new Date().toISOString(),
    period: `${days} days`,
    activeKeys: activeKeys.length,
    metrics,
    rawData: usageData,
  };

  const fs = await import('fs');
  fs.writeFileSync(outputFile, JSON.stringify(report, null, 2));

  console.log(`✅ Metrics exported to ${outputFile}\n`);
}

// CLI Interface
async function main() {
  const command = process.argv[2];
  const days = parseInt(process.argv[3]) || 7;

  switch (command) {
    case 'dashboard':
    case undefined:
      await displayDashboard(days);
      break;

    case 'export':
      const outputFile = process.argv[4] || 'metrics.json';
      await exportMetrics(days, outputFile);
      break;

    default:
      console.log('Usage:');
      console.log('  node monitoring-dashboard.js [dashboard] [days] - Display dashboard (default: 7 days)');
      console.log('  node monitoring-dashboard.js export [days] [output_file] - Export metrics to JSON\n');
      console.log('Examples:');
      console.log('  node monitoring-dashboard.js');
      console.log('  node monitoring-dashboard.js dashboard 30');
      console.log('  node monitoring-dashboard.js export 7 metrics.json\n');
  }

  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
