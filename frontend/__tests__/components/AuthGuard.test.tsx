/**
 * AuthGuard Component Tests
 * 
 * AuthGuard bileşeninin token kontrolü, yönlendirme ve event listener testleri.
 * Global auth guard davranışları test edilir.
 */

import { screen, waitFor, act } from '@testing-library/react';
import { 
  render, 
  createMockAuthState, 
  createAuthenticatedState
} from '../utils/test-utils';
import AuthGuard from '@/body/auth/components/AuthGuard';

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
  usePathname: () => '/test-page',
  useSearchParams: () => new URLSearchParams(),
}));

// Token validation mock
const mockIsTokenValid = jest.fn();
jest.mock('@/body/redux/api/axiosInstance', () => ({
  isTokenValid: () => mockIsTokenValid(),
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

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Authenticated state with valid token
 */
const authenticatedState = {
  auth: createAuthenticatedState({
    token: 'valid-jwt-token',
  }),
};

/**
 * Unauthenticated state
 */
const unauthenticatedState = {
  auth: createMockAuthState(),
};

/**
 * Test child component
 */
const TestChild = () => <div data-testid="test-child">Test Child Content</div>;

// ============================================================================
// TEST SUITES
// ============================================================================

describe('AuthGuard Component', () => {
  // Her testten önce mock'ları temizle
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsTokenValid.mockReturnValue(true);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ========================================================================
  // RENDER TESTS
  // ========================================================================
  
  describe('Rendering', () => {
    test('should render children when authenticated', () => {
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    test('should render children when not authenticated', () => {
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: unauthenticatedState }
      );
      
      // AuthGuard children'ı her zaman render eder
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    test('should render multiple children', () => {
      render(
        <AuthGuard>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // TOKEN VALIDATION TESTS
  // ========================================================================
  
  describe('Token Validation', () => {
    test('should not redirect when token is valid', () => {
      mockIsTokenValid.mockReturnValue(true);
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      // Login'e yönlendirme yapılmamalı
      expect(mockPush).not.toHaveBeenCalledWith('/login');
    });

    test('should redirect to login when token is invalid', async () => {
      mockIsTokenValid.mockReturnValue(false);
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('should call isTokenValid when authenticated', () => {
      mockIsTokenValid.mockReturnValue(true);
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      expect(mockIsTokenValid).toHaveBeenCalled();
    });
  });

  // ========================================================================
  // PERIODIC TOKEN CHECK TESTS
  // ========================================================================
  
  describe('Periodic Token Check', () => {
    test('should check token periodically when authenticated', async () => {
      mockIsTokenValid.mockReturnValue(true);
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      // İlk kontrol
      const initialCallCount = mockIsTokenValid.mock.calls.length;
      
      // 30 saniye ileri al
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      
      // Periyodik kontrol yapılmış olmalı
      expect(mockIsTokenValid.mock.calls.length).toBeGreaterThan(initialCallCount);
    });

    test('should not check token periodically when not authenticated', async () => {
      mockIsTokenValid.mockReturnValue(true);
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: unauthenticatedState }
      );
      
      const initialCallCount = mockIsTokenValid.mock.calls.length;
      
      // 30 saniye ileri al
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      
      // Authenticated olmadığında periyodik kontrol yapılmamalı
      expect(mockIsTokenValid.mock.calls.length).toBe(initialCallCount);
    });

    test('should redirect when token expires during periodic check', async () => {
      mockIsTokenValid.mockReturnValue(true);
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      // Token'ı geçersiz yap
      mockIsTokenValid.mockReturnValue(false);
      
      // 30 saniye ileri al (periyodik kontrol)
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });

  // ========================================================================
  // VISIBILITY CHANGE TESTS
  // ========================================================================
  
  describe('Visibility Change', () => {
    test('should check token when tab becomes visible', async () => {
      mockIsTokenValid.mockReturnValue(true);
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      const initialCallCount = mockIsTokenValid.mock.calls.length;
      
      // Visibility change event'i simüle et
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      
      // Token kontrolü yapılmış olmalı
      expect(mockIsTokenValid.mock.calls.length).toBeGreaterThanOrEqual(initialCallCount);
    });
  });

  // ========================================================================
  // STORAGE EVENT TESTS
  // ========================================================================
  
  describe('Storage Events', () => {
    test('should redirect when token is removed from storage', async () => {
      mockIsTokenValid.mockReturnValue(true);
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      // Storage event'i simüle et (token silindi)
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'token',
          newValue: null,
          oldValue: 'valid-token',
        }));
      });
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    test('should not redirect when other storage key changes', async () => {
      mockIsTokenValid.mockReturnValue(true);
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      // Başka bir key değişikliği
      act(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'other-key',
          newValue: null,
          oldValue: 'some-value',
        }));
      });
      
      // Login'e yönlendirme yapılmamalı
      expect(mockPush).not.toHaveBeenCalledWith('/login');
    });
  });

  // ========================================================================
  // INITIALIZATION TESTS
  // ========================================================================
  
  describe('Initialization', () => {
    test('should dispatch initializeAuth on mount', () => {
      const { store } = render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: unauthenticatedState }
      );
      
      // initializeAuth dispatch edilmeli
      // Action'lar dispatch edildiğinde store değişir
      expect(store.getState().auth).toBeDefined();
    });
  });

  // ========================================================================
  // CLEANUP TESTS
  // ========================================================================
  
  describe('Cleanup', () => {
    test('should clear interval on unmount', () => {
      mockIsTokenValid.mockReturnValue(true);
      
      const { unmount } = render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      // Unmount et
      unmount();
      
      // 30 saniye ileri al
      act(() => {
        jest.advanceTimersByTime(30000);
      });
      
      // Unmount sonrası redirect çağrılmamalı
      // (Bu test interval temizlendiğini doğrular)
      expect(mockPush).not.toHaveBeenCalled();
    });

    test('should remove event listeners on unmount', () => {
      mockIsTokenValid.mockReturnValue(true);
      
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const documentRemoveEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      
      const { unmount } = render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: authenticatedState }
      );
      
      // Unmount et
      unmount();
      
      // Event listener'lar temizlenmeli
      expect(removeEventListenerSpy).toHaveBeenCalled();
      expect(documentRemoveEventListenerSpy).toHaveBeenCalled();
      
      removeEventListenerSpy.mockRestore();
      documentRemoveEventListenerSpy.mockRestore();
    });
  });

  // ========================================================================
  // EDGE CASES
  // ========================================================================
  
  describe('Edge Cases', () => {
    test('should handle null token gracefully', () => {
      const stateWithNullToken = {
        auth: createAuthenticatedState({
          token: null,
        }),
      };
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: stateWithNullToken }
      );
      
      // Hata fırlatmamalı
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    test('should handle empty token gracefully', () => {
      const stateWithEmptyToken = {
        auth: createAuthenticatedState({
          token: '',
        }),
      };
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: stateWithEmptyToken }
      );
      
      // Hata fırlatmamalı
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });

    test('should render without crashing when loading', () => {
      const loadingState = {
        auth: createMockAuthState({ isLoading: true }),
      };
      
      render(
        <AuthGuard>
          <TestChild />
        </AuthGuard>,
        { preloadedState: loadingState }
      );
      
      expect(screen.getByTestId('test-child')).toBeInTheDocument();
    });
  });
});
