/**
 * AuthSlice Unit Tests
 * 
 * Redux auth slice'ının tüm reducer, action ve async thunk'larını test eder.
 * Bu testler slice'ın iş mantığının doğruluğunu kontrol eder.
 */

import authReducer, {
  logout,
  clearError,
  setUser,
  setTokens,
  resetAuth,
  login,
  register,
  refreshToken,
  getCurrentUser,
  initializeAuth,
  logoutAsync,
  googleLogin,
  selectUser,
  selectToken,
  selectRefreshToken,
  selectIsAuthenticated,
  selectIsLoading,
  selectError,
  selectAuth,
} from '@/body/redux/slices/auth/AuthSlice';
import { AuthState, UserDto } from '@/body/redux/slices/auth/DTOs/AuthDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Auth API'yi mock'la
jest.mock('@/body/redux/api/authApi', () => ({
  loginApi: jest.fn(),
  registerApi: jest.fn(),
  refreshTokenApi: jest.fn(),
  logoutApi: jest.fn(),
  getCurrentUserApi: jest.fn(),
  getUserFromStoredToken: jest.fn(),
  checkAuthStatus: jest.fn(),
  getStoredToken: jest.fn(),
  getStoredRefreshToken: jest.fn(),
  googleLoginApi: jest.fn(),
}));

// ============================================================================
// TEST DATA
// ============================================================================

/**
 * Initial state - slice'ın başlangıç durumu
 */
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Mock user data
 */
const mockUser: UserDto = {
  id: '1',
  name: 'Test',
  surname: 'User',
  email: 'test@example.com',
  phone: '5551234567',
};

/**
 * Mock authenticated state
 */
const authenticatedState: AuthState = {
  user: { ...mockUser, isAdmin: false },
  token: 'test-jwt-token',
  refreshToken: 'test-refresh-token',
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

/**
 * Mock auth response
 */
const mockAuthResponse = {
  success: true,
  message: 'İşlem başarılı',
  token: 'new-jwt-token',
  refreshToken: 'new-refresh-token',
  expiresIn: 3600,
  user: mockUser,
};

// ============================================================================
// REDUCER TESTS
// ============================================================================

describe('AuthSlice', () => {
  describe('Initial State', () => {
    test('should return initial state when passed an empty action', () => {
      const result = authReducer(undefined, { type: '' });
      expect(result).toEqual(initialState);
    });

    test('initial state should have correct default values', () => {
      const result = authReducer(undefined, { type: '' });

      expect(result.user).toBeNull();
      expect(result.token).toBeNull();
      expect(result.refreshToken).toBeNull();
      expect(result.isAuthenticated).toBe(false);
      expect(result.isLoading).toBe(false);
      expect(result.error).toBeNull();
    });
  });

  // ========================================================================
  // SYNC REDUCER TESTS
  // ========================================================================

  describe('Sync Reducers', () => {
    describe('logout', () => {
      test('should reset auth state to initial values', () => {
        const result = authReducer(authenticatedState, logout());

        expect(result.user).toBeNull();
        expect(result.token).toBeNull();
        expect(result.refreshToken).toBeNull();
        expect(result.isAuthenticated).toBe(false);
        expect(result.error).toBeNull();
      });

      test('should clear error when logging out', () => {
        const stateWithError: AuthState = {
          ...authenticatedState,
          error: 'Some error',
        };

        const result = authReducer(stateWithError, logout());
        expect(result.error).toBeNull();
      });
    });

    describe('clearError', () => {
      test('should set error to null', () => {
        const stateWithError: AuthState = {
          ...initialState,
          error: 'Test error message',
        };

        const result = authReducer(stateWithError, clearError());
        expect(result.error).toBeNull();
      });

      test('should not affect other state properties', () => {
        const stateWithError: AuthState = {
          ...authenticatedState,
          error: 'Test error',
        };

        const result = authReducer(stateWithError, clearError());

        expect(result.user).toEqual({ ...mockUser, isAdmin: false });
        expect(result.token).toBe('test-jwt-token');
        expect(result.isAuthenticated).toBe(true);
      });
    });

    describe('setUser', () => {
      test('should update user in state', () => {
        const result = authReducer(initialState, setUser(mockUser));
        expect(result.user).toEqual({ ...mockUser, isAdmin: false });
      });

      test('should allow setting user to null', () => {
        const result = authReducer(authenticatedState, setUser(null));
        expect(result.user).toBeNull();
      });

      test('should update user with partial data', () => {
        const partialUser: UserDto = {
          id: '2',
          name: 'New',
          surname: 'User',
          email: 'new@example.com',
        };

        const result = authReducer(authenticatedState, setUser(partialUser));
        expect(result.user).toEqual(partialUser);
      });
    });

    describe('setTokens', () => {
      test('should update both tokens in state', () => {
        const tokens = {
          token: 'new-access-token',
          refreshToken: 'new-refresh-token',
        };

        const result = authReducer(initialState, setTokens(tokens));

        expect(result.token).toBe('new-access-token');
        expect(result.refreshToken).toBe('new-refresh-token');
      });

      test('should overwrite existing tokens', () => {
        const tokens = {
          token: 'updated-token',
          refreshToken: 'updated-refresh-token',
        };

        const result = authReducer(authenticatedState, setTokens(tokens));

        expect(result.token).toBe('updated-token');
        expect(result.refreshToken).toBe('updated-refresh-token');
      });
    });

    describe('resetAuth', () => {
      test('should return initial state', () => {
        const result = authReducer(authenticatedState, resetAuth());
        expect(result).toEqual(initialState);
      });

      test('should reset all properties including loading and error', () => {
        const modifiedState: AuthState = {
          user: mockUser,
          token: 'token',
          refreshToken: 'refresh',
          isAuthenticated: true,
          isLoading: true,
          error: 'some error',
        };

        const result = authReducer(modifiedState, resetAuth());

        expect(result.user).toBeNull();
        expect(result.token).toBeNull();
        expect(result.refreshToken).toBeNull();
        expect(result.isAuthenticated).toBe(false);
        expect(result.isLoading).toBe(false);
        expect(result.error).toBeNull();
      });
    });
  });

  // ========================================================================
  // ASYNC THUNK TESTS - LOGIN
  // ========================================================================

  describe('Async Thunks - Login', () => {
    const loginCredentials = {
      emailOrUsername: 'test@example.com',
      password: 'password123',
    };

    describe('login.pending', () => {
      test('should set isLoading to true', () => {
        const result = authReducer(initialState, login.pending('', loginCredentials));
        expect(result.isLoading).toBe(true);
      });

      test('should clear previous error', () => {
        const stateWithError: AuthState = {
          ...initialState,
          error: 'Previous error',
        };

        const result = authReducer(stateWithError, login.pending('', loginCredentials));
        expect(result.error).toBeNull();
      });
    });

    describe('login.fulfilled', () => {
      test('should set user and tokens on successful login', () => {
        const result = authReducer(
          initialState,
          login.fulfilled(mockAuthResponse, '', loginCredentials)
        );

        expect(result.isLoading).toBe(false);
        expect(result.isAuthenticated).toBe(true);
        expect(result.user).toEqual({ ...mockUser, isAdmin: false });
        expect(result.token).toBe('new-jwt-token');
        expect(result.refreshToken).toBe('new-refresh-token');
        expect(result.error).toBeNull();
      });

      test('should handle response without user', () => {
        const responseWithoutUser = {
          ...mockAuthResponse,
          user: undefined,
        };

        const result = authReducer(
          initialState,
          login.fulfilled(responseWithoutUser, '', loginCredentials)
        );

        expect(result.user).toBeNull();
        expect(result.isAuthenticated).toBe(true);
      });
    });

    describe('login.rejected', () => {
      test('should set error message on failed login', () => {
        const result = authReducer(
          initialState,
          login.rejected(null, '', loginCredentials, 'Invalid credentials')
        );

        expect(result.isLoading).toBe(false);
        expect(result.isAuthenticated).toBe(false);
        expect(result.error).toBe('Invalid credentials');
      });

      test('should not set user or tokens on failure', () => {
        const result = authReducer(
          initialState,
          login.rejected(null, '', loginCredentials, 'Login failed')
        );

        expect(result.user).toBeNull();
        expect(result.token).toBeNull();
        expect(result.refreshToken).toBeNull();
      });
    });
  });

  // ========================================================================
  // ASYNC THUNK TESTS - REGISTER
  // ========================================================================

  describe('Async Thunks - Register', () => {
    const registerData = {
      name: 'Test',
      surname: 'User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    describe('register.pending', () => {
      test('should set isLoading to true', () => {
        const result = authReducer(initialState, register.pending('', registerData));
        expect(result.isLoading).toBe(true);
      });

      test('should clear previous error', () => {
        const stateWithError: AuthState = {
          ...initialState,
          error: 'Previous error',
        };

        const result = authReducer(stateWithError, register.pending('', registerData));
        expect(result.error).toBeNull();
      });
    });

    describe('register.fulfilled', () => {
      test('should set user and tokens on successful registration', () => {
        const result = authReducer(
          initialState,
          register.fulfilled(mockAuthResponse, '', registerData)
        );

        expect(result.isLoading).toBe(false);
        expect(result.isAuthenticated).toBe(true);
        expect(result.user).toEqual({ ...mockUser, isAdmin: false });
        expect(result.token).toBe('new-jwt-token');
        expect(result.refreshToken).toBe('new-refresh-token');
      });
    });

    describe('register.rejected', () => {
      test('should set error message on failed registration', () => {
        const result = authReducer(
          initialState,
          register.rejected(null, '', registerData, 'Email already exists')
        );

        expect(result.isLoading).toBe(false);
        expect(result.isAuthenticated).toBe(false);
        expect(result.error).toBe('Email already exists');
      });
    });
  });

  // ========================================================================
  // ASYNC THUNK TESTS - GOOGLE LOGIN
  // ========================================================================

  describe('Async Thunks - Google Login', () => {
    const googleLoginData = {
      idToken: 'mock-google-id-token',
    };

    describe('googleLogin.pending', () => {
      test('should set isLoading to true', () => {
        const result = authReducer(initialState, googleLogin.pending('', googleLoginData));
        expect(result.isLoading).toBe(true);
      });

      test('should clear previous error', () => {
        const stateWithError: AuthState = {
          ...initialState,
          error: 'Previous error',
        };

        const result = authReducer(stateWithError, googleLogin.pending('', googleLoginData));
        expect(result.error).toBeNull();
      });
    });

    describe('googleLogin.fulfilled', () => {
      test('should set user and tokens on successful Google login', () => {
        const googleAuthResponse = {
          ...mockAuthResponse,
          message: 'Google ile giriş başarılı',
        };

        const result = authReducer(
          initialState,
          googleLogin.fulfilled(googleAuthResponse, '', googleLoginData)
        );

        expect(result.isLoading).toBe(false);
        expect(result.isAuthenticated).toBe(true);
        expect(result.user).toEqual({ ...mockUser, isAdmin: false });
        expect(result.token).toBe('new-jwt-token');
        expect(result.refreshToken).toBe('new-refresh-token');
        expect(result.error).toBeNull();
      });

      test('should handle response without user', () => {
        const responseWithoutUser = {
          ...mockAuthResponse,
          user: undefined,
        };

        const result = authReducer(
          initialState,
          googleLogin.fulfilled(responseWithoutUser, '', googleLoginData)
        );

        expect(result.user).toBeNull();
        expect(result.isAuthenticated).toBe(true);
      });

      test('should set authentication to true', () => {
        const result = authReducer(
          initialState,
          googleLogin.fulfilled(mockAuthResponse, '', googleLoginData)
        );

        expect(result.isAuthenticated).toBe(true);
      });
    });

    describe('googleLogin.rejected', () => {
      test('should set error message on failed Google login', () => {
        const result = authReducer(
          initialState,
          googleLogin.rejected(null, '', googleLoginData, 'Invalid Google token')
        );

        expect(result.isLoading).toBe(false);
        expect(result.isAuthenticated).toBe(false);
        expect(result.error).toBe('Invalid Google token');
      });

      test('should not set user or tokens on failure', () => {
        const result = authReducer(
          initialState,
          googleLogin.rejected(null, '', googleLoginData, 'Google login failed')
        );

        expect(result.user).toBeNull();
        expect(result.token).toBeNull();
        expect(result.refreshToken).toBeNull();
      });

      test('should set isLoading to false on rejection', () => {
        const loadingState: AuthState = {
          ...initialState,
          isLoading: true,
        };

        const result = authReducer(
          loadingState,
          googleLogin.rejected(null, '', googleLoginData, 'Error')
        );

        expect(result.isLoading).toBe(false);
      });
    });
  });

  // ========================================================================
  // ASYNC THUNK TESTS - REFRESH TOKEN
  // ========================================================================

  describe('Async Thunks - Refresh Token', () => {
    describe('refreshToken.pending', () => {
      test('should set isLoading to true', () => {
        const result = authReducer(authenticatedState, refreshToken.pending('', undefined));
        expect(result.isLoading).toBe(true);
      });
    });

    describe('refreshToken.fulfilled', () => {
      test('should update tokens on successful refresh', () => {
        const result = authReducer(
          authenticatedState,
          refreshToken.fulfilled(mockAuthResponse, '', undefined)
        );

        expect(result.isLoading).toBe(false);
        expect(result.token).toBe('new-jwt-token');
        expect(result.refreshToken).toBe('new-refresh-token');
      });

      test('should preserve existing user if not provided in response', () => {
        const responseWithoutUser = {
          ...mockAuthResponse,
          user: undefined,
        };

        const result = authReducer(
          authenticatedState,
          refreshToken.fulfilled(responseWithoutUser, '', undefined)
        );

        expect(result.user).toEqual({ ...mockUser, isAdmin: false });
      });
    });

    describe('refreshToken.rejected', () => {
      test('should clear auth state on failed refresh', () => {
        const result = authReducer(
          authenticatedState,
          refreshToken.rejected(null, '', undefined, 'Token expired')
        );

        expect(result.isLoading).toBe(false);
        expect(result.isAuthenticated).toBe(false);
        expect(result.user).toBeNull();
        expect(result.token).toBeNull();
        expect(result.refreshToken).toBeNull();
        expect(result.error).toBe('Token expired');
      });
    });
  });

  // ========================================================================
  // ASYNC THUNK TESTS - GET CURRENT USER
  // ========================================================================

  describe('Async Thunks - Get Current User', () => {
    describe('getCurrentUser.pending', () => {
      test('should set isLoading to true', () => {
        const result = authReducer(authenticatedState, getCurrentUser.pending('', undefined));
        expect(result.isLoading).toBe(true);
      });
    });

    describe('getCurrentUser.fulfilled', () => {
      test('should update user on success', () => {
        const newUser: UserDto = {
          id: '2',
          name: 'Updated',
          surname: 'User',
          email: 'updated@example.com',
        };

        const result = authReducer(
          authenticatedState,
          getCurrentUser.fulfilled({ ...mockAuthResponse, user: newUser }, '', undefined)
        );

        expect(result.isLoading).toBe(false);
        expect(result.user).toEqual({ ...newUser, isAdmin: false });
      });
    });

    describe('getCurrentUser.rejected', () => {
      test('should set error on failure', () => {
        const result = authReducer(
          authenticatedState,
          getCurrentUser.rejected(null, '', undefined, 'Failed to get user')
        );

        expect(result.isLoading).toBe(false);
        expect(result.error).toBe('Failed to get user');
      });

      test('should not clear authentication on failure', () => {
        const result = authReducer(
          authenticatedState,
          getCurrentUser.rejected(null, '', undefined, 'Error')
        );

        expect(result.isAuthenticated).toBe(true);
        expect(result.token).toBe('test-jwt-token');
      });
    });
  });

  // ========================================================================
  // ASYNC THUNK TESTS - INITIALIZE AUTH
  // ========================================================================

  describe('Async Thunks - Initialize Auth', () => {
    describe('initializeAuth.pending', () => {
      test('should set isLoading to true', () => {
        const result = authReducer(initialState, initializeAuth.pending('', undefined));
        expect(result.isLoading).toBe(true);
      });
    });

    describe('initializeAuth.fulfilled', () => {
      test('should set auth state when authenticated', () => {
        const authData = {
          user: mockUser,
          token: 'stored-token',
          refreshToken: 'stored-refresh-token',
          isAuthenticated: true,
        };

        const result = authReducer(
          initialState,
          initializeAuth.fulfilled(authData, '', undefined)
        );

        expect(result.isLoading).toBe(false);
        expect(result.user).toEqual({ ...mockUser, isAdmin: false });
        expect(result.token).toBe('stored-token');
        expect(result.refreshToken).toBe('stored-refresh-token');
        expect(result.isAuthenticated).toBe(true);
      });

      test('should keep initial state when not authenticated', () => {
        const authData = {
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        };

        const result = authReducer(
          initialState,
          initializeAuth.fulfilled(authData, '', undefined)
        );

        expect(result.isLoading).toBe(false);
        expect(result.user).toBeNull();
        expect(result.isAuthenticated).toBe(false);
      });
    });

    describe('initializeAuth.rejected', () => {
      test('should set isAuthenticated to false on failure', () => {
        const result = authReducer(
          initialState,
          initializeAuth.rejected(null, '', undefined)
        );

        expect(result.isLoading).toBe(false);
        expect(result.isAuthenticated).toBe(false);
      });
    });
  });

  // ========================================================================
  // ASYNC THUNK TESTS - LOGOUT ASYNC
  // ========================================================================

  describe('Async Thunks - Logout Async', () => {
    describe('logoutAsync.fulfilled', () => {
      test('should clear all auth state', () => {
        const result = authReducer(authenticatedState, logoutAsync.fulfilled(undefined, '', undefined));

        expect(result.user).toBeNull();
        expect(result.token).toBeNull();
        expect(result.refreshToken).toBeNull();
        expect(result.isAuthenticated).toBe(false);
        expect(result.error).toBeNull();
      });
    });
  });

  // ========================================================================
  // SELECTOR TESTS
  // ========================================================================

  describe('Selectors', () => {
    const mockRootState = {
      auth: authenticatedState,
    };

    test('selectUser should return user from state', () => {
      expect(selectUser(mockRootState)).toEqual({ ...mockUser, isAdmin: false });
    });

    test('selectToken should return token from state', () => {
      expect(selectToken(mockRootState)).toBe('test-jwt-token');
    });

    test('selectRefreshToken should return refresh token from state', () => {
      expect(selectRefreshToken(mockRootState)).toBe('test-refresh-token');
    });

    test('selectIsAuthenticated should return authentication status', () => {
      expect(selectIsAuthenticated(mockRootState)).toBe(true);
    });

    test('selectIsLoading should return loading status', () => {
      expect(selectIsLoading(mockRootState)).toBe(false);
    });

    test('selectError should return error from state', () => {
      const stateWithError = {
        auth: { ...authenticatedState, error: 'Test error' },
      };
      expect(selectError(stateWithError)).toBe('Test error');
    });

    test('selectAuth should return entire auth state', () => {
      expect(selectAuth(mockRootState)).toEqual(authenticatedState);
    });

    test('selectors should handle null values', () => {
      const emptyState = { auth: initialState };

      expect(selectUser(emptyState)).toBeNull();
      expect(selectToken(emptyState)).toBeNull();
      expect(selectRefreshToken(emptyState)).toBeNull();
      expect(selectIsAuthenticated(emptyState)).toBe(false);
      expect(selectError(emptyState)).toBeNull();
    });
  });
});
