/**
 * PersonalDataForm Component
 * Collects user personal data before KYC verification
 */

import { useState, useEffect } from 'react';
import { ChevronRight, Loader2 } from 'lucide-react';

export default function PersonalDataForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    userId: '',
    email: '',
    firstName: '',
    lastName: '',
  });

  // Usar el userId del usuario autenticado (Metamask address, email, etc.)
  useEffect(() => {
    const storedUser = localStorage.getItem('ownly_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userId = user.address || user.email || user.id || `user_${Date.now()}`;
        setFormData(prev => ({ ...prev, userId }));
        // Pre-rellenar email si está disponible
        if (user.email) {
          setFormData(prev => ({ ...prev, userId, email: user.email }));
        }
      } catch {
        setFormData(prev => ({ ...prev, userId: `user_${Date.now()}` }));
      }
    } else {
      setFormData(prev => ({ ...prev, userId: `user_${Date.now()}` }));
    }
  }, []);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nombre es requerido';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Apellido es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
          Email
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="tu@email.com"
          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
          style={{
            background: 'rgba(183,148,246,0.06)',
            border: `1px solid ${errors.email ? 'rgba(248,113,113,0.3)' : 'rgba(183,148,246,0.2)'}`,
            color: '#F0EAFF',
          }}
          disabled={loading}
        />
        {errors.email && (
          <p className="text-xs mt-1" style={{ color: '#F87171' }}>{errors.email}</p>
        )}
      </div>

      {/* First Name */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
          Nombre
        </label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="Juan"
          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
          style={{
            background: 'rgba(183,148,246,0.06)',
            border: `1px solid ${errors.firstName ? 'rgba(248,113,113,0.3)' : 'rgba(183,148,246,0.2)'}`,
            color: '#F0EAFF',
          }}
          disabled={loading}
        />
        {errors.firstName && (
          <p className="text-xs mt-1" style={{ color: '#F87171' }}>{errors.firstName}</p>
        )}
      </div>

      {/* Last Name */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#F0EAFF' }}>
          Apellido
        </label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Pérez García"
          className="w-full px-4 py-3 rounded-xl outline-none transition-all"
          style={{
            background: 'rgba(183,148,246,0.06)',
            border: `1px solid ${errors.lastName ? 'rgba(248,113,113,0.3)' : 'rgba(183,148,246,0.2)'}`,
            color: '#F0EAFF',
          }}
          disabled={loading}
        />
        {errors.lastName && (
          <p className="text-xs mt-1" style={{ color: '#F87171' }}>{errors.lastName}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
          color: '#070510',
          boxShadow: '0 0 30px rgba(183,148,246,0.25)',
        }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Iniciando verificación...
          </>
        ) : (
          <>
            Continuar
            <ChevronRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Privacy note */}
      <p className="text-xs text-center" style={{ color: 'rgba(240,234,255,0.4)' }}>
        🔒 Tus datos están protegidos y solo se usan para verificación KYC
      </p>
    </form>
  );
}
