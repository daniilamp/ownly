/**
 * Página pública de validación de acceso a documento compartido
 * URL: /access/:accessId
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import { useSharedAccess } from '@/hooks/useSharedAccess';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Access() {
  const { accessId } = useParams();
  const { validateAccess } = useSharedAccess();
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (accessId) {
      const r = validateAccess(accessId);
      setResult(r);
    }
  }, [accessId]);

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
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(52,211,153,0.15)', border: '3px solid rgba(52,211,153,0.5)', boxShadow: '0 0 50px rgba(52,211,153,0.25)' }}>
              <CheckCircle className="w-12 h-12" style={{ color: '#34D399' }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#34D399' }}>Acceso válido</h1>
            <p className="text-sm mb-6" style={{ color: 'rgba(240,234,255,0.5)' }}>
              El propietario ha compartido este documento contigo
            </p>

            <div className="rounded-2xl p-5 text-left mb-4"
              style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5" style={{ color: '#34D399' }} />
                <div>
                  <p className="font-semibold" style={{ color: '#F0EAFF' }}>{result.access.docTitle}</p>
                  <p className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>{result.access.docType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(52,211,153,0.7)' }}>
                <Clock className="w-3.5 h-3.5" />
                Válido hasta {format(new Date(result.access.expiresAt), "dd MMM 'a las' HH:mm", { locale: es })}
              </div>
            </div>

            <p className="text-xs" style={{ color: 'rgba(240,234,255,0.25)' }}>
              Ownly · Acceso temporal · El propietario puede revocar en cualquier momento
            </p>
          </>
        ) : (
          <>
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: 'rgba(248,113,113,0.15)', border: '3px solid rgba(248,113,113,0.5)', boxShadow: '0 0 50px rgba(248,113,113,0.25)' }}>
              <XCircle className="w-12 h-12" style={{ color: '#F87171' }} />
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#F87171' }}>Acceso denegado</h1>
            <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
              {result.reason}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
