import { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useContracts } from '@/hooks/useContracts';
import { keccak256, encodePacked } from 'viem';

export default function BatchUpload() {
  const { address } = useWallet();
  const { addCommitments, submitBatch, isPending, isConfirming, isSuccess, error, hash } = useContracts();
  const [file, setFile] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/json') {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          setCredentials(Array.isArray(data) ? data : [data]);
        } catch (err) {
          alert('Error al leer el archivo JSON');
        }
      };
      reader.readAsText(selectedFile);
    } else {
      alert('Por favor selecciona un archivo JSON válido');
    }
  };

  const buildMerkleTree = (leaves) => {
    if (leaves.length === 0) return null;
    let layer = [...leaves];
    
    while (layer.length > 1) {
      const nextLayer = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = i + 1 < layer.length ? layer[i + 1] : layer[i];
        const sorted = left <= right ? [left, right] : [right, left];
        nextLayer.push(keccak256(encodePacked(['bytes32', 'bytes32'], sorted)));
      }
      layer = nextLayer;
    }
    
    return layer[0];
  };

  const handleUpload = async () => {
    if (credentials.length === 0) {
      alert('No hay credenciales para subir');
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      // 1. Generar commitments (hash de cada credencial)
      const commitments = credentials.map(cred => 
        keccak256(encodePacked(
          ['string', 'string', 'string'],
          [cred.name, cred.number, cred.type]
        ))
      );

      // 2. Construir Merkle tree
      const merkleRoot = buildMerkleTree(commitments);

      // 3. Llamar a la API para publicar en blockchain
      const response = await fetch(`${import.meta.env.VITE_OWNLY_API_URL}/api/batch/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials: credentials.map((cred, i) => ({
            hash: commitments[i],
            userAddress: address,
            issuerSig: keccak256(encodePacked(['string'], [cred.number])),
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Guardar en localStorage como historial
        const batch = {
          id: data.batchId,
          issuer: address,
          count: credentials.length,
          timestamp: new Date().toISOString(),
          merkleRoot: data.merkleRoot,
          txHash: data.txHash,
        };

        const history = JSON.parse(localStorage.getItem('issuer_batches') || '[]');
        history.unshift(batch);
        localStorage.setItem('issuer_batches', JSON.stringify(history));

        setResult({
          success: true,
          batchId: batch.id,
          merkleRoot: batch.merkleRoot,
          txHash: batch.txHash,
        });

        setFile(null);
        setCredentials([]);
      } else {
        throw new Error(data.error || 'Error al publicar el lote');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setResult({
        success: false,
        error: err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="rounded-2xl p-8"
        style={{ background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.2)' }}>
        
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#F0EAFF' }}>
          Subir Lote de Credenciales
        </h2>
        <p className="mb-6" style={{ color: 'rgba(240,234,255,0.5)' }}>
          Sube un archivo JSON con las credenciales a emitir. El sistema generará un Merkle tree
          y lo publicará en Polygon Amoy.
        </p>

        {/* File Input */}
        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center w-full h-64 rounded-xl cursor-pointer transition-all hover:opacity-80"
            style={{
              background: 'rgba(96,165,250,0.08)',
              border: '2px dashed rgba(96,165,250,0.3)',
            }}>
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-12 h-12 mb-4" style={{ color: '#60A5FA' }} />
              <p className="mb-2 text-sm font-semibold" style={{ color: '#F0EAFF' }}>
                {file ? file.name : 'Haz clic para subir o arrastra un archivo'}
              </p>
              <p className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>
                JSON (máx. 1000 credenciales por lote)
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        {/* Preview */}
        {credentials.length > 0 && (
          <div className="mb-6 p-4 rounded-xl"
            style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5" style={{ color: '#60A5FA' }} />
              <span className="font-semibold" style={{ color: '#F0EAFF' }}>
                {credentials.length} credenciales detectadas
              </span>
            </div>
            <div className="text-xs font-mono p-3 rounded overflow-auto max-h-40"
              style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(240,234,255,0.7)' }}>
              {JSON.stringify(credentials.slice(0, 3), null, 2)}
              {credentials.length > 3 && '\n...'}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={credentials.length === 0 || uploading}
          className="w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: credentials.length > 0 ? 'linear-gradient(135deg, #60A5FA, #3B82F6)' : 'rgba(96,165,250,0.1)',
            color: credentials.length > 0 ? '#070510' : '#60A5FA',
          }}>
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Publicando en blockchain...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Publicar Lote
            </>
          )}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-2xl p-8"
          style={{
            background: result.success ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${result.success ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
          }}>
          <div className="flex items-center gap-3 mb-4">
            {result.success ? (
              <CheckCircle className="w-8 h-8" style={{ color: '#34D399' }} />
            ) : (
              <AlertCircle className="w-8 h-8" style={{ color: '#F87171' }} />
            )}
            <h3 className="text-xl font-bold" style={{ color: '#F0EAFF' }}>
              {result.success ? 'Lote publicado exitosamente' : 'Error al publicar'}
            </h3>
          </div>

          {result.success ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'rgba(240,234,255,0.5)' }}>Batch ID:</span>
                <span className="font-mono" style={{ color: '#F0EAFF' }}>{result.batchId}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'rgba(240,234,255,0.5)' }}>Merkle Root:</span>
                <span className="font-mono text-xs" style={{ color: '#F0EAFF' }}>
                  {result.merkleRoot.slice(0, 10)}...{result.merkleRoot.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'rgba(240,234,255,0.5)' }}>TX Hash:</span>
                <span className="font-mono text-xs" style={{ color: '#F0EAFF' }}>
                  {result.txHash.slice(0, 10)}...{result.txHash.slice(-8)}
                </span>
              </div>
            </div>
          ) : (
            <p style={{ color: '#F87171' }}>{result.error}</p>
          )}
        </div>
      )}

      {/* Example JSON */}
      <div className="rounded-2xl p-6"
        style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.1)' }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: '#F0EAFF' }}>
          Formato de ejemplo
        </h3>
        <pre className="text-xs font-mono p-4 rounded overflow-auto"
          style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(240,234,255,0.7)' }}>
{`[
  {
    "name": "Juan Pérez García",
    "type": "dni",
    "number": "12345678A",
    "birthDate": "1990-05-15",
    "issuer": "Ministerio del Interior",
    "expiryDate": "2030-05-15"
  },
  {
    "name": "María López Sánchez",
    "type": "dni",
    "number": "87654321B",
    "birthDate": "1985-08-20",
    "issuer": "Ministerio del Interior",
    "expiryDate": "2029-08-20"
  }
]`}
        </pre>
      </div>
    </div>
  );
}
