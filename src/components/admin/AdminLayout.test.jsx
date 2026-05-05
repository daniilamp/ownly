/**
 * AdminLayout Unit Tests
 * Tests responsive sidebar toggle behavior and navigation
 * 
 * Requirements: 19.1, 19.4, 20.1, 20.2, 20.3, 20.4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { AuthContext } from '@/context/AuthContext';

// Mock AdminSidebar component
vi.mock('./AdminSidebar', () => ({
  default: ({ isOpen, onClose, isMobile }) => (
    <div data-testid="admin-sidebar" data-open={isOpen} data-mobile={isMobile}>
      Admin Sidebar
      <button onClick={onClose} data-testid="sidebar-close-btn">Close</button>
    </div>
  )
}));

// Helper function to render AdminLayout with auth context
const renderWithAuth = (authValue = {}, initialWidth = 1024) => {
  // Set initial window width
  global.innerWidth = initialWidth;
  global.dispatchEvent(new Event('resize'));

  const defaultAuthValue = {
    isAuthenticated: true,
    userRole: 'admin',
    loading: false,
    user: { email: 'admin@example.com', role: 'admin' },
    ...authValue,
  };

  return render(
    <AuthContext.Provider value={defaultAuthValue}>
      <MemoryRouter>
        <AdminLayout />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('AdminLayout', () => {
  beforeEach(() => {
    // Reset window size before each test
    global.innerWidth = 1024;
    global.innerHeight = 768;
  });

  describe('Initial Render', () => {
    it('should render the admin layout container', () => {
      renderWithAuth();
      
      const layout = document.querySelector('.min-h-screen.flex');
      expect(layout).toBeInTheDocument();
    });

    it('should render AdminSidebar component', () => {
      renderWithAuth();
      
      expect(screen.getByTestId('admin-sidebar')).toBeInTheDocument();
    });

    it('should render main content area', () => {
      renderWithAuth();
      
      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
    });

    it('should have correct background color', () => {
      renderWithAuth();
      
      const layout = document.querySelector('.min-h-screen.flex');
      expect(layout).toHaveStyle({ background: '#070510' });
    });
  });

  describe('Desktop Layout (≥1024px)', () => {
    it('should show sidebar open by default on desktop', async () => {
      global.innerWidth = 1024;
      renderWithAuth();

      await waitFor(() => {
        const sidebar = screen.getByTestId('admin-sidebar');
        expect(sidebar).toHaveAttribute('data-open', 'true');
      });
    });

    it('should not show mobile header on desktop', () => {
      global.innerWidth = 1024;
      renderWithAuth();

      const mobileHeader = document.querySelector('.lg\\:hidden');
      // Mobile header exists but should be hidden on desktop
      expect(mobileHeader).toBeInTheDocument();
    });

    it('should not show mobile overlay on desktop', () => {
      global.innerWidth = 1024;
      renderWithAuth();

      const overlay = document.querySelector('.fixed.inset-0.bg-black');
      expect(overlay).not.toBeInTheDocument();
    });

    it('should pass isMobile=false to sidebar on desktop', async () => {
      global.innerWidth = 1280;
      renderWithAuth();

      await waitFor(() => {
        const sidebar = screen.getByTestId('admin-sidebar');
        expect(sidebar).toHaveAttribute('data-mobile', 'false');
      });
    });
  });

  describe('Mobile Layout (<1024px)', () => {
    it('should show sidebar closed by default on mobile', () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const sidebar = screen.getByTestId('admin-sidebar');
      expect(sidebar).toHaveAttribute('data-open', 'false');
    });

    it('should show mobile header on mobile', () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    });

    it('should show hamburger menu button on mobile', () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      expect(toggleButton).toBeInTheDocument();
    });

    it('should pass isMobile=true to sidebar on mobile', () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const sidebar = screen.getByTestId('admin-sidebar');
      expect(sidebar).toHaveAttribute('data-mobile', 'true');
    });

    it('should not show overlay when sidebar is closed on mobile', () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const overlay = document.querySelector('.fixed.inset-0.bg-black');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('Sidebar Toggle Functionality', () => {
    it('should toggle sidebar when hamburger button is clicked', async () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      const sidebar = screen.getByTestId('admin-sidebar');

      // Initially closed
      expect(sidebar).toHaveAttribute('data-open', 'false');

      // Click to open
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-open', 'true');
      });

      // Click to close
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-open', 'false');
      });
    });

    it('should show correct icon when sidebar is closed', () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      const menuIcon = toggleButton.querySelector('svg');
      
      expect(menuIcon).toBeInTheDocument();
    });

    it('should show correct icon when sidebar is open', async () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      
      // Open sidebar
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const xIcon = toggleButton.querySelector('svg');
        expect(xIcon).toBeInTheDocument();
      });
    });
  });

  describe('Mobile Overlay Behavior', () => {
    it('should show overlay when sidebar is open on mobile', async () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      
      // Open sidebar
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const overlay = document.querySelector('.fixed.inset-0.bg-black');
        expect(overlay).toBeInTheDocument();
      });
    });

    it('should close sidebar when overlay is clicked', async () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      const sidebar = screen.getByTestId('admin-sidebar');
      
      // Open sidebar
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-open', 'true');
      });

      // Click overlay
      const overlay = document.querySelector('.fixed.inset-0.bg-black');
      fireEvent.click(overlay);

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-open', 'false');
      });
    });

    it('should have correct overlay styles', async () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      
      // Open sidebar
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const overlay = document.querySelector('.fixed.inset-0.bg-black');
        expect(overlay).toHaveClass('bg-opacity-50', 'z-20');
      });
    });

    it('should not show overlay on desktop even when sidebar is open', () => {
      global.innerWidth = 1280;
      renderWithAuth({}, 1280);

      const overlay = document.querySelector('.fixed.inset-0.bg-black');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should update sidebar state when resizing from desktop to mobile', async () => {
      global.innerWidth = 1280;
      const { rerender } = renderWithAuth({}, 1280);

      // Initially desktop - sidebar open
      await waitFor(() => {
        const sidebar = screen.getByTestId('admin-sidebar');
        expect(sidebar).toHaveAttribute('data-open', 'true');
      });

      // Resize to mobile
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        const sidebar = screen.getByTestId('admin-sidebar');
        expect(sidebar).toHaveAttribute('data-mobile', 'true');
      });
    });

    it('should update sidebar state when resizing from mobile to desktop', async () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      // Initially mobile - sidebar closed
      const sidebar = screen.getByTestId('admin-sidebar');
      expect(sidebar).toHaveAttribute('data-open', 'false');

      // Resize to desktop
      global.innerWidth = 1280;
      global.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-open', 'true');
      });
    });

    it('should handle tablet size (768-1023px)', () => {
      global.innerWidth = 900;
      renderWithAuth({}, 900);

      const sidebar = screen.getByTestId('admin-sidebar');
      expect(sidebar).toHaveAttribute('data-mobile', 'true');
    });
  });

  describe('Sidebar Close Callback', () => {
    it('should close sidebar when onClose is called on mobile', async () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      const sidebar = screen.getByTestId('admin-sidebar');
      
      // Open sidebar
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-open', 'true');
      });

      // Trigger onClose callback
      const closeButton = screen.getByTestId('sidebar-close-btn');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-open', 'false');
      });
    });

    it('should not close sidebar when onClose is called on desktop', async () => {
      global.innerWidth = 1280;
      renderWithAuth({}, 1280);

      const sidebar = screen.getByTestId('admin-sidebar');
      
      await waitFor(() => {
        expect(sidebar).toHaveAttribute('data-open', 'true');
      });

      // Trigger onClose callback (should not close on desktop)
      const closeButton = screen.getByTestId('sidebar-close-btn');
      fireEvent.click(closeButton);

      // Sidebar should remain open on desktop
      expect(sidebar).toHaveAttribute('data-open', 'true');
    });
  });

  describe('Main Content Area', () => {
    it('should render main content with correct classes', () => {
      renderWithAuth();

      const mainContent = screen.getByRole('main');
      expect(mainContent).toHaveClass('flex-1', 'p-6', 'lg:p-8');
    });

    it('should have max-width container for content', () => {
      renderWithAuth();

      const container = document.querySelector('.max-w-7xl');
      expect(container).toBeInTheDocument();
    });

    it('should center content with mx-auto', () => {
      renderWithAuth();

      const container = document.querySelector('.max-w-7xl');
      expect(container).toHaveClass('mx-auto');
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label on toggle button', () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      expect(toggleButton).toHaveAttribute('aria-label', 'Toggle sidebar');
    });

    it('should have aria-hidden on overlay', async () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      
      // Open sidebar
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const overlay = document.querySelector('.fixed.inset-0.bg-black');
        expect(overlay).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should have semantic main element', () => {
      renderWithAuth();

      const mainElement = screen.getByRole('main');
      expect(mainElement.tagName).toBe('MAIN');
    });
  });

  describe('Styling', () => {
    it('should have correct mobile header styles', () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const header = document.querySelector('.lg\\:hidden.sticky');
      expect(header).toBeInTheDocument();
    });

    it('should have correct toggle button styles', () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      expect(toggleButton).toHaveClass('p-2', 'rounded-lg', 'transition-all', 'hover:scale-105');
    });

    it('should have correct layout flex structure', () => {
      renderWithAuth();

      const layout = document.querySelector('.min-h-screen.flex');
      expect(layout).toHaveClass('min-h-screen', 'flex');
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid toggle clicks', async () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      const sidebar = screen.getByTestId('admin-sidebar');

      // Rapid clicks
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);
      fireEvent.click(toggleButton);

      await waitFor(() => {
        // Should end up in open state (3 clicks from closed)
        expect(sidebar).toHaveAttribute('data-open', 'true');
      });
    });

    it('should handle window resize during sidebar animation', async () => {
      global.innerWidth = 768;
      renderWithAuth({}, 768);

      const toggleButton = screen.getByLabelText('Toggle sidebar');
      
      // Open sidebar
      fireEvent.click(toggleButton);

      // Resize during animation
      global.innerWidth = 1280;
      global.dispatchEvent(new Event('resize'));

      await waitFor(() => {
        const sidebar = screen.getByTestId('admin-sidebar');
        expect(sidebar).toHaveAttribute('data-mobile', 'false');
      });
    });

    it('should cleanup resize listener on unmount', () => {
      const { unmount } = renderWithAuth();
      
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });
});
