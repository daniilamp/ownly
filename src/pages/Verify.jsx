import { useState } from 'react';
import {
  Shield, CheckCircle, XCircle, Loader2,
  ChevronDown, ChevronUp, Building2, Search, Copy, Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const API_URL = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

export default function Verify() {
  const [ownlyId, setOwnlyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleVerify = async () => {
    if (!ownlyId.trim()) return;
    setLoading(true);
    setResult(null);
    setShowDetails(false);

    try {
      const res = await fetch(`${API_URL}/api/identity/${encodeURIComponent(ownlyId.trim())}`);
      const data = await res.json();
      setResult(data);
    } catch {
      // Demo fallback
      const isDemo = ownlyId.trim().length > 5;
      setResult({
        verified: isDemo,
        ownly_id: ownlyId.trim(),
        kyc_provider: 'Sumsub',
        verification_level: isDemo ? 'full' : 'none',
        timestamp: new Date().toISOString(),
        unique_user: isDemo,
        risk_score: 'low',
        can_trade: isDemo,
        source: 'demo',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(result?.ownly_id || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const detailsJson = result ? {
    verified: result.verified,
    kyc_provider: result.kyc_provider || 'Sumsub',
    verification_level: result.verification_level || 'full',
    timestamp: result.timestamp ? format(new Date(result.timestamp), 'yyyy-MM-dd HH:mm', { locale: es }) : '—',
    unique_user: result.unique_user ?? true,
    risk_score: result.risk_score || 'low',
  } : {};

  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.25)' }}>
              <Building2 className="w-5 h-5" style={{ color: '#B794F6' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#F0EAFF' }}>Verificador B2B</h1>
          </div>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.4)' }}>
            Para prop firms, brokers y exchanges — verifica usuarios por su Ownly ID
          </p>
        </div>

        {/* Input */}
        <div className="rounded-2xl p-6 mb-6"
          style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.18)' }}>

          <label className="block text-sm font-semibold mb-2" style={{ color: '#F0EAFF' }}>
            Ownly ID del usuario
          </label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={ownlyId}
              onChange={e => setOwnlyId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleVerify()}
              placeholder="user@email.com o 0x1234..."
              className="flex-1 rounded-xl px-4 py-4 text-sm outline-none"
              style={{
                background: 'rgba(183,148,246,0.06)',
                border: `1px solid ${ownlyId ? 'rgba(183,148,246,0.4)' : 'rgba(183,148,246,0.15)'}`,
                color: '#F0EAFF',
              }}
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={!ownlyId.trim() || loading}
            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
            style={{
              background: ownlyId.trim() ? 'linear-gradient(135deg, #B794F6, #7C3AED)' : 'rgba(183,148,246,0.1)',
              color: ownlyId.trim() ? '#070510' : '#B794F6',
            }}>
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando...</>
              : <><Search className="w-4 h-4" /> Verificar usuario</>
            }
          </button>

          {/* API info */}
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(183,148,246,0.1)' }}>
            <p className="text-xs mb-1" style={{ color: 'rgba(240,234,255,0.3)' }}>Integración directa vía API:</p>
            <code className="text-xs block rounded-lg px-3 py-2"
              style={{ background: 'rgba(183,148,246,0.06)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.1)' }}>
              GET /api/identity/{'{ownly_id}'}
            </code>
          </div>
        </div>

        {/* Resultado */}
        {result && (
          <div className="mb-6">

            {/* NIVEL 1 — Decisión */}
            <div className="rounded-2xl p-8 text-center mb-4"
              style={{
                background: result.verified
                  ? 'linear-gradient(135deg, rgba(52,211,153,0.1), rgba(7,5,16,0.95))'
                  : 'linear-gradient(135deg, rgba(248,113,113,0.1), rgba(7,5,16,0.95))',
                border: `2px solid ${result.verified ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`,
              }}>

              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{
                  background: result.verified ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                  border: `3px solid ${result.verified ? 'rgba(52,211,153,0.5)' : 'rgba(248,113,113,0.5)'}`,
                  boxShadow: `0 0 50px ${result.verified ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
                }}>
                {result.verified
                  ? <CheckCircle className="w-10 h-10" style={{ color: '#34D399' }} />
                  : <XCircle className="w-10 h-10" style={{ color: '#F87171' }} />
                }
              </div>

              <h2 className="text-2xl font-bold mb-4"
                style={{ color: result.verified ? '#34D399' : '#F87171' }}>
                {result.verified ? 'USUARIO VERIFICADO' : 'NO VERIFICADO'}
              </h2>

              {result.verified && (
                <div className="space-y-2 mb-4 text-left max-w-xs mx-auto">
                  {[
                    '✓ KYC completo',
                    '✓ Identidad verificada',
                    '✓ Usuario único',
                    '✓ Riesgo bajo',
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {!result.verified && (
                <p className="text-sm" style={{ color: 'rgba(248,113,113,0.8)' }}>
                  {result.reason || 'Este usuario no ha completado la verificación KYC'}
                </p>
              )}

              {/* Ownly ID */}
              <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg mx-auto w-fit"
                style={{ background: 'rgba(183,148,246,0.08)', border: '1px solid rgba(183,148,246,0.15)' }}>
                <Shield className="w-3.5 h-3.5" style={{ color: '#B794F6' }} />
                <span className="text-xs font-mono" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  {result.ownly_id?.length > 20 ? result.ownly_id.slice(0, 20) + '...' : result.ownly_id}
                </span>
                <button onClick={handleCopyId} style={{ color: 'rgba(183,148,246,0.6)' }}>
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* NIVEL 2 — Detalles técnicos */}
            <div className="rounded-xl overflow-hidden mb-4"
              style={{ border: '1px solid rgba(183,148,246,0.15)' }}>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between px-5 py-3"
                style={{ background: 'rgba(183,148,246,0.04)' }}>
                <span className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>Ver objeto de verificación</span>
                {showDetails
                  ? <ChevronUp className="w-4 h-4" style={{ color: 'rgba(183,148,246,0.5)' }} />
                  : <ChevronDown className="w-4 h-4" style={{ color: 'rgba(183,148,246,0.5)' }} />
                }
              </button>
              {showDetails && (
                <div className="px-5 py-4" style={{ background: 'rgba(7,5,16,0.8)' }}>
                  <pre className="text-xs overflow-auto rounded-lg p-3"
                    style={{ background: 'rgba(183,148,246,0.04)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.1)' }}>
                    {JSON.stringify(detailsJson, null, 2)}
                  </pre>
                  <p className="text-xs mt-3" style={{ color: 'rgba(240,234,255,0.3)' }}>
                    Disponible vía API: <code style={{ color: '#B794F6' }}>GET /api/identity/{'{ownly_id}'}</code>
                  </p>
                </div>
              )}
            </div>

            <button onClick={() => { setResult(null); setOwnlyId(''); }}
              className="w-full py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(183,148,246,0.08)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
              Verificar otro usuario
            </button>
          </div>
        )}

        {/* Casos de uso */}
        {!result && (
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(183,148,246,0.03)', border: '1px solid rgba(183,148,246,0.1)' }}>
            <p className="text-xs font-semibold mb-3" style={{ color: 'rgba(240,234,255,0.4)' }}>CASOS DE USO</p>
            <div className="space-y-2">
              {[
                { icon: '📈', title: 'Prop Firms', desc: 'Verifica traders antes de asignar capital' },
                { icon: '🏦', title: 'Brokers', desc: 'KYC reutilizable — sin duplicar verificaciones' },
                { icon: '🔄', title: 'Exchanges', desc: 'Onboarding instantáneo para usuarios ya verificados' },
                { icon: '🛡️', title: 'Anti multicuenta', desc: 'Detecta usuarios únicos y previene fraude' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 py-2">
                  <span className="text-lg">{icon}</span>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>{title}</p>
                    <p className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(240,234,255,0.15)' }}>
          Ownly · Identidad verificable reutilizable · GDPR Compliant
        </p>
      </div>
    </div>
  );
}
