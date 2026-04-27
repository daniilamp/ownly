/**
 * Send Client Notification Email
 * 
 * This script helps you send the API v2.0 migration notification to clients.
 * It generates personalized emails based on CLIENT_NOTIFICATION_EMAIL.md template.
 */

import fs from 'fs';
import path from 'path';

// Client list - Add your clients here
const clients = [
  {
    name: 'Example Prop Firm',
    email: 'tech@examplepropfirm.com',
    company: 'Example Prop Firm',
    useCase: 'prop firm',
    estimatedVolume: '1000 requests/day',
  },
  // Add more clients here
];

function generateEmail(client) {
  // Read the template
  const templatePath = path.join(process.cwd(), '../../CLIENT_NOTIFICATION_EMAIL.md');
  let template = fs.readFileSync(templatePath, 'utf-8');

  // Replace placeholders
  template = template.replace(/\[NOMBRE_CLIENTE\]/g, client.name);
  template = template.replace(/\[EMPRESA\]/g, client.company);

  return template;
}

function main() {
  console.log('📧 Client Notification Email Generator\n');
  console.log('═══════════════════════════════════════════════════════\n');

  if (clients.length === 0) {
    console.log('⚠️  No clients configured');
    console.log('   Edit send-client-notification.js and add clients to the array\n');
    return;
  }

  console.log(`Found ${clients.length} client(s):\n`);

  clients.forEach((client, index) => {
    console.log(`${index + 1}. ${client.name} (${client.email})`);
    console.log(`   Company: ${client.company}`);
    console.log(`   Use Case: ${client.useCase}`);
    console.log(`   Estimated Volume: ${client.estimatedVolume}\n`);

    // Generate personalized email
    const email = generateEmail(client);

    // Save to file
    const outputPath = path.join(process.cwd(), `email-${client.name.toLowerCase().replace(/\s+/g, '-')}.md`);
    fs.writeFileSync(outputPath, email);

    console.log(`   ✅ Email generated: ${outputPath}\n`);
  });

  console.log('═══════════════════════════════════════════════════════');
  console.log('📋 NEXT STEPS:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('1. Review generated email files');
  console.log('2. Copy content to your email client');
  console.log('3. Attach CLIENT_API_DOCUMENTATION.md');
  console.log('4. Send to clients');
  console.log('5. Track responses and generate API keys\n');

  console.log('💡 TIP: Use a service like SendGrid, Mailchimp, or your email');
  console.log('   provider to send professional emails with tracking.\n');
}

main();
