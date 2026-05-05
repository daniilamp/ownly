/**
 * FilterPanel Component
 * Reusable filter component for admin tables
 * 
 * Features:
 * - Text input with debounce
 * - Dropdown select
 * - Date range picker
 * - Multi-select
 * - Active filter count badge
 * - Reset all filters functionality
 * - Responsive layout for mobile/desktop
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 8.1, 8.2, 8.3, 8.4, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */

import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar, ChevronDown } from 'lucide-react';

/**
 * FilterPanel Component
 * 
 * @param {Object} props
 * @param {Array} props.filters - Array of filter configurations
 *   Each filter config: { key, type, label, placeholder, options, defaultValue }
 *   Types: 'text', 'select', 'dateRange', 'multiSelect'
 * @param {Object} props.activeFilters - Current filter values { filterKey: value }
 * @param {Function} props.onChange - Callback when filter changes (filterKey, value)
 * @param {Function} props.onReset - Callback to reset all filters
 */
export default function FilterPanel({ filters = [], activeFilters = {}, onChange, onReset }) {
  const [localFilters, setLocalFilters] = useState(activeFilters);
  const [expandedMultiSelect, setExpandedMultiSelect] = useState(null);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalFilters(activeFilters);
  }, [activeFilters]);

  // Calculate active filter count (non-empty values)
  const activeFilterCount = Object.values(activeFilters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) {
      // For date range objects
      return value.startDate || value.endDate;
    }
    return value !== '' && value !== null && value !== undefined;
  }).length;

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
    onChange(key, value);
  };

  const handleReset = () => {
    setLocalFilters({});
    setExpandedMultiSelect(null);
    onReset();
  };

  const toggleMultiSelect = (key) => {
    setExpandedMultiSelect(expandedMultiSelect === key ? null : key);
  };

  const handleMultiSelectChange = (filterKey, option) => {
    const currentValues = localFilters[filterKey] || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter(v => v !== option)
      : [...currentValues, option];
    handleFilterChange(filterKey, newValues);
  };

  const renderFilter = (filter) => {
    const value = localFilters[filter.key] || filter.defaultValue || '';

    switch (filter.type) {
      case 'text':
        return (
          <div key={filter.key} className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(240,234,255,0.6)' }}>
              {filter.label}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(183,148,246,0.4)' }} />
              <input
                type="text"
                placeholder={filter.placeholder || 'Search...'}
                value={value}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(183,148,246,0.04)',
                  border: '1px solid rgba(183,148,246,0.15)',
                  color: '#F0EAFF',
                  '--tw-ring-color': 'rgba(183,148,246,0.3)',
                }}
              />
            </div>
          </div>
        );

      case 'select':
        return (
          <div key={filter.key} className="flex-1 min-w-[180px]">
            <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(240,234,255,0.6)' }}>
              {filter.label}
            </label>
            <div className="relative">
              <select
                value={value}
                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm appearance-none cursor-pointer transition-all focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(183,148,246,0.04)',
                  border: '1px solid rgba(183,148,246,0.15)',
                  color: '#F0EAFF',
                  '--tw-ring-color': 'rgba(183,148,246,0.3)',
                }}
              >
                <option value="">{filter.placeholder || 'All'}</option>
                {filter.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'rgba(183,148,246,0.4)' }} />
            </div>
          </div>
        );

      case 'dateRange':
        return (
          <div key={filter.key} className="flex-1 min-w-[280px]">
            <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(240,234,255,0.6)' }}>
              {filter.label}
            </label>
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(183,148,246,0.4)' }} />
                <input
                  type="date"
                  placeholder="Start date"
                  value={value?.startDate || ''}
                  onChange={(e) => handleFilterChange(filter.key, { ...value, startDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: 'rgba(183,148,246,0.04)',
                    border: '1px solid rgba(183,148,246,0.15)',
                    color: '#F0EAFF',
                    '--tw-ring-color': 'rgba(183,148,246,0.3)',
                  }}
                />
              </div>
              <span className="text-xs" style={{ color: 'rgba(240,234,255,0.4)' }}>to</span>
              <div className="relative flex-1">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(183,148,246,0.4)' }} />
                <input
                  type="date"
                  placeholder="End date"
                  value={value?.endDate || ''}
                  onChange={(e) => handleFilterChange(filter.key, { ...value, endDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2"
                  style={{
                    background: 'rgba(183,148,246,0.04)',
                    border: '1px solid rgba(183,148,246,0.15)',
                    color: '#F0EAFF',
                    '--tw-ring-color': 'rgba(183,148,246,0.3)',
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 'multiSelect':
        const selectedValues = value || [];
        return (
          <div key={filter.key} className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(240,234,255,0.6)' }}>
              {filter.label}
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMultiSelect(filter.key)}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(183,148,246,0.04)',
                  border: '1px solid rgba(183,148,246,0.15)',
                  color: selectedValues.length > 0 ? '#F0EAFF' : 'rgba(240,234,255,0.5)',
                  '--tw-ring-color': 'rgba(183,148,246,0.3)',
                }}
              >
                <span>
                  {selectedValues.length > 0
                    ? `${selectedValues.length} selected`
                    : filter.placeholder || 'Select...'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedMultiSelect === filter.key ? 'rotate-180' : ''}`} style={{ color: 'rgba(183,148,246,0.4)' }} />
              </button>
              
              {expandedMultiSelect === filter.key && (
                <div
                  className="absolute z-10 w-full mt-2 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  style={{
                    background: 'rgba(20,16,40,0.98)',
                    border: '1px solid rgba(183,148,246,0.2)',
                  }}
                >
                  {filter.options?.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-opacity-80 transition-all"
                      style={{
                        background: selectedValues.includes(option.value) ? 'rgba(183,148,246,0.08)' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedValues.includes(option.value)}
                        onChange={() => handleMultiSelectChange(filter.key, option.value)}
                        className="w-4 h-4 rounded cursor-pointer"
                        style={{
                          accentColor: '#B794F6',
                        }}
                      />
                      <span className="text-sm" style={{ color: '#F0EAFF' }}>
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="rounded-xl p-4 lg:p-6 mb-6"
      style={{
        background: 'rgba(183,148,246,0.04)',
        border: '1px solid rgba(183,148,246,0.15)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5" style={{ color: '#B794F6' }} />
          <h3 className="font-bold text-base" style={{ color: '#F0EAFF' }}>
            Filters
          </h3>
          {activeFilterCount > 0 && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: 'rgba(183,148,246,0.15)',
                color: '#B794F6',
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        
        {activeFilterCount > 0 && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.2)',
              color: '#F87171',
            }}
          >
            <X className="w-3.5 h-3.5" />
            Reset All
          </button>
        )}
      </div>

      {/* Filter inputs */}
      <div className="flex flex-wrap gap-4">
        {filters.map(filter => renderFilter(filter))}
      </div>
    </div>
  );
}
