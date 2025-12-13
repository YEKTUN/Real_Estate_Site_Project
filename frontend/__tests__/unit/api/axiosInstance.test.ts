/**
 * AxiosInstance Unit Tests
 * 
 * Axios instance ve token yönetimi testleri.
 */

import axiosInstance, {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  clearTokens,
  saveTokens,
  isTokenValid,
  getUserFromToken,
  refreshAccessToken,
} from '@/body/redux/api/axiosInstance';
import axios from 'axios';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// ============================================================================
// TEST DATA
// ============================================================================

// Mock JWT token (expires in 1 hour)
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE5MTYyMzkwMjJ9.test-signature';
const mockExpiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.test-signature';
const mockRefreshToken = 'mock-refresh-token';

// ============================================================================
// TESTS
// ============================================================================

describe('AxiosInstance Token Management', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Token Operations', () => {
    test('getToken should return null when no token exists', () => {
      expect(getToken()).toBeNull();
    });

    test('setToken should store token in localStorage', () => {
      setToken(mockToken);
      expect(localStorage.getItem('token')).toBe(mockToken);
    });

    test('getToken should return stored token', () => {
      setToken(mockToken);
      expect(getToken()).toBe(mockToken);
    });

    test('removeToken should remove token from localStorage', () => {
      setToken(mockToken);
      removeToken();
      expect(localStorage.getItem('token')).toBeNull();
    });

    test('getRefreshToken should return null when no refresh token exists', () => {
      expect(getRefreshToken()).toBeNull();
    });

    test('setRefreshToken should store refresh token in localStorage', () => {
      setRefreshToken(mockRefreshToken);
      expect(localStorage.getItem('refreshToken')).toBe(mockRefreshToken);
    });

    test('getRefreshToken should return stored refresh token', () => {
      setRefreshToken(mockRefreshToken);
      expect(getRefreshToken()).toBe(mockRefreshToken);
    });

    test('removeRefreshToken should remove refresh token from localStorage', () => {
      setRefreshToken(mockRefreshToken);
      removeRefreshToken();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    test('clearTokens should remove both tokens', () => {
      setToken(mockToken);
      setRefreshToken(mockRefreshToken);
      clearTokens();
      
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    test('saveTokens should store both tokens', () => {
      saveTokens(mockToken, mockRefreshToken);
      
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('refreshToken')).toBe(mockRefreshToken);
    });
  });

  describe('Token Validation', () => {
    test('isTokenValid should return false when no token exists', () => {
      expect(isTokenValid()).toBe(false);
    });

    test('isTokenValid should return true for valid token', () => {
      // Create a token that expires in the future
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const validTokenPayload = btoa(JSON.stringify({
        sub: '123',
        exp: futureExp,
      }));
      const validToken = `header.${validTokenPayload}.signature`;
      
      setToken(validToken);
      expect(isTokenValid()).toBe(true);
    });

    test('isTokenValid should return false for expired token', () => {
      // Create a token that expired in the past
      const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredTokenPayload = btoa(JSON.stringify({
        sub: '123',
        exp: pastExp,
      }));
      const expiredToken = `header.${expiredTokenPayload}.signature`;
      
      setToken(expiredToken);
      expect(isTokenValid()).toBe(false);
    });

    test('isTokenValid should return false for invalid token format', () => {
      setToken('invalid-token');
      expect(isTokenValid()).toBe(false);
    });
  });

  describe('getUserFromToken', () => {
    test('should return null when no token exists', () => {
      expect(getUserFromToken()).toBeNull();
    });

    test('should return user info from valid token', () => {
      const userPayload = {
        sub: 'user123',
        given_name: 'John',
        family_name: 'Doe',
        email: 'john@example.com',
      };
      const tokenPayload = btoa(JSON.stringify(userPayload));
      const token = `header.${tokenPayload}.signature`;
      
      setToken(token);
      const user = getUserFromToken();
      
      expect(user).toEqual({
        id: 'user123',
        name: 'John',
        surname: 'Doe',
        email: 'john@example.com',
      });
    });

    test('should return null for invalid token format', () => {
      setToken('invalid-token');
      expect(getUserFromToken()).toBeNull();
    });
  });

  describe('refreshAccessToken', () => {
    test('should return null when no refresh token exists', async () => {
      const result = await refreshAccessToken();
      expect(result).toBeNull();
    });

    test('should refresh token successfully', async () => {
      setRefreshToken(mockRefreshToken);
      
      const newToken = 'new-access-token';
      const newRefreshToken = 'new-refresh-token';
      
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: true,
          token: newToken,
          refreshToken: newRefreshToken,
        },
      });

      const result = await refreshAccessToken();
      
      expect(result).toBe(newToken);
      expect(localStorage.getItem('token')).toBe(newToken);
      expect(localStorage.getItem('refreshToken')).toBe(newRefreshToken);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        { refreshToken: mockRefreshToken }
      );
    });

    test('should clear tokens when refresh fails', async () => {
      setRefreshToken(mockRefreshToken);
      setToken(mockToken);
      
      mockedAxios.post.mockRejectedValueOnce(new Error('Refresh failed'));

      const result = await refreshAccessToken();
      
      expect(result).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    test('should clear tokens when refresh response is unsuccessful', async () => {
      setRefreshToken(mockRefreshToken);
      setToken(mockToken);
      
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          success: false,
        },
      });

      const result = await refreshAccessToken();
      
      expect(result).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });
});

