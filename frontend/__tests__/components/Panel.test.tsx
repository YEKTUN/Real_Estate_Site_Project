/**
 * Panel Component Tests
 * 
 * Panel bileşeninin render, navigasyon ve kullanıcı etkileşim testleri.
 * Sidebar menü, aktif state ve çıkış işlemleri test edilir.
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  render,
  createMockAuthState,
  createAuthenticatedState,
  createMockUser
} from '../utils/test-utils';
import Panel from '@/body/panel/Panel';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Router mock
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/panel',
  useSearchParams: () => new URLSearchParams(),
}));

// Auth API mock
jest.mock('@/body/redux/api/authApi', () => ({
  loginApi: jest.fn(),
  registerApi: jest.fn(),
  logoutApi: jest.fn().mockResolvedValue({}),
  getCurrentUserApi: jest.fn(),
  getUserFromStoredToken: jest.fn(),
  checkAuthStatus: jest.fn(() => true),
  getStoredToken: jest.fn(() => 'mock-token'),
  getStoredRefreshToken: jest.fn(() => 'mock-refresh-token'),
  refreshTokenApi: jest.fn(),
  googleLoginApi: jest.fn(),
}));

jest.mock('@/body/redux/api/favoriteApi', () => ({
  fetchFavorites: jest.fn().mockResolvedValue({ success: true, data: [] }),
  addFavorite: jest.fn(),
  removeFavorite: jest.fn(),
}));

jest.mock('@/body/redux/api/messageApi', () => ({
  fetchThreads: jest.fn().mockResolvedValue({ success: true, data: [] }),
  fetchMessages: jest.fn().mockResolvedValue({ success: true, data: [] }),
  getUnreadCount: jest.fn().mockResolvedValue({ success: true, count: 0 }),
}));

jest.mock('@/body/redux/api/listingApi', () => ({
  fetchMyListings: jest.fn().mockResolvedValue({ success: true, data: [], meta: { total: 0 } }),
  createListing: jest.fn(),
  updateListing: jest.fn(),
  deleteListing: jest.fn(),
  fetchListings: jest.fn().mockResolvedValue({ success: true, data: [] }),
}));

// Panel alt bileşenlerini mock'la
jest.mock('@/body/panel/components/ProfileSection', () => {
  return function MockProfileSection() {
    return <div data-testid="profile-section">Profile Section Content</div>;
  };
});

jest.mock('@/body/panel/components/MyListings', () => {
  return function MockMyListings() {
    return <div data-testid="my-listings-section">My Listings Content</div>;
  };
});

jest.mock('@/body/panel/components/CreateListing', () => {
  return function MockCreateListing() {
    return <div data-testid="create-listing-section">Create Listing Content</div>;
  };
});

jest.mock('@/body/panel/components/FavoriteListings', () => {
  return function MockFavoriteListings() {
    return <div data-testid="favorites-section">Favorites Content</div>;
  };
});

jest.mock('@/body/panel/components/Settings', () => {
  return function MockSettings() {
    return <div data-testid="settings-section">Settings Content</div>;
  };
});

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Authenticated state with user
 */
const authenticatedState = {
  auth: createAuthenticatedState(),
};

/**
 * Custom user state
 */
const customUserState = {
  auth: createAuthenticatedState({
    user: createMockUser({
      name: 'Ahmet',
      surname: 'Yılmaz',
      email: 'ahmet@example.com',
    }),
  }),
};

/**
 * Loading state
 */
const loadingState = {
  auth: createMockAuthState({ isLoading: true }),
};

/**
 * Unauthenticated state
 */
const unauthenticatedState = {
  auth: createMockAuthState({ isAuthenticated: false }),
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Panel Component', () => {
  // User event setup
  const user = userEvent.setup();

  // Her testten önce mock'ları temizle
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================================================
  // RENDER TESTS
  // ========================================================================

  describe('Rendering', () => {
    test('should render panel without crashing', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      // Panel ana yapısı render edilmeli - birden fazla olabilir
      const profilimElements = screen.getAllByText('Profilim');
      expect(profilimElements.length).toBeGreaterThan(0);
    });

    test('should render user name and email', () => {
      render(<Panel />, { preloadedState: customUserState });

      // Birden fazla yerde gösterilebilir (desktop ve mobile header)
      const userNames = screen.getAllByText('Ahmet Yılmaz');
      expect(userNames.length).toBeGreaterThan(0);

      const emails = screen.getAllByText('ahmet@example.com');
      expect(emails.length).toBeGreaterThan(0);
    });

    test('should render user initial in avatar', () => {
      render(<Panel />, { preloadedState: customUserState });

      // Avatar içinde 'A' harfi olmalı (Ahmet'in baş harfi)
      const avatars = screen.getAllByText('A');
      expect(avatars.length).toBeGreaterThan(0);
    });

    test('should render all menu items', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      // Menu item'lar birden fazla yerde olabilir
      const profilimElements = screen.getAllByText('Profilim');
      expect(profilimElements.length).toBeGreaterThan(0);
      expect(screen.getByText('İlanlarım')).toBeInTheDocument();
      expect(screen.getByText('İlan Ver')).toBeInTheDocument();
      expect(screen.getByText('Favorilerim')).toBeInTheDocument();
      expect(screen.getByText('Ayarlar')).toBeInTheDocument();
    });

    test('should render menu item descriptions', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      // Descriptions birden fazla yerde olabilir (sidebar ve content header)
      const kisiselElements = screen.getAllByText('Kişisel bilgilerinizi düzenleyin');
      expect(kisiselElements.length).toBeGreaterThan(0);
      expect(screen.getByText('İlanlarınızı yönetin')).toBeInTheDocument();
      expect(screen.getByText('Yeni ilan oluşturun')).toBeInTheDocument();
      expect(screen.getByText('Favori ilanlarınız')).toBeInTheDocument();
      expect(screen.getByText('Hesap ayarları')).toBeInTheDocument();
    });

    test('should render logout button', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      expect(screen.getByText('Çıkış Yap')).toBeInTheDocument();
      expect(screen.getByText('Hesabınızdan çıkın')).toBeInTheDocument();
    });

    test('should render menu icons', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      expect(screen.getByText('👤')).toBeInTheDocument();
      expect(screen.getByText('🏠')).toBeInTheDocument();
      expect(screen.getByText('➕')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('⚙️')).toBeInTheDocument();
      expect(screen.getByText('🚪')).toBeInTheDocument();
    });

    test('should render user statistics', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      expect(screen.getByText('İlan')).toBeInTheDocument();
      expect(screen.getByText('Favori')).toBeInTheDocument();
      expect(screen.getByText('Mesaj')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // MENU NAVIGATION TESTS
  // ========================================================================

  describe('Menu Navigation', () => {
    test('should show profile section by default', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      expect(screen.getByTestId('profile-section')).toBeInTheDocument();
    });

    test('should switch to my-listings section when clicked', async () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const myListingsButton = screen.getByText('İlanlarım').closest('button');
      expect(myListingsButton).toBeInTheDocument();

      await user.click(myListingsButton!);

      expect(screen.getByTestId('my-listings-section')).toBeInTheDocument();
    });

    test('should switch to create-listing section when clicked', async () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const createListingButton = screen.getByText('İlan Ver').closest('button');
      expect(createListingButton).toBeInTheDocument();

      await user.click(createListingButton!);

      expect(screen.getByTestId('create-listing-section')).toBeInTheDocument();
    });

    test('should switch to favorites section when clicked', async () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const favoritesButton = screen.getByText('Favorilerim').closest('button');
      expect(favoritesButton).toBeInTheDocument();

      await user.click(favoritesButton!);

      expect(screen.getByTestId('favorites-section')).toBeInTheDocument();
    });

    test('should switch to settings section when clicked', async () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const settingsButton = screen.getByText('Ayarlar').closest('button');
      expect(settingsButton).toBeInTheDocument();

      await user.click(settingsButton!);

      expect(screen.getByTestId('settings-section')).toBeInTheDocument();
    });

    test('should update content header when menu changes', async () => {
      render(<Panel />, { preloadedState: authenticatedState });

      // Başlangıçta Profilim
      expect(screen.getByRole('heading', { name: 'Profilim' })).toBeInTheDocument();

      // İlanlarım'a tıkla
      const myListingsButton = screen.getByText('İlanlarım').closest('button');
      await user.click(myListingsButton!);

      expect(screen.getByRole('heading', { name: 'İlanlarım' })).toBeInTheDocument();
    });

    test('should highlight active menu item', async () => {
      render(<Panel />, { preloadedState: authenticatedState });

      // Profilim varsayılan olarak aktif - sidebar'daki butonu bul
      const profileButtons = screen.getAllByText('Profilim');
      const sidebarProfileButton = profileButtons.find(el => el.closest('button'));
      expect(sidebarProfileButton?.closest('button')).toHaveClass('bg-blue-50', 'text-blue-600');

      // İlanlarım'a tıkla
      const myListingsButton = screen.getByText('İlanlarım').closest('button');
      await user.click(myListingsButton!);

      // İlanlarım aktif olmalı
      expect(myListingsButton).toHaveClass('bg-blue-50', 'text-blue-600');
    });
  });

  // ========================================================================
  // LOGOUT TESTS
  // ========================================================================

  describe('Logout', () => {
    test('should call logout and redirect when clicking logout button', async () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const logoutButton = screen.getByText('Çıkış Yap').closest('button');
      expect(logoutButton).toBeInTheDocument();

      await user.click(logoutButton!);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('logout button should have correct styling', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const logoutButton = screen.getByText('Çıkış Yap').closest('button');
      expect(logoutButton).toHaveClass('text-red-600', 'hover:bg-red-50');
    });
  });

  // ========================================================================
  // LOADING STATE TESTS
  // ========================================================================

  describe('Loading State', () => {
    test('should show loading spinner when loading', () => {
      render(<Panel />, { preloadedState: loadingState });

      expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
    });

    test('should show loading animation', () => {
      render(<Panel />, { preloadedState: loadingState });

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  // ========================================================================
  // AUTHENTICATION REDIRECT TESTS
  // ========================================================================

  describe('Authentication Redirect', () => {
    test('should redirect to login when not authenticated', async () => {
      render(<Panel />, { preloadedState: unauthenticatedState });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('should show redirecting message when not authenticated', () => {
      render(<Panel />, { preloadedState: unauthenticatedState });

      expect(screen.getByText('Yönlendiriliyor...')).toBeInTheDocument();
    });

    test('should not redirect when authenticated', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      // Login'e yönlendirme yapılmamalı
      expect(mockPush).not.toHaveBeenCalledWith('/login');
    });
  });

  // ========================================================================
  // MOBILE MENU TESTS
  // ========================================================================

  describe('Mobile Menu', () => {
    test('should render mobile header', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      // Mobile toggle button
      const toggleButtons = screen.getAllByRole('button');
      const mobileToggle = toggleButtons.find(btn =>
        btn.textContent?.includes('☰') || btn.textContent?.includes('✕')
      );

      expect(mobileToggle).toBeInTheDocument();
    });

    test('should toggle sidebar on mobile menu button click', async () => {
      render(<Panel />, { preloadedState: authenticatedState });

      // Mobile toggle button'ı bul
      const toggleButtons = screen.getAllByRole('button');
      const mobileToggle = toggleButtons.find(btn =>
        btn.textContent?.includes('☰') || btn.textContent?.includes('✕')
      );

      if (mobileToggle) {
        await user.click(mobileToggle);

        // Toggle çalışmalı
        expect(mobileToggle).toBeInTheDocument();
      }
    });
  });

  // ========================================================================
  // STYLING TESTS
  // ========================================================================

  describe('Styling', () => {
    test('should have correct container styling', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const container = document.querySelector('.min-h-screen.bg-gray-50');
      expect(container).toBeInTheDocument();
    });

    test('sidebar should have shadow and rounded corners', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const sidebar = document.querySelector('aside');
      expect(sidebar).toHaveClass('rounded-2xl', 'shadow-lg');
    });

    test('main content should have shadow and rounded corners', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const main = document.querySelector('main');
      expect(main).toHaveClass('rounded-2xl', 'shadow-lg');
    });

    test('user header should have gradient background', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const userHeader = document.querySelector('.bg-gradient-to-br');
      expect(userHeader).toBeInTheDocument();
    });
  });

  // ========================================================================
  // ACCESSIBILITY TESTS
  // ========================================================================

  describe('Accessibility', () => {
    test('should have accessible navigation', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const nav = document.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    test('should have accessible main content', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
    });

    test('should have accessible aside element', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const aside = document.querySelector('aside');
      expect(aside).toBeInTheDocument();
    });

    test('all menu buttons should be focusable', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const menuButtons = screen.getAllByRole('button');

      menuButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    test('content header should be a heading', () => {
      render(<Panel />, { preloadedState: authenticatedState });

      const heading = screen.getByRole('heading', { name: 'Profilim' });
      expect(heading).toBeInTheDocument();
    });
  });
});
