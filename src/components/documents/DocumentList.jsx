import { Trash2, Eye, Lock, Share2, X, QrCode, Copy, Check, Link2, Ban, Clock, KeyRound, Loader2 } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { useSharedAccess } from '@/hooks/useSharedAccess';
import { decryptDocument, base64ToArrayBuffer } from '@/utils/encryption';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DOCUMENT_TYPE_LABELS = {
  dni: 'DNI', pasaporte: 'Pasaporte', carnet_conducir: 'Carnet de Conducir',
  cartilla_vacunacion: 'Cartilla de Vacunación', certificado_medico: 'Certificado Médico',
  titulo_universitario: 'Título Universitario', diploma_bachillerato: 'Diploma de Bachillerato',
  licencia_profesional: 'Licencia Profesional', comprobante_domicilio: 'Comprobante de Domicilio',
  comprobante_ingresos: 'Comprobante de Ingresos', contrato_trabajo: 'Contrato de Trabajo',
  otros: 'Otros',
};

const STATUS_STYLE = {
  active:  { color: '#34D399', bg: 'rgba(52,211,153,0.1)',  label: 'Activo' },
  revoked: { color: '#F87171', bg: 'rgba(248,113,113,0.1)', label: 'Revocado' },
  expired: { color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',  label: 'Expirado' },
};

const BASE_URL = window.location.origin;

export default function DocumentList({ documents, onView, onDelete, loading }) {
  const [confirmId, setConfirmId] = useState(null);
  const [shareDoc, setShareDoc] = useState(null);
  const [shareExpiry, setShareExpiry] = useState('10min');
  const [sharePassword, setSharePassword] = useState('');
  const [shareError, setShareError] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [activeShare, setActiveShare] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAccesses, setShowAccesses] = useState(false);

  const { accesses, createAccess, revokeAccess } = useSharedAccess();

  const handleShare = async () => {
    if (!sharePassword) { setShareError('Introduce la contraseña del documento'); return; }
    setShareLoading(true);
    setShareError(null);
    try {
      const encryptedData = base64ToArrayBuffer(shareDoc.encryptedData);
      const iv = base64ToArrayBuffer(shareDoc.iv);
      const salt = base64ToArrayBuffer(shareDoc.salt);
      const decrypted = await decryptDocument(encryptedData, sharePassword, iv, salt);

      const bytes = new Uint8Array(decrypted);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
      const base64Content = btoa(binary);

      const access = await createAccess(shareDoc, shareExpiry, base64Content);
      setActiveShare(access);
      setSharePassword('');
    } catch (e) {
      setShareError(e.message === 'Error al crear acceso' ? 'Error al crear acceso. Inténtalo de nuevo.' : 'Contraseña incorrecta');
    } finally {
      setShareLoading(false);
    }
  };

  // Link corto — funciona en cualquier dispositivo
  const shareLink = activeShare ? `${BASE_URL}/access/${activeShare.id}` : '';
  const shareQrUrl = activeShare
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareLink)}`
    : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const closeShareModal = () => { setShareDoc(null); setActiveShare(null); setCopiedLink(false); setSharePassword(''); setShareError(null); };

  if (loading) return (
    <div className="text-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3" />
      <p style={{ color: 'rgba(240,234,255,0.5)' }}>Cargando documentos...</p>
    </div>
  );

  if (documents.length === 0) return (
    <div className="text-center py-12 rounded-xl"
      style={{ background: 'rgba(183,148,246,0.04)', border: '1px dashed rgba(183,148,246,0.2)' }}>
      <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(183,148,246,0.5)' }} />
      <p style={{ color: 'rgba(240,234,255,0.5)' }}>No tienes documentos guardados</p>
      <p style={{ color: 'rgba(240,234,255,0.3)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
        Sube tu primer documento para comenzar
      </p>
    </div>
  );

  return (
    <>
      <div className="space-y-3">
        {documents.map(doc => (
          <div key={doc.id} className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.15)' }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 shrink-0" style={{ color: '#34D399' }} />
                <h3 className="font-semibold truncate" style={{ color: '#F0EAFF' }}>
                  {doc.title || DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                </h3>
              </div>
              <p className="text-xs truncate" style={{ color: 'rgba(240,234,255,0.4)' }}>
                {DOCUMENT_TYPE_LABELS[doc.documentType]} · {(doc.fileSize / 1024).toFixed(1)} KB
              </p>
            </div>
            <div className="flex items-center gap-1.5 ml-3">
              <button onClick={() => onView(doc)} className="p-2 rounded-lg"
                style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA' }} title="Ver">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => { setShareDoc(doc); setActiveShare(null); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold"
                style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
                <Share2 className="w-3.5 h-3.5" />
                Compartir
              </button>
              <button onClick={() => setConfirmId(doc.id)} className="p-2 rounded-lg"
                style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }} title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sección accesos compartidos */}
      {accesses.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setShowAccesses(!showAccesses)}
            className="flex items-center gap-2 text-sm font-semibold mb-3"
            style={{ color: 'rgba(240,234,255,0.6)' }}>
            <Link2 className="w-4 h-4" />
            Accesos compartidos ({accesses.filter(a => a.status === 'active').length} activos)
          </button>

          {showAccesses && (
            <div className="space-y-2">
              {accesses.map(access => {
                const s = STATUS_STYLE[access.status] || STATUS_STYLE.expired;
                return (
                  <div key={access.id} className="rounded-xl p-3 flex items-center justify-between"
                    style={{ background: 'rgba(183,148,246,0.03)', border: '1px solid rgba(183,148,246,0.1)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: s.bg, color: s.color }}>{s.label}</span>
                        <span className="text-sm font-medium truncate" style={{ color: '#F0EAFF' }}>
                          {access.docTitle}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(240,234,255,0.35)' }}>
                        <Clock className="w-3 h-3" />
                        {access.status === 'active'
                          ? `Expira ${format(new Date(access.expiresAt), "dd MMM HH:mm", { locale: es })}`
                          : access.status === 'revoked' ? 'Revocado manualmente'
                          : 'Expirado'
                        }
                      </div>
                    </div>
                    {access.status === 'active' && (
                      <button onClick={() => revokeAccess(access.id)}
                        className="ml-3 p-2 rounded-lg shrink-0"
                        style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}
                        title="Revocar acceso">
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmId && (
        <ConfirmModal
          title="Eliminar documento"
          message="¿Seguro que quieres eliminar este documento? Esta acción no se puede deshacer."
          onConfirm={() => { onDelete(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {/* Modal compartir */}
      {shareDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-scaleIn"
            style={{ background: 'rgba(14,10,30,0.99)', border: '1px solid rgba(183,148,246,0.2)' }}>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5" style={{ color: '#B794F6' }} />
                <h3 className="font-bold" style={{ color: '#F0EAFF' }}>Compartir documento</h3>
              </div>
              <button onClick={closeShareModal} style={{ color: 'rgba(240,234,255,0.4)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm mb-4 font-semibold" style={{ color: '#F0EAFF' }}>
              {shareDoc.title || shareDoc.documentType}
            </p>

            {!activeShare ? (
              <>
                {/* Duración */}
                <p className="text-xs mb-2" style={{ color: 'rgba(240,234,255,0.4)' }}>Duración del acceso:</p>
                <div className="flex gap-2 mb-4">
                  {[{ v: '10min', l: '10 min' }, { v: '1h', l: '1 hora' }, { v: '24h', l: '24 horas' }].map(({ v, l }) => (
                    <button key={v} onClick={() => setShareExpiry(v)}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: shareExpiry === v ? 'rgba(183,148,246,0.25)' : 'rgba(183,148,246,0.06)',
                        color: shareExpiry === v ? '#B794F6' : 'rgba(240,234,255,0.5)',
                        border: `1px solid ${shareExpiry === v ? 'rgba(183,148,246,0.4)' : 'rgba(183,148,246,0.1)'}`,
                      }}>
                      {l}
                    </button>
                  ))}
                </div>

                {/* Contraseña para desencriptar */}
                <p className="text-xs mb-2" style={{ color: 'rgba(240,234,255,0.4)' }}>
                  <KeyRound className="w-3 h-3 inline mr-1" />
                  Contraseña del documento para compartir:
                </p>
                <input
                  type="password"
                  value={sharePassword}
                  onChange={e => { setSharePassword(e.target.value); setShareError(null); }}
                  placeholder="Contraseña de encriptación"
                  className="w-full px-4 py-3 rounded-xl outline-none mb-3"
                  style={{ background: 'rgba(183,148,246,0.06)', border: `1px solid ${shareError ? 'rgba(248,113,113,0.4)' : 'rgba(183,148,246,0.2)'}`, color: '#F0EAFF' }}
                  onKeyDown={e => e.key === 'Enter' && handleShare()}
                />
                {shareError && <p className="text-xs mb-3" style={{ color: '#F87171' }}>{shareError}</p>}

                <button onClick={handleShare} disabled={shareLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #B794F6, #7C3AED)', color: '#070510' }}>
                  {shareLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparando...</> : <><QrCode className="w-4 h-4" /> Generar link y QR</>}
                </button>
              </>
            ) : (
              <>
                {/* QR generado */}
                <div className="rounded-xl p-3 text-center mb-3" style={{ background: 'white' }}>
                  <img src={shareQrUrl} alt="QR acceso" style={{ width: 200, height: 200, margin: '0 auto' }} />
                </div>

                {/* Link corto */}
                <div className="rounded-xl p-3 mb-3 flex items-center gap-2"
                  style={{ background: 'rgba(183,148,246,0.06)', border: '1px solid rgba(183,148,246,0.15)' }}>
                  <code className="text-xs flex-1 truncate" style={{ color: '#B794F6' }}>{shareLink}</code>
                  <button onClick={handleCopyLink}
                    className="shrink-0 p-1.5 rounded-lg"
                    style={{ background: 'rgba(183,148,246,0.15)', color: '#B794F6' }}>
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs mb-4" style={{ color: 'rgba(52,211,153,0.7)' }}>
                  <Clock className="w-3.5 h-3.5" />
                  Válido {shareExpiry === '10min' ? '10 minutos' : shareExpiry === '1h' ? '1 hora' : '24 horas'}
                </div>

                <button onClick={() => revokeAccess(activeShare.id)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                  <Ban className="w-4 h-4" />
                  Revocar acceso ahora
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
