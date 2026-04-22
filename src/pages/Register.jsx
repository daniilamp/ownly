/**
 * Register Page
 * User registration
 */

import { useState } from 'react';
import { Shield, Mail, Lock, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const { registerWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!email || !password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido');
      return;
    }

    setLoading(true);

    try {
      await registerWithEmail(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      {/* Ambient glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(183,148,246,0.12), transparent 70%)' }} />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.25)' }}>
                <Shield className="w-6 h-6" style={{ color: '#B794F6' }} />
              </div>
              <span className="font-mono font-bold text-2xl tracking-wider" style={{ color: '#B794F6' }}>OWNLY</span>
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
              Crear Cuenta
            </h1>
            <p style={{ color: 'rgba(240,234,255,0.5)' }}>
              Regístrate para acceder a tu identidad digital
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5" style={{ color: 'rgba(240,234,255,0.3)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
                  style={{
                    background: 'rgba(183,148,246,0.06)',
                    border: '1px solid rgba(183,148,246,0.2)',
                    color: '#F0EAFF',
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5" style={{ color: 'rgba(240,234,255,0.3)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
                  style={{
                    background: 'rgba(183,148,246,0.06)',
                    border: '1px solid rgba(183,148,246,0.2)',
                    color: '#F0EAFF',
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5" style={{ color: 'rgba(240,234,255,0.3)' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
                  style={{
                    background: 'rgba(183,148,246,0.06)',
                    border: '1px solid rgba(183,148,246,0.2)',
                    color: '#F0EAFF',
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl p-4"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" style={{ color: '#F87171' }} />
                  <p style={{ color: '#F87171', fontSize: '0.875rem' }}>{error}</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              style={{
                background: loading ? 'rgba(183,148,246,0.3)' : 'linear-gradient(135deg, #B794F6, #7C3AED)',
                color: '#070510',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center">
            <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              ¿Ya tienes cuenta?
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: 'rgba(183,148,246,0.1)',
                color: '#B794F6',
                border: '1px solid rgba(183,148,246,0.2)',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Iniciar Sesión
            </Link>
          </div>

          {/* Privacy */}
          <div className="mt-8 rounded-xl p-4"
            style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <p style={{ color: 'rgba(52,211,153,0.8)', fontSize: '0.75rem' }}>
              🔐 Tu contraseña se encripta localmente. Nunca la compartimos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
