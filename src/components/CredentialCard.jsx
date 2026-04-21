import { useState, useEffect, useRef } from 'react';
import { Trash2, QrCode, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { useCredentials } from '@/hooks/useCredentials';

export default function CredentialCard({ credential, onDelete }) {
  const { generateQRData } = useCredentials();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  const qrData = generateQRData(credential.id);
  const typeLabel = {
    dni: 'DNI',
    passport: 'Pasaporte',
    license: 'Carnet de Conducir',
  }[credential.type] || credential.type;

  // Generar QR cuando se muestre
  useEffect(() => {
    if (showQR && qrData && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrData, { width: 200 }, (err) => {
        if (err) console.error('Error generating QR:', err);
      });
    }
  }, [showQR, qrData]);

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
        <div>
          <div className="text-xs font-mono mb-1" style={{ color: 'rgba(183,148,246,0.6)' }}>
            {typeLabel}
          </div>
          <h3 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
            {credential.name}
          </h3>
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-lg transition-all hover:opacity-70"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

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
            <span style={{ color: '#F0EAFF' }}>{new Date(credential.expiryDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* QR Section */}
      {showQR ? (
        <div className="mb-4 p-4 rounded-lg text-center"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <canvas ref={canvasRef} className="mx-auto mb-3" />
          <button
            onClick={handleCopyQR}
            className="flex items-center gap-2 mx-auto px-3 py-1 rounded text-xs font-semibold transition-all"
            style={{
              background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(183,148,246,0.1)',
              color: copied ? '#34D399' : '#B794F6',
            }}>
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado' : 'Copiar QR'}
          </button>
        </div>
      ) : null}

      {/* Button */}
      <button
        onClick={() => setShowQR(!showQR)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all"
        style={{
          background: showQR ? 'rgba(183,148,246,0.2)' : 'rgba(183,148,246,0.1)',
          color: '#B794F6',
          border: '1px solid rgba(183,148,246,0.2)',
        }}>
        <QrCode className="w-4 h-4" />
        {showQR ? 'Ocultar QR' : 'Generar QR'}
      </button>
    </div>
  );
}
