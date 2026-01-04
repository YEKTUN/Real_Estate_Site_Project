import axiosInstance, {
  saveTokens,
  clearTokens,
  getToken,
  getRefreshToken,
  getUserFromToken,
  isTokenValid
} from './axiosInstance';
import {
  LoginRequestDto,
  RegisterRequestDto,
  AuthResponseDto,
  UserDto,
  GoogleLoginRequestDto
} from '../slices/auth/DTOs/AuthDTOs';

/**
 * Auth API
 * 
 * Kimlik doğrulama işlemleri için API fonksiyonları.
 * Login, Register, Refresh Token, Logout ve token yönetimi.
 */

// ============================================================================
// AUTH API FUNCTIONS
// ============================================================================

/**
 * Kullanıcı Girişi
 * @param credentials - Login bilgileri (email ve şifre)
 * @returns Auth yanıtı (token, refreshToken ve kullanıcı bilgileri)
 */
export const loginApi = async (credentials: LoginRequestDto): Promise<AuthResponseDto> => {
  console.log('loginApi çağrıldı:', credentials.emailOrUsername);
  try {
    const response = await axiosInstance.post<AuthResponseDto>('/auth/login', credentials);
    console.log('Login API yanıtı:', response.data);

    // Başarılı giriş - token'ları kaydet
    if (response.data.success && response.data.token && response.data.refreshToken) {
      saveTokens(response.data.token, response.data.refreshToken);
    }

    return response.data;
  } catch (error: unknown) {
    console.error('Login API hatası:', error);
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }

    return {
      success: false,
      message: 'Giriş işlemi sırasında bir hata oluştu'
    };
  }
};

/**
 * Kullanıcı Kaydı
 * @param userData - Kayıt bilgileri
 * @returns Auth yanıtı (token, refreshToken ve kullanıcı bilgileri)
 */
export const registerApi = async (userData: RegisterRequestDto): Promise<AuthResponseDto> => {
  console.log('registerApi çağrıldı:', userData.email);
  try {
    const response = await axiosInstance.post<AuthResponseDto>('/auth/register', userData);
    console.log('Register API yanıtı:', response.data);

    // Başarılı kayıt - token'ları kaydet
    if (response.data.success && response.data.token && response.data.refreshToken) {
      saveTokens(response.data.token, response.data.refreshToken);
    }

    return response.data;
  } catch (error: unknown) {
    console.error('Register API hatası:', error);
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }

    return {
      success: false,
      message: 'Kayıt işlemi sırasında bir hata oluştu'
    };
  }
};

/**
 * Google ile Giriş
 * @param googleData - Google ID Token
 * @returns Auth yanıtı (token, refreshToken ve kullanıcı bilgileri)
 */
export const googleLoginApi = async (googleData: GoogleLoginRequestDto): Promise<AuthResponseDto> => {
  console.log('googleLoginApi çağrıldı');
  try {
    const response = await axiosInstance.post<AuthResponseDto>('/auth/google', googleData);
    console.log('Google Login API yanıtı:', response.data);

    // Başarılı giriş - token'ları kaydet
    if (response.data.success && response.data.token && response.data.refreshToken) {
      saveTokens(response.data.token, response.data.refreshToken);
    }

    return response.data;
  } catch (error: unknown) {
    console.error('Google Login API hatası:', error);
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }

    return {
      success: false,
      message: 'Google ile giriş işlemi sırasında bir hata oluştu'
    };
  }
};

/**
 * Token Yenileme
 * @returns Yeni token'lar
 */
export const refreshTokenApi = async (): Promise<AuthResponseDto> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    return {
      success: false,
      message: 'Refresh token bulunamadı'
    };
  }

  try {
    const response = await axiosInstance.post<AuthResponseDto>('/auth/refresh', {
      refreshToken
    });

    if (response.data.success && response.data.token && response.data.refreshToken) {
      saveTokens(response.data.token, response.data.refreshToken);
    }

    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }

    return {
      success: false,
      message: 'Token yenileme sırasında bir hata oluştu'
    };
  }
};

/**
 * Kullanıcı Çıkışı
 * Token'ları temizler ve backend'e logout isteği gönderir
 */
export const logoutApi = async (): Promise<void> => {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      await axiosInstance.post('/auth/logout', { refreshToken });
    } catch {
      // Logout hatası olsa bile token'ları temizle
      console.warn('Logout API hatası, token\'lar temizleniyor');
    }
  }

  clearTokens();
};

/**
 * Mevcut Kullanıcı Bilgilerini Getir
 * @returns Kullanıcı bilgileri
 */
export const getCurrentUserApi = async (): Promise<AuthResponseDto> => {
  try {
    const response = await axiosInstance.get<AuthResponseDto>('/auth/me');
    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }

    return {
      success: false,
      message: 'Kullanıcı bilgileri alınamadı'
    };
  }
};

/**
 * Kullanıcı ID'sine göre kullanıcı bilgilerini getir
 * 
 * Profil sayfalarında başka bir kullanıcının temel profil bilgilerini
 * göstermek için kullanılır.
 */
export const getUserByIdApi = async (userId: string): Promise<AuthResponseDto> => {
  try {
    const response = await axiosInstance.get<AuthResponseDto>(`/auth/user/${userId}`);
    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }

    return {
      success: false,
      message: 'Kullanıcı bilgileri alınamadı',
    };
  }
};

/**
 * Profil fotoğrafını güncelle
 */
export const updateProfilePictureApi = async (profilePictureUrl: string): Promise<AuthResponseDto> => {
  try {
    const response = await axiosInstance.put<AuthResponseDto>(
      '/auth/profile-picture',
      JSON.stringify(profilePictureUrl),
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error: unknown) {
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }
    return {
      success: false,
      message: 'Profil fotoğrafı güncellenemedi'
    };
  }
};

/**
 * Token'dan kullanıcı bilgilerini al (API çağrısı yapmadan)
 * @returns Kullanıcı bilgileri veya null
 */
export const getUserFromStoredToken = (): UserDto | null => {
  if (!isTokenValid()) {
    return null;
  }

  const userData = getUserFromToken();
  if (!userData) return null;

  return {
    id: userData.id,
    name: userData.name,
    surname: userData.surname,
    email: userData.email,
    profilePictureUrl: userData.profilePictureUrl,
    isAdmin: userData.isAdmin ?? false,
    isActive: userData.isActive ?? true,
    phoneVerified: userData.phoneVerified ?? false,
  };
};

/**
 * Oturum durumunu kontrol et
 * @returns Oturum açık mı?
 */
export const checkAuthStatus = (): boolean => {
  return isTokenValid() || !!getRefreshToken();
};

/**
 * Mevcut access token'ı al
 * @returns Token veya null
 */
export const getStoredToken = (): string | null => {
  return getToken();
};

/**
 * Mevcut refresh token'ı al
 * @returns Refresh token veya null
 */
export const getStoredRefreshToken = (): string | null => {
  return getRefreshToken();
};

/**
 * Şifre sıfırlama isteği - Email'e token gönderir
 * @param email - Email adresi
 * @returns İşlem sonucu
 */
export const forgetPasswordApi = async (email: string): Promise<AuthResponseDto> => {
  console.log('forgetPasswordApi çağrıldı:', email);
  try {
    const response = await axiosInstance.post<AuthResponseDto>('/auth/forget-password', { email });
    console.log('Forget Password API yanıtı:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Forget Password API hatası:', error);
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }

    return {
      success: false,
      message: 'Şifre sıfırlama isteği sırasında bir hata oluştu'
    };
  }
};

/**
 * Şifre sıfırlama - Token ile yeni şifre belirleme
 * @param token - Şifre sıfırlama token'ı
 * @param email - Email adresi
 * @param newPassword - Yeni şifre
 * @param confirmPassword - Yeni şifre tekrarı
 * @returns İşlem sonucu
 */
export const resetPasswordApi = async (
  token: string,
  email: string,
  newPassword: string,
  confirmPassword: string
): Promise<AuthResponseDto> => {
  console.log('resetPasswordApi çağrıldı:', email);
  try {
    const response = await axiosInstance.post<AuthResponseDto>('/auth/reset-password', {
      token,
      email,
      newPassword,
      confirmPassword
    });
    console.log('Reset Password API yanıtı:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Reset Password API hatası:', error);
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }

    return {
      success: false,
      message: 'Şifre sıfırlama işlemi sırasında bir hata oluştu'
    };
  }
};

/**
 * Şifre değiştirme - Mevcut şifre ile yeni şifre belirleme
 * @param currentPassword - Mevcut şifre
 * @param newPassword - Yeni şifre
 * @param confirmPassword - Yeni şifre tekrarı
 * @returns İşlem sonucu
 */
export const changePasswordApi = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): Promise<AuthResponseDto> => {
  console.log('changePasswordApi çağrıldı');
  try {
    const response = await axiosInstance.post<AuthResponseDto>('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmPassword
    });
    console.log('Change Password API yanıtı:', response.data);
    return response.data;
  } catch (error: unknown) {
    console.error('Change Password API hatası:', error);
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }

    return {
      success: false,
      message: 'Şifre değiştirme işlemi sırasında bir hata oluştu'
    };
  }
};

/**
 * Hesabı Pasife Al (Hesap Silme)
 * @returns İşlem sonucu
 */
export const deactivateAccountApi = async (): Promise<AuthResponseDto> => {
  console.log('deactivateAccountApi çağrıldı');
  try {
    const response = await axiosInstance.post<AuthResponseDto>('/auth/deactivate');
    console.log('Deactivate Account API yanıtı:', response.data);

    // Hesap pasife alındığında token'ları temizle
    if (response.data.success) {
      clearTokens();
    }

    return response.data;
  } catch (error: unknown) {
    console.error('Deactivate Account API hatası:', error);
    if (isAxiosError(error) && error.response?.data) {
      return error.response.data as AuthResponseDto;
    }

    return {
      success: false,
      message: 'Hesap kapatma işlemi sırasında bir hata oluştu'
    };
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Axios error type guard
 */
interface AxiosErrorWithResponse {
  response?: {
    data: unknown;
    status: number;
  };
}

const isAxiosError = (error: unknown): error is AxiosErrorWithResponse => {
  return typeof error === 'object' && error !== null && 'response' in error;
};
