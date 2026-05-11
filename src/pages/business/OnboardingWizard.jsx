/**
 * OnboardingWizard Component
 * Multi-step wizard guiding new business users through:
 *   Step 1: API Key Generation
 *   Step 2: Documentation Review
 *
 * Displays the generated API key exactly once with a warning to save securely.
 * Provides copy-to-clipboard functionality with visual feedback.
 *
 * Requirements: 3.2, 3.3, 9.5
 */

import { useState } from 'react';
import {
  Key,
  BookOpen,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Shield,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

/**
 * Retrieves the auth token from localStorage.
 */
function getAuthToken() {
  return localStorage.getItem('ownly_token');
}

export default function OnboardingWizard({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [apiKey, setApiKey] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  /**
   * Step 1: Generate API Key
   * Calls POST /api/business/api-keys/generate and displays the plaintext key once.
   */
  const handleGenerateKey = async () => {
    setError(null);
    setGenerating(true);

    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/api/business/api-keys/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate API key. Please retry.');
      }

      const data = await res.json();
      setApiKey(data.apiKey || data.key || data.plaintext);
    } catch (err) {
      setError(err.message || 'Failed to generate API key. Please retry.');
    } finally {
      setGenerating(false);
    }
  };

  /**
   * Copy API key to clipboard with visual feedback.
   */
  const handleCopyKey = async () => {
    if (!apiKey) return;

    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = apiKey;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  /**
   * Move to step 2 (documentation review).
   */
  const handleNextStep = () => {
    setCurrentStep(2);
  };

  /**
   * Complete the wizard and notify parent to refresh the dashboard.
   */
  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div
      className="rounded-2xl p-8 max-w-2xl mx-auto"
      style={{
        background: 'rgba(183,148,246,0.04)',
        border: '1px solid rgba(183,148,246,0.15)',
      }}
    >
      {/* Wizard Header */}
      <div className="text-center mb-8">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: 'rgba(183,148,246,0.12)',
            border: '1px solid rgba(183,148,246,0.25)',
          }}
        >
          <Shield className="w-7 h-7" style={{ color: '#B794F6' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
          Welcome to Ownly Business Portal
        </h2>
        <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
          Let's get you set up with API access in just a few steps.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <StepIndicator step={1} currentStep={currentStep} label="Generate API Key" />
        <div
          className="w-12 h-px"
          style={{
            background: currentStep >= 2
              ? 'rgba(183,148,246,0.6)'
              : 'rgba(183,148,246,0.2)',
          }}
        />
        <StepIndicator step={2} currentStep={currentStep} label="Review Docs" />
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <StepGenerateKey
          apiKey={apiKey}
          generating={generating}
          error={error}
          copied={copied}
          onGenerate={handleGenerateKey}
          onCopy={handleCopyKey}
          onNext={handleNextStep}
        />
      )}

      {currentStep === 2 && (
        <StepReviewDocs onFinish={handleFinish} />
      )}
    </div>
  );
}

/**
 * Step indicator circle with label.
 */
function StepIndicator({ step, currentStep, label }) {
  const isActive = currentStep === step;
  const isCompleted = currentStep > step;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
        style={{
          background: isCompleted
            ? 'rgba(52,211,153,0.2)'
            : isActive
              ? 'rgba(183,148,246,0.2)'
              : 'rgba(183,148,246,0.06)',
          border: isCompleted
            ? '1px solid rgba(52,211,153,0.4)'
            : isActive
              ? '1px solid rgba(183,148,246,0.4)'
              : '1px solid rgba(183,148,246,0.15)',
          color: isCompleted
            ? '#34D399'
            : isActive
              ? '#B794F6'
              : 'rgba(240,234,255,0.4)',
        }}
      >
        {isCompleted ? <Check className="w-4 h-4" /> : step}
      </div>
      <span
        className="text-xs"
        style={{
          color: isActive || isCompleted
            ? '#F0EAFF'
            : 'rgba(240,234,255,0.4)',
        }}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Step 1: Generate API Key
 */
function StepGenerateKey({ apiKey, generating, error, copied, onGenerate, onCopy, onNext }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{
            background: 'rgba(183,148,246,0.1)',
            border: '1px solid rgba(183,148,246,0.2)',
          }}
        >
          <Key className="w-6 h-6" style={{ color: '#B794F6' }} />
        </div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: '#F0EAFF' }}>
          Generate Your API Key
        </h3>
        <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
          Your API key is required to authenticate requests to the Ownly Identity API.
        </p>
      </div>

      {/* Key not yet generated */}
      {!apiKey && (
        <div className="text-center">
          <button
            onClick={onGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
            style={{
              background: generating
                ? 'rgba(183,148,246,0.3)'
                : 'linear-gradient(135deg, #B794F6, #7C3AED)',
              color: '#070510',
              opacity: generating ? 0.6 : 1,
              cursor: generating ? 'not-allowed' : 'pointer',
            }}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Key className="w-5 h-5" />
                Generate API Key
              </>
            )}
          </button>

          {error && (
            <div
              className="mt-4 rounded-xl p-4 text-left"
              style={{
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
              }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{ color: '#F87171' }} />
                <p className="text-sm" style={{ color: '#F87171' }}>{error}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Key generated — display once with warning */}
      {apiKey && (
        <div className="space-y-4">
          {/* Security Warning */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.25)',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FBBF24' }} />
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: '#FBBF24' }}>
                  Save your API key now
                </p>
                <p className="text-xs" style={{ color: 'rgba(251,191,36,0.8)' }}>
                  This is the only time your API key will be displayed. Copy it and store it securely.
                  You will not be able to view it again.
                </p>
              </div>
            </div>
          </div>

          {/* API Key Display */}
          <div
            className="rounded-xl p-4"
            style={{
              background: 'rgba(183,148,246,0.06)',
              border: '1px solid rgba(183,148,246,0.2)',
            }}
          >
            <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(240,234,255,0.5)' }}>
              Your API Key
            </label>
            <div className="flex items-center gap-2">
              <code
                className="flex-1 text-sm font-mono px-3 py-2 rounded-lg break-all"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  color: '#34D399',
                  border: '1px solid rgba(52,211,153,0.2)',
                }}
              >
                {apiKey}
              </code>
              <button
                onClick={onCopy}
                className="flex-shrink-0 p-2.5 rounded-lg transition-all hover:scale-105"
                style={{
                  background: copied
                    ? 'rgba(52,211,153,0.15)'
                    : 'rgba(183,148,246,0.1)',
                  border: copied
                    ? '1px solid rgba(52,211,153,0.3)'
                    : '1px solid rgba(183,148,246,0.2)',
                }}
                title={copied ? 'Copied!' : 'Copy to clipboard'}
              >
                {copied ? (
                  <Check className="w-4 h-4" style={{ color: '#34D399' }} />
                ) : (
                  <Copy className="w-4 h-4" style={{ color: '#B794F6' }} />
                )}
              </button>
            </div>
            {copied && (
              <p className="mt-2 text-xs" style={{ color: '#34D399' }}>
                Copied to clipboard!
              </p>
            )}
          </div>

          {/* Next Step Button */}
          <div className="text-center pt-2">
            <button
              onClick={onNext}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
                color: '#070510',
              }}
            >
              Continue to Documentation
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Step 2: Review Documentation
 */
function StepReviewDocs({ onFinish }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{
            background: 'rgba(183,148,246,0.1)',
            border: '1px solid rgba(183,148,246,0.2)',
          }}
        >
          <BookOpen className="w-6 h-6" style={{ color: '#B794F6' }} />
        </div>
        <h3 className="text-lg font-semibold mb-1" style={{ color: '#F0EAFF' }}>
          Review Documentation
        </h3>
        <p className="text-sm" style={{ color: 'rgba(240,234,255,0.5)' }}>
          Explore the API documentation to get started with your integration.
        </p>
      </div>

      {/* Documentation Overview */}
      <div className="space-y-3">
        <DocItem
          title="Identity Verification Endpoints"
          description="Verify user identities with GET /api/identity/:ownlyId and POST /api/identity/verify"
        />
        <DocItem
          title="Authentication"
          description="Include your API key in the X-API-Key header for all requests"
        />
        <DocItem
          title="Code Examples"
          description="Ready-to-use examples in JavaScript, Python, and cURL"
        />
        <DocItem
          title="Integration Guides"
          description="Step-by-step guides for prop firms, exchanges, and brokers"
        />
      </div>

      {/* Link to full documentation */}
      <div
        className="rounded-xl p-4 text-center"
        style={{
          background: 'rgba(183,148,246,0.06)',
          border: '1px solid rgba(183,148,246,0.15)',
        }}
      >
        <p className="text-sm mb-3" style={{ color: 'rgba(240,234,255,0.6)' }}>
          Visit the full documentation for detailed endpoint references, sandbox testing, and more.
        </p>
        <a
          href="/business/docs"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-all hover:underline"
          style={{ color: '#B794F6' }}
        >
          <BookOpen className="w-4 h-4" />
          Open Documentation
        </a>
      </div>

      {/* Finish Button */}
      <div className="text-center pt-2">
        <button
          onClick={onFinish}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
            color: '#070510',
          }}
        >
          <CheckCircle2 className="w-5 h-5" />
          Complete Setup
        </button>
      </div>
    </div>
  );
}

/**
 * Documentation item row.
 */
function DocItem({ title, description }) {
  return (
    <div
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: 'rgba(183,148,246,0.04)',
        border: '1px solid rgba(183,148,246,0.1)',
      }}
    >
      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#34D399' }} />
      <div>
        <p className="text-sm font-medium" style={{ color: '#F0EAFF' }}>
          {title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(240,234,255,0.5)' }}>
          {description}
        </p>
      </div>
    </div>
  );
}
