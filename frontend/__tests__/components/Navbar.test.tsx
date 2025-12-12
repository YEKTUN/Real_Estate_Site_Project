/**
 * Navbar Component Tests
 * 
 * Navbar bileşeninin render, navigasyon ve responsive davranış testleri.
 * Bu testler bileşenin UI ve kullanıcı etkileşimlerini kontrol eder.
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  render, 
  createMockAuthState,
  createAuthenticatedState,
  createMockUser
} from '../utils/test-utils';
import Navbar from '@/body/components/Navbar';

// ============================================================================
// MOCK SETUP
// ============================================================================

// usePathname mock'unu dinamik hale getir
let mockPathname = '/';
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

// Auth API mock
jest.mock('@/body/redux/api/authApi', () => ({
  loginApi: jest.fn(),
  registerApi: jest.fn(),
  logoutApi: jest.fn().mockResolvedValue({}),
  getCurrentUserApi: jest.fn(),
  getUserFromStoredToken: jest.fn(),
  checkAuthStatus: jest.fn(() => false),
  getStoredToken: jest.fn(),
  getStoredRefreshToken: jest.fn(),
  refreshTokenApi: jest.fn(),
  googleLoginApi: jest.fn(),
}));

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Unauthenticated state
 */
const unauthenticatedState = {
  auth: createMockAuthState(),
};

/**
 * Authenticated state
 */
const authenticatedState = {
  auth: createAuthenticatedState({
    user: createMockUser({
      name: 'Ahmet',
      surname: 'Yılmaz',
      email: 'ahmet@example.com',
    }),
  }),
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Navbar Component', () => {
  // User event setup
  const user = userEvent.setup();

  // Her testten önce pathname'i sıfırla
  beforeEach(() => {
    mockPathname = '/';
    jest.clearAllMocks();
  });

  // ========================================================================
  // RENDER TESTS
  // ========================================================================
  
  describe('Rendering', () => {
    test('should render navbar without crashing', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    test('should render logo with correct text', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      expect(screen.getByText('Real Estate')).toBeInTheDocument();
      expect(screen.getByText('🏠')).toBeInTheDocument();
    });

    test('should render all navigation items', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      // Desktop ve mobile için aynı linkler var, getAllByText kullan
      expect(screen.getAllByText('Ana Sayfa').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('İlanlar').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Hakkımızda').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('İletişim').length).toBeGreaterThanOrEqual(1);
    });

    test('should render login button when not authenticated', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const loginButtons = screen.getAllByText('Giriş Yap');
      expect(loginButtons.length).toBeGreaterThan(0);
    });

    test('should render register button when not authenticated', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const registerButton = screen.getByRole('link', { name: /kayıt ol/i });
      expect(registerButton).toBeInTheDocument();
    });
  });

  // ========================================================================
  // NAVIGATION LINK TESTS
  // ========================================================================
  
  describe('Navigation Links', () => {
    test('logo should link to home page', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      // Logo linki (emoji ve text içeren)
      const logoLinks = screen.getAllByRole('link').filter(
        link => link.getAttribute('href') === '/' && link.textContent?.includes('Real Estate')
      );
      expect(logoLinks.length).toBeGreaterThan(0);
    });

    test('Ana Sayfa link should have correct href', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const homeLinks = screen.getAllByText('Ana Sayfa');
      homeLinks.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('href', '/');
      });
    });

    test('İlanlar link should have correct href', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const propertiesLinks = screen.getAllByText('İlanlar');
      propertiesLinks.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('href', '/properties');
      });
    });

    test('Hakkımızda link should have correct href', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const aboutLinks = screen.getAllByText('Hakkımızda');
      aboutLinks.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('href', '/about');
      });
    });

    test('İletişim link should have correct href', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const contactLinks = screen.getAllByText('İletişim');
      contactLinks.forEach(link => {
        expect(link.closest('a')).toHaveAttribute('href', '/contact');
      });
    });

    test('login button should link to login page when not authenticated', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const loginButtons = screen.getAllByText('Giriş Yap');
      loginButtons.forEach(button => {
        const link = button.closest('a');
        if (link) {
          expect(link).toHaveAttribute('href', '/login');
        }
      });
    });

    test('register button should link to register page', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const registerButton = screen.getByRole('link', { name: /kayıt ol/i });
      expect(registerButton).toHaveAttribute('href', '/register');
    });
  });

  // ========================================================================
  // STYLING TESTS
  // ========================================================================
  
  describe('Styling', () => {
    test('navbar should be sticky at top', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sticky', 'top-0');
    });

    test('navbar should have shadow', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('shadow-md');
    });

    test('navbar should have white background', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('bg-white');
    });

    test('register button should have blue background', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const registerButton = screen.getByRole('link', { name: /kayıt ol/i });
      expect(registerButton).toHaveClass('bg-blue-600');
    });

    test('logo text should be bold', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const logoText = screen.getByText('Real Estate');
      expect(logoText).toHaveClass('font-bold');
    });
  });

  // ========================================================================
  // RESPONSIVE DESIGN TESTS
  // ========================================================================
  
  describe('Responsive Design', () => {
    test('should render desktop navigation (hidden on mobile)', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      // Desktop nav: hidden md:flex
      const desktopNav = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
      expect(desktopNav).not.toBeNull();
      expect(desktopNav).toBeInTheDocument();
    });

    test('should render mobile navigation (visible on mobile)', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      // Mobile nav: md:hidden
      const mobileNav = document.querySelector('.md\\:hidden.mt-4');
      expect(mobileNav).not.toBeNull();
      expect(mobileNav).toBeInTheDocument();
    });

    test('desktop login should be hidden on mobile', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      // Desktop giriş yap linki hidden md:block class'ına sahip olmalı
      const desktopLoginLinks = document.querySelectorAll('a.hidden.md\\:block');
      expect(desktopLoginLinks.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // ACTIVE STATE TESTS
  // ========================================================================
  
  describe('Active State', () => {
    test('should highlight home link when on home page', () => {
      mockPathname = '/';
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      // Desktop navigation'daki Ana Sayfa linki
      const desktopNav = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
      expect(desktopNav).not.toBeNull();
      const homeLink = desktopNav!.querySelector('a[href="/"]');
      expect(homeLink).not.toBeNull();
      expect(homeLink).toHaveClass('text-blue-600');
    });

    test('should highlight properties link when on properties page', () => {
      mockPathname = '/properties';
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      // Desktop navigation'daki İlanlar linki
      const desktopNav = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
      expect(desktopNav).not.toBeNull();
      const propertiesLink = desktopNav!.querySelector('a[href="/properties"]');
      expect(propertiesLink).not.toBeNull();
      expect(propertiesLink).toHaveClass('text-blue-600');
    });

    test('should highlight about link when on about page', () => {
      mockPathname = '/about';
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const desktopNav = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
      expect(desktopNav).not.toBeNull();
      const aboutLink = desktopNav!.querySelector('a[href="/about"]');
      expect(aboutLink).not.toBeNull();
      expect(aboutLink).toHaveClass('text-blue-600');
    });

    test('should highlight contact link when on contact page', () => {
      mockPathname = '/contact';
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const desktopNav = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
      expect(desktopNav).not.toBeNull();
      const contactLink = desktopNav!.querySelector('a[href="/contact"]');
      expect(contactLink).not.toBeNull();
      expect(contactLink).toHaveClass('text-blue-600');
    });

    test('inactive links should have gray color', () => {
      mockPathname = '/';
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const desktopNav = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
      expect(desktopNav).not.toBeNull();
      const propertiesLink = desktopNav!.querySelector('a[href="/properties"]');
      expect(propertiesLink).not.toBeNull();
      expect(propertiesLink).toHaveClass('text-gray-700');
    });

    test('active link should have border bottom', () => {
      mockPathname = '/';
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const desktopNav = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
      expect(desktopNav).not.toBeNull();
      const homeLink = desktopNav!.querySelector('a[href="/"]');
      expect(homeLink).not.toBeNull();
      expect(homeLink).toHaveClass('border-b-2', 'border-blue-600');
    });
  });

  // ========================================================================
  // ACCESSIBILITY TESTS
  // ========================================================================
  
  describe('Accessibility', () => {
    test('should have accessible navigation landmark', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    test('should have accessible banner landmark', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    test('all links should be accessible', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);
      
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  // ========================================================================
  // NAVIGATION ITEMS DATA TESTS
  // ========================================================================
  
  describe('Navigation Items', () => {
    test('should have exactly 4 navigation items', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      // Desktop navigation'daki linkler
      const desktopNav = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
      expect(desktopNav).not.toBeNull();
      const navLinks = desktopNav!.querySelectorAll('a');
      
      expect(navLinks.length).toBe(4);
    });

    test('navigation items should be in correct order', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const desktopNav = document.querySelector('.hidden.md\\:flex.items-center.space-x-8');
      expect(desktopNav).not.toBeNull();
      const navLinks = desktopNav!.querySelectorAll('a');
      
      expect(navLinks[0]).toHaveTextContent('Ana Sayfa');
      expect(navLinks[1]).toHaveTextContent('İlanlar');
      expect(navLinks[2]).toHaveTextContent('Hakkımızda');
      expect(navLinks[3]).toHaveTextContent('İletişim');
    });
  });

  // ========================================================================
  // AUTHENTICATED STATE TESTS
  // ========================================================================
  
  describe('Authenticated State', () => {
    test('should show panel link when authenticated and not on panel page', () => {
      mockPathname = '/';
      render(<Navbar />, { preloadedState: authenticatedState });
      
      expect(screen.getByText("Panel'e Git")).toBeInTheDocument();
    });

    test('should not show panel link when on panel page', () => {
      mockPathname = '/panel';
      render(<Navbar />, { preloadedState: authenticatedState });
      
      expect(screen.queryByText("Panel'e Git")).not.toBeInTheDocument();
    });

    test('should show user initial in avatar when authenticated', () => {
      mockPathname = '/';
      render(<Navbar />, { preloadedState: authenticatedState });
      
      // Ahmet'in baş harfi 'A'
      const avatars = screen.getAllByText('A');
      expect(avatars.length).toBeGreaterThan(0);
    });

    test('should show user name when on panel page', () => {
      mockPathname = '/panel';
      render(<Navbar />, { preloadedState: authenticatedState });
      
      expect(screen.getByText('Ahmet')).toBeInTheDocument();
    });

    test('should show logout button when authenticated', () => {
      render(<Navbar />, { preloadedState: authenticatedState });
      
      expect(screen.getByText('Çıkış Yap')).toBeInTheDocument();
    });

    test('should not show login/register buttons when authenticated', () => {
      render(<Navbar />, { preloadedState: authenticatedState });
      
      expect(screen.queryByRole('link', { name: /kayıt ol/i })).not.toBeInTheDocument();
    });

    test('logout button should redirect to login page', async () => {
      render(<Navbar />, { preloadedState: authenticatedState });
      
      const logoutButton = screen.getByText('Çıkış Yap').closest('button');
      expect(logoutButton).toBeInTheDocument();
      
      await user.click(logoutButton!);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('logout button should have red styling', () => {
      render(<Navbar />, { preloadedState: authenticatedState });
      
      const logoutButton = screen.getByText('Çıkış Yap').closest('button');
      expect(logoutButton).toHaveClass('text-red-600');
    });

    test('should show mobile panel link when authenticated and not on panel', () => {
      mockPathname = '/';
      render(<Navbar />, { preloadedState: authenticatedState });
      
      // Mobil navigasyonda Panel linki
      expect(screen.getByText('Panel')).toBeInTheDocument();
    });

    test('should show mobile logout link when authenticated', () => {
      mockPathname = '/';
      render(<Navbar />, { preloadedState: authenticatedState });
      
      // Mobil navigasyonda Çıkış linki
      expect(screen.getByText('Çıkış')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // UNAUTHENTICATED STATE TESTS
  // ========================================================================
  
  describe('Unauthenticated State', () => {
    test('should not show panel link when not authenticated', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      expect(screen.queryByText("Panel'e Git")).not.toBeInTheDocument();
    });

    test('should not show logout button when not authenticated', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      expect(screen.queryByText('Çıkış Yap')).not.toBeInTheDocument();
    });

    test('should not show avatar when not authenticated', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      // Gradient avatar class'ı olmamalı
      const avatar = document.querySelector('.bg-gradient-to-br.from-blue-500');
      expect(avatar).toBeNull();
    });

    test('should show login button when not authenticated', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      const loginButtons = screen.getAllByText('Giriş Yap');
      expect(loginButtons.length).toBeGreaterThan(0);
    });

    test('should show register button when not authenticated', () => {
      render(<Navbar />, { preloadedState: unauthenticatedState });
      
      expect(screen.getByRole('link', { name: /kayıt ol/i })).toBeInTheDocument();
    });
  });
});
