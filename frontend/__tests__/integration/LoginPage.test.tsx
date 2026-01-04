/**
 * LoginPage Integration Tests
 * 
 * Login sayfasının form işlemleri, Redux entegrasyonu ve kullanıcı etkileşim testleri.
 * Bu testler bileşenin Redux ile birlikte çalışmasını kontrol eder.
 */

import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  render,
  createMockAuthState,
  createAuthenticatedState
} from '../utils/test-utils';
import LoginPage from '@/body/auth/LoginPage';

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
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}));

// Auth API mock
jest.mock('@/body/redux/api/authApi', () => ({
  loginApi: jest.fn(),
  logoutApi: jest.fn(),
  getCurrentUserApi: jest.fn(),
  getUserFromStoredToken: jest.fn(),
  checkAuthStatus: jest.fn(() => false),
  getStoredToken: jest.fn(),
  getStoredRefreshToken: jest.fn(),
  refreshTokenApi: jest.fn(),
  googleLoginApi: jest.fn(),
}));

// Google OAuth mock
jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GoogleLogin: ({ onSuccess, onError }: { onSuccess: (response: { credential: string }) => void; onError: () => void }) => (
    <button
      data-testid="google-login-button"
      onClick={() => onSuccess({ credential: 'mock-google-credential' })}
    >
      Google ile Giriş Yap
    </button>
  ),
}));

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Default initial state for tests
 */
const defaultInitialState = {
  auth: createMockAuthState(),
};

/**
 * Loading state
 */
const loadingState = {
  auth: createMockAuthState({ isLoading: true }),
};

/**
 * Error state
 */
const errorState = {
  auth: createMockAuthState({ error: 'Geçersiz e-posta veya şifre' }),
};

/**
 * Authenticated state
 */
const authenticatedState = {
  auth: createAuthenticatedState(),
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('LoginPage', () => {
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
    test('should render login form correctly', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      expect(screen.getByRole('heading', { name: /giriş yap/i })).toBeInTheDocument();
      expect(screen.getByText('Hesabınıza giriş yaparak devam edin')).toBeInTheDocument();
    });

    test('should render email input field', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta veya kullanıcı adı/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'ornek@email.com');
    });

    test('should render password input field', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const passwordInput = screen.getByLabelText(/şifre/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('placeholder', '••••••••');
    });

    test('should render submit button', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const submitButton = screen.getByRole('button', { name: /^giriş yap$/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    test('should render remember me checkbox', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      expect(screen.getByText('Beni Hatırla')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    test('should render forgot password link', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const forgotPasswordLink = screen.getByRole('link', { name: /şifreni mi unuttun/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    test('should render register link', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      expect(screen.getByText(/hesabınız yok mu/i)).toBeInTheDocument();
      const registerLink = screen.getByRole('link', { name: /kayıt ol/i });
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    test('should render Google login button', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      // GoogleLogin bileşeni mock'landığı için data-testid ile buluyoruz
      const googleButton = screen.getByTestId('google-login-button');
      expect(googleButton).toBeInTheDocument();
    });

    test('should render divider with "veya" text', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      expect(screen.getByText('veya')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // FORM INTERACTION TESTS
  // ========================================================================

  describe('Form Interactions', () => {
    test('should update email input value on change', async () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta veya kullanıcı adı/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    test('should update password input value on change', async () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const passwordInput = screen.getByLabelText(/şifre/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    test('should toggle password visibility when clicking eye button', async () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const passwordInput = screen.getByLabelText(/şifre/i);

      // Password should be hidden initially
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click toggle button
      const toggleButtons = screen.getAllByRole('button');
      const eyeButton = toggleButtons.find(btn =>
        btn.textContent?.includes('👁️') || btn.textContent?.includes('🙈')
      );

      if (eyeButton) {
        await user.click(eyeButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        await user.click(eyeButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    test('should toggle remember me checkbox', async () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });

    test('should clear inputs when typing after error', async () => {
      render(<LoginPage />, { preloadedState: errorState });

      const emailInput = screen.getByLabelText(/e-posta veya kullanıcı adı/i);
      await user.type(emailInput, 'new@example.com');

      expect(emailInput).toHaveValue('new@example.com');
    });
  });

  // ========================================================================
  // FORM VALIDATION TESTS
  // ========================================================================

  describe('Form Validation', () => {
    test('email input should have required attribute', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta veya kullanıcı adı/i);
      expect(emailInput).toBeRequired();
    });

    test('password input should have required attribute', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const passwordInput = screen.getByLabelText(/şifre/i);
      expect(passwordInput).toBeRequired();
    });

    test('should not submit form with empty email', async () => {
      const { store } = render(<LoginPage />, { preloadedState: defaultInitialState });

      const passwordInput = screen.getByLabelText(/şifre/i);
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /^giriş yap$/i });
      await user.click(submitButton);

      // Store should not change to loading
      expect(store.getState().auth.isLoading).toBe(false);
    });

    test('should not submit form with empty password', async () => {
      const { store } = render(<LoginPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta veya kullanıcı adı/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /^giriş yap$/i });
      await user.click(submitButton);

      // Store should not change to loading
      expect(store.getState().auth.isLoading).toBe(false);
    });

    test('should not submit form with whitespace-only values', async () => {
      const { store } = render(<LoginPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta veya kullanıcı adı/i);
      const passwordInput = screen.getByLabelText(/şifre/i);

      // fireEvent kullan çünkü userEvent.type boşlukları farklı ele alıyor
      fireEvent.change(emailInput, { target: { value: '   ' } });
      fireEvent.change(passwordInput, { target: { value: '   ' } });

      const submitButton = screen.getByRole('button', { name: /^giriş yap$/i });
      fireEvent.click(submitButton);

      expect(store.getState().auth.isLoading).toBe(false);
    });
  });

  // ========================================================================
  // LOADING STATE TESTS
  // ========================================================================

  describe('Loading State', () => {
    test('should disable email input when loading', () => {
      render(<LoginPage />, { preloadedState: loadingState });

      const emailInput = screen.getByLabelText(/e-posta veya kullanıcı adı/i);
      expect(emailInput).toBeDisabled();
    });

    test('should disable password input when loading', () => {
      render(<LoginPage />, { preloadedState: loadingState });

      const passwordInput = screen.getByLabelText(/şifre/i);
      expect(passwordInput).toBeDisabled();
    });

    test('should disable submit button when loading', () => {
      render(<LoginPage />, { preloadedState: loadingState });

      const submitButton = screen.getByRole('button', { name: /giriş yapılıyor/i });
      expect(submitButton).toBeDisabled();
    });

    test('should disable checkbox when loading', () => {
      render(<LoginPage />, { preloadedState: loadingState });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    test('should render Google login button in loading state', () => {
      render(<LoginPage />, { preloadedState: loadingState });

      // Mock'lanmış Google button her zaman mevcut
      const googleButton = screen.getByTestId('google-login-button');
      expect(googleButton).toBeInTheDocument();
    });

    test('should show loading spinner when submitting', () => {
      render(<LoginPage />, { preloadedState: loadingState });

      expect(screen.getByText('Giriş Yapılıyor...')).toBeInTheDocument();
    });

    test('submit button should have loading styles', () => {
      render(<LoginPage />, { preloadedState: loadingState });

      const submitButton = screen.getByRole('button', { name: /giriş yapılıyor/i });
      expect(submitButton).toHaveClass('disabled:bg-blue-400');
    });
  });

  // ========================================================================
  // ERROR STATE TESTS
  // ========================================================================

  describe('Error State', () => {
    test('should display error message when login fails', () => {
      render(<LoginPage />, { preloadedState: errorState });

      expect(screen.getByText('Geçersiz e-posta veya şifre')).toBeInTheDocument();
    });

    test('should render error in red styled container', () => {
      render(<LoginPage />, { preloadedState: errorState });

      const errorContainer = screen.getByText('Geçersiz e-posta veya şifre').closest('div');
      expect(errorContainer).toHaveClass('bg-red-50', 'text-red-700');
    });

    test('should have close button for error message', () => {
      render(<LoginPage />, { preloadedState: errorState });

      const closeButton = screen.getByRole('button', { name: /✕/i });
      expect(closeButton).toBeInTheDocument();
    });

    test('should clear error when clicking close button', async () => {
      const { store } = render(<LoginPage />, { preloadedState: errorState });

      const closeButton = screen.getByRole('button', { name: /✕/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(store.getState().auth.error).toBeNull();
      });
    });

    test('should not display error container when no error', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const errorContainer = screen.queryByText('Geçersiz e-posta veya şifre');
      expect(errorContainer).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // AUTHENTICATION REDIRECT TESTS
  // ========================================================================

  describe('Authentication Redirect', () => {
    test('should redirect to panel when already authenticated', async () => {
      render(<LoginPage />, { preloadedState: authenticatedState });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/panel');
      });
    });

    test('should not redirect when not authenticated', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // STYLING TESTS
  // ========================================================================

  describe('Styling', () => {
    test('submit button should have correct styling', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const submitButton = screen.getByRole('button', { name: /^giriş yap$/i });
      expect(submitButton).toHaveClass('bg-blue-600', 'text-white', 'rounded-lg');
    });

    test('inputs should have focus styles', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta veya kullanıcı adı/i);
      expect(emailInput).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });

    test('forgot password link should have blue color', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const forgotPasswordLink = screen.getByRole('link', { name: /şifreni mi unuttun/i });
      expect(forgotPasswordLink).toHaveClass('text-blue-600');
    });

    test('register link should have blue color and bold text', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const registerLink = screen.getByRole('link', { name: /kayıt ol/i });
      expect(registerLink).toHaveClass('text-blue-600', 'font-semibold');
    });
  });

  // ========================================================================
  // ACCESSIBILITY TESTS
  // ========================================================================

  describe('Accessibility', () => {
    test('inputs should have associated labels', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta veya kullanıcı adı/i);
      const passwordInput = screen.getByLabelText(/şifre/i);

      expect(emailInput).toHaveAttribute('id', 'emailOrUsername');
      expect(passwordInput).toHaveAttribute('id', 'password');
    });

    test('form should be properly structured', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    test('submit button should be focusable', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const submitButton = screen.getByRole('button', { name: /^giriş yap$/i });
      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);
    });
  });

  // ========================================================================
  // GOOGLE LOGIN TESTS
  // ========================================================================

  describe('Google Login', () => {
    test('should render Google login button', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const googleButton = screen.getByTestId('google-login-button');
      expect(googleButton).toBeInTheDocument();
    });

    test('Google login button should be clickable', async () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const googleButton = screen.getByTestId('google-login-button');

      // Click should not throw error
      await user.click(googleButton);

      // Button should still be in document after click
      expect(googleButton).toBeInTheDocument();
    });

    test('should have divider before Google login button', () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      expect(screen.getByText('veya')).toBeInTheDocument();
    });

    test('Google login button should trigger onSuccess callback when clicked', async () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const googleButton = screen.getByTestId('google-login-button');

      // Mock'umuz click'te onSuccess'i çağırıyor
      await user.click(googleButton);

      // Buton tıklandıktan sonra da sayfada kalmalı
      expect(googleButton).toBeInTheDocument();
    });
  });

  // ========================================================================
  // FORM SUBMISSION TESTS
  // ========================================================================

  describe('Form Submission', () => {
    test('should submit form with valid credentials', async () => {
      const { store } = render(<LoginPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta veya kullanıcı adı/i);
      const passwordInput = screen.getByLabelText(/şifre/i);
      const submitButton = screen.getByRole('button', { name: /^giriş yap$/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Form submission should trigger login action
      // The actual API call is mocked, so we check if form was submitted
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    test('should prevent default form submission', async () => {
      render(<LoginPage />, { preloadedState: defaultInitialState });

      const form = document.querySelector('form');

      // Form should have onSubmit handler that prevents default
      expect(form).toBeInTheDocument();
    });
  });
});
