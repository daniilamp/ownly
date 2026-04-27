/**
 * Access Routes — almacenamiento temporal de documentos compartidos
 * El contenido se guarda en Supabase con TTL, el link solo lleva el access_id
 */

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

export const accessRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// POST /api/access — guardar contenido compartido
accessRouter.post('/', async (req, res, next) => {
  try {
    const { accessId, docTitle, docType, mimeType, fileName, expiresAt, content } = req.body;
    if (!accessId || !content) return res.status(400).json({ error: 'accessId y content requeridos' });

    const { error } = await supabase
      .from('shared_access')
      .upsert({
        id: accessId,
        doc_title: docTitle,
        doc_type: docType,
        mime_type: mimeType,
        file_name: fileName,
        expires_at: expiresAt,
        content: content,
        status: 'active',
        created_at: new Date().toISOString(),
      });

    if (error) throw error;
    return res.json({ success: true, accessId });
  } catch (err) {
    next(err);
  }
});

// GET /api/access/:accessId — obtener contenido
accessRouter.get('/:accessId', async (req, res, next) => {
  try {
    const { accessId } = req.params;

    const { data, error } = await supabase
      .from('shared_access')
      .select('*')
      .eq('id', accessId)
      .single();

    if (error || !data) return res.status(404).json({ valid: false, reason: 'Acceso no encontrado' });
    if (data.status === 'revoked') return res.json({ valid: false, reason: 'Acceso revocado por el propietario' });
    if (new Date(data.expires_at) < new Date()) {
      await supabase.from('shared_access').update({ status: 'expired' }).eq('id', accessId);
      return res.json({ valid: false, reason: 'Este acceso ha expirado' });
    }

    return res.json({
      valid: true,
      access: {
        id: data.id,
        docTitle: data.doc_title,
        docType: data.doc_type,
        mimeType: data.mime_type,
        fileName: data.file_name,
        expiresAt: data.expires_at,
        content: data.content,
        status: data.status,
      }
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/access/:accessId — revocar
accessRouter.delete('/:accessId', async (req, res, next) => {
  try {
    const { accessId } = req.params;
    await supabase.from('shared_access').update({ status: 'revoked', content: null }).eq('id', accessId);
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
