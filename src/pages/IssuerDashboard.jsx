import { useState } from 'react';
import { Upload, Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import BatchUpload from '@/components/issuer/BatchUpload';
import BatchHistory from '@/components/issuer/BatchHistory';

export default function IssuerDashboard() {
  const { isConnected, address } = useWallet();
  const [activeTab, setActiveTab] = useState('upload');

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#070510' }}>
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#F87171' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
            Wallet no conectada
          </h2>
          <p style={{ color: 'rgba(240,234,255,0.5)' }}>
            Conecta tu wallet para acceder al panel de emisor
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)' }}>
              <Users className="w-6 h-6" style={{ color: '#60A5FA' }} />
            </div>
            <div>
              <h1 className="text-4xl font-bold" style={{ color: '#F0EAFF' }}>
                Panel de Emisor
              </h1>
              <p className="text-sm font-mono" style={{ color: 'rgba(240,234,255,0.5)' }}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
          </div>
          <p style={{ color: 'rgba(240,234,255,0.6)' }}>
            Emite credenciales verificables en lote para tus usuarios
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b" style={{ borderColor: 'rgba(183,148,246,0.1)' }}>
          <button
            onClick={() => setActiveTab('upload')}
            className="px-6 py-3 font-semibold transition-all"
            style={{
              color: activeTab === 'upload' ? '#60A5FA' : 'rgba(240,234,255,0.5)',
              borderBottom: activeTab === 'upload' ? '2px solid #60A5FA' : '2px solid transparent',
            }}>
            <Upload className="w-4 h-4 inline mr-2" />
            Subir Lote
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="px-6 py-3 font-semibold transition-all"
            style={{
              color: activeTab === 'history' ? '#60A5FA' : 'rgba(240,234,255,0.5)',
              borderBottom: activeTab === 'history' ? '2px solid #60A5FA' : '2px solid transparent',
            }}>
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Historial
          </button>
        </div>

        {/* Content */}
        {activeTab === 'upload' ? <BatchUpload /> : <BatchHistory />}
      </div>
    </div>
  );
}
