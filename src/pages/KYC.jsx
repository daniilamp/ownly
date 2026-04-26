/**
 * KYC Page
 * Main page for identity verification flow
 */

import { useState, useEffect } from 'react';
import { Shield, CheckCircle, Clock, AlertCircle, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useKYC } from '@/hooks/useKYC';
import PersonalDataForm from '@/components/kyc/PersonalDataForm';
import SumsubSDK from '@/components/kyc/SumsubSDK';

const STEPS = {
  FORM: 'form',
  VERIFICATION: 'verification',
  COMPLETED: 'completed',
  ERROR: 'error',
};

export default function KYC() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.FORM);
  const [userData, setUserData] = useState(null);
  const { loading, error, sdkToken, applicantId, initKYC, reset } = useKYC();

  /**
   * Handle form submission
   */
  const handleFormSubmit = async (data) => {
    setUserData(data);
    // Save userId to localStorage for later use
    localStorage.setItem('ownly_userId', data.userId);
    try {
      await initKYC(data);
      setStep(STEPS.VERIFICATION);
    } catch (err) {
      setStep(STEPS.ERROR);
    }
  };

  /**
   * Handle successful verification
   */
  const handleVerificationSuccess = async (payload) => {
    console.log('Verification successful:', payload);
    console.log('userData:', userData);
    console.log('applicantId:', payload.applicantId);
    
    // Call backend to create credential
    try {
      const apiUrl = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/kyc/simulate-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantId: payload.applicantId,
          userId: userData?.userId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', errorText);
        throw new Error('Failed to create credential');
      }

      const result = await response.json();
      console.log('Credential created:', result);
    } catch (err) {
      console.error('Error creating credential:', err);
    }

    setStep(STEPS.COMPLETED);
  };

  /**
   * Handle verification error
   */
  const handleVerificationError = (err) => {
    console.error('Verification error:', err);
    setStep(STEPS.ERROR);
  };

  /**
   * Handle retry
   */
  const handleRetry = () => {
    reset();
    setStep(STEPS.FORM);
    setUserData(null);
  };

  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10 animate-fadeIn">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(183,148,246,0.12)', border: '1px solid rgba(183,148,246,0.25)' }}>
              <Shield className="w-6 h-6" style={{ color: '#B794F6' }} />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: '#F0EAFF' }}>
              Verificación KYC
            </h1>
          </div>
          <p style={{ color: 'rgba(240,234,255,0.5)', fontSize: '1rem' }}>
            Verifica tu identidad de forma segura y obtén tu credencial digital
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-10">
          {[
            { step: STEPS.FORM, label: 'Datos', icon: '1' },
            { step: STEPS.VERIFICATION, label: 'Verificación', icon: '2' },
            { step: STEPS.COMPLETED, label: 'Completado', icon: '✓' },
          ].map((item, i) => {
            const steps = [STEPS.FORM, STEPS.VERIFICATION, STEPS.COMPLETED];
            const active = steps.indexOf(item.step) <= steps.indexOf(step);
            return (
              <div key={item.step} className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: active ? 'rgba(183,148,246,0.25)' : 'rgba(183,148,246,0.06)',
                      color: active ? '#B794F6' : 'rgba(183,148,246,0.4)',
                      border: `1px solid ${active ? 'rgba(183,148,246,0.4)' : 'rgba(183,148,246,0.12)'}`,
                    }}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium hidden sm:block"
                    style={{ color: active ? '#F0EAFF' : 'rgba(240,234,255,0.3)' }}>
                    {item.label}
                  </span>
                </div>
                {i < 2 && (
                  <div className="w-8 h-0.5 mx-1"
                    style={{ background: active ? 'rgba(183,148,246,0.3)' : 'rgba(183,148,246,0.08)' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="rounded-3xl p-8 mb-8"
          style={{ background: 'rgba(183,148,246,0.04)', border: '1px solid rgba(183,148,246,0.18)' }}>

          {/* Step 1: Personal Data Form */}
          {step === STEPS.FORM && (
            <div>
              <h2 className="text-xl font-bold mb-6" style={{ color: '#F0EAFF' }}>
                Paso 1: Información Personal
              </h2>
              <PersonalDataForm onSubmit={handleFormSubmit} loading={loading} />
            </div>
          )}

          {/* Step 2: Verification */}
          {step === STEPS.VERIFICATION && sdkToken && (
            <div>
              <h2 className="text-xl font-bold mb-6" style={{ color: '#F0EAFF' }}>
                Paso 2: Verificar Identidad
              </h2>
              <p className="mb-6 text-sm" style={{ color: 'rgba(240,234,255,0.6)' }}>
                Por favor, sigue las instrucciones para subir tu documento de identidad y completar la verificación.
              </p>
              {console.log('Rendering SumsubSDK with:', { sdkToken, applicantId })}
              <SumsubSDK
                sdkToken={sdkToken}
                applicantId={applicantId}
                onSuccess={handleVerificationSuccess}
                onError={handleVerificationError}
              />
            </div>
          )}

          {/* Step 3: Completed */}
          {step === STEPS.COMPLETED && (
            <div className="text-center py-4">
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(52,211,153,0.12)', border: '2px solid rgba(52,211,153,0.4)' }}>
                  <CheckCircle className="w-10 h-10" style={{ color: '#34D399' }} />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#34D399' }}>
                ✔ Identidad verificada
              </h2>
              <p className="text-lg font-semibold mb-1" style={{ color: '#F0EAFF' }}>
                Tu Ownly ID está lista
              </p>
              <p className="text-sm mb-8" style={{ color: 'rgba(240,234,255,0.5)' }}>
                {userData?.firstName} {userData?.lastName}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #B794F6, #7C3AED)', color: '#070510', boxShadow: '0 0 30px rgba(183,148,246,0.3)' }}>
                  <QrCode className="w-6 h-6" />
                  Mostrar QR
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: 'rgba(183,148,246,0.08)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
                  Usar en acceso →
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === STEPS.ERROR && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(248,113,113,0.12)', border: '2px solid rgba(248,113,113,0.4)' }}>
                  <AlertCircle className="w-8 h-8" style={{ color: '#F87171' }} />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#F87171' }}>
                Error en la Verificación
              </h2>
              <p className="mb-6" style={{ color: 'rgba(240,234,255,0.6)' }}>
                {error || 'Ocurrió un error durante la verificación. Por favor, intenta de nuevo.'}
              </p>
              <button
                onClick={handleRetry}
                className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  color: '#F87171',
                  border: '1px solid rgba(248,113,113,0.2)',
                }}
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs" style={{ color: 'rgba(240,234,255,0.2)' }}>
            OWNLY · Verificación segura · GDPR Compliant · Powered by Sumsub
          </p>
        </div>
      </div>
    </div>
  );
}
