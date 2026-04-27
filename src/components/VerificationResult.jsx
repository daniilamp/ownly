/**
 * Verification Result Component
 * Displays verification status in a clean, user-friendly way
 * NO JSON exposed to users
 */

import { CheckCircle, AlertCircle, Clock, Shield } from 'lucide-react';

export function VerificationResult({ result, showDetails = false, onToggleDetails = null }) {
  if (!result) return null;

  const { verified, verification_level, risk_score, timestamp, unique_user, can_trade } = result;

  // Determine status icon and color
  const getStatusDisplay = () => {
    if (verified) {
      return {
        icon: CheckCircle,
        color: '#34D399',
        bgColor: 'rgba(52,211,153,0.1)',
        borderColor: 'rgba(52,211,153,0.3)',
        title: '✔ Usuario verificado',
        subtitle: 'Identidad confirmada',
      };
    } else if (verification_level === 'pending') {
      return {
        icon: Clock,
        color: '#FBBF24',
        bgColor: 'rgba(251,191,36,0.1)',
        borderColor: 'rgba(251,191,36,0.3)',
        title: '⏳ Verificación pendiente',
        subtitle: 'En proceso de revisión',
      };
    } else {
      return {
        icon: AlertCircle,
        color: '#EF4444',
        bgColor: 'rgba(239,68,68,0.1)',
        borderColor: 'rgba(239,68,68,0.3)',
        title: '✗ No verificado',
        subtitle: 'Verificación rechazada o no iniciada',
      };
    }
  };

  const status = getStatusDisplay();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <div
        className="rounded-2xl p-6 border"
        style={{
          background: status.bgColor,
          borderColor: status.borderColor,
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{
              background: `${status.color}20`,
              border: `2px solid ${status.color}`,
            }}
          >
            <StatusIcon className="w-6 h-6" style={{ color: status.color }} />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
              {status.title}
            </h3>
            <p className="text-sm mt-1" style={{ color: 'rgba(240,234,255,0.6)' }}>
              {status.subtitle}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6" style={{ borderTop: '1px solid rgba(240,234,255,0.1)' }}>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
              Nivel
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: '#F0EAFF' }}>
              {verification_level === 'full' ? 'Completo' : verification_level === 'pending' ? 'Pendiente' : 'Rechazado'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
              Riesgo
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: risk_score === 'low' ? '#34D399' : risk_score === 'medium' ? '#FBBF24' : '#EF4444' }}>
              {risk_score === 'low' ? 'Bajo' : risk_score === 'medium' ? 'Medio' : 'Alto'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
              Único
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: unique_user ? '#34D399' : '#EF4444' }}>
              {unique_user ? 'Sí' : 'No'}
            </p>
          </div>
        </div>
      </div>

      {/* Expandable Details (only for authenticated users) */}
      {onToggleDetails && (
        <button
          onClick={() => onToggleDetails(!showDetails)}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: 'rgba(183,148,246,0.1)',
            color: '#B794F6',
            border: '1px solid rgba(183,148,246,0.2)',
          }}
        >
          {showDetails ? '▼ Ocultar detalles' : '▶ Ver detalles'}
        </button>
      )}

      {/* Detailed Information (only if expanded and authenticated) */}
      {showDetails && onToggleDetails && (
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.15)',
          }}
        >
          <div className="flex justify-between items-center">
            <span style={{ color: 'rgba(240,234,255,0.6)' }}>Verificación</span>
            <span style={{ color: '#F0EAFF' }} className="font-semibold">
              {verified ? 'Completada' : 'Pendiente'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span style={{ color: 'rgba(240,234,255,0.6)' }}>Fecha</span>
            <span style={{ color: '#F0EAFF' }} className="font-semibold text-sm">
              {timestamp ? new Date(timestamp).toLocaleDateString('es-ES') : '—'}
            </span>
          </div>
          {can_trade !== undefined && (
            <div className="flex justify-between items-center">
              <span style={{ color: 'rgba(240,234,255,0.6)' }}>Puede operar</span>
              <span style={{ color: can_trade ? '#34D399' : '#EF4444' }} className="font-semibold">
                {can_trade ? 'Sí' : 'No'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Security Notice */}
      <div
        className="rounded-lg p-3 flex items-start gap-2"
        style={{
          background: 'rgba(96,165,250,0.06)',
          border: '1px solid rgba(96,165,250,0.15)',
        }}
      >
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#60A5FA' }} />
        <p className="text-xs" style={{ color: 'rgba(96,165,250,0.8)' }}>
          Esta información está protegida. Solo se comparte con tu consentimiento.
        </p>
      </div>
    </div>
  );
}
