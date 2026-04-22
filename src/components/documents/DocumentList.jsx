/**
 * DocumentList Component
 * Displays list of uploaded documents
 */

import { Trash2, Eye, Lock } from 'lucide-react';
import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

const DOCUMENT_TYPE_LABELS = {
  dni: 'DNI',
  pasaporte: 'Pasaporte',
  carnet_conducir: 'Carnet de Conducir',
  cartilla_vacunacion: 'Cartilla de Vacunación',
  certificado_medico: 'Certificado Médico',
  titulo_universitario: 'Título Universitario',
  diploma_bachillerato: 'Diploma de Bachillerato',
  licencia_profesional: 'Licencia Profesional',
  comprobante_domicilio: 'Comprobante de Domicilio',
  comprobante_ingresos: 'Comprobante de Ingresos',
  contrato_trabajo: 'Contrato de Trabajo',
  otros: 'Otros',
};

export default function DocumentList({ documents, onView, onDelete, loading }) {
  const [confirmId, setConfirmId] = useState(null);

  const handleDeleteClick = (id) => setConfirmId(id);
  const handleConfirm = () => { onDelete(confirmId); setConfirmId(null); };
  const handleCancel = () => setConfirmId(null);
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-3"></div>
        <p style={{ color: 'rgba(240,234,255,0.5)' }}>Cargando documentos...</p>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl"
        style={{ background: 'rgba(183,148,246,0.04)', border: '1px dashed rgba(183,148,246,0.2)' }}>
        <Lock className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(183,148,246,0.5)' }} />
        <p style={{ color: 'rgba(240,234,255,0.5)' }}>
          No tienes documentos guardados
        </p>
        <p style={{ color: 'rgba(240,234,255,0.3)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Sube tu primer documento para comenzar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map(doc => (
        <div
          key={doc.id}
          className="rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-lg"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4" style={{ color: '#34D399' }} />
              <h3 className="font-semibold" style={{ color: '#F0EAFF' }}>
                {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
              </h3>
            </div>
            <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem' }}>
              {doc.fileName}
            </p>
            <p style={{ color: 'rgba(240,234,255,0.3)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
              {(doc.fileSize / 1024).toFixed(2)} KB • {new Date(doc.uploadedAt).toLocaleDateString('es-ES')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onView(doc)}
              className="p-2 rounded-lg transition-all hover:bg-opacity-50"
              style={{
                background: 'rgba(96,165,250,0.1)',
                color: '#60A5FA',
              }}
              title="Ver documento"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleDeleteClick(doc.id)}
              className="p-2 rounded-lg transition-all hover:bg-opacity-50"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}
              title="Eliminar documento">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      {confirmId && (
        <ConfirmModal
          title="Eliminar documento"
          message="¿Seguro que quieres eliminar este documento? Esta acción no se puede deshacer."
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
