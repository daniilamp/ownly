/**
 * AdminSidebar Component
 * Navigation menu for admin sections
 * Features:
 * - Navigation links (Dashboard, Users, API Keys, Audit Logs)
 * - Active route highlighting
 * - User email and role display
 * - Logout button
 * 
 * Requirements: 19.1, 19.2, 19.3, 19.5, 19.6
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Key, FileText, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AdminSidebar({ isOpen, onClose, isMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/api-keys', icon: Key, label: 'API Keys' },
    { to: '/admin/logs', icon: FileText, label: 'Audit Logs' },
  ];

  // Sidebar classes based on state
  const sidebarClasses = `
    fixed lg:sticky top-0 left-0 h-screen z-30
    flex flex-col
    border-r transition-transform duration-300 ease-in-out
    ${isMobile ? 'w-64' : 'w-64 lg:w-72'}
    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
  `;

  return (
    <aside
      className={sidebarClasses}
      style={{
        background: 'rgba(7,5,16,0.98)',
        borderColor: 'rgba(183,148,246,0.15)',
      }}
    >
      {/* Sidebar header */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(183,148,246,0.12)',
              border: '1px solid rgba(183,148,246,0.25)',
            }}
          >
            <Shield className="w-5 h-5" style={{ color: '#B794F6' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: '#F0EAFF' }}>
              Admin Panel
            </h2>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive ? 'active-nav-link' : 'inactive-nav-link'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(183,148,246,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(183,148,246,0.25)' : '1px solid transparent',
              color: isActive ? '#B794F6' : 'rgba(240,234,255,0.6)',
            })}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-semibold text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info and logout */}
      <div className="p-4 border-t space-y-3" style={{ borderColor: 'rgba(183,148,246,0.15)' }}>
        {/* User info */}
        <div
          className="p-3 rounded-lg"
          style={{
            background: 'rgba(183,148,246,0.04)',
            border: '1px solid rgba(183,148,246,0.1)',
          }}
        >
          <p className="text-xs font-semibold mb-1" style={{ color: 'rgba(240,234,255,0.5)' }}>
            Logged in as
          </p>
          <p className="text-sm font-semibold truncate" style={{ color: '#F0EAFF' }}>
            {user?.email || 'admin@ownly.com'}
          </p>
          <p className="text-xs font-semibold mt-1" style={{ color: '#B794F6' }}>
            Role: ADMIN
          </p>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:scale-[1.02]"
          style={{
            background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)',
            color: '#F87171',
          }}
        >
          <LogOut className="w-5 h-5" />
          <span className="font-semibold text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
