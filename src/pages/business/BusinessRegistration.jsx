/**
 * BusinessRegistration Page (Public)
 * Self-service registration form for companies wanting to integrate Ownly's
 * identity verification API.
 * 
 * This is a PUBLIC page — no authentication required.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7
 */

import { useState } from 'react';
import { Building2, Globe, Mail, User, FileText, BarChart3, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_OWNLY_API_URL || 'http://localhost:3001';

/**
 * Client-side validation matching the Zod schema from the design document:
 * - companyName: string, min 2, max 200 (required)
 * - companyWebsite: valid URL or empty string (optional)
 * - contactEmail: valid email format (required)
 * - contactName: string, min 2, max 255 (required)
 * - useCase: string, min 10, max 2000 (required)
 * - expectedMonthlyVolume: positive integer (optional)
 */
function validateForm(data) {
  const errors = {};

  // companyName: required, 2-200 chars
  if (!data.companyName || data.companyName.trim().length === 0) {
    errors.companyName = 'Company name is required';
  } else if (data.companyName.trim().length < 2) {
    errors.companyName = 'Company name must be at least 2 characters';
  } else if (data.companyName.trim().length > 200) {
    errors.companyName = 'Company name must be at most 200 characters';
  }

  // companyWebsite: optional, but if provided must be a valid URL
  if (data.companyWebsite && data.companyWebsite.trim().length > 0) {
    try {
      new URL(data.companyWebsite.trim());
    } catch {
      errors.companyWebsite = 'Please enter a valid URL (e.g., https://example.com)';
    }
  }

  // contactEmail: required, valid email format
  if (!data.contactEmail || data.contactEmail.trim().length === 0) {
    errors.contactEmail = 'Contact email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail.trim())) {
    errors.contactEmail = 'Please enter a valid email address';
  }

  // contactName: required, 2-255 chars
  if (!data.contactName || data.contactName.trim().length === 0) {
    errors.contactName = 'Contact name is required';
  } else if (data.contactName.trim().length < 2) {
    errors.contactName = 'Contact name must be at least 2 characters';
  } else if (data.contactName.trim().length > 255) {
    errors.contactName = 'Contact name must be at most 255 characters';
  }

  // useCase: required, 10-2000 chars
  if (!data.useCase || data.useCase.trim().length === 0) {
    errors.useCase = 'Use case description is required';
  } else if (data.useCase.trim().length < 10) {
    errors.useCase = 'Use case must be at least 10 characters';
  } else if (data.useCase.trim().length > 2000) {
    errors.useCase = 'Use case must be at most 2000 characters';
  }

  // expectedMonthlyVolume: optional, but if provided must be a positive integer
  if (data.expectedMonthlyVolume !== '' && data.expectedMonthlyVolume !== undefined && data.expectedMonthlyVolume !== null) {
    const vol = Number(data.expectedMonthlyVolume);
    if (!Number.isInteger(vol) || vol <= 0) {
      errors.expectedMonthlyVolume = 'Expected monthly volume must be a positive whole number';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export default function BusinessRegistration() {
  const [formData, setFormData] = useState({
    companyName: '',
    companyWebsite: '',
    contactEmail: '',
    contactName: '',
    useCase: '',
    expectedMonthlyVolume: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState(null);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    // Clear server error on any change
    if (serverError) {
      setServerError(null);
    }
  };

  const handleBlur = (field) => () => {
    // Validate single field on blur for immediate feedback
    const singleFieldData = { ...formData };
    const result = validateForm(singleFieldData);
    if (result.errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: result.errors[field] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);

    // Validate all fields
    const result = validateForm(formData);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      // Build request body
      const body = {
        companyName: formData.companyName.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactName: formData.contactName.trim(),
        useCase: formData.useCase.trim(),
      };

      // Only include optional fields if they have values
      if (formData.companyWebsite.trim()) {
        body.companyWebsite = formData.companyWebsite.trim();
      }
      if (formData.expectedMonthlyVolume !== '') {
        body.expectedMonthlyVolume = Number(formData.expectedMonthlyVolume);
      }

      const res = await fetch(`${API_BASE}/api/business/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        setSubmitted(true);
        return;
      }

      const errorData = await res.json().catch(() => ({}));

      if (res.status === 409) {
        // Duplicate pending application
        setServerError('An application for this email is already pending');
      } else if (res.status === 400 && errorData.details) {
        // Field-level validation errors from server
        setErrors(errorData.details);
      } else {
        setServerError(errorData.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setServerError('Unable to connect to the server. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Success confirmation view
  if (submitted) {
    return (
      <div className="min-h-screen" style={{ background: '#070510' }}>
        {/* Ambient glow */}
        <div
          className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(52,211,153,0.12), transparent 70%)' }}
        />

        <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full text-center">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.25)',
              }}
            >
              <CheckCircle2 className="w-10 h-10" style={{ color: '#34D399' }} />
            </div>

            <h1 className="text-3xl font-bold mb-3" style={{ color: '#F0EAFF' }}>
              Application Submitted!
            </h1>
            <p className="text-base mb-6" style={{ color: 'rgba(240,234,255,0.6)' }}>
              Thank you for your interest in Ownly. We've received your application and will review it shortly.
              You'll receive a confirmation email at <strong style={{ color: '#F0EAFF' }}>{formData.contactEmail}</strong>.
            </p>
            <p className="text-sm mb-8" style={{ color: 'rgba(240,234,255,0.4)' }}>
              Our team typically reviews applications within 1-2 business days. 
              You'll be notified by email once a decision has been made.
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
                color: '#070510',
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#070510' }}>
      {/* Ambient glow */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[150px] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(183,148,246,0.12), transparent 70%)' }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{
                background: 'rgba(183,148,246,0.12)',
                border: '1px solid rgba(183,148,246,0.25)',
              }}
            >
              <Building2 className="w-7 h-7" style={{ color: '#B794F6' }} />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#F0EAFF' }}>
              Business Registration
            </h1>
            <p style={{ color: 'rgba(240,234,255,0.5)' }}>
              Apply for API access to integrate Ownly's identity verification into your platform.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Company Name */}
            <FormField
              label="Company Name"
              required
              icon={<Building2 className="w-5 h-5" />}
              error={errors.companyName}
            >
              <input
                type="text"
                value={formData.companyName}
                onChange={handleChange('companyName')}
                onBlur={handleBlur('companyName')}
                placeholder="Your company name"
                maxLength={200}
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(183,148,246,0.06)',
                  border: errors.companyName
                    ? '1px solid rgba(248,113,113,0.5)'
                    : '1px solid rgba(183,148,246,0.2)',
                  color: '#F0EAFF',
                }}
                disabled={loading}
              />
            </FormField>

            {/* Company Website */}
            <FormField
              label="Company Website"
              icon={<Globe className="w-5 h-5" />}
              error={errors.companyWebsite}
            >
              <input
                type="url"
                value={formData.companyWebsite}
                onChange={handleChange('companyWebsite')}
                onBlur={handleBlur('companyWebsite')}
                placeholder="https://yourcompany.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(183,148,246,0.06)',
                  border: errors.companyWebsite
                    ? '1px solid rgba(248,113,113,0.5)'
                    : '1px solid rgba(183,148,246,0.2)',
                  color: '#F0EAFF',
                }}
                disabled={loading}
              />
            </FormField>

            {/* Contact Email */}
            <FormField
              label="Contact Email"
              required
              icon={<Mail className="w-5 h-5" />}
              error={errors.contactEmail}
            >
              <input
                type="email"
                value={formData.contactEmail}
                onChange={handleChange('contactEmail')}
                onBlur={handleBlur('contactEmail')}
                placeholder="contact@yourcompany.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(183,148,246,0.06)',
                  border: errors.contactEmail
                    ? '1px solid rgba(248,113,113,0.5)'
                    : '1px solid rgba(183,148,246,0.2)',
                  color: '#F0EAFF',
                }}
                disabled={loading}
              />
            </FormField>

            {/* Contact Name */}
            <FormField
              label="Contact Name"
              required
              icon={<User className="w-5 h-5" />}
              error={errors.contactName}
            >
              <input
                type="text"
                value={formData.contactName}
                onChange={handleChange('contactName')}
                onBlur={handleBlur('contactName')}
                placeholder="Full name of the primary contact"
                maxLength={255}
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(183,148,246,0.06)',
                  border: errors.contactName
                    ? '1px solid rgba(248,113,113,0.5)'
                    : '1px solid rgba(183,148,246,0.2)',
                  color: '#F0EAFF',
                }}
                disabled={loading}
              />
            </FormField>

            {/* Use Case */}
            <FormField
              label="Use Case"
              required
              icon={<FileText className="w-5 h-5" />}
              error={errors.useCase}
            >
              <textarea
                value={formData.useCase}
                onChange={handleChange('useCase')}
                onBlur={handleBlur('useCase')}
                placeholder="Describe how you plan to use Ownly's identity verification API (min 10 characters)"
                rows={4}
                maxLength={2000}
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all resize-none"
                style={{
                  background: 'rgba(183,148,246,0.06)',
                  border: errors.useCase
                    ? '1px solid rgba(248,113,113,0.5)'
                    : '1px solid rgba(183,148,246,0.2)',
                  color: '#F0EAFF',
                }}
                disabled={loading}
              />
            </FormField>

            {/* Expected Monthly Volume */}
            <FormField
              label="Expected Monthly Volume"
              icon={<BarChart3 className="w-5 h-5" />}
              error={errors.expectedMonthlyVolume}
              hint="Estimated number of API requests per month"
            >
              <input
                type="number"
                value={formData.expectedMonthlyVolume}
                onChange={handleChange('expectedMonthlyVolume')}
                onBlur={handleBlur('expectedMonthlyVolume')}
                placeholder="e.g., 10000"
                min="1"
                step="1"
                className="w-full pl-10 pr-4 py-3 rounded-xl outline-none transition-all"
                style={{
                  background: 'rgba(183,148,246,0.06)',
                  border: errors.expectedMonthlyVolume
                    ? '1px solid rgba(248,113,113,0.5)'
                    : '1px solid rgba(183,148,246,0.2)',
                  color: '#F0EAFF',
                }}
                disabled={loading}
              />
            </FormField>

            {/* Server Error */}
            {serverError && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.2)',
                }}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: '#F87171' }} />
                  <p style={{ color: '#F87171', fontSize: '0.875rem' }}>{serverError}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mt-6"
              style={{
                background: loading
                  ? 'rgba(183,148,246,0.3)'
                  : 'linear-gradient(135deg, #B794F6, #7C3AED)',
                color: '#070510',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-8">
            <p style={{ color: 'rgba(240,234,255,0.4)', fontSize: '0.875rem' }}>
              Already have a business account?{' '}
              <Link
                to="/login"
                className="font-semibold transition-all hover:underline"
                style={{ color: '#B794F6' }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Reusable form field wrapper with label, icon, and error display
 */
function FormField({ label, required, icon, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
        {label}
        {required && <span style={{ color: '#F87171' }}> *</span>}
      </label>
      <div className="relative">
        <div
          className="absolute left-3 top-3 pointer-events-none"
          style={{ color: 'rgba(240,234,255,0.3)' }}
        >
          {icon}
        </div>
        {children}
      </div>
      {hint && !error && (
        <p className="mt-1 text-xs" style={{ color: 'rgba(240,234,255,0.35)' }}>
          {hint}
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs" style={{ color: '#F87171' }}>
          {error}
        </p>
      )}
    </div>
  );
}
