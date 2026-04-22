/**
 * Login Page
 * Multiple authentication methods
 */

import { useState } from 'react';
import { Shield, Wallet, Fingerprint, Mail, Loader2, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { loginWithMetamask, loginWithBiometric, loginWithEmail, loginWithGoogle, biometricAvailable } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleMetamaskLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // En móvil sin window.ethereum, redirigir al navegador de Metamask
      if (!window.ethereum) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          const currentUrl = encodeURIComponent(window.location.href);
          window.location.href = `https://metamask.app.link/dapp/${window.location.host}`;
          return;
        }
        throw new Error('Metamask no está instalado. Instálalo desde https://metamask.io');
      }

      if (!window.ethereum.isMetaMask) {
        throw new Error('Por favor usa Metamask para conectar');
      }

      // Request accounts - abre popup si no está conectado
      let accounts;
      try {
        accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
      } catch (err) {
        if (err.code === 4001) {
          throw new Error('Conexión rechazada. Por favor acepta la solicitud en Metamask.');
        }
        if (err.code === -32002) {
          throw new Error('Ya hay una solicitud pendiente en Metamask. Abre Metamask y acéptala.');
        }
        throw err;
      }

      if (!accounts || accounts.length === 0) {
        throw new Error('No se encontraron cuentas en Metamask');
      }

      const address = accounts[0];

      // Pedir firma para verificar que el usuario controla la wallet
      // Esto SIEMPRE abre el popup de Metamask para confirmar
      const message = `Bienvenido a OWNLY\n\nFirma este mensaje para verificar que eres el propietario de esta wallet.\n\nDirección: ${address}\nFecha: ${new Date().toISOString()}`;

      let signature;
      try {
        signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });
      } catch (err) {
        if (err.code === 4001) {
          throw new Error('Firma rechazada. Por favor acepta la firma en Metamask.');
        }
        throw err;
      }

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      await loginWithMetamask(address, chainId);
      navigate('/dashboard');
    } catch (err) {
      console.error('Metamask login error:', err);
      setError(err.message || 'Error al conectar Metamask');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      await loginWithBiometric();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error en autenticación biométrica');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error('Por favor completa todos los campos');
      }

      await loginWithEmail(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);

    try {
      await loginWithGoogle(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Error al iniciar sesión con Google. Por favor intenta de nuevo.');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#070510' }}>
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(183,148,246,0.12), transparent 70%)' }} />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full animate-fadeIn">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6 animate-float">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.25)' }}>
                <Shield className="w-7 h-7" style={{ color: '#B794F6' }} />
              </div>
              <span className="font-bold text-3xl tracking-tight gradient-text">OWNLY</span>
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ color: '#F0EAFF' }}>
              Bienvenido
            </h1>
            <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '1.1rem' }}>
              Accede a tu identidad digital verificada
            </p>
          </div>

          {/* Card Container */}
          <div className="rounded-3xl p-8 mb-6"
            style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.18)' }}>
            {/* Error */}
            {error && (
              <div className="mb-6 rounded-xl p-4 animate-scaleIn"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" style={{ color: '#F87171' }} />
                  <p style={{ color: '#F87171', fontSize: '0.875rem', fontWeight: '500' }}>{error}</p>
                </div>
              </div>
            )}

            {/* Login Methods */}
            {!showEmailForm ? (
              <div className="space-y-3">
                {/* Google - Solo mostrar si está configurado */}
                {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID !== '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com' && (
                  <>
                    <div className="w-full">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="outline"
                        size="large"
                        text="continue_with"
                        shape="rectangular"
                        logo_alignment="left"
                        width="100%"
                      />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px" style={{ background: 'rgba(183,148,246,0.2)' }} />
                      <span style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', fontWeight: '500' }}>o continúa con</span>
                      <div className="flex-1 h-px" style={{ background: 'rgba(183,148,246,0.2)' }} />
                    </div>
                  </>
                )}

                {/* Metamask */}
                <button
                  onClick={handleMetamaskLogin}
                  disabled={loading}
                  className="w-full px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 card-hover"
                  style={{
                    background: loading ? 'rgba(246,173,85,0.3)' : 'linear-gradient(135deg, #f6ad55, #ed8936)',
                    color: '#070510',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(237, 137, 54, 0.3)',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-5 h-5" />
                      {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Abrir en Metamask' : 'Conectar Metamask'}
                    </>
                  )}
                </button>

                {/* Biometric */}
                {biometricAvailable && (
                  <button
                    onClick={handleBiometricLogin}
                    disabled={loading}
                    className="w-full px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 card-hover"
                    style={{
                      background: loading ? 'rgba(72,187,120,0.3)' : 'linear-gradient(135deg, #48bb78, #38a169)',
                      color: '#070510',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-5 h-5" />
                        Huella Digital / Cara
                      </>
                    )}
                  </button>
                )}

                {/* Email */}
                <button
                  onClick={() => setShowEmailForm(true)}
                  disabled={loading}
                  className="w-full px-6 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-3 card-hover"
                  style={{
                    background: loading ? 'rgba(183,148,246,0.3)' : 'linear-gradient(135deg, #B794F6, #7C3AED)',
                    color: '#070510',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(183, 148, 246, 0.3)',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <Mail className="w-5 h-5" />
                  Email y Contraseña
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#F0EAFF' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                    style={{
                      background: 'rgba(183,148,246,0.06)',
                      border: '1px solid rgba(183,148,246,0.2)',
                      color: '#F0EAFF',
                    }}
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#F0EAFF' }}>
                    Contraseña
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                    style={{
                      background: 'rgba(183,148,246,0.06)',
                      border: '1px solid rgba(183,148,246,0.2)',
                      color: '#F0EAFF',
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(false)}
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all card-hover"
                    style={{
                      background: 'rgba(183,148,246,0.1)',
                      color: '#B794F6',
                      border: '1px solid rgba(183,148,246,0.2)',
                    }}
                  >
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 card-hover"
                    style={{
                      background: loading ? 'rgba(183,148,246,0.3)' : 'linear-gradient(135deg, #B794F6, #7C3AED)',
                      color: '#070510',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(183, 148, 246, 0.3)',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Iniciando...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Info */}
          <div className="text-center space-y-4">
            <div className="rounded-xl p-4"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <p style={{ color: 'rgba(52,211,153,0.8)', fontSize: '0.875rem' }}>
                🔐 <strong>Seguridad:</strong> Tus datos están protegidos con encriptación de grado militar.
              </p>
            </div>

            {!showEmailForm && (
              <div>
                <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  ¿No tienes cuenta?
                </p>
                <Link
                  to="/register"
                  className="inline-block px-6 py-3 rounded-xl font-semibold transition-all card-hover"
                  style={{
                    background: 'linear-gradient(135deg, #48bb78, #38a169)',
                    color: '#070510',
                    boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
                  }}
                >
                  Crear Cuenta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
