import { useState } from 'react';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useCredentials } from '@/hooks/useCredentials';
import CredentialForm from '@/components/CredentialForm';
import CredentialCard from '@/components/CredentialCard';

export default function Credentials() {
  const { credentials, loading, saveCredential, deleteCredential } = useCredentials();
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070510' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p style={{ color: 'rgba(240,234,255,0.5)' }}>Cargando credenciales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
              Mis Credenciales
            </h1>
            <p style={{ color: 'rgba(240,234,255,0.5)' }}>
              Gestiona tus documentos de identidad de forma segura
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
              color: '#070510',
              boxShadow: '0 0 20px rgba(183,148,246,0.3)',
            }}>
            <Plus className="w-5 h-5" />
            Nueva Credencial
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-12 rounded-2xl p-8"
            style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.2)' }}>
            <CredentialForm
              onSave={(cred) => {
                saveCredential(cred);
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Credentials Grid */}
        {credentials.length === 0 ? (
          <div className="text-center py-20 rounded-2xl"
            style={{ background: 'rgba(183,148,246,0.04)', border: '1px dashed rgba(183,148,246,0.2)' }}>
            <p className="text-lg mb-4" style={{ color: 'rgba(240,234,255,0.5)' }}>
              No tienes credenciales guardadas
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-block px-6 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(183,148,246,0.1)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
              Crear la primera →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {credentials.map(cred => (
              <CredentialCard
                key={cred.id}
                credential={cred}
                onDelete={() => deleteCredential(cred.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
