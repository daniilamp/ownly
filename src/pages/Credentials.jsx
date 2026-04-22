import { useState } from 'react';
import { Shield, Plus } from 'lucide-react';
import { useCredentials } from '@/hooks/useCredentials';
import { useNavigate } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import CredentialForm from '@/components/CredentialForm';
import CredentialCard from '@/components/CredentialCard';

export default function Credentials() {
  const { credentials, loading, saveCredential, deleteCredential } = useCredentials();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#070510' }}>
        <div className="relative z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: '#B794F6' }}></div>
          <p style={{ color: 'rgba(240,234,255,0.7)', fontWeight: '500' }}>Cargando credenciales...</p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer
      title="Mis Credenciales"
      subtitle="Gestiona tus documentos de identidad de forma segura"
      icon={Shield}
    >
      {/* Add Button */}
      <div className="mb-8 flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all card-hover"
          style={{
            background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
            color: '#070510',
            boxShadow: '0 4px 12px rgba(183, 148, 246, 0.3)',
          }}>
          <Plus className="w-5 h-5" />
          Nueva Credencial
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl p-8 animate-scaleIn"
          style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.18)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#F0EAFF' }}>
            Nueva Credencial
          </h2>
          <CredentialForm
            onSubmit={(data) => {
              saveCredential(data);
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Credentials Grid */}
      {credentials.length === 0 ? (
        <div className="rounded-2xl p-12 text-center"
          style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.18)' }}>
          <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgba(183,148,246,0.5)' }} />
          <h3 className="text-xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
            No tienes credenciales aún
          </h3>
          <p style={{ color: 'rgba(240,234,255,0.5)', marginBottom: '1.5rem' }}>
            Completa el proceso de KYC para obtener tu primera credencial verificada
          </p>
          <button
            onClick={() => navigate('/kyc')}
            className="px-6 py-3 rounded-xl font-semibold transition-all card-hover"
            style={{
              background: 'linear-gradient(135deg, #48bb78, #38a169)',
              color: '#070510',
              boxShadow: '0 4px 12px rgba(72, 187, 120, 0.3)',
            }}
          >
            Ir a Verificación KYC
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              onDelete={() => deleteCredential(credential.id)}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
