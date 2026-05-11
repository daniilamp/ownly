/**
 * ErrorBoundary Component
 * Catches and displays component errors gracefully
 * 
 * Features:
 * - Catch React component errors
 * - Display fallback UI with error details
 * - Provide retry option to reset error state
 * - Error reporting mechanism (console logging)
 * - Prevents entire app crash from component errors
 * 
 * Requirements: 21.1, 21.2, 21.4
 */

import { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary Component
 * 
 * @example
 * <ErrorBoundary>
 *   <AdminDashboard />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // TODO: Send error to error reporting service (e.g., Sentry)
    // reportErrorToService(error, errorInfo);
  }

  handleReset = () => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI when error occurs
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: '#070510' }}
        >
          <div
            className="max-w-2xl w-full rounded-2xl p-8"
            style={{
              background: 'rgba(183,148,246,0.04)',
              border: '1px solid rgba(183,148,246,0.15)',
            }}
          >
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.2)',
                }}
              >
                <AlertTriangle className="w-10 h-10" style={{ color: '#F87171' }} />
              </div>
            </div>

            {/* Error Title */}
            <h1
              className="text-3xl font-bold text-center mb-4"
              style={{ color: '#F0EAFF' }}
            >
              Something went wrong
            </h1>

            {/* Error Description */}
            <p
              className="text-center mb-6 text-base"
              style={{ color: 'rgba(240,234,255,0.6)' }}
            >
              We encountered an unexpected error while rendering this component. 
              This has been logged and we'll look into it.
            </p>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div
                className="mb-6 p-4 rounded-lg overflow-auto max-h-60"
                style={{
                  background: 'rgba(248,113,113,0.05)',
                  border: '1px solid rgba(248,113,113,0.15)',
                }}
              >
                <p
                  className="text-xs font-bold mb-2"
                  style={{ color: '#F87171' }}
                >
                  Error Details (Development Only):
                </p>
                <pre
                  className="text-xs font-mono whitespace-pre-wrap"
                  style={{ color: 'rgba(240,234,255,0.7)' }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #B794F6, #7C3AED)',
                  color: '#070510',
                }}
                aria-label="Retry loading the component"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105"
                style={{
                  background: 'rgba(183,148,246,0.12)',
                  border: '1px solid rgba(183,148,246,0.3)',
                  color: '#B794F6',
                }}
                aria-label="Go to home page"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>

            {/* Help Text */}
            <div
              className="mt-6 pt-6 border-t text-center"
              style={{ borderColor: 'rgba(183,148,246,0.1)' }}
            >
              <p
                className="text-xs"
                style={{ color: 'rgba(240,234,255,0.4)' }}
              >
                If this problem persists, please contact support or try refreshing the page.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Render children normally when no error
    return this.props.children;
  }
}

export default ErrorBoundary;
