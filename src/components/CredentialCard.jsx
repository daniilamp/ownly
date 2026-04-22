import { useState } from 'react';
import { Trash2, QrCode, Copy, Check, Shield, ExternalLink } from 'lucide-react';
import { useCredentials } from '@/hooks/useCredentials';
import ConfirmModal from '@/components/ConfirmModal';

const TYPE_LABELS = {
  identity_verified: 'Identidad Verificada',
  dni: 'DNI',
  passport: 'Pasaporte',
  license: 'Carnet de Conducir',
};

const STATUS_CONFIG = {
  published: { label: 'Publicada en blockchain', color: '#34D399', bg: 'rgba(52,211,153,0.1)' },
  pending:   { label: 'Pendiente',               color: '#FBBF24', bg: 'rgba(251,191,36,0.1)' },
  failed:    { label: 'Error',                   color: '#F87171', bg: 'rgba(248,113,113,0.1)' },
};

export default function CredentialCard({ credential, onDelete }) {
  const { generateQRData } = useCredentials();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const qrData = generateQRData(credential.id);
  const typeLabel = TYPE_LABELS[credential.type] || credential.type;
  const statusCfg = STATUS_CONFIG[credential.status] || STATUS_CONFIG.pending;

  const qrImageUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`
    : '';

  const handleCopyQR = () => {
    navigator.clipboard.writeText(qrData);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl p-6 transition-all hover:shadow-lg"
      style={{ background: 'rgba(183,148,246,0.08)', border: '1px solid rgba(183,148,246,0.2)' }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(183,148,246,0.15)', border: '1px solid rgba(183,148,246,0.3)' }}>
            <Shield className="w-5 h-5" style={{ color: '#B794F6' }} />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: '#F0EAFF' }}>
              {credential.name || typeLabel}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: statusCfg.bg, color: statusCfg.color }}>
              {statusCfg.label}
            </span>
          </div>
        </div>
        <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg transition-all hover:opacity-70"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {confirmDelete && (
        <ConfirmModal
          title="Eliminar credencial"
          message="¿Seguro que quieres eliminar esta credencial? Esta acción no se puede deshacer."
          onConfirm={() => { onDelete(); setConfirmDelete(false); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {/* Info */}
      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span style={{ color: 'rgba(240,234,255,0.5)' }}>Número:</span>
          <span className="font-mono" style={{ color: '#F0EAFF' }}>{credential.number}</span>
        </div>
        {credential.issuer && (
          <div className="flex justify-between">
            <span style={{ color: 'rgba(240,234,255,0.5)' }}>Emisor:</span>
            <span style={{ color: '#F0EAFF' }}>{credential.issuer}</span>
          </div>
        )}
        {credential.expiryDate && (
          <div className="flex justify-between">
            <span style={{ color: 'rgba(240,234,255,0.5)' }}>Caducidad:</span>
            <span style={{ color: '#F0EAFF' }}>{new Date(credential.expiryDate).toLocaleDateString('es-ES')}</span>
          </div>
        )}
        {credential.blockchainTxHash && (
          <div className="flex justify-between items-center">
            <span style={{ color: 'rgba(240,234,255,0.5)' }}>Blockchain:</span>
            <a href={`https://amoy.polygonscan.com/tx/${credential.blockchainTxHash}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs"
              style={{ color: '#8247E5' }}>
              {credential.blockchainTxHash.slice(0, 10)}...
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* QR */}
      {showQR && (
        <div className="mb-4 p-4 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.95)' }}>
          <img src={qrImageUrl} alt="QR Code" className="mx-auto mb-3 rounded" style={{ width: 200, height: 200 }} />
          <button onClick={handleCopyQR}
            className="flex items-center gap-2 mx-auto px-3 py-1 rounded text-xs font-semibold transition-all"
            style={{ background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(183,148,246,0.1)', color: copied ? '#34D399' : '#B794F6' }}>
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado' : 'Copiar datos'}
          </button>
        </div>
      )}

      <button onClick={() => setShowQR(!showQR)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all"
        style={{ background: showQR ? 'rgba(183,148,246,0.2)' : 'rgba(183,148,246,0.1)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
        <QrCode className="w-4 h-4" />
        {showQR ? 'Ocultar QR' : 'Generar QR'}
      </button>
    </div>
  );
}
