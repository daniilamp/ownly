import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Verify from './pages/Verify';
import Credentials from './pages/Credentials';
import Documents from './pages/Documents';
import KYC from './pages/KYC';
import NotFound from './pages/NotFound';
import Access from './pages/Access';

// Google OAuth Client ID (reemplaza con tu Client ID real)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com';

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

function AppContent() {
  const { isAuthenticated, loading, logout, userRole } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070510' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#B794F6' }} />
      </div>
    );
  }

  const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); };

  // Role-based navigation visibility
  const canAccessKYC = userRole === 'user' || userRole === 'admin';
  const canAccessVerifier = userRole === 'business' || userRole === 'admin';
  const canAccessAdmin = userRole === 'admin';

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#070510' }}>
      {/* Header */}
      <header className="relative z-20 border-b"
        style={{ background: 'rgba(183,148,246,0.04)', borderColor: 'rgba(183,148,246,0.15)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Ownly" className="w-12 h-12 rounded-xl object-cover" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {isAuthenticated ? (
              <>
                {canAccessKYC && <Link to="/kyc" className="text-sm font-semibold transition-all hover:scale-105" style={{ color: 'rgba(240,234,255,0.7)' }}>Verificación KYC</Link>}
                {canAccessKYC && <Link to="/credentials" className="text-sm font-semibold transition-all hover:scale-105" style={{ color: 'rgba(240,234,255,0.7)' }}>Mis Credenciales</Link>}
                {canAccessKYC && <Link to="/documents" className="text-sm font-semibold transition-all hover:scale-105" style={{ color: 'rgba(240,234,255,0.7)' }}>Mis Documentos</Link>}
                {canAccessVerifier && <Link to="/verify" className="text-sm font-semibold transition-all hover:scale-105" style={{ color: 'rgba(240,234,255,0.7)' }}>Verificador</Link>}
                <button onClick={handleLogout} className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{ color: '#F87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold px-4 py-2 rounded-lg transition-all"
                  style={{ background: 'linear-gradient(135deg, #B794F6, #7C3AED)', color: '#070510' }}>
                  Iniciar Sesión
                </Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg" onClick={() => setMenuOpen(!menuOpen)}
            style={{ color: '#B794F6', background: 'rgba(183,148,246,0.08)' }}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-6 py-4 flex flex-col gap-3"
            style={{ borderColor: 'rgba(183,148,246,0.15)', background: 'rgba(7,5,16,0.98)' }}>
            {isAuthenticated ? (
              <>
                {canAccessKYC && <Link to="/kyc" onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2" style={{ color: 'rgba(240,234,255,0.7)' }}>Verificación KYC</Link>}
                {canAccessKYC && <Link to="/credentials" onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2" style={{ color: 'rgba(240,234,255,0.7)' }}>Mis Credenciales</Link>}
                {canAccessKYC && <Link to="/documents" onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2" style={{ color: 'rgba(240,234,255,0.7)' }}>Mis Documentos</Link>}
                {canAccessVerifier && <Link to="/verify" onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2" style={{ color: 'rgba(240,234,255,0.7)' }}>Verificador</Link>}
                <button onClick={handleLogout} className="text-sm font-semibold py-2 text-left" style={{ color: '#F87171' }}>Salir</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm font-semibold py-2" style={{ color: '#B794F6' }}>Iniciar Sesión</Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Routes */}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/kyc" element={isAuthenticated && canAccessKYC ? <KYC /> : <Navigate to="/login" />} />
        <Route path="/credentials" element={isAuthenticated && canAccessKYC ? <Credentials /> : <Navigate to="/login" />} />
        <Route path="/documents" element={isAuthenticated && canAccessKYC ? <Documents /> : <Navigate to="/login" />} />
        <Route path="/verify" element={isAuthenticated && canAccessVerifier ? <Verify /> : <Navigate to="/login" />} />
        <Route path="/access/:accessId" element={<Access />} />
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}
