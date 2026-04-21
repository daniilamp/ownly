import { useState } from 'react';
import { X } from 'lucide-react';

export default function CredentialForm({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    type: 'dni',
    name: '',
    number: '',
    issuer: '',
    expiryDate: '',
    birthDate: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.number) {
      alert('Por favor completa los campos requeridos');
      return;
    }
    onSave(formData);
    setFormData({ type: 'dni', name: '', number: '', issuer: '', expiryDate: '', birthDate: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Type */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#F0EAFF' }}>
            Tipo de Documento
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg outline-none"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#F0EAFF',
            }}>
            <option value="dni">DNI</option>
            <option value="passport">Pasaporte</option>
            <option value="license">Carnet de Conducir</option>
          </select>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#F0EAFF' }}>
            Nombre Completo *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Juan Pérez García"
            className="w-full px-4 py-2 rounded-lg outline-none"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#F0EAFF',
            }}
          />
        </div>

        {/* Number */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#F0EAFF' }}>
            Número de Documento *
          </label>
          <input
            type="text"
            name="number"
            value={formData.number}
            onChange={handleChange}
            placeholder="12345678A"
            className="w-full px-4 py-2 rounded-lg outline-none"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#F0EAFF',
            }}
          />
        </div>

        {/* Issuer */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#F0EAFF' }}>
            Emisor
          </label>
          <input
            type="text"
            name="issuer"
            value={formData.issuer}
            onChange={handleChange}
            placeholder="Ministerio del Interior"
            className="w-full px-4 py-2 rounded-lg outline-none"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#F0EAFF',
            }}
          />
        </div>

        {/* Birth Date */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#F0EAFF' }}>
            Fecha de Nacimiento
          </label>
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg outline-none"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#F0EAFF',
            }}
          />
        </div>

        {/* Expiry Date */}
        <div>
          <label className="block text-sm font-semibold mb-2" style={{ color: '#F0EAFF' }}>
            Fecha de Caducidad
          </label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg outline-none"
            style={{
              background: 'rgba(183,148,246,0.08)',
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#F0EAFF',
            }}
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg font-semibold transition-all"
          style={{ background: 'rgba(183,148,246,0.1)', color: '#B794F6', border: '1px solid rgba(183,148,246,0.2)' }}>
          Cancelar
        </button>
        <button
          type="submit"
          className="px-6 py-2 rounded-lg font-semibold transition-all"
          style={{
            background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
            color: '#070510',
          }}>
          Guardar Credencial
        </button>
      </div>
    </form>
  );
}
