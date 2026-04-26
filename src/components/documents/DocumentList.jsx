/**
 * DocumentList Component
 * Displays list of uploaded documents
 */

import { Trash2, Eye, Lock, Share2, X, QrCode } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

const DOCUMENT_TYPE_LABELS = {
  dni: 'DNI',
  pasaporte: 'Pasaporte',
  carnet_conducir: 'Carnet de Conducir',
  cartilla_vacunacion: 'Cartilla de Vacunación',
  certificado_medico: 'Certificado Médico',
  titulo_universitario: 'Título Universitario',
  diploma_bachillerato: 'Diploma de Bachillerato',
  licencia_profesional: 'Licencia Profesional',
  comprobante_domicilio: 'Comprobante de Domicilio',
  comprobante_ingresos: 'Comprobante de Ingresos',
  contrato_trabajo: 'Contrato de Trabajo',
  otros: 'Otros',
};

export default function DocumentList({ documents, onView, onDelete, loading }) {
  const [confirmId, setConfirmId] = useState(null);
  const [shareDoc, setShareDoc] = useState(null); // doc being shared
  const [shareExpiry, setShareExpiry] = useState('10min');

  const handleDeleteClick = (id) => setConfirmId(id);
  const handleConfirm = () => { onDelete(confirmId); setConfirmId(null); };
  const handleCancel = () => setConfirmId(null);

  // Genera un token de compartición temporal (simulado — en prod sería un endpoint)
  const getShareToken = (doc) => {
    const expMs = shareExpiry === '10min' ? 10 * 60000 : shareExpiry === '1h' ? 3600000 : 86400000;
    return JSON.stringify({
      type: 'ownly_doc_share',
      docId: doc.id,
      docTitle: doc.title || doc.documentType,
      expiresAt: Date.now() + expMs,
    });
  };

  const shareQrUrl = shareDoc
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getShareToken(shareDoc))}`
    : null;
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
        <p style={{ color: 'rgba(240,234,255,0.5)' }}>Cargando documentos...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl"
        style={{ background: 'rgba(183,148,246,0.04)', border: '1px dashed rgba(183,148,246,0.2)' }}>
        <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(183,148,246,0.5)' }} />
        <p style={{ color: 'rgba(240,234,255,0.5)' }}>
          No tienes documentos guardados
        </p>
        <p style={{ color: 'rgba(240,234,255,0.3)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Sube tu primer documento para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map(doc => (
        <div
          key={doc.id}
          className="rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4" style={{ color: '#34D399' }} />
              <h3 className="font-semibold" style={{ color: '#F0EAFF' }}>
                {doc.title || DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
              </h3>
            </div>
            <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem' }}>
              {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType} · {doc.fileName}
            </p>
            <p style={{ color: 'rgba(240,234,255,0.3)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {(doc.fileSize / 1024).toFixed(2)} KB · {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => onView(doc)}
              className="p-2 rounded-lg" style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA' }}
              title="Ver documento">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => setShareDoc(doc)}
              className="p-2 rounded-lg" style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}
              title="Compartir documento">
              <Share2 className="w-4 h-4" />
            </button>
            <button onClick={() => handleDeleteClick(doc.id)}
              className="p-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}
              title="Eliminar documento">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      {confirmId && (
        <ConfirmModal
          title="Eliminar documento"
          message="¿Seguro que quieres eliminar este documento? Esta acción no se puede deshacer."
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {/* Modal compartir */}
      {shareDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 animate-scaleIn"
            style={{ background: 'rgba(20,16,40,0.98)', border: '1px solid rgba(183,148,246,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5" style={{ color: '#B794F6' }} />
                <h3 className="font-bold" style={{ color: '#F0EAFF' }}>Compartir documento</h3>
              </div>
              <button onClick={() => setShareDoc(null)} style={{ color: 'rgba(240,234,255,0.4)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm mb-4" style={{ color: 'rgba(240,234,255,0.6)' }}>
              <strong style={{ color: '#F0EAFF' }}>{shareDoc.title || shareDoc.documentType}</strong>
            </p>

            {/* Duración */}
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

            {/* QR */}
            <div className="rounded-xl p-3 text-center mb-4" style={{ background: 'white' }}>
              <img src={shareQrUrl} alt="QR compartir" style={{ width: 180, height: 180, margin: '0 auto' }} />
            </div>

            <p className="text-xs text-center" style={{ color: 'rgba(240,234,255,0.3)' }}>
              Acceso limitado · Válido {shareExpiry === '10min' ? '10 minutos' : shareExpiry === '1h' ? '1 hora' : '24 horas'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
