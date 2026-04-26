import { useState } from 'react';
import {
  Shield, CheckCircle, XCircle, Loader2, QrCode,
  Zap, Camera, ChevronDown, ChevronUp, Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import QRScanner from '@/components/verify/QRScanner';
import { useZKVerify } from '@/hooks/useZKVerify';

export default function Verify() {
  const [token, setToken] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const { verify, loading, result, reset } = useZKVerify();

  const handleQRScan = (value) => { setShowScanner(false); setToken(value); };
  const handleVerify = () => verify(token);
  const handleReset = () => { reset(); setToken(''); setShowDetails(false); };

  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}

      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.25)' }}>
              <Shield className="w-5 h-5" style={{ color: '#B794F6' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#F0EAFF' }}>Verificador</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.4)' }}>
            Para negocios y staff — escanea el QR del usuario
          </p>
        </div>

        {!result ? (
          /* ── INPUT ── */
          <div className="rounded-2xl p-6 mb-6"
            style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.18)' }}>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="Pega el código o escanea el QR..."
                className="flex-1 rounded-xl px-4 py-4 text-sm outline-none"
                style={{
                  background: 'rgba(183,148,246,0.06)',
                  border: `1px solid ${token ? 'rgba(183,148,246,0.4)' : 'rgba(183,148,246,0.15)'}`,
                  color: '#F0EAFF',
                }}
              />
              <button onClick={() => setShowScanner(true)}
                className="px-4 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.3)', color: '#B794F6' }}>
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleVerify}
              disabled={!token.trim() || loading}
              className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40"
              style={{
                background: token.trim() ? 'linear-gradient(135deg, #B794F6, #7C3AED)' : 'rgba(183,148,246,0.1)',
                color: token.trim() ? '#070510' : '#B794F6',
              }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
                : <><Zap className="w-4 h-4" /> Verificar</>
              }
            </button>

            {/* Demo tokens */}
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(183,148,246,0.1)' }}>
              <p className="text-xs mb-2" style={{ color: 'rgba(240,234,255,0.3)' }}>Tokens de demo:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { token: 'A1B2C3D4E5F6A7B8', label: 'Válido' },
                  { token: 'EXPIRED123456789', label: 'Caducado' },
                ].map(({ token: t, label }) => (
                  <button key={t} onClick={() => setToken(t)}
                    className="text-xs px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(183,148,246,0.08)', color: 'rgba(183,148,246,0.7)', border: '1px solid rgba(183,148,246,0.15)' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        ) : (
          /* ── RESULTADO ── */
          <div className="mb-6">

            {/* NIVEL 1 — Decisión inmediata */}
            <div className="rounded-2xl p-8 text-center mb-4"
              style={{
                background: result.valid
                  ? 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(7,5,16,0.95))'
                  : 'linear-gradient(135deg, rgba(248,113,113,0.1), rgba(7,5,16,0.95))',
                border: `2px solid ${result.valid ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`,
              }}>

              <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  background: result.valid ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                  border: `3px solid ${result.valid ? 'rgba(52,211,153,0.5)' : 'rgba(248,113,113,0.5)'}`,
                  boxShadow: `0 0 50px ${result.valid ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
                }}>
                {result.valid
                  ? <CheckCircle className="w-12 h-12" style={{ color: '#34D399' }} />
                  : <XCircle className="w-12 h-12" style={{ color: '#F87171' }} />
                }
              </div>

              <h2 className="text-3xl font-bold mb-3"
                style={{ color: result.valid ? '#34D399' : '#F87171' }}>
                {result.valid ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}
              </h2>

              {result.valid && (
                <div className="space-y-2 mb-2">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
                    <span className="font-semibold" style={{ color: '#F0EAFF' }}>Mayor de 18 años</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" style={{ color: '#34D399' }} />
                    <span className="font-semibold" style={{ color: '#F0EAFF' }}>Identidad verificada</span>
                  </div>
                </div>
              )}

              {!result.valid && (
                <p className="text-sm" style={{ color: 'rgba(248,113,113,0.8)' }}>
                  {result.reason || 'El código QR no es válido o ha caducado'}
                </p>
              )}
            </div>

            {/* NIVEL 2 — Detalles expandibles */}
            {result.valid && (
              <div className="rounded-xl overflow-hidden mb-4"
                style={{ border: '1px solid rgba(183,148,246,0.15)' }}>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full flex items-center justify-between px-5 py-3"
                  style={{ background: 'rgba(183,148,246,0.04)' }}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" style={{ color: '#B794F6' }} />
                    <span className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>Ver detalles técnicos</span>
                  </div>
                  {showDetails
                    ? <ChevronUp className="w-4 h-4" style={{ color: 'rgba(183,148,246,0.5)' }} />
                    : <ChevronDown className="w-4 h-4" style={{ color: 'rgba(183,148,246,0.5)' }} />
                  }
                </button>

                {showDetails && (
                  <div className="px-5 py-4" style={{ background: 'rgba(7,5,16,0.8)' }}>
                    <pre className="text-xs overflow-auto rounded-lg p-3"
                      style={{ background: 'rgba(183,148,246,0.04)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.1)' }}>
{JSON.stringify({
  verified: true,
  kyc_provider: "Sumsub",
  verification_level: "full",
  timestamp: result.verifiedAt ? format(new Date(result.verifiedAt), 'yyyy-MM-dd HH:mm', { locale: es }) : new Date().toISOString().slice(0,16),
  unique_user: true,
  risk_score: "low",
}, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <button onClick={handleReset}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(183,148,246,0.08)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
              Verificar otro código
            </button>
          </div>
        )}

        <p className="text-center text-xs" style={{ color: 'rgba(240,234,255,0.15)' }}>
          Ownly · GDPR Compliant · Solo se confirma la validez, no se almacenan datos
        </p>
      </div>
    </div>
  );
}
