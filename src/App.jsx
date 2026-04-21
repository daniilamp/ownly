import { Routes, Route, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Verify from './pages/Verify';

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: 'rgba(183,148,246,0.1)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.25)' }}>
              <Shield className="w-5 h-5" style={{ color: '#B794F6' }} />
            </div>
            <span className="font-mono font-bold text-xl tracking-wider" style={{ color: '#B794F6' }}>OWNLY</span>
          </Link>
          <nav className="flex gap-6">
            <Link to="/verify" className="text-sm font-mono transition-opacity hover:opacity-70"
              style={{ color: 'rgba(240,234,255,0.7)' }}>
              Verificador
            </Link>
          </nav>
        </div>
      </header>

      {/* Routes */}
      <Routes>
        <Route path="/verify" element={<Verify />} />
        <Route path="/" element={<Home />} />
      </Routes>
    </div>
  );
}

function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-center">
      <h1 className="text-5xl font-bold mb-6" style={{ color: '#F0EAFF' }}>
        Ownly
      </h1>
      <p className="text-lg mb-8" style={{ color: 'rgba(240,234,255,0.6)' }}>
        Verificación de identidad con <span style={{ color: '#B794F6' }}>Zero-Knowledge Proofs</span>
      </p>
      <p className="text-sm mb-12" style={{ color: 'rgba(240,234,255,0.4)' }}>
        Demuestra atributos de tu identidad sin revelar datos sensibles
      </p>
      <Link to="/verify"
        className="inline-block px-8 py-3 rounded-xl font-semibold transition-all"
        style={{
          background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
          color: '#070510',
          boxShadow: '0 0 30px rgba(183,148,246,0.25)',
        }}>
        Ir al Verificador →
      </Link>
    </div>
  );
}
