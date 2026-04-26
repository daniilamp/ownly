/**
 * Dashboard — Ownly ID como core del producto
 * Contexto: trading, prop firms, brokers
 */

import { useState, useEffect } from 'react';
import { Shield, FileText, QrCode, CheckCircle, Clock, ChevronRight, Copy, Check, X, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useCredentials } from '@/hooks/useCredentials';
import { useDocuments } from '@/hooks/useDocuments';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { credentials, loading: credLoading } = useCredentials();
  const { documents } = useDocuments();
  const [kycData, setKycData] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [showQRModal, setShowQRModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadKycData();
  }, [user]);

  const loadKycData = async () => {
    try {
      const userId = localStorage.getItem('ownly_userId');
      if (!userId) { setKycLoading(false); return; }
      const apiUrl = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/kyc/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setKycData(data.verification);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setKycLoading(false);
    }
  };

  const isVerified = !!kycData;
  const credential = credentials[0];

  // QR data — usa el ID de la credencial o el userId
  const qrToken = credential?.id
    ? JSON.stringify({ type: 'ownly_credential', credentialId: credential.id, timestamp: Date.now(), expiresAt: Date.now() + 86400000 })
    : null;
  const qrUrl = qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrToken)}`
    : null;

  const handleCopy = () => {
    if (qrToken) { navigator.clipboard.writeText(qrToken); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Estado de identidad — hero */}
        {kycLoading ? (
          <div className="rounded-2xl p-8 mb-6 text-center animate-pulse"
            style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.15)' }}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4" style={{ background: 'rgba(183,148,246,0.1)' }} />
            <div className="h-4 rounded mx-auto w-32" style={{ background: 'rgba(183,148,246,0.1)' }} />
          </div>
        ) : isVerified ? (
          /* ── VERIFICADO ── */
          <div className="rounded-2xl p-8 mb-6"
            style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(7,5,16,0.9))', border: '1px solid rgba(52,211,153,0.25)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid rgba(52,211,153,0.4)' }}>
                <CheckCircle className="w-6 h-6" style={{ color: '#34D399' }} />
              </div>
              <div>
                <h2 className="font-bold" style={{ color: '#34D399' }}>Identidad verificada</h2>
                <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
                  {kycData.first_name} {kycData.last_name}
                </p>
              </div>
            </div>

            {/* Ownly ID — el activo principal */}
            <div className="rounded-xl p-4 mb-5"
              style={{ background: 'rgba(183,148,246,0.06)', border: '1px solid rgba(183,148,246,0.2)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(183,148,246,0.6)' }}>TU OWNLY ID</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-sm font-mono truncate" style={{ color: '#F0EAFF' }}>
                  {user?.email || user?.address || user?.id}
                </code>
                <button onClick={() => {
                  navigator.clipboard.writeText(user?.email || user?.address || user?.id || '');
                  setCopied(true); setTimeout(() => setCopied(false), 2000);
                }} className="shrink-0 p-1.5 rounded-lg" style={{ background: 'rgba(183,148,246,0.1)', color: '#B794F6' }}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-xs mt-2" style={{ color: 'rgba(240,234,255,0.3)' }}>
                Comparte este ID con plataformas para verificación instantánea
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowQRModal(true)}
                className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'linear-gradient(135deg, #B794F6, #7C3AED)', color: '#070510' }}>
                <QrCode className="w-4 h-4" />
                Mostrar QR
              </button>
              <button
                onClick={() => navigate('/verify')}
                className="py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399', border: '1px solid rgba(52,211,153,0.2)' }}>
                <TrendingUp className="w-4 h-4" />
                Verificador
              </button>
            </div>
          </div>
        ) : (
          /* ── NO VERIFICADO ── */
          <div className="rounded-2xl p-8 mb-6 text-center"
            style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(251,191,36,0.1)', border: '2px solid rgba(251,191,36,0.3)' }}>
              <Clock className="w-8 h-8" style={{ color: '#FBBF24' }} />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#FBBF24' }}>Sin verificar</h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(240,234,255,0.5)' }}>
              Verifica tu identidad una vez y úsala en cualquier plataforma
            </p>
            <button
              onClick={() => navigate('/kyc')}
              className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: '#070510' }}>
              Verificar identidad (2 min)
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => navigate('/credentials')}
            className="rounded-xl p-4 text-left transition-all active:scale-95"
            style={{ background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)' }}>
            <Shield className="w-5 h-5 mb-2" style={{ color: '#60A5FA' }} />
            <p className="font-semibold text-sm" style={{ color: '#F0EAFF' }}>Credenciales</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(96,165,250,0.7)' }}>
              {credLoading ? '—' : `${credentials.length} activa${credentials.length !== 1 ? 's' : ''}`}
            </p>
          </button>

          <button onClick={() => navigate('/documents')}
            className="rounded-xl p-4 text-left transition-all active:scale-95"
            style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.15)' }}>
            <FileText className="w-5 h-5 mb-2" style={{ color: '#34D399' }} />
            <p className="font-semibold text-sm" style={{ color: '#F0EAFF' }}>Documentos</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(52,211,153,0.7)' }}>
              {`${documents.length} guardado${documents.length !== 1 ? 's' : ''}`}
            </p>
          </button>
        </div>

        {/* KYC pendiente CTA secundario */}
        {!isVerified && !kycLoading && (
          <button onClick={() => navigate('/kyc')}
            className="w-full rounded-xl p-4 flex items-center justify-between transition-all active:scale-95"
            style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.15)' }}>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" style={{ color: '#B794F6' }} />
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>Verificación KYC</p>
                <p className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>Completa tu identidad digital</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4" style={{ color: 'rgba(183,148,246,0.5)' }} />
          </button>
        )}
      </div>

      {/* ── MODAL QR (pantalla completa) ── */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
          style={{ background: '#070510' }}>

          {/* Cerrar */}
          <button onClick={() => setShowQRModal(false)}
            className="absolute top-6 right-6 p-2 rounded-full"
            style={{ background: 'rgba(183,148,246,0.1)', color: '#B794F6' }}>
            <X className="w-5 h-5" />
          </button>

          <div className="text-center w-full max-w-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5" style={{ color: '#34D399' }} />
              <h2 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>Tu identidad está lista</h2>
            </div>
            <p className="text-sm mb-6" style={{ color: 'rgba(240,234,255,0.5)' }}>
              Estás compartiendo: <span style={{ color: '#34D399' }}>✓ Mayor de 18 años &nbsp; ✓ Identidad verificada</span>
            </p>

            {/* QR */}
            {qrUrl ? (
              <div className="rounded-2xl p-4 mb-6 mx-auto inline-block"
                style={{ background: 'white' }}>
                <img src={qrUrl} alt="QR Ownly" style={{ width: 260, height: 260, display: 'block' }} />
              </div>
            ) : (
              <div className="rounded-2xl p-8 mb-6 text-center"
                style={{ background: 'rgba(183,148,246,0.06)', border: '1px solid rgba(183,148,246,0.2)' }}>
                <QrCode className="w-16 h-16 mx-auto mb-3" style={{ color: 'rgba(183,148,246,0.4)' }} />
                <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
                  Completa el KYC para activar tu QR
                </p>
              </div>
            )}

            <p className="text-xs mb-6" style={{ color: 'rgba(240,234,255,0.3)' }}>
              Muestra este código al staff para verificar tu acceso
            </p>

            <button onClick={handleCopy}
              className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(183,148,246,0.1)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
              {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar código</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
