import { AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Eliminar', danger = true }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full max-w-sm rounded-2xl p-6 animate-scaleIn"
        style={{ background: 'rgba(20,16,40,0.98)', border: '1px solid rgba(183,148,246,0.2)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: danger ? 'rgba(248,113,113,0.1)' : 'rgba(183,148,246,0.1)' }}>
            <AlertTriangle className="w-5 h-5" style={{ color: danger ? '#F87171' : '#B794F6' }} />
          </div>
          <h3 className="font-bold text-lg" style={{ color: '#F0EAFF' }}>{title}</h3>
        </div>
        <p className="mb-6 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{ background: 'rgba(183,148,246,0.08)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
            Cancelar
          </button>
          <button onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: danger ? 'rgba(248,113,113,0.15)' : 'linear-gradient(135deg, #B794F6, #7C3AED)',
              color: danger ? '#F87171' : '#070510',
              border: danger ? '1px solid rgba(248,113,113,0.3)' : 'none',
            }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
