/**
 * DocumentViewer Component
 * Displays encrypted document after decryption
 */

import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Download, Fingerprint, FileText } from 'lucide-react';
import { decryptDocument, base64ToArrayBuffer } from '@/utils/encryption';
import { isBiometricAvailable, authenticateWithBiometric, getBiometricCredentialId } from '@/utils/biometric';

export default function DocumentViewer({ document, onClose }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [useBiometric, setUseBiometric] = useState(false);

  useEffect(() => {
    checkBiometric();
  }, []);

  const checkBiometric = async () => {
    const available = await isBiometricAvailable();
    const credentialId = getBiometricCredentialId();
    setBiometricAvailable(available && !!credentialId);
  };

  const handleDecrypt = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!password) {
        throw new Error('Por favor ingresa la contraseña');
      }

      console.log('Document to decrypt:', {
        id: document.id,
        fileName: document.fileName,
        hasEncryptedData: !!document.encryptedData,
        hasIv: !!document.iv,
        hasSalt: !!document.salt,
        encryptedDataType: typeof document.encryptedData,
        ivType: typeof document.iv,
        saltType: typeof document.salt,
      });

      // Validate document has required fields
      if (!document.encryptedData) {
        throw new Error('Documento no tiene datos encriptados');
      }
      if (!document.iv) {
        throw new Error('Documento no tiene IV');
      }
      if (!document.salt) {
        throw new Error('Documento no tiene salt. Por favor sube el documento nuevamente.');
      }

      // Validate that fields are strings (Base64)
      if (typeof document.encryptedData !== 'string') {
        console.error('encryptedData is not a string:', document.encryptedData);
        throw new Error('Datos encriptados inválidos (no es string)');
      }
      if (typeof document.iv !== 'string') {
        console.error('iv is not a string:', document.iv);
        throw new Error('IV inválido (no es string)');
      }
      if (typeof document.salt !== 'string') {
        console.error('salt is not a string:', document.salt);
        throw new Error('Salt inválido (no es string)');
      }

      // Convert Base64 strings to ArrayBuffer
      let encryptedData, iv, salt;
      try {
        console.log('Converting Base64 to ArrayBuffer...');
        encryptedData = base64ToArrayBuffer(document.encryptedData);
        iv = base64ToArrayBuffer(document.iv);
        salt = base64ToArrayBuffer(document.salt);
        console.log('Conversion successful');
      } catch (decodeErr) {
        console.error('Base64 decode error:', decodeErr);
        throw new Error(`Error al decodificar datos: ${decodeErr.message}`);
      }

      // Decrypt the document
      console.log('Decrypting document...');
      const data = await decryptDocument(
        encryptedData,
        password,
        iv,
        salt
      );
      console.log('Decryption successful');

      setDecryptedData(data);
    } catch (err) {
      console.error('Decryption error:', err);
      setError(err.message || 'Error al desencriptar el documento');
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricDecrypt = async () => {
    setError(null);
    setLoading(true);

    try {
      const credentialId = getBiometricCredentialId();
      if (!credentialId) {
        throw new Error('Biometric credential not found');
      }

      // Authenticate with biometric
      await authenticateWithBiometric(credentialId);

      // If biometric succeeds, use stored password
      // In a real app, you'd retrieve the password from secure storage
      // For now, we'll prompt for password after biometric
      setUseBiometric(true);
      setError('Biometría verificada. Por favor ingresa tu contraseña.');
    } catch (err) {
      setError(err.message || 'Error en autenticación biométrica');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!decryptedData) return;

    // Create blob and download
    const blob = new Blob([decryptedData], { type: document.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = document.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto"
        style={{ background: '#070510', border: '1px solid rgba(183,148,246,0.2)' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b"
          style={{ borderColor: 'rgba(183,148,246,0.1)' }}>
          <h2 className="text-xl font-bold" style={{ color: '#F0EAFF' }}>
            Ver Documento
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:bg-opacity-50"
            style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!decryptedData ? (
            <form onSubmit={handleDecrypt} className="space-y-4">
              <div>
                <p style={{ color: 'rgba(240,234,255,0.7)', marginBottom: '1rem' }}>
                  Este documento está encriptado. Ingresa tu contraseña para verlo.
                </p>
              </div>

              {biometricAvailable && (
                <button
                  type="button"
                  onClick={handleBiometricDecrypt}
                  disabled={loading}
                  className="w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  style={{
                    background: 'rgba(96,165,250,0.1)',
                    color: '#60A5FA',
                    border: '1px solid rgba(96,165,250,0.2)',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verificando biometría...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      Usar Huella Digital / Cara
                    </>
                  )}
                </button>
              )}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                  style={{
                    background: 'rgba(183,148,246,0.06)',
                    border: '1px solid rgba(183,148,246,0.2)',
                    color: '#F0EAFF',
                  }}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-xl p-4"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" style={{ color: '#F87171' }} />
                    <p style={{ color: '#F87171', fontSize: '0.875rem' }}>{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                style={{
                  background: loading ? 'rgba(183,148,246,0.3)' : 'linear-gradient(135deg, #B794F6, #7C3AED)',
                  color: '#070510',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Desencriptando...
                  </>
                ) : (
                  'Ver Documento'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold" style={{ color: '#F0EAFF' }}>
                    {document.fileName}
                  </h3>
                  <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem' }}>
                    {(document.fileSize / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>

              {/* Document Preview */}
              <div className="rounded-xl overflow-hidden"
                style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.1)' }}>
                {document.mimeType.startsWith('image/') ? (
                  // Image preview
                  <img
                    src={URL.createObjectURL(new Blob([decryptedData], { type: document.mimeType }))}
                    alt={document.fileName}
                    className="w-full rounded-lg"
                  />
                ) : document.mimeType === 'application/pdf' ? (
                  // PDF preview
                  <iframe
                    src={URL.createObjectURL(new Blob([decryptedData], { type: document.mimeType }))}
                    className="w-full h-[600px] rounded-lg"
                    title={document.fileName}
                  />
                ) : document.mimeType.startsWith('text/') ? (
                  // Text preview
                  <div className="p-4 max-h-[600px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-mono text-sm" style={{ color: '#F0EAFF' }}>
                      {new TextDecoder().decode(decryptedData)}
                    </pre>
                  </div>
                ) : (
                  // Other file types - show preview option
                  <div className="text-center py-12">
                    <div className="mb-4">
                      <FileText className="w-16 h-16 mx-auto" style={{ color: 'rgba(183,148,246,0.5)' }} />
                    </div>
                    <p className="font-semibold mb-2" style={{ color: '#F0EAFF' }}>
                      Documento desencriptado correctamente
                    </p>
                    <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '0.875rem' }}>
                      Tipo: {document.mimeType}
                    </p>
                    <p style={{ color: 'rgba(240,234,255,0.3)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                      Este tipo de archivo no se puede previsualizar en el navegador.
                    </p>
                    <button
                      onClick={handleDownload}
                      className="mt-4 px-6 py-2 rounded-lg font-semibold text-sm transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
                        color: '#070510',
                      }}
                    >
                      Descargar para ver
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
