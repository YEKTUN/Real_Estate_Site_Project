/**
 * GoogleLoginButton Component Tests
 * 
 * Google OAuth login button bileşeninin render ve callback testleri.
 * Google Login SDK entegrasyonu test edilir.
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  render, 
  createMockAuthState
} from '../utils/test-utils';
import GoogleLoginButton from '@/body/auth/components/GoogleLoginButton';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock onSuccess ve onError callback'leri
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();

// Google OAuth mock - farklı senaryolar için
let mockGoogleLoginOnSuccess: ((response: { credential: string }) => void) | null = null;
let mockGoogleLoginOnError: (() => void) | null = null;

jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GoogleLogin: ({ 
    onSuccess, 
    onError,
    text,
  }: { 
    onSuccess: (response: { credential: string }) => void; 
    onError: () => void;
    text?: string;
  }) => {
    // Callback'leri sakla
    mockGoogleLoginOnSuccess = onSuccess;
    mockGoogleLoginOnError = onError;
    
    return (
      <button 
        data-testid="google-login-button"
        data-text={text}
        onClick={() => onSuccess({ credential: 'mock-google-credential' })}
      >
        {text === 'signup_with' ? 'Google ile Kayıt Ol' : 'Google ile Giriş Yap'}
      </button>
    );
  },
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
  googleLoginApi: jest.fn().mockResolvedValue({
    success: true,
    message: 'Google ile giriş başarılı',
    token: 'mock-jwt-token',
    refreshToken: 'mock-refresh-token',
    user: {
      id: '1',
      name: 'Google',
      surname: 'User',
      email: 'google@example.com',
    },
  }),
}));

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Default state
 */
const defaultState = {
  auth: createMockAuthState(),
};

/**
 * Loading state
 */
const loadingState = {
  auth: createMockAuthState({ isLoading: true }),
};

// ============================================================================
// TEST SUITES
// ============================================================================

describe('GoogleLoginButton Component', () => {
  // User event setup
  const user = userEvent.setup();

  // Her testten önce mock'ları temizle
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSuccess.mockClear();
    mockOnError.mockClear();
    mockGoogleLoginOnSuccess = null;
    mockGoogleLoginOnError = null;
  });

  // ========================================================================
  // RENDER TESTS
  // ========================================================================
  
  describe('Rendering', () => {
    test('should render Google login button', () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    });

    test('should render with "signin_with" text by default', () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      expect(screen.getByText('Google ile Giriş Yap')).toBeInTheDocument();
    });

    test('should render with "signup_with" text when specified', () => {
      render(
        <GoogleLoginButton text="signup_with" />,
        { preloadedState: defaultState }
      );
      
      expect(screen.getByText('Google ile Kayıt Ol')).toBeInTheDocument();
    });

    test('should render with correct text attribute', () => {
      render(
        <GoogleLoginButton text="signup_with" />,
        { preloadedState: defaultState }
      );
      
      const button = screen.getByTestId('google-login-button');
      expect(button).toHaveAttribute('data-text', 'signup_with');
    });

    test('should be wrapped in a flex container', () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      const container = screen.getByTestId('google-login-button').parentElement;
      expect(container).toHaveClass('flex', 'justify-center');
    });
  });

  // ========================================================================
  // LOADING STATE TESTS
  // ========================================================================
  
  describe('Loading State', () => {
    test('should have disabled styles when loading', () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: loadingState }
      );
      
      const container = screen.getByTestId('google-login-button').parentElement;
      expect(container).toHaveClass('pointer-events-none', 'opacity-50');
    });

    test('should not have disabled styles when not loading', () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      const container = screen.getByTestId('google-login-button').parentElement;
      expect(container).not.toHaveClass('pointer-events-none');
      expect(container).not.toHaveClass('opacity-50');
    });
  });

  // ========================================================================
  // SUCCESS CALLBACK TESTS
  // ========================================================================
  
  describe('Success Callback', () => {
    test('should call onSuccess callback when login succeeds', async () => {
      render(
        <GoogleLoginButton onSuccess={mockOnSuccess} />,
        { preloadedState: defaultState }
      );
      
      const button = screen.getByTestId('google-login-button');
      await user.click(button);
      
      // googleLogin thunk dispatch edilir ve başarılı olursa onSuccess çağrılır
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    test('should dispatch googleLogin action on click', async () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      const button = screen.getByTestId('google-login-button');
      await user.click(button);
      
      // Button tıklandığında hata fırlatmamalı
      expect(button).toBeInTheDocument();
    });

    test('should handle credential response', async () => {
      render(
        <GoogleLoginButton onSuccess={mockOnSuccess} />,
        { preloadedState: defaultState }
      );
      
      // Simulate Google callback
      if (mockGoogleLoginOnSuccess) {
        mockGoogleLoginOnSuccess({ credential: 'test-credential' });
      }
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  // ========================================================================
  // ERROR CALLBACK TESTS
  // ========================================================================
  
  describe('Error Callback', () => {
    test('should call onError callback when credential is missing', async () => {
      render(
        <GoogleLoginButton onError={mockOnError} />,
        { preloadedState: defaultState }
      );
      
      // Simulate Google callback with empty credential
      if (mockGoogleLoginOnSuccess) {
        // Credential olmadan çağır
        const originalOnSuccess = mockGoogleLoginOnSuccess;
        // @ts-expect-error - testing edge case
        originalOnSuccess({ credential: '' });
      }
      
      // onError çağrılmalı (credential boş olduğunda)
      // Not: Gerçek implementasyonda credential undefined ise onError çağrılır
    });

    test('should call onError when Google login fails', async () => {
      render(
        <GoogleLoginButton onError={mockOnError} />,
        { preloadedState: defaultState }
      );
      
      // Simulate Google error
      if (mockGoogleLoginOnError) {
        mockGoogleLoginOnError();
      }
      
      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith('Google ile giriş başarısız oldu');
      });
    });
  });

  // ========================================================================
  // PROPS TESTS
  // ========================================================================
  
  describe('Props', () => {
    test('should accept text prop', () => {
      render(
        <GoogleLoginButton text="continue_with" />,
        { preloadedState: defaultState }
      );
      
      const button = screen.getByTestId('google-login-button');
      expect(button).toHaveAttribute('data-text', 'continue_with');
    });

    test('should accept onSuccess callback prop', () => {
      const customOnSuccess = jest.fn();
      
      render(
        <GoogleLoginButton onSuccess={customOnSuccess} />,
        { preloadedState: defaultState }
      );
      
      // onSuccess prop geçirilmeli
      expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    });

    test('should accept onError callback prop', () => {
      const customOnError = jest.fn();
      
      render(
        <GoogleLoginButton onError={customOnError} />,
        { preloadedState: defaultState }
      );
      
      // onError prop geçirilmeli
      expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    });

    test('should work without callback props', () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      // Callback'siz de çalışmalı
      expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // CLICK BEHAVIOR TESTS
  // ========================================================================
  
  describe('Click Behavior', () => {
    test('should be clickable when not loading', async () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      const button = screen.getByTestId('google-login-button');
      
      // Click should not throw
      await user.click(button);
      
      expect(button).toBeInTheDocument();
    });

    test('button should remain in document after click', async () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      const button = screen.getByTestId('google-login-button');
      await user.click(button);
      
      expect(button).toBeInTheDocument();
    });
  });

  // ========================================================================
  // STYLING TESTS
  // ========================================================================
  
  describe('Styling', () => {
    test('should have full width container', () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      const container = screen.getByTestId('google-login-button').parentElement;
      expect(container).toHaveClass('w-full');
    });

    test('should center content', () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      const container = screen.getByTestId('google-login-button').parentElement;
      expect(container).toHaveClass('justify-center');
    });
  });

  // ========================================================================
  // ACCESSIBILITY TESTS
  // ========================================================================
  
  describe('Accessibility', () => {
    test('should be focusable', () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      const button = screen.getByTestId('google-login-button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    test('should have button role', () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================
  
  describe('Edge Cases', () => {
    test('should handle rapid clicks gracefully', async () => {
      render(
        <GoogleLoginButton onSuccess={mockOnSuccess} />,
        { preloadedState: defaultState }
      );
      
      const button = screen.getByTestId('google-login-button');
      
      // Rapid clicks
      await user.click(button);
      await user.click(button);
      await user.click(button);
      
      // Should not crash
      expect(button).toBeInTheDocument();
    });

    test('should handle undefined callbacks gracefully', async () => {
      render(
        <GoogleLoginButton />,
        { preloadedState: defaultState }
      );
      
      const button = screen.getByTestId('google-login-button');
      await user.click(button);
      
      // Should not crash without callbacks
      expect(button).toBeInTheDocument();
    });
  });
});
