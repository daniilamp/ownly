import { X } from 'lucide-react';

export default function QRScanner({ onScan, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-2xl p-8 max-w-md w-full"
        style={{ background: 'rgba(7,5,16,0.95)', border: '1px solid rgba(183,148,246,0.2)' }}>
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: '#F0EAFF' }}>Escanear QR</h2>
          <button onClick={onClose} className="p-1 hover:opacity-70">
            <X className="w-5 h-5" style={{ color: 'rgba(240,234,255,0.5)' }} />
          </button>
        </div>

        <div className="rounded-xl p-8 text-center"
          style={{ background: 'rgba(183,148,246,0.05)', border: '2px dashed rgba(183,148,246,0.2)' }}>
          <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
            Funcionalidad de cámara no disponible en demo.
          </p>
          <p className="text-xs mt-2" style={{ color: 'rgba(240,234,255,0.3)' }}>
            Usa los tokens de demo en el campo de texto.
          </p>
        </div>

        <button onClick={onClose}
          className="w-full mt-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'rgba(183,148,246,0.1)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
          Cerrar
        </button>
      </div>
    </div>
  );
}
