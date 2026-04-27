#!/usr/bin/env node
/**
 * Create Initial Admin User
 * Run this script to create the first admin account
 * 
 * Usage: node create-admin-user.js --email admin@ownly.com
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createAdminUser() {
  const args = process.argv.slice(2);
  const emailArg = args.find(a => a.startsWith('--email='));
  const email = emailArg ? emailArg.split('=')[1] : args[args.indexOf('--email') + 1];

  if (!email) {
    console.error('Usage: node create-admin-user.js --email=admin@example.com');
    process.exit(1);
  }

  console.log(`Creating admin user: ${email}`);

  try {
    // Check if user already exists
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.role === 'admin') {
        console.log(`✅ User ${email} is already an admin`);
        return;
      }

      // Upgrade to admin
      const { data: updated, error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('email', email)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ User ${email} upgraded to admin role`);
      console.log('User ID:', updated.id);
      return;
    }

    // Create new admin user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        role: 'admin',
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Admin user created successfully`);
    console.log('User ID:', newUser.id);
    console.log('Email:', newUser.email);
    console.log('Role:', newUser.role);
    console.log('\n⚠️  Remember to create a Supabase auth account for this user if needed.');

  } catch (err) {
    console.error('❌ Error creating admin user:', err.message);
    process.exit(1);
  }
}

createAdminUser();
