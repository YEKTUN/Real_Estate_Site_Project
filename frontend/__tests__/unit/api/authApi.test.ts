/**
 * AuthApi Unit Tests
 * 
 * Auth API fonksiyonlarının testleri.
 */

import {
  loginApi,
  registerApi,
  googleLoginApi,
  refreshTokenApi,
  logoutApi,
  forgetPasswordApi,
  resetPasswordApi,
  changePasswordApi,
} from '@/body/redux/api/authApi';
import axiosInstance, { saveTokens, clearTokens } from '@/body/redux/api/axiosInstance';
import { LoginRequestDto, RegisterRequestDto, GoogleLoginRequestDto } from '@/body/redux/slices/auth/DTOs/AuthDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/axiosInstance');

const mockedAxiosInstance = axiosInstance as jest.Mocked<typeof axiosInstance>;
const mockedSaveTokens = saveTokens as jest.MockedFunction<typeof saveTokens>;
const mockedClearTokens = clearTokens as jest.MockedFunction<typeof clearTokens>;
const mockedGetRefreshToken = require('@/body/redux/api/axiosInstance').getRefreshToken as jest.MockedFunction<any>;

// ============================================================================
// TEST DATA
// ============================================================================

const mockLoginDto: LoginRequestDto = {
  emailOrUsername: 'test@example.com',
  password: 'Test123!@#',
};

const mockRegisterDto: RegisterRequestDto = {
  name: 'Test',
  surname: 'User',
  email: 'test@example.com',
  phone: '5551234567',
  password: 'Test123!@#',
  confirmPassword: 'Test123!@#',
};

const mockGoogleLoginDto: GoogleLoginRequestDto = {
  idToken: 'mock-google-id-token',
};

const mockAuthResponse = {
  success: true,
  message: 'İşlem başarılı',
  token: 'mock-jwt-token',
  refreshToken: 'mock-refresh-token',
  expiresIn: 3600,
  user: {
    id: 'user-123',
    name: 'Test',
    surname: 'User',
    email: 'test@example.com',
    phone: '5551234567',
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe('AuthApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loginApi', () => {
    it('should login successfully and save tokens', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockAuthResponse,
      } as any);

      const result = await loginApi(mockLoginDto);

      expect(result.success).toBe(true);
      expect(result.token).toBe('mock-jwt-token');
      expect(mockedSaveTokens).toHaveBeenCalledWith('mock-jwt-token', 'mock-refresh-token');
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/auth/login', mockLoginDto);
    });

    it('should handle login error', async () => {
      const errorResponse = {
        response: {
          data: {
            success: false,
            message: 'Geçersiz kullanıcı adı veya şifre',
          },
        },
      };

      mockedAxiosInstance.post.mockRejectedValueOnce(errorResponse);

      const result = await loginApi(mockLoginDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Geçersiz kullanıcı adı veya şifre');
    });
  });

  describe('registerApi', () => {
    it('should register successfully and save tokens', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockAuthResponse,
      } as any);

      const result = await registerApi(mockRegisterDto);

      expect(result.success).toBe(true);
      expect(mockedSaveTokens).toHaveBeenCalledWith('mock-jwt-token', 'mock-refresh-token');
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/auth/register', mockRegisterDto);
    });

    it('should handle register error', async () => {
      const errorResponse = {
        response: {
          data: {
            success: false,
            message: 'Email zaten kullanılıyor',
          },
        },
      };

      mockedAxiosInstance.post.mockRejectedValueOnce(errorResponse);

      const result = await registerApi(mockRegisterDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email zaten kullanılıyor');
    });
  });

  describe('googleLoginApi', () => {
    it('should login with Google successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockAuthResponse,
      } as any);

      const result = await googleLoginApi(mockGoogleLoginDto);

      expect(result.success).toBe(true);
      expect(mockedSaveTokens).toHaveBeenCalledWith('mock-jwt-token', 'mock-refresh-token');
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/auth/google', mockGoogleLoginDto);
    });
  });

  describe('refreshTokenApi', () => {
    it('should refresh token successfully', async () => {
      mockedGetRefreshToken.mockReturnValueOnce('old-refresh-token');
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockAuthResponse,
      } as any);

      const result = await refreshTokenApi();

      expect(result.success).toBe(true);
      expect(mockedSaveTokens).toHaveBeenCalledWith('mock-jwt-token', 'mock-refresh-token');
    });
  });

  describe('logoutApi', () => {
    it('should logout successfully and clear tokens', async () => {
      mockedGetRefreshToken.mockReturnValueOnce('old-refresh-token');
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: { success: true, message: 'Çıkış başarılı' },
      } as any);

      await logoutApi();

      expect(mockedClearTokens).toHaveBeenCalled();
    });
  });

  describe('forgetPasswordApi', () => {
    it('should send password reset email successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: { success: true, message: 'Email gönderildi' },
      } as any);

      const result = await forgetPasswordApi('test@example.com');

      expect(result.success).toBe(true);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/auth/forget-password', {
        email: 'test@example.com',
      });
    });
  });

  describe('resetPasswordApi', () => {
    it('should reset password successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: { success: true, message: 'Şifre sıfırlandı' },
      } as any);

      const result = await resetPasswordApi('token', 'test@example.com', 'NewPass123!', 'NewPass123!');

      expect(result.success).toBe(true);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'token',
        email: 'test@example.com',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });
    });
  });

  describe('changePasswordApi', () => {
    it('should change password successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: { success: true, message: 'Şifre değiştirildi' },
      } as any);

      const result = await changePasswordApi('OldPass123!', 'NewPass123!', 'NewPass123!');

      expect(result.success).toBe(true);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/auth/change-password', {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!',
      });
    });
  });
});

