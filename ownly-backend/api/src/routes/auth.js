/**
 * Auth Routes — email/password via Supabase Auth
 * Updated: 2026-04-27 - Returns user role from database
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

export const authRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ── POST /api/auth/register ───────────────────────────────────────────────────
authRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });
    if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email confirmation for now
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
      }
      return res.status(400).json({ error: error.message });
    }

    return res.json({ success: true, userId: data.user.id, email: data.user.email });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes('Invalid login')) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos' });
      }
      return res.status(401).json({ error: error.message });
    }

    // Get user role from users table
    let userRole = 'user'; // default role
    try {
      console.log('[AUTH] Fetching role for email:', email);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('email', email)
        .single();
      
      console.log('[AUTH] Query result - data:', userData, 'error:', userError);
      
      if (!userError && userData) {
        userRole = userData.role;
        console.log('[AUTH] Role set to:', userRole);
      } else {
        console.log('[AUTH] Using default role due to error or no data');
      }
    } catch (roleError) {
      console.error('[AUTH] Error fetching user role:', roleError);
      // Continue with default role if query fails
    }

    return res.json({
      success: true,
      userId: data.user.id,
      email: data.user.email,
      token: data.session.access_token,
      role: userRole,
    });
  } catch (err) {
    next(err);
  }
});
