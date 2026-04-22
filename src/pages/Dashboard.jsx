/**
 * Dashboard Page
 * User dashboard with verified identity information
 */

import { useState, useEffect } from 'react';
import { User, Shield, FileText, Lock, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useCredentials } from '@/hooks/useCredentials';
import { useDocuments } from '@/hooks/useDocuments';

export default function Dashboard() {
  const { user, authMethod, logout } = useAuth();
  const navigate = useNavigate();
  const { credentials, loading: credLoading } = useCredentials();
  const { documents, loading: docLoading } = useDocuments();
  const [kycData, setKycData] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load KYC data if available
    loadKycData();
  }, [user, navigate]);

  const loadKycData = async () => {
    try {
      const userId = localStorage.getItem('ownly_userId');
      if (!userId) { setKycLoading(false); return; }

      const apiUrl = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/kyc/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setKycData(data.verification);
      }
    } catch (err) {
      console.error('Error loading KYC data:', err);
    } finally {
      setKycLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getAuthMethodLabel = () => {
    switch (authMethod) {
      case 'metamask':
        return 'Metamask';
      case 'biometric':
        return 'Biometría';
      case 'email':
        return 'Email';
      default:
        return 'Desconocido';
    }
  };

  const getAuthMethodIcon = () => {
    switch (authMethod) {
      case 'metamask':
        return <Wallet className="w-5 h-5" />;
      case 'biometric':
        return <Lock className="w-5 h-5" />;
      case 'email':
        return <User className="w-5 h-5" />;
      default:
        return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
            Mi Panel
          </h1>
          <p style={{ color: 'rgba(240,234,255,0.5)' }}>
            Bienvenido a tu identidad digital verificada
          </p>
        </div>

        {/* User Info Card */}
        <div className="rounded-2xl p-8 mb-12"
          style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.2)' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold" style={{ color: '#F0EAFF' }}>
              Información de Usuario
            </h2>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              {getAuthMethodIcon()}
              <span style={{ color: '#34D399', fontSize: '0.875rem', fontWeight: 'bold' }}>
                {getAuthMethodLabel()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User ID */}
            <div>
              <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                ID de Usuario
              </p>
              <p className="font-mono" style={{ color: '#F0EAFF', wordBreak: 'break-all' }}>
                {user?.id || user?.address || user?.email}
              </p>
            </div>

            {/* Auth Method */}
            <div>
              <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Método de Autenticación
              </p>
              <p style={{ color: '#F0EAFF' }}>
                {getAuthMethodLabel()}
              </p>
            </div>

            {/* Login Time */}
            <div>
              <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Hora de Inicio de Sesión
              </p>
              <p style={{ color: '#F0EAFF' }}>
                {new Date(user?.loginTime).toLocaleString('es-ES')}
              </p>
            </div>

            {/* Verification Status */}
            <div>
              <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                Estado de Verificación
              </p>
              {kycLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: 'rgba(240,234,255,0.3)' }} />
                  <p style={{ color: 'rgba(240,234,255,0.5)' }}>Comprobando...</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: kycData ? '#34D399' : '#FBBF24' }} />
                  <p style={{ color: kycData ? '#34D399' : '#FBBF24' }}>
                    {kycData ? 'KYC Verificado' : 'Pendiente de verificación'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KYC Data */}
        {kycData && (
          <div className="rounded-2xl p-8 mb-12"
            style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#F0EAFF' }}>
              Datos de Verificación KYC
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Email
                </p>
                <p style={{ color: '#F0EAFF' }}>{kycData.email}</p>
              </div>

              <div>
                <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Nombre
                </p>
                <p style={{ color: '#F0EAFF' }}>
                  {kycData.first_name} {kycData.last_name}
                </p>
              </div>

              <div>
                <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Estado
                </p>
                <p style={{ color: '#34D399', textTransform: 'capitalize' }}>
                  {kycData.status}
                </p>
              </div>

              <div>
                <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Fecha de Verificación
                </p>
                <p style={{ color: '#F0EAFF' }}>
                  {new Date(kycData.created_at).toLocaleDateString('es-ES')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Credentials */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: '#F0EAFF', fontWeight: 'bold' }}>Credenciales</h3>
              <Shield className="w-5 h-5" style={{ color: '#60A5FA' }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: '#60A5FA' }}>
              {credLoading ? <span className="animate-pulse">—</span> : credentials.length}
            </p>
            <p style={{ color: 'rgba(96,165,250,0.7)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Credenciales verificadas
            </p>
          </div>

          {/* Documents */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: '#F0EAFF', fontWeight: 'bold' }}>Documentos</h3>
              <FileText className="w-5 h-5" style={{ color: '#34D399' }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: '#34D399' }}>
              {docLoading ? <span className="animate-pulse">—</span> : documents.length}
            </p>
            <p style={{ color: 'rgba(52,211,153,0.7)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Documentos encriptados
            </p>
          </div>

          {/* Security */}
          <div className="rounded-2xl p-6"
            style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.2)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ color: '#F0EAFF', fontWeight: 'bold' }}>Seguridad</h3>
              <Lock className="w-5 h-5" style={{ color: '#B794F6' }} />
            </div>
            <p className="text-3xl font-bold" style={{ color: '#B794F6' }}>
              ✓
            </p>
            <p style={{ color: 'rgba(183,148,246,0.7)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Encriptación AES-256
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/kyc')}
            className="rounded-xl p-6 transition-all hover:shadow-lg text-left cursor-pointer"
            style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.2)' }}
          >
            <Shield className="w-6 h-6 mb-3" style={{ color: '#B794F6' }} />
            <h3 className="font-semibold mb-1" style={{ color: '#F0EAFF' }}>Verificación KYC</h3>
            <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem' }}>
              Completa tu verificación de identidad
            </p>
          </button>

          <button
            onClick={() => navigate('/credentials')}
            className="rounded-xl p-6 transition-all hover:shadow-lg text-left cursor-pointer"
            style={{ background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.2)' }}
          >
            <Shield className="w-6 h-6 mb-3" style={{ color: '#60A5FA' }} />
            <h3 className="font-semibold mb-1" style={{ color: '#F0EAFF' }}>Mis Credenciales</h3>
            <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem' }}>
              Visualiza tus credenciales verificadas
            </p>
          </button>

          <button
            onClick={() => navigate('/documents')}
            className="rounded-xl p-6 transition-all hover:shadow-lg text-left cursor-pointer"
            style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.2)' }}
          >
            <FileText className="w-6 h-6 mb-3" style={{ color: '#34D399' }} />
            <h3 className="font-semibold mb-1" style={{ color: '#F0EAFF' }}>Mis Documentos</h3>
            <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem' }}>
              Gestiona tus documentos encriptados
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
