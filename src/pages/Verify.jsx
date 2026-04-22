import { useState } from 'react';
import {
  Shield, CheckCircle, XCircle, Loader2, QrCode, Building2,
  Zap, Lock, ChevronDown, ChevronUp, BarChart3, Camera,
  ExternalLink, Wifi, WifiOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import QRScanner from '@/components/verify/QRScanner';
import { useZKVerify } from '@/hooks/useZKVerify';

const TYPE_LABELS = {
  dni: 'DNI / Identidad',
  passport: 'Pasaporte',
  driving_license: 'Carnet de Conducir',
  title: 'Título Académico',
  employment: 'Empleo',
  health: 'Salud / Seguro',
  other: 'Documento',
};

const USE_CASES = [
  { icon: '🍹', title: 'Ocio y Eventos', desc: 'Verificación de edad en locales sin mostrar el DNI físico. Cumple GDPR.' },
  { icon: '🚗', title: 'Alquileres y Movilidad', desc: 'Confirma carnet de conducir y solvencia sin fotocopias ni datos sensibles.' },
  { icon: '🏨', title: 'Hoteles y Alojamiento', desc: 'Registro de viajeros automático, GDPR-compliant y sin almacenar datos.' },
  { icon: '💼', title: 'Recursos Humanos', desc: 'Verifica títulos, antecedentes y experiencia laboral al instante.' },
  { icon: '🏥', title: 'Sanidad', desc: 'Confirma identidad del paciente y cobertura médica sin exponer historial.' },
  { icon: '🎓', title: 'Educación', desc: 'Valida títulos académicos y certificaciones de forma instantánea.' },
];

export default function Verify() {
  const [token, setToken] = useState('');
  const [showUseCases, setShowUseCases] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const { verify, loading, result, reset, apiOnline } = useZKVerify();

  const handleQRScan = (value) => {
    setShowScanner(false);
    setToken(value);
  };

  const handleVerify = () => verify(token);

  const handleReset = () => {
    reset();
    setToken('');
  };

  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10 animate-fadeIn">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.25)' }}>
              <Shield className="w-6 h-6" style={{ color: '#B794F6' }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: '#F0EAFF' }}>
              Verificador
            </h1>
          </div>
          <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '1rem' }}>
            Confirma la identidad de un usuario{' '}
            <span style={{ color: '#B794F6' }}>sin acceder a sus datos privados</span>
          </p>

          {/* API status badge */}
          {apiOnline !== null && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-xs"
              style={{
                background: apiOnline ? 'rgba(52,211,153,0.08)' : 'rgba(251,191,36,0.08)',
                border: `1px solid ${apiOnline ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
                color: apiOnline ? '#34D399' : '#FBBF24',
              }}>
              {apiOnline
                ? <><Wifi className="w-3 h-3 mr-1" /> API conectada · ZK activo</>
                : <><WifiOff className="w-3 h-3 mr-1" /> Modo demo</>
              }
            </div>
          )}
        </div>

        {/* Main verifier card */}
        {!result ? (
          <div className="rounded-3xl p-8 mb-8"
            style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.18)' }}>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(183,148,246,0.1)', border: '1px solid rgba(183,148,246,0.2)' }}>
                <QrCode className="w-5 h-5" style={{ color: '#B794F6' }} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>Introducir código QR</div>
                <div className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>
                  El usuario te muestra su QR — introdúcelo o escanéalo con la cámara
                </div>
              </div>
            </div>

            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={token}
                onChange={e => setToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                placeholder="A1B2C3D4E5F6A7B8..."
                className="flex-1 rounded-xl px-4 py-4 text-sm font-mono outline-none transition-all"
                style={{
                  background: 'rgba(183,148,246,0.06)',
                  border: `1px solid ${token ? 'rgba(183,148,246,0.4)' : 'rgba(183,148,246,0.15)'}`,
                  color: '#F0EAFF',
                  letterSpacing: '0.1em',
                }}
              />
              <button
                onClick={() => setShowScanner(true)}
                title="Escanear con cámara"
                className="px-4 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
                style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.3)', color: '#B794F6', flexShrink: 0 }}>
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleVerify}
              disabled={!token.trim() || loading}
              className="w-full py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: token.trim() ? 'linear-gradient(135deg, #B794F6, #7C3AED)' : 'rgba(183,148,246,0.1)',
                color: token.trim() ? '#070510' : '#B794F6',
                boxShadow: token.trim() ? '0 0 30px rgba(183,148,246,0.25)' : 'none',
              }}>
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Verificando en blockchain...</>
                : <><Zap className="w-4 h-4" /> Verificar Identidad</>
              }
            </button>

            {/* Demo tokens */}
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(183,148,246,0.1)' }}>
              <div className="text-xs mb-3" style={{ color: 'rgba(240,234,255,0.35)' }}>TOKENS DE DEMO</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { token: 'A1B2C3D4E5F6A7B8', label: 'DNI Válido' },
                  { token: 'C3D4E5F6A7B8C9D0', label: 'Carnet Válido' },
                  { token: 'EXPIRED123456789', label: 'QR Caducado' },
                ].map(({ token: t, label }) => (
                  <button key={t} onClick={() => setToken(t)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                    style={{ background: 'rgba(183,148,246,0.08)', color: 'rgba(183,148,246,0.7)', border: '1px solid rgba(183,148,246,0.15)' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        ) : (
          /* ── Result ── */
          <div className="rounded-3xl p-8 mb-8 relative overflow-hidden"
            style={{
              background: result.valid
                ? 'linear-gradient(135deg, rgba(52,211,153,0.08), rgba(7,5,16,0.95))'
                : 'linear-gradient(135deg, rgba(248,113,113,0.08), rgba(7,5,16,0.95))',
              border: `1px solid ${result.valid ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)'}`,
            }}>

            <div className="absolute top-0 left-0 right-0 h-px" style={{
              background: `linear-gradient(90deg, transparent, ${result.valid ? 'rgba(52,211,153,0.6)' : 'rgba(248,113,113,0.6)'}, transparent)`
            }} />

            {/* Status icon */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: result.valid ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                  border: `2px solid ${result.valid ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)'}`,
                  boxShadow: `0 0 40px ${result.valid ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                }}>
                {result.valid
                  ? <CheckCircle className="w-10 h-10" style={{ color: '#34D399' }} />
                  : <XCircle className="w-10 h-10" style={{ color: '#F87171' }} />
                }
              </div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: result.valid ? '#34D399' : '#F87171' }}>
                {result.valid ? 'Identidad Válida' : 'Verificación Fallida'}
              </h2>

              {/* Source badge */}
              {result.valid && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full mb-2"
                  style={{
                    background: result.source === 'demo' ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)',
                    color: result.source === 'demo' ? '#FBBF24' : '#34D399',
                    border: `1px solid ${result.source === 'demo' ? 'rgba(251,191,36,0.25)' : 'rgba(52,211,153,0.25)'}`,
                  }}>
                  {result.source === 'demo' ? '⚡ Demo' : result.source === 'api' ? '✓ ZK verificado · API' : '✓ Credencial real de Ownly'}
                </span>
              )}

              <p className="text-sm text-center" style={{ color: 'rgba(240,234,255,0.5)' }}>
                {result.valid
                  ? 'La prueba criptográfica es correcta y está registrada en Polygon L2'
                  : result.reason || 'El código QR no es válido o ha caducado'
                }
              </p>
            </div>

            {result.valid && (
              <>
                {/* Claims */}
                {result.claims?.length > 0 && (
                  <div className="rounded-xl p-4 mb-4"
                    style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
                    <div className="text-xs font-semibold mb-3" style={{ color: 'rgba(52,211,153,0.7)' }}>
                      CLAIMS VERIFICADOS (SIN DATOS PRIVADOS)
                    </div>
                    <div className="space-y-2">
                      {result.claims.map(claim => (
                        <div key={claim} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#34D399' }} />
                          <span className="text-sm" style={{ color: '#F0EAFF' }}>{claim}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meta info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {result.credential_name && (
                    <div className="rounded-xl p-3 col-span-2"
                      style={{ background: 'rgba(183,148,246,0.05)', border: '1px solid rgba(183,148,246,0.12)' }}>
                      <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(183,148,246,0.6)' }}>CREDENCIAL</div>
                      <div className="text-sm font-medium" style={{ color: '#F0EAFF' }}>{result.credential_name}</div>
                    </div>
                  )}
                  <div className="rounded-xl p-3"
                    style={{ background: 'rgba(183,148,246,0.05)', border: '1px solid rgba(183,148,246,0.12)' }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(183,148,246,0.6)' }}>TIPO</div>
                    <div className="text-sm font-medium" style={{ color: '#F0EAFF' }}>
                      {TYPE_LABELS[result.credential_type] || result.credential_type}
                    </div>
                  </div>
                  <div className="rounded-xl p-3"
                    style={{ background: 'rgba(183,148,246,0.05)', border: '1px solid rgba(183,148,246,0.12)' }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(183,148,246,0.6)' }}>EMISOR</div>
                    <div className="text-sm font-medium truncate" style={{ color: '#F0EAFF' }}>{result.issuer}</div>
                  </div>
                  <div className="rounded-xl p-3"
                    style={{ background: 'rgba(183,148,246,0.05)', border: '1px solid rgba(183,148,246,0.12)' }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(183,148,246,0.6)' }}>VERIFICADO</div>
                    <div className="text-sm font-medium" style={{ color: '#F0EAFF' }}>
                      {format(new Date(result.verifiedAt), 'dd MMM HH:mm', { locale: es })}
                    </div>
                  </div>
                  {result.expiry && (
                    <div className="rounded-xl p-3"
                      style={{ background: 'rgba(183,148,246,0.05)', border: '1px solid rgba(183,148,246,0.12)' }}>
                      <div className="text-xs font-semibold mb-1" style={{ color: 'rgba(183,148,246,0.6)' }}>CADUCIDAD</div>
                      <div className="text-sm font-medium" style={{ color: '#F0EAFF' }}>
                        {format(new Date(result.expiry), 'MM/yyyy', { locale: es })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Polygon blockchain card */}
                {result.polygon_tx && (
                  <div className="rounded-xl p-4 mb-4"
                    style={{ background: 'linear-gradient(135deg, rgba(130,71,229,0.08), rgba(7,5,16,0.8))', border: '1px solid rgba(130,71,229,0.3)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(130,71,229,0.3)', color: '#8247E5' }}>⬡</div>
                      <span className="text-xs font-mono tracking-wider" style={{ color: '#8247E5' }}>POLYGON L2 · TESTNET</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded ml-auto"
                        style={{ background: 'rgba(52,211,153,0.1)', color: '#34D399' }}>CONFIRMADO</span>
                    </div>
                    <div className="text-xs font-mono break-all mb-3" style={{ color: 'rgba(240,234,255,0.5)' }}>
                      {result.polygon_tx}
                    </div>
                    <a href={`https://cardona-zkevm.polygonscan.com/tx/${result.polygon_tx}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-mono transition-opacity hover:opacity-80"
                      style={{ color: '#8247E5' }}>
                      <ExternalLink className="w-3 h-3" />Ver en PolygonScan →
                    </a>
                  </div>
                )}

                {/* GDPR note */}
                <div className="flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(0,255,242,0.04)', border: '1px solid rgba(0,255,242,0.1)' }}>
                  <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#00FFF2' }} />
                  <p className="text-xs" style={{ color: 'rgba(240,234,255,0.45)' }}>
                    <span style={{ color: '#00FFF2' }}>GDPR compliant:</span> No se ha almacenado ningún dato personal.
                    Solo se confirmó la validez criptográfica.
                  </p>
                </div>
              </>
            )}

            <button onClick={handleReset}
              className="w-full mt-5 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(183,148,246,0.1)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
              Verificar otro código
            </button>
          </div>
        )}

        {/* Use cases */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(183,148,246,0.12)' }}>
          <button onClick={() => setShowUseCases(!showUseCases)}
            className="w-full flex items-center justify-between px-6 py-4 transition-all"
            style={{ background: 'rgba(183,148,246,0.04)' }}>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" style={{ color: '#B794F6' }} />
              <span className="text-sm font-semibold" style={{ color: '#F0EAFF' }}>Casos de uso para negocios</span>
            </div>
            {showUseCases
              ? <ChevronUp className="w-4 h-4" style={{ color: 'rgba(183,148,246,0.6)' }} />
              : <ChevronDown className="w-4 h-4" style={{ color: 'rgba(183,148,246,0.6)' }} />
            }
          </button>
          {showUseCases && (
            <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {USE_CASES.map(({ icon, title, desc }) => (
                <div key={title} className="p-3 rounded-xl"
                  style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.1)' }}>
                  <div className="text-xl mb-1">{icon}</div>
                  <div className="text-sm font-medium mb-0.5" style={{ color: '#F0EAFF' }}>{title}</div>
                  <div className="text-xs" style={{ color: 'rgba(240,234,255,0.45)' }}>{desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* B2B Dashboard link */}
        <Link to="/dashboard"
          className="flex items-center justify-center gap-2 mt-6 py-3 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'rgba(96,165,250,0.06)', color: '#60A5FA', border: '1px solid rgba(96,165,250,0.2)' }}>
          <BarChart3 className="w-4 h-4" />Mi Panel →
        </Link>

        <div className="text-center mt-6">
          <p className="text-xs" style={{ color: 'rgba(240,234,255,0.2)' }}>
            OWNLY · Verificación criptográfica · GDPR Compliant · Polygon zkEVM
          </p>
        </div>
      </div>
    </div>
  );
}
