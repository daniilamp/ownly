/**
 * DocumentUpload Component
 * Allows users to upload and encrypt documents locally
 */

import { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

const DOCUMENT_TYPES = [
  { value: 'dni', label: 'DNI' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'carnet_conducir', label: 'Carnet de Conducir' },
  { value: 'cartilla_vacunacion', label: 'Cartilla de Vacunación' },
  { value: 'certificado_medico', label: 'Certificado Médico' },
  { value: 'titulo_universitario', label: 'Título Universitario' },
  { value: 'diploma_bachillerato', label: 'Diploma de Bachillerato' },
  { value: 'licencia_profesional', label: 'Licencia Profesional' },
  { value: 'comprobante_domicilio', label: 'Comprobante de Domicilio' },
  { value: 'comprobante_ingresos', label: 'Comprobante de Ingresos' },
  { value: 'contrato_trabajo', label: 'Contrato de Trabajo' },
  { value: 'otros', label: 'Otros' },
];

export default function DocumentUpload({ onUpload, onCancel }) {
  const [documentType, setDocumentType] = useState('dni');
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('El archivo no puede ser mayor a 10MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    if (!password) {
      setError('Por favor ingresa una contraseña');
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

    setLoading(true);

    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Call onUpload with file data
      await onUpload({
        documentType,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileData: arrayBuffer,
        password,
      });

      setSuccess(true);
      setTimeout(() => {
        setFile(null);
        setPassword('');
        setConfirmPassword('');
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error al subir el documento');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl p-6 text-center"
        style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
        <CheckCircle className="w-8 h-8 mx-auto mb-3" style={{ color: '#34D399' }} />
        <h3 className="font-semibold mb-2" style={{ color: '#34D399' }}>
          ¡Documento subido exitosamente!
        </h3>
        <p style={{ color: 'rgba(52,211,153,0.7)', fontSize: '0.875rem' }}>
          Tu documento está encriptado y almacenado localmente
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Document Type */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
          Tipo de Documento
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
          style={{
            background: '#1a1030',
            border: '1px solid rgba(183,148,246,0.2)',
            color: '#F0EAFF',
          }}
          disabled={loading}
        >
          {DOCUMENT_TYPES.map(type => (
            <option key={type.value} value={type.value} style={{ background: '#1a1030', color: '#F0EAFF' }}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
          Archivo
        </label>
        <div className="relative">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
            disabled={loading}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <label
            htmlFor="file-input"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl cursor-pointer transition-all"
            style={{
              background: 'rgba(183,148,246,0.06)',
              border: '2px dashed rgba(183,148,246,0.2)',
              color: file ? '#34D399' : 'rgba(240,234,255,0.6)',
            }}
          >
            <Upload className="w-5 h-5" />
            <span>
              {file ? `✓ ${file.name}` : 'Selecciona un archivo'}
            </span>
          </label>
        </div>
        <p style={{ color: 'rgba(240,234,255,0.4)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          PDF, JPG, PNG, DOC (máx 10MB)
        </p>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
          Contraseña de Encriptación
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
          style={{
            background: 'rgba(183,148,246,0.06)',
            border: '1px solid rgba(183,148,246,0.2)',
            color: '#F0EAFF',
          }}
          disabled={loading}
        />
        <p style={{ color: 'rgba(240,234,255,0.4)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          🔒 Tú controlas esta contraseña. Nosotros nunca la vemos.
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
          Confirmar Contraseña
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repite la contraseña"
          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
          style={{
            background: 'rgba(183,148,246,0.06)',
            border: '1px solid rgba(183,148,246,0.2)',
            color: '#F0EAFF',
          }}
          disabled={loading}
        />
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

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: 'rgba(183,148,246,0.1)',
            color: '#B794F6',
            border: '1px solid rgba(183,148,246,0.2)',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
          style={{
            background: loading ? 'rgba(183,148,246,0.3)' : 'linear-gradient(135deg, #B794F6, #7C3AED)',
            color: '#070510',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Encriptando...
            </>
          ) : (
            'Subir Documento'
          )}
        </button>
      </div>

      {/* Privacy Note */}
      <p style={{ color: 'rgba(240,234,255,0.3)', fontSize: '0.75rem', textAlign: 'center' }}>
        🔐 Tu documento se encripta con AES-256-GCM en tu dispositivo. Solo tú puedes verlo.
      </p>
    </form>
  );
}
