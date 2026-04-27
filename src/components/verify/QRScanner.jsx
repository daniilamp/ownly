/**
 * QRScanner — escáner QR con cámara real usando jsQR
 */

import { useEffect, useRef, useState } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import jsQR from 'jsqr';

export default function QRScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [error, setError] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        videoRef.current.onloadedmetadata = () => {
          setReady(true);
          scanLoop();
        };
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Permite el acceso en tu navegador.');
    }
  };

  const stopCamera = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  const scanLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

    if (code?.data) {
      stopCamera();
      onScan(code.data);
      return;
    }

    rafRef.current = requestAnimationFrame(scanLoop);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#000' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: 'rgba(0,0,0,0.8)' }}>
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5" style={{ color: '#B794F6' }} />
          <span className="font-semibold" style={{ color: '#F0EAFF' }}>Escanear QR</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-full"
          style={{ background: 'rgba(255,255,255,0.1)', color: '#F0EAFF' }}>
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Cámara */}
      <div className="flex-1 relative flex items-center justify-center">
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: '#B794F6' }} />
            <p className="text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>Iniciando cámara...</p>
          </div>
        )}

        {error && (
          <div className="text-center px-6">
            <Camera className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(248,113,113,0.5)' }} />
            <p className="text-sm mb-4" style={{ color: '#F87171' }}>{error}</p>
            <button onClick={onClose}
              className="px-6 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(183,148,246,0.1)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
              Cerrar
            </button>
          </div>
        )}

        <video ref={videoRef} className="w-full h-full object-cover"
          style={{ display: error ? 'none' : 'block' }}
          playsInline muted />

        {/* Marco de escaneo */}
        {ready && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-64 h-64">
              {/* Esquinas */}
              {[['top-0 left-0', 'border-t-2 border-l-2'],
                ['top-0 right-0', 'border-t-2 border-r-2'],
                ['bottom-0 left-0', 'border-b-2 border-l-2'],
                ['bottom-0 right-0', 'border-b-2 border-r-2']].map(([pos, border], i) => (
                <div key={i} className={`absolute ${pos} w-8 h-8 ${border} rounded-sm`}
                  style={{ borderColor: '#B794F6' }} />
              ))}
              {/* Línea de escaneo animada */}
              <div className="absolute left-2 right-2 h-0.5 animate-bounce"
                style={{ background: 'rgba(183,148,246,0.8)', top: '50%' }} />
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="px-4 py-4 text-center shrink-0" style={{ background: 'rgba(0,0,0,0.8)' }}>
        <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
          Apunta la cámara al QR del usuario
        </p>
      </div>
    </div>
  );
}
