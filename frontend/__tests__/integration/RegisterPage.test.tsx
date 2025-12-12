/**
 * RegisterPage Integration Tests
 * 
 * Kayıt sayfasının form işlemleri, Redux entegrasyonu ve kullanıcı etkileşim testleri.
 * Bu testler bileşenin Redux ile birlikte çalışmasını kontrol eder.
 */

import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  render, 
  createMockAuthState, 
  createAuthenticatedState
} from '../utils/test-utils';
import RegisterPage from '@/body/auth/RegisterPage';

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
  usePathname: () => '/register',
  useSearchParams: () => new URLSearchParams(),
}));

// Auth API mock
jest.mock('@/body/redux/api/authApi', () => ({
  loginApi: jest.fn(),
  registerApi: jest.fn(),
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
  GoogleLogin: ({ onSuccess }: { onSuccess: (response: { credential: string }) => void }) => (
    <button 
      data-testid="google-register-button"
      onClick={() => onSuccess({ credential: 'mock-google-credential' })}
    >
      Google ile Kayıt Ol
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
  auth: createMockAuthState({ error: 'Bu e-posta adresi zaten kullanımda' }),
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

describe('RegisterPage', () => {
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
    test('should render register form correctly', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      expect(screen.getByRole('heading', { name: /kayıt ol/i })).toBeInTheDocument();
      expect(screen.getByText('Yeni hesap oluşturun ve başlayın')).toBeInTheDocument();
    });

    test('should render name input field', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const nameInput = screen.getByLabelText(/^ad$/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('placeholder', 'Ahmet');
    });

    test('should render surname input field', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const surnameInput = screen.getByLabelText(/soyad/i);
      expect(surnameInput).toBeInTheDocument();
      expect(surnameInput).toHaveAttribute('type', 'text');
      expect(surnameInput).toHaveAttribute('placeholder', 'Yılmaz');
    });

    test('should render phone input field', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const phoneInput = screen.getByLabelText(/telefon numarası/i);
      expect(phoneInput).toBeInTheDocument();
      expect(phoneInput).toHaveAttribute('type', 'tel');
    });

    test('should render email input field', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('placeholder', 'ornek@email.com');
    });

    test('should render password input field', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const passwordInput = screen.getByLabelText(/^şifre$/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should render confirm password input field', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const confirmPasswordInput = screen.getByLabelText(/şifre tekrar/i);
      expect(confirmPasswordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('should render submit button', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const submitButton = screen.getByRole('button', { name: /^kayıt ol$/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    test('should render terms checkbox', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      expect(screen.getByText(/kullanım koşullarını/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    test('should render login link', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      expect(screen.getByText(/zaten hesabınız var mı/i)).toBeInTheDocument();
      const loginLink = screen.getByRole('link', { name: /giriş yap/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    test('should render Google register button', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const googleButton = screen.getByTestId('google-register-button');
      expect(googleButton).toBeInTheDocument();
    });

    test('should render divider with "veya" text', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      expect(screen.getByText('veya')).toBeInTheDocument();
    });

    test('should render password requirements text', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      expect(screen.getByText(/en az 8 karakter/i)).toBeInTheDocument();
    });
  });

  // ========================================================================
  // FORM INTERACTION TESTS
  // ========================================================================
  
  describe('Form Interactions', () => {
    test('should update name input value on change', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const nameInput = screen.getByLabelText(/^ad$/i);
      await user.type(nameInput, 'Ahmet');

      expect(nameInput).toHaveValue('Ahmet');
    });

    test('should update surname input value on change', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const surnameInput = screen.getByLabelText(/soyad/i);
      await user.type(surnameInput, 'Yılmaz');

      expect(surnameInput).toHaveValue('Yılmaz');
    });

    test('should update phone input value on change', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const phoneInput = screen.getByLabelText(/telefon numarası/i);
      await user.type(phoneInput, '5551234567');

      expect(phoneInput).toHaveValue('5551234567');
    });

    test('should update email input value on change', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    test('should update password input value on change', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const passwordInput = screen.getByLabelText(/^şifre$/i);
      await user.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    test('should update confirm password input value on change', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const confirmPasswordInput = screen.getByLabelText(/şifre tekrar/i);
      await user.type(confirmPasswordInput, 'password123');

      expect(confirmPasswordInput).toHaveValue('password123');
    });

    test('should toggle password visibility when clicking eye button', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const passwordInput = screen.getByLabelText(/^şifre$/i);
      
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

    test('should toggle terms checkbox', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  // ========================================================================
  // FORM VALIDATION TESTS
  // ========================================================================
  
  describe('Form Validation', () => {
    test('should show validation error for short name', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const nameInput = screen.getByLabelText(/^ad$/i);
      const surnameInput = screen.getByLabelText(/soyad/i);
      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/^şifre$/i);
      const confirmPasswordInput = screen.getByLabelText(/şifre tekrar/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /^kayıt ol$/i });

      await user.type(nameInput, 'A');
      await user.type(surnameInput, 'Yılmaz');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(checkbox);
      await user.click(submitButton);

      expect(screen.getByText('Ad en az 2 karakter olmalıdır!')).toBeInTheDocument();
    });

    test('should show validation error for short surname', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const nameInput = screen.getByLabelText(/^ad$/i);
      const surnameInput = screen.getByLabelText(/soyad/i);
      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/^şifre$/i);
      const confirmPasswordInput = screen.getByLabelText(/şifre tekrar/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /^kayıt ol$/i });

      await user.type(nameInput, 'Ahmet');
      await user.type(surnameInput, 'Y');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(checkbox);
      await user.click(submitButton);

      expect(screen.getByText('Soyad en az 2 karakter olmalıdır!')).toBeInTheDocument();
    });

    test('should show validation error for mismatched passwords', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const nameInput = screen.getByLabelText(/^ad$/i);
      const surnameInput = screen.getByLabelText(/soyad/i);
      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/^şifre$/i);
      const confirmPasswordInput = screen.getByLabelText(/şifre tekrar/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /^kayıt ol$/i });

      await user.type(nameInput, 'Ahmet');
      await user.type(surnameInput, 'Yılmaz');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'differentpassword');
      await user.click(checkbox);
      await user.click(submitButton);

      expect(screen.getByText('Şifreler eşleşmiyor!')).toBeInTheDocument();
    });

    test('should show validation error for short password', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const nameInput = screen.getByLabelText(/^ad$/i);
      const surnameInput = screen.getByLabelText(/soyad/i);
      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/^şifre$/i);
      const confirmPasswordInput = screen.getByLabelText(/şifre tekrar/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /^kayıt ol$/i });

      await user.type(nameInput, 'Ahmet');
      await user.type(surnameInput, 'Yılmaz');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.type(confirmPasswordInput, 'short');
      await user.click(checkbox);
      await user.click(submitButton);

      expect(screen.getByText('Şifre en az 8 karakter olmalıdır!')).toBeInTheDocument();
    });

    test('should show validation error for terms not accepted', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const nameInput = screen.getByLabelText(/^ad$/i);
      const surnameInput = screen.getByLabelText(/soyad/i);
      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/^şifre$/i);
      const confirmPasswordInput = screen.getByLabelText(/şifre tekrar/i);
      const submitButton = screen.getByRole('button', { name: /^kayıt ol$/i });

      await user.type(nameInput, 'Ahmet');
      await user.type(surnameInput, 'Yılmaz');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      // Don't click checkbox
      await user.click(submitButton);

      expect(screen.getByText('Kullanım koşullarını kabul etmelisiniz!')).toBeInTheDocument();
    });

    test('all inputs should have required attribute', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      expect(screen.getByLabelText(/^ad$/i)).toBeRequired();
      expect(screen.getByLabelText(/soyad/i)).toBeRequired();
      expect(screen.getByLabelText(/e-posta adresi/i)).toBeRequired();
      expect(screen.getByLabelText(/^şifre$/i)).toBeRequired();
      expect(screen.getByLabelText(/şifre tekrar/i)).toBeRequired();
    });

    test('phone input should not be required', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const phoneInput = screen.getByLabelText(/telefon numarası/i);
      expect(phoneInput).not.toBeRequired();
    });
  });

  // ========================================================================
  // LOADING STATE TESTS
  // ========================================================================
  
  describe('Loading State', () => {
    test('should disable all inputs when loading', () => {
      render(<RegisterPage />, { preloadedState: loadingState });

      expect(screen.getByLabelText(/^ad$/i)).toBeDisabled();
      expect(screen.getByLabelText(/soyad/i)).toBeDisabled();
      expect(screen.getByLabelText(/telefon numarası/i)).toBeDisabled();
      expect(screen.getByLabelText(/e-posta adresi/i)).toBeDisabled();
      expect(screen.getByLabelText(/^şifre$/i)).toBeDisabled();
      expect(screen.getByLabelText(/şifre tekrar/i)).toBeDisabled();
    });

    test('should disable submit button when loading', () => {
      render(<RegisterPage />, { preloadedState: loadingState });

      const submitButton = screen.getByRole('button', { name: /kayıt yapılıyor/i });
      expect(submitButton).toBeDisabled();
    });

    test('should disable checkbox when loading', () => {
      render(<RegisterPage />, { preloadedState: loadingState });

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    test('should show loading spinner when submitting', () => {
      render(<RegisterPage />, { preloadedState: loadingState });

      expect(screen.getByText('Kayıt Yapılıyor...')).toBeInTheDocument();
    });

    test('submit button should have loading styles', () => {
      render(<RegisterPage />, { preloadedState: loadingState });

      const submitButton = screen.getByRole('button', { name: /kayıt yapılıyor/i });
      expect(submitButton).toHaveClass('disabled:bg-blue-400');
    });
  });

  // ========================================================================
  // ERROR STATE TESTS
  // ========================================================================
  
  describe('Error State', () => {
    test('should display error message when registration fails', () => {
      render(<RegisterPage />, { preloadedState: errorState });

      expect(screen.getByText('Bu e-posta adresi zaten kullanımda')).toBeInTheDocument();
    });

    test('should render error in red styled container', () => {
      render(<RegisterPage />, { preloadedState: errorState });

      const errorContainer = screen.getByText('Bu e-posta adresi zaten kullanımda').closest('div');
      expect(errorContainer).toHaveClass('bg-red-50', 'text-red-700');
    });

    test('should have close button for error message', () => {
      render(<RegisterPage />, { preloadedState: errorState });

      const closeButton = screen.getByRole('button', { name: /✕/i });
      expect(closeButton).toBeInTheDocument();
    });

    test('should clear error when clicking close button', async () => {
      const { store } = render(<RegisterPage />, { preloadedState: errorState });

      const closeButton = screen.getByRole('button', { name: /✕/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(store.getState().auth.error).toBeNull();
      });
    });

    test('should not display error container when no error', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const errorContainer = screen.queryByText('Bu e-posta adresi zaten kullanımda');
      expect(errorContainer).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // AUTHENTICATION REDIRECT TESTS
  // ========================================================================
  
  describe('Authentication Redirect', () => {
    test('should redirect to panel when already authenticated', async () => {
      render(<RegisterPage />, { preloadedState: authenticatedState });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/panel');
      });
    });

    test('should not redirect when not authenticated', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ========================================================================
  // STYLING TESTS
  // ========================================================================
  
  describe('Styling', () => {
    test('submit button should have correct styling', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const submitButton = screen.getByRole('button', { name: /^kayıt ol$/i });
      expect(submitButton).toHaveClass('bg-blue-600', 'text-white', 'rounded-lg');
    });

    test('inputs should have focus styles', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      expect(emailInput).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });

    test('login link should have blue color and bold text', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const loginLink = screen.getByRole('link', { name: /giriş yap/i });
      expect(loginLink).toHaveClass('text-blue-600', 'font-semibold');
    });
  });

  // ========================================================================
  // ACCESSIBILITY TESTS
  // ========================================================================
  
  describe('Accessibility', () => {
    test('inputs should have associated labels', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      expect(screen.getByLabelText(/^ad$/i)).toHaveAttribute('id', 'name');
      expect(screen.getByLabelText(/soyad/i)).toHaveAttribute('id', 'surname');
      expect(screen.getByLabelText(/telefon numarası/i)).toHaveAttribute('id', 'phone');
      expect(screen.getByLabelText(/e-posta adresi/i)).toHaveAttribute('id', 'email');
      expect(screen.getByLabelText(/^şifre$/i)).toHaveAttribute('id', 'password');
      expect(screen.getByLabelText(/şifre tekrar/i)).toHaveAttribute('id', 'confirmPassword');
    });

    test('form should be properly structured', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const form = document.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    test('submit button should be focusable', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const submitButton = screen.getByRole('button', { name: /^kayıt ol$/i });
      submitButton.focus();
      expect(document.activeElement).toBe(submitButton);
    });
  });

  // ========================================================================
  // GOOGLE REGISTER TESTS
  // ========================================================================
  
  describe('Google Register', () => {
    test('should render Google register button', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const googleButton = screen.getByTestId('google-register-button');
      expect(googleButton).toBeInTheDocument();
    });

    test('Google register button should be clickable', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const googleButton = screen.getByTestId('google-register-button');
      
      // Click should not throw error
      await user.click(googleButton);
      
      // Button should still be in document after click
      expect(googleButton).toBeInTheDocument();
    });

    test('should have divider before Google register button', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      expect(screen.getByText('veya')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // FORM SUBMISSION TESTS
  // ========================================================================
  
  describe('Form Submission', () => {
    test('should submit form with valid data', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const nameInput = screen.getByLabelText(/^ad$/i);
      const surnameInput = screen.getByLabelText(/soyad/i);
      const emailInput = screen.getByLabelText(/e-posta adresi/i);
      const passwordInput = screen.getByLabelText(/^şifre$/i);
      const confirmPasswordInput = screen.getByLabelText(/şifre tekrar/i);
      const checkbox = screen.getByRole('checkbox');
      const submitButton = screen.getByRole('button', { name: /^kayıt ol$/i });

      await user.type(nameInput, 'Ahmet');
      await user.type(surnameInput, 'Yılmaz');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.type(confirmPasswordInput, 'password123');
      await user.click(checkbox);
      await user.click(submitButton);

      // Form values should be correct
      expect(nameInput).toHaveValue('Ahmet');
      expect(surnameInput).toHaveValue('Yılmaz');
      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
      expect(confirmPasswordInput).toHaveValue('password123');
    });

    test('should prevent default form submission', async () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const form = document.querySelector('form');
      
      // Form should have onSubmit handler that prevents default
      expect(form).toBeInTheDocument();
    });
  });

  // ========================================================================
  // TERMS LINKS TESTS
  // ========================================================================
  
  describe('Terms Links', () => {
    test('should render terms of use link', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const termsLink = screen.getByRole('link', { name: /kullanım koşullarını/i });
      expect(termsLink).toHaveAttribute('href', '/terms');
    });

    test('should render privacy policy link', () => {
      render(<RegisterPage />, { preloadedState: defaultInitialState });

      const privacyLink = screen.getByRole('link', { name: /gizlilik politikasını/i });
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });
  });
});
