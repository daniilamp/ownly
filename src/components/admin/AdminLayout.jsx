/**
 * AdminLayout Component
 * Provides consistent layout structure for all admin pages
 * Features:
 * - Responsive sidebar (persistent on desktop ≥1024px, collapsible on tablet/mobile)
 * - Main content area with proper spacing
 * - Sidebar toggle functionality for mobile
 * 
 * Requirements: 19.1, 19.4, 20.1, 20.2, 20.3, 20.4
 */

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout() {
  // Sidebar state: open by default on desktop, closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size and set initial sidebar state
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      // On desktop, sidebar should be open by default
      if (!mobile) {
        setSidebarOpen(true);
      }
    };

    // Check on mount
    checkScreenSize();

    // Add resize listener
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#070510' }}>
      {/* Sidebar */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={closeSidebar}
        isMobile={isMobile}
      />

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header with hamburger menu */}
        <div 
          className="lg:hidden sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between"
          style={{ 
            background: 'rgba(7,5,16,0.98)', 
            borderColor: 'rgba(183,148,246,0.15)',
            backdropFilter: 'blur(20px)'
          }}
        >
          <h1 className="text-xl font-bold" style={{ color: '#F0EAFF' }}>
            Admin Panel
          </h1>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg transition-all hover:scale-105"
            style={{ 
              background: 'rgba(183,148,246,0.08)', 
              border: '1px solid rgba(183,148,246,0.2)',
              color: '#B794F6'
            }}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
