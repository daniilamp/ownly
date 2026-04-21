import { useState, useEffect } from 'react';
import { Package, ExternalLink, Calendar, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BatchHistory() {
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('issuer_batches') || '[]');
    setBatches(history);
  }, []);

  if (batches.length === 0) {
    return (
      <div className="text-center py-20 rounded-2xl"
        style={{ background: 'rgba(96,165,250,0.04)', border: '1px dashed rgba(96,165,250,0.2)' }}>
        <Package className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgba(96,165,250,0.5)' }} />
        <p className="text-lg" style={{ color: 'rgba(240,234,255,0.5)' }}>
          No hay lotes publicados aún
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {batches.map(batch => (
        <div
          key={batch.id}
          className="rounded-xl p-6 transition-all hover:shadow-lg"
          style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
          
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-5 h-5" style={{ color: '#60A5FA' }} />
                <h3 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
                  Lote #{batch.id}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
                <Calendar className="w-4 h-4" />
                {format(new Date(batch.timestamp), "dd MMM yyyy 'a las' HH:mm", { locale: es })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold" style={{ color: '#60A5FA' }}>
                {batch.count}
              </div>
              <div className="text-xs" style={{ color: 'rgba(240,234,255,0.5)' }}>
                credenciales
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4" style={{ color: 'rgba(240,234,255,0.5)' }} />
              <span style={{ color: 'rgba(240,234,255,0.5)' }}>Merkle Root:</span>
              <span className="font-mono text-xs" style={{ color: '#F0EAFF' }}>
                {batch.merkleRoot.slice(0, 10)}...{batch.merkleRoot.slice(-8)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" style={{ color: 'rgba(240,234,255,0.5)' }} />
              <span style={{ color: 'rgba(240,234,255,0.5)' }}>TX Hash:</span>
              <a
                href={`https://amoy.polygonscan.com/tx/${batch.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs hover:opacity-70 transition-opacity"
                style={{ color: '#60A5FA' }}>
                {batch.txHash.slice(0, 10)}...{batch.txHash.slice(-8)} →
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
