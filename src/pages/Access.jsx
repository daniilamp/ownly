/**
 * Página pública de acceso a documento compartido
 * URL: /access/:accessId
 */

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Clock, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Access() {
  const { accessId } = useParams();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [showDoc, setShowDoc] = useState(false);
  const [docUrl, setDocUrl] = useState(null);

  useEffect(() => {
    const token = searchParams.get('t');
    if (!token) {
      setResult({ valid: false, reason: 'Enlace inválido o incompleto' });
      return;
    }

    try {
      const payload = JSON.parse(atob(token));

      // Validar expiración
      if (new Date(payload.expiresAt) < new Date()) {
        setResult({ valid: false, reason: 'Este acceso ha expirado' });
        return;
      }

      if (payload.status === 'revoked') {
        setResult({ valid: false, reason: 'Acceso revocado por el propietario' });
        return;
      }

      setResult({ valid: true, access: payload });
    } catch {
      setResult({ valid: false, reason: 'Enlace inválido' });
    }
  }, [accessId, searchParams]);

  const handleViewDoc = () => {
    const content = result?.access?.content;
    if (!content) return;

    const binary = atob(content);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: result.access.mimeType || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    setDocUrl({ url, mimeType: result.access.mimeType, fileName: result.access.fileName });
    setShowDoc(true);
  };

  const isImage = docUrl?.mimeType?.startsWith('image/');
  const isPdf = docUrl?.mimeType === 'application/pdf';

  if (!result) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#070510' }}>
      <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#B794F6' }} />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#070510' }}>
      <div className="w-full max-w-sm text-center">

        {result.valid ? (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(52,211,153,0.15)', border: '3px solid rgba(52,211,153,0.5)', boxShadow: '0 0 50px rgba(52,211,153,0.25)' }}>
              <CheckCircle className="w-10 h-10" style={{ color: '#34D399' }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#34D399' }}>Acceso válido</h1>
            <p className="text-sm mb-5" style={{ color: 'rgba(240,234,255,0.5)' }}>
              El propietario ha compartido este documento contigo
            </p>

            <div className="rounded-2xl p-4 text-left mb-5"
              style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 shrink-0" style={{ color: '#34D399' }} />
                <div>
                  <p className="font-semibold" style={{ color: '#F0EAFF' }}>{result.access.docTitle}</p>
                  <p className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>{result.access.fileName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(52,211,153,0.7)' }}>
                <Clock className="w-3.5 h-3.5" />
                Válido hasta {format(new Date(result.access.expiresAt), "dd MMM 'a las' HH:mm", { locale: es })}
              </div>
            </div>

            {/* CTA principal */}
            <button onClick={handleViewDoc}
              className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 mb-3 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #B794F6, #7C3AED)', color: '#070510', boxShadow: '0 0 30px rgba(183,148,246,0.3)' }}>
              <Eye className="w-5 h-5" />
              Ver documento
            </button>

            <p className="text-xs" style={{ color: 'rgba(240,234,255,0.2)' }}>
              Ownly · Acceso temporal · El propietario puede revocar en cualquier momento
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(248,113,113,0.15)', border: '3px solid rgba(248,113,113,0.5)', boxShadow: '0 0 50px rgba(248,113,113,0.25)' }}>
              <XCircle className="w-10 h-10" style={{ color: '#F87171' }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#F87171' }}>Acceso denegado</h1>
            <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>{result.reason}</p>
          </>
        )}
      </div>

      {/* Visor de documento */}
      {showDoc && docUrl && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#070510' }}>
          {/* Header visor */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: '1px solid rgba(183,148,246,0.15)', background: 'rgba(183,148,246,0.04)' }}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" style={{ color: '#B794F6' }} />
              <span className="text-sm font-semibold truncate max-w-xs" style={{ color: '#F0EAFF' }}>
                {docUrl.fileName}
              </span>
            </div>
            <button onClick={() => { setShowDoc(false); URL.revokeObjectURL(docUrl.url); setDocUrl(null); }}
              className="p-2 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {isImage && (
              <img src={docUrl.url} alt={docUrl.fileName}
                className="max-w-full max-h-full rounded-xl object-contain"
                style={{ boxShadow: '0 0 40px rgba(0,0,0,0.5)' }} />
            )}
            {isPdf && (
              <iframe src={docUrl.url} title={docUrl.fileName}
                className="w-full rounded-xl"
                style={{ height: 'calc(100vh - 80px)', border: 'none' }} />
            )}
            {!isImage && !isPdf && (
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgba(183,148,246,0.4)' }} />
                <p className="mb-4" style={{ color: 'rgba(240,234,255,0.6)' }}>
                  Vista previa no disponible para este tipo de archivo
                </p>
                <a href={docUrl.url} download={docUrl.fileName}
                  className="px-6 py-3 rounded-xl font-semibold text-sm inline-block"
                  style={{ background: 'linear-gradient(135deg, #B794F6, #7C3AED)', color: '#070510' }}>
                  Descargar archivo
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
