/**
 * ExportButton Component
 * Export audit logs to CSV format
 * 
 * Features:
 * - Generate CSV file from current filtered logs
 * - Include all log fields in CSV export
 * - Filename format: "audit-logs-YYYY-MM-DD.csv"
 * - Display progress indicator during export
 * - Trigger browser download on completion
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6
 */

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

/**
 * Convert logs array to CSV format
 */
const convertToCSV = (logs, logType) => {
  if (!logs || logs.length === 0) {
    return '';
  }

  // Define headers based on log type
  let headers = [];
  let rows = [];

  switch (logType) {
    case 'access':
      headers = ['Timestamp', 'User ID', 'User Email', 'Endpoint', 'Method', 'Access Granted', 'User Role', 'Required Role'];
      rows = logs.map(log => [
        log.timestamp,
        log.userId || '',
        log.userEmail || '',
        log.endpoint || '',
        log.method || '',
        log.accessGranted ? 'Yes' : 'No',
        log.userRole || '',
        log.requiredRole || '',
      ]);
      break;

    case 'role-changes':
      headers = ['Timestamp', 'User ID', 'User Email', 'Old Role', 'New Role', 'Changed By ID', 'Changed By Email', 'Reason'];
      rows = logs.map(log => [
        log.timestamp,
        log.userId || '',
        log.userEmail || '',
        log.oldRole || '',
        log.newRole || '',
        log.changedBy || '',
        log.changedByEmail || '',
        log.reason || '',
      ]);
      break;

    case 'security':
      headers = ['Timestamp', 'User ID', 'User Email', 'Endpoint', 'Event Type', 'Severity', 'Details'];
      rows = logs.map(log => [
        log.timestamp,
        log.userId || '',
        log.userEmail || '',
        log.endpoint || '',
        log.eventType || '',
        log.severity || '',
        log.details || '',
      ]);
      break;

    default:
      return '';
  }

  // Escape CSV values (handle commas, quotes, newlines)
  const escapeCSVValue = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV string
  const csvRows = [
    headers.map(escapeCSVValue).join(','),
    ...rows.map(row => row.map(escapeCSVValue).join(',')),
  ];

  return csvRows.join('\n');
};

/**
 * Generate filename with current date
 */
const generateFilename = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `audit-logs-${year}-${month}-${day}.csv`;
};

/**
 * Trigger browser download of CSV file
 */
const downloadCSV = (csvContent, filename) => {
  // Create blob with UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * ExportButton Component
 * 
 * @param {Object} props
 * @param {Array} props.logs - Array of log entries to export
 * @param {string} props.logType - Type of logs: 'access' | 'role-changes' | 'security'
 * @param {Object} props.filters - Current filter values (for display)
 * @param {Function} props.onExportStart - Callback when export starts (optional)
 * @param {Function} props.onExportComplete - Callback when export completes (optional)
 * @param {Function} props.onExportError - Callback when export fails (optional)
 */
export default function ExportButton({
  logs = [],
  logType = 'access',
  filters = {},
  onExportStart,
  onExportComplete,
  onExportError,
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (logs.length === 0) {
      onExportError?.('No logs to export');
      return;
    }

    try {
      setIsExporting(true);
      onExportStart?.();

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));

      // Convert logs to CSV
      const csvContent = convertToCSV(logs, logType);

      if (!csvContent) {
        throw new Error('Failed to generate CSV content');
      }

      // Generate filename
      const filename = generateFilename();

      // Trigger download
      downloadCSV(csvContent, filename);

      onExportComplete?.(filename);
    } catch (error) {
      console.error('Export failed:', error);
      onExportError?.(error.message || 'Failed to export logs');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || logs.length === 0}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      style={{
        background: 'rgba(52,211,153,0.12)',
        border: '1px solid rgba(52,211,153,0.3)',
        color: '#34D399',
      }}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export to CSV ({logs.length} logs)
        </>
      )}
    </button>
  );
}
