import { useNavigate } from 'react-router-dom';
import { Shield, Home } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#070510' }}>
      <div className="text-center animate-fadeIn">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.25)' }}>
            <Shield className="w-10 h-10" style={{ color: '#B794F6' }} />
          </div>
        </div>
        <h1 className="text-7xl font-bold mb-4 gradient-text">404</h1>
        <h2 className="text-2xl font-bold mb-3" style={{ color: '#F0EAFF' }}>Página no encontrada</h2>
        <p className="mb-8" style={{ color: 'rgba(240,234,255,0.5)' }}>
          Esta página no existe o ha sido movida.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all card-hover"
          style={{ background: 'linear-gradient(135deg, #B794F6, #7C3AED)', color: '#070510' }}>
          <Home className="w-4 h-4" />
          Volver al inicio
        </button>
      </div>
    </div>
  );
}
