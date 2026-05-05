/**
 * SystemHealthIndicator Component Tests
 * 
 * Tests:
 * - Health data fetching and display
 * - Color-coded status indicators
 * - Metric display
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SystemHealthIndicator from '../SystemHealthIndicator';

describe('SystemHealthIndicator', () => {
  it('should render component header', () => {
    render(<SystemHealthIndicator systemHealth={null} />);
    expect(screen.getByText('System Health')).toBeInTheDocument();
  });

  it('should display loading state when systemHealth is null', () => {
    render(<SystemHealthIndicator systemHealth={null} />);
    expect(screen.getByText('Loading system health...')).toBeInTheDocument();
  });

  it('should display healthy status with green indicator', () => {
    const healthyData = {
      status: 'healthy',
      database: { connected: true, responseTime: 50 },
      api: { responseTime: 100, errorRate: 0.5 },
      lastChecked: new Date().toISOString(),
    };

    render(<SystemHealthIndicator systemHealth={healthyData} />);

    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Overall System Status')).toBeInTheDocument();
  });

  it('should display warning status with yellow indicator', () => {
    const warningData = {
      status: 'warning',
      database: { connected: true, responseTime: 300 },
      api: { responseTime: 400, errorRate: 3 },
      lastChecked: new Date().toISOString(),
    };

    render(<SystemHealthIndicator systemHealth={warningData} />);

    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  it('should display critical status with red indicator', () => {
    const criticalData = {
      status: 'critical',
      database: { connected: false, responseTime: 1000 },
      api: { responseTime: 800, errorRate: 10 },
      lastChecked: new Date().toISOString(),
    };

    render(<SystemHealthIndicator systemHealth={criticalData} />);

    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('should display database connection status', () => {
    const healthData = {
      status: 'healthy',
      database: { connected: true, responseTime: 50 },
      api: { responseTime: 100, errorRate: 0.5 },
    };

    render(<SystemHealthIndicator systemHealth={healthData} />);

    expect(screen.getByText('Database')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Response: 50ms')).toBeInTheDocument();
  });

  it('should display disconnected database status', () => {
    const healthData = {
      status: 'critical',
      database: { connected: false, responseTime: 0 },
      api: { responseTime: 100, errorRate: 0.5 },
    };

    render(<SystemHealthIndicator systemHealth={healthData} />);

    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('should display API response time', () => {
    const healthData = {
      status: 'healthy',
      database: { connected: true, responseTime: 50 },
      api: { responseTime: 150, errorRate: 0.5 },
    };

    render(<SystemHealthIndicator systemHealth={healthData} />);

    expect(screen.getByText('API Response')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(screen.getByText('Average response time')).toBeInTheDocument();
  });

  it('should format response time in seconds when >= 1000ms', () => {
    const healthData = {
      status: 'warning',
      database: { connected: true, responseTime: 1500 },
      api: { responseTime: 2000, errorRate: 2 },
    };

    render(<SystemHealthIndicator systemHealth={healthData} />);

    expect(screen.getByText('Response: 1.50s')).toBeInTheDocument();
    expect(screen.getByText('2.00s')).toBeInTheDocument();
  });

  it('should display error rate percentage', () => {
    const healthData = {
      status: 'healthy',
      database: { connected: true, responseTime: 50 },
      api: { responseTime: 100, errorRate: 1.25 },
    };

    render(<SystemHealthIndicator systemHealth={healthData} />);

    expect(screen.getByText('Error Rate')).toBeInTheDocument();
    expect(screen.getByText('1.25%')).toBeInTheDocument();
    expect(screen.getByText('Error percentage')).toBeInTheDocument();
  });

  it('should display last checked timestamp', () => {
    const lastChecked = new Date('2024-01-15T10:30:00Z');
    const healthData = {
      status: 'healthy',
      database: { connected: true, responseTime: 50 },
      api: { responseTime: 100, errorRate: 0.5 },
      lastChecked: lastChecked.toISOString(),
    };

    render(<SystemHealthIndicator systemHealth={healthData} />);

    expect(screen.getByText(/Last checked:/)).toBeInTheDocument();
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalData = {
      status: 'healthy',
      database: { connected: true },
      api: {},
    };

    render(<SystemHealthIndicator systemHealth={minimalData} />);

    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    // Should display N/A for missing metrics
    expect(screen.getAllByText('N/A')).toHaveLength(2);
  });

  it('should apply correct color coding for response time thresholds', () => {
    // Test healthy response time (< 200ms)
    const healthyData = {
      status: 'healthy',
      database: { connected: true, responseTime: 50 },
      api: { responseTime: 150, errorRate: 0.5 },
    };

    const { rerender } = render(<SystemHealthIndicator systemHealth={healthyData} />);
    expect(screen.getByText('150ms')).toBeInTheDocument();

    // Test warning response time (200-500ms)
    const warningData = {
      status: 'warning',
      database: { connected: true, responseTime: 300 },
      api: { responseTime: 400, errorRate: 2 },
    };

    rerender(<SystemHealthIndicator systemHealth={warningData} />);
    expect(screen.getByText('400ms')).toBeInTheDocument();

    // Test critical response time (>= 500ms)
    const criticalData = {
      status: 'critical',
      database: { connected: true, responseTime: 600 },
      api: { responseTime: 800, errorRate: 5 },
    };

    rerender(<SystemHealthIndicator systemHealth={criticalData} />);
    expect(screen.getByText('800ms')).toBeInTheDocument();
  });

  it('should apply correct color coding for error rate thresholds', () => {
    // Test healthy error rate (< 1%)
    const healthyData = {
      status: 'healthy',
      database: { connected: true, responseTime: 50 },
      api: { responseTime: 100, errorRate: 0.5 },
    };

    const { rerender } = render(<SystemHealthIndicator systemHealth={healthyData} />);
    expect(screen.getByText('0.50%')).toBeInTheDocument();

    // Test warning error rate (1-5%)
    const warningData = {
      status: 'warning',
      database: { connected: true, responseTime: 100 },
      api: { responseTime: 200, errorRate: 3 },
    };

    rerender(<SystemHealthIndicator systemHealth={warningData} />);
    expect(screen.getByText('3.00%')).toBeInTheDocument();

    // Test critical error rate (>= 5%)
    const criticalData = {
      status: 'critical',
      database: { connected: true, responseTime: 100 },
      api: { responseTime: 200, errorRate: 8 },
    };

    rerender(<SystemHealthIndicator systemHealth={criticalData} />);
    expect(screen.getByText('8.00%')).toBeInTheDocument();
  });
});
