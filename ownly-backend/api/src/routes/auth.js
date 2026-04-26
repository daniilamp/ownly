/**
 * Auth Routes — email/password via Supabase Auth
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

    return res.json({
      success: true,
      userId: data.user.id,
      email: data.user.email,
      token: data.session.access_token,
    });
  } catch (err) {
    next(err);
  }
});
