/**
 * Documents Page
 * Manage encrypted documents
 */

import { useState } from 'react';
import { FileText, Plus, AlertCircle } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import PageContainer from '@/components/PageContainer';
import DocumentUpload from '@/components/documents/DocumentUpload';
import DocumentList from '@/components/documents/DocumentList';
import DocumentViewer from '@/components/documents/DocumentViewer';

export default function Documents() {
  const { documents, loading, uploadDocument, deleteDocument } = useDocuments();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleUpload = async (documentData) => {
    try {
      setUploadError(null);
      await uploadDocument(documentData);
      setShowUploadForm(false);
    } catch (err) {
      setUploadError(err.message);
    }
  };

  const handleDelete = async (documentId) => {
    if (confirm('¿Estás seguro de que quieres eliminar este documento?')) {
      try {
        await deleteDocument(documentId);
      } catch (err) {
        alert(`Error al eliminar: ${err.message}`);
      }
    }
  };

  const handleView = (document) => {
    setSelectedDocument(document);
  };

  return (
    <PageContainer
      title="Mis Documentos"
      subtitle="Documentos encriptados localmente en tu dispositivo"
      icon={FileText}
    >
      {/* Upload Button */}
      <div className="mb-8 flex justify-end">
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all card-hover"
          style={{
            background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
            color: '#070510',
            boxShadow: '0 4px 12px rgba(183, 148, 246, 0.3)',
          }}
        >
          <Plus className="w-5 h-5" />
          Subir Documento
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="mb-8 rounded-2xl p-8 animate-scaleIn"
          style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.18)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#F0EAFF' }}>
            Subir Nuevo Documento
          </h2>
          {uploadError && (
            <div className="mb-6 rounded-xl p-4"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" style={{ color: '#F87171' }} />
                <p style={{ color: '#F87171', fontWeight: '500' }}>{uploadError}</p>
              </div>
            </div>
          )}
          <DocumentUpload
            onUpload={handleUpload}
            onCancel={() => setShowUploadForm(false)}
          />
        </div>
      )}

      {/* Documents List */}
      <div className="rounded-2xl p-8"
        style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.18)' }}>
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#F0EAFF' }}>
          Tus Documentos ({documents.length})
        </h2>
        <DocumentList
          documents={documents}
          onView={handleView}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

      {/* Privacy Notice */}
      <div className="mt-8 rounded-xl p-6"
        style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
        <p style={{ color: 'rgba(52,211,153,0.8)', fontSize: '0.95rem' }}>
          🔐 <strong>Privacidad Garantizada:</strong> Tus documentos se encriptan con AES-256-GCM en tu dispositivo. 
          Solo tú tienes acceso. Nosotros nunca vemos tus documentos sin encriptar.
        </p>
      </div>

      {/* Document Viewer Modal */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </PageContainer>
  );
}
