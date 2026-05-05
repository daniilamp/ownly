/**
 * ToastNotification Component
 * Display success/error/info/warning feedback messages
 * 
 * Features:
 * - Support for 4 types: success, error, info, warning
 * - Auto-dismiss after configurable duration (default: 3000ms)
 * - Manual close button
 * - Slide-in animation from top-right
 * - Stack multiple toasts vertically
 * - Matches Ownly design system
 * 
 * Requirements: 21.1, 21.2, 21.6
 */

import { useEffect, useState, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

/**
 * ToastNotification Component
 * 
 * @param {Object} props
 * @param {string} props.type - Toast type: 'success' | 'error' | 'info' | 'warning'
 * @param {string} props.message - Message to display
 * @param {number} props.duration - Auto-dismiss duration in milliseconds (default: 3000)
 * @param {Function} props.onClose - Callback when toast is closed
 * @param {number} props.index - Stack index for positioning multiple toasts (default: 0)
 */
export default function ToastNotification({
  type = 'info',
  message,
  duration = 3000,
  onClose,
  index = 0,
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const autoDismissTimerRef = useRef(null);
  const exitTimerRef = useRef(null);

  // Slide in on mount
  useEffect(() => {
    // Small delay to trigger animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss after duration
  useEffect(() => {
    if (duration <= 0) return; // Don't auto-dismiss if duration is 0 or negative

    autoDismissTimerRef.current = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [duration]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    if (isExiting) return; // Prevent multiple calls
    setIsExiting(true);
    
    // Clear auto-dismiss timer if it exists
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }
    
    // Wait for exit animation to complete before calling onClose
    exitTimerRef.current = setTimeout(() => {
      onClose?.();
    }, 300);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  // Get type-specific configuration
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle,
          color: '#34D399',
          bgColor: 'rgba(52,211,153,0.12)',
          borderColor: 'rgba(52,211,153,0.3)',
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: '#F87171',
          bgColor: 'rgba(248,113,113,0.12)',
          borderColor: 'rgba(248,113,113,0.3)',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: '#FBBF24',
          bgColor: 'rgba(251,191,36,0.12)',
          borderColor: 'rgba(251,191,36,0.3)',
        };
      case 'info':
      default:
        return {
          icon: Info,
          color: '#60A5FA',
          bgColor: 'rgba(96,165,250,0.12)',
          borderColor: 'rgba(96,165,250,0.3)',
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  // Calculate position based on stack index
  const topPosition = 24 + (index * 80); // 24px base + 80px per toast

  return (
    <div
      className={`fixed right-6 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[320px] max-w-[420px] transition-all duration-300 ${
        isVisible && !isExiting ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
      style={{
        top: `${topPosition}px`,
        background: `linear-gradient(135deg, ${config.bgColor}, rgba(20,16,40,0.95))`,
        border: `1px solid ${config.borderColor}`,
        backdropFilter: 'blur(8px)',
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5" style={{ color: config.color }} />
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words" style={{ color: '#F0EAFF' }}>
          {message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg transition-all hover:scale-110 hover:bg-opacity-20"
        style={{ 
          color: 'rgba(240,234,255,0.5)',
          background: 'rgba(240,234,255,0.05)',
        }}
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar for auto-dismiss */}
      {duration > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1 rounded-b-xl transition-all"
          style={{
            width: '100%',
            background: config.color,
            opacity: 0.3,
            animation: `shrink ${duration}ms linear`,
          }}
        />
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * ToastContainer Component
 * Container for managing multiple toast notifications
 * 
 * Usage:
 * const [toasts, setToasts] = useState([]);
 * 
 * const showToast = (type, message, duration = 3000) => {
 *   const id = Date.now();
 *   setToasts(prev => [...prev, { id, type, message, duration }]);
 * };
 * 
 * const removeToast = (id) => {
 *   setToasts(prev => prev.filter(toast => toast.id !== id));
 * };
 * 
 * <ToastContainer toasts={toasts} onClose={removeToast} />
 */
export function ToastContainer({ toasts = [], onClose }) {
  return (
    <>
      {toasts.map((toast, index) => (
        <ToastNotification
          key={toast.id}
          type={toast.type}
          message={toast.message}
          duration={toast.duration}
          index={index}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </>
  );
}
