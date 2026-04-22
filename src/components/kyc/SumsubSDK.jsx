/**
 * SumsubSDK Component
 * Integrates Sumsub Web SDK for document upload and verification
 */

import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export default function SumsubSDK({ sdkToken, applicantId, onSuccess, onError }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('loading'); // loading, ready, completed, error

  useEffect(() => {
    if (!sdkToken || !containerRef.current) return;

    // Check if we're in mock mode (token starts with "mock_")
    const isMockMode = sdkToken.startsWith('mock_');

    if (isMockMode) {
      // Mock mode for local development
      console.log('Using mock Sumsub SDK for testing');
      setLoading(false);
      setStatus('ready');

      // Create mock UI
      const mockContainer = document.createElement('div');
      mockContainer.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h3 style="color: #B794F6; margin-bottom: 15px;">📋 Modo Demo - Sumsub SDK</h3>
          <p style="color: rgba(240,234,255,0.6); margin-bottom: 20px;">
            En producción, aquí aparecería la interfaz de Sumsub para subir documentos.
          </p>
          <button id="mock-verify-btn" style="
            padding: 10px 20px;
            background: linear-gradient(135deg, #B794F6, #7C3AED);
            color: #070510;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          ">
            ✓ Simular Verificación Exitosa
          </button>
        </div>
      `;

      containerRef.current.appendChild(mockContainer);

      // Add click handler for mock button
      const mockBtn = mockContainer.querySelector('#mock-verify-btn');
      if (mockBtn) {
        mockBtn.addEventListener('click', () => {
          console.log('Mock button clicked');
          console.log('applicantId:', applicantId);
          setStatus('completed');
          onSuccess?.({
            applicantId: applicantId,
            status: 'completed',
            mock: true,
          });
        });
      }

      return;
    }

    // Real Sumsub SDK loading
    const script = document.createElement('script');
    script.src = 'https://sdk.sumsub.com/idensic.js';
    script.async = true;

    script.onload = () => {
      try {
        // Initialize Sumsub SDK
        if (window.idensic && window.idensic.WebSdk) {
          const sdk = window.idensic.WebSdk.init({
            token: sdkToken,
            onMessage: (type, payload) => {
              console.log('Sumsub message:', type, payload);

              if (type === 'idensicOnSuccess') {
                setStatus('completed');
                onSuccess?.(payload);
              } else if (type === 'idensicOnError') {
                setStatus('error');
                setError(payload?.message || 'Verification failed');
                onError?.(payload);
              }
            },
            onLoad: () => {
              setLoading(false);
              setStatus('ready');
            },
          });

          // Mount SDK to container
          sdk.mount(containerRef.current);
        } else {
          throw new Error('Sumsub SDK not loaded');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message);
        onError?.(err);
      }
    };

    script.onerror = () => {
      console.warn('Failed to load Sumsub SDK from CDN, using mock mode');
      setLoading(false);
      setStatus('ready');

      // Fallback to mock mode
      const mockContainer = document.createElement('div');
      mockContainer.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h3 style="color: #B794F6; margin-bottom: 15px;">📋 Modo Demo - Sumsub SDK</h3>
          <p style="color: rgba(240,234,255,0.6); margin-bottom: 20px;">
            No se pudo cargar el SDK de Sumsub (sin conexión a internet).
            En producción, aquí aparecería la interfaz de Sumsub.
          </p>
          <button id="mock-verify-btn" style="
            padding: 10px 20px;
            background: linear-gradient(135deg, #B794F6, #7C3AED);
            color: #070510;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          ">
            ✓ Simular Verificación Exitosa
          </button>
        </div>
      `;

      containerRef.current.appendChild(mockContainer);

      const mockBtn = mockContainer.querySelector('#mock-verify-btn');
      if (mockBtn) {
        mockBtn.addEventListener('click', () => {
          console.log('Mock button clicked (fallback)');
          console.log('applicantId:', applicantId);
          setStatus('completed');
          onSuccess?.({
            applicantId: applicantId,
            status: 'completed',
            mock: true,
          });
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [sdkToken, onSuccess, onError]);

  return (
    <div className="w-full">
      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: '#B794F6' }} />
          <p style={{ color: 'rgba(240,234,255,0.7)' }}>Cargando verificador de identidad...</p>
        </div>
      )}

      {/* Error state */}
      {status === 'error' && (
        <div className="rounded-xl p-6 mb-4"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5" style={{ color: '#F87171' }} />
            <h3 className="font-semibold" style={{ color: '#F87171' }}>Error en la verificación</h3>
          </div>
          <p style={{ color: 'rgba(248,113,113,0.8)' }}>{error}</p>
        </div>
      )}

      {/* Success state */}
      {status === 'completed' && (
        <div className="rounded-xl p-6 mb-4"
          style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" style={{ color: '#34D399' }} />
            <div>
              <h3 className="font-semibold" style={{ color: '#34D399' }}>Verificación completada</h3>
              <p style={{ color: 'rgba(52,211,153,0.7)', fontSize: '0.875rem' }}>
                Tu identidad ha sido verificada exitosamente
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SDK Container */}
      {!error && status !== 'completed' && (
        <div
          ref={containerRef}
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.1)',
            minHeight: '500px',
          }}
        />
      )}
    </div>
  );
}
