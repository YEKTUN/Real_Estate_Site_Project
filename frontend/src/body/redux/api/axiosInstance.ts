import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

/**
 * Axios Instance
 * 
 * API istekleri için yapılandırılmış axios instance.
 * JWT token yönetimi, Refresh Token ve interceptor'lar içerir.
 */

// API base URL - environment variable'dan alınır
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5202/api';

/**
 * Axios Instance oluştur
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 saniye (email gönderme işlemleri için yeterli süre)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token yenileme işlemi devam ediyor mu?
let isRefreshing = false;
// Bekleyen istekler kuyruğu
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

/**
 * Bekleyen istekleri işle
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Access Token'ı localStorage'dan al
 */
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * Access Token'ı localStorage'a kaydet
 */
export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

/**
 * Access Token'ı localStorage'dan sil
 */
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

/**
 * Refresh Token'ı localStorage'dan al
 */
export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('refreshToken');
  }
  return null;
};

/**
 * Refresh Token'ı localStorage'a kaydet
 */
export const setRefreshToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('refreshToken', token);
  }
};

/**
 * Refresh Token'ı localStorage'dan sil
 */
export const removeRefreshToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('refreshToken');
  }
};

/**
 * Tüm token'ları sil
 */
export const clearTokens = (): void => {
  removeToken();
  removeRefreshToken();
};

/**
 * Tüm token'ları kaydet
 */
export const saveTokens = (accessToken: string, refreshToken: string): void => {
  setToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * Access Token'ın geçerli olup olmadığını kontrol et
 */
export const isTokenValid = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000;
    // 30 saniye buffer ekle
    return Date.now() < (expirationTime - 30000);
  } catch {
    return false;
  }
};

/**
 * Token'dan kullanıcı bilgilerini al
 * 
 * NOT: Backend tarafında JWT içine "picture" claim'i olarak profil fotoğrafı URL'i
 * eklendi. Burada bu alanı da okuyarak frontend'de initial state oluştururken
 * profil fotoğrafının kaybolmamasını sağlıyoruz.
 */
export const getUserFromToken = (): { id: string; name: string; surname: string; email: string; profilePictureUrl?: string } | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      name: payload.given_name || '',
      surname: payload.family_name || '',
      email: payload.email,
      // Backend'deki custom "picture" claim'i
      profilePictureUrl: payload.picture || undefined,
    };
  } catch {
    return null;
  }
};

// ============================================================================
// TOKEN REFRESH
// ============================================================================

/**
 * Token yenileme fonksiyonu
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    return null;
  }

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: refreshToken
    });

    if (response.data.success && response.data.token) {
      saveTokens(response.data.token, response.data.refreshToken);
      return response.data.token;
    }
    
    return null;
  } catch {
    clearTokens();
    return null;
  }
};

// ============================================================================
// REQUEST INTERCEPTOR
// ============================================================================

/**
 * Request Interceptor
 * Her istekte Authorization header'ına token ekler
 */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================================================
// RESPONSE INTERCEPTOR
// ============================================================================

/**
 * Response Interceptor
 * 401 hatalarında token yenileme işlemi yapar
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 401 Unauthorized ve henüz retry yapılmamışsa
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Refresh token endpoint'i için retry yapma
      if (originalRequest.url?.includes('/auth/refresh')) {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      // Zaten yenileme işlemi devam ediyorsa kuyruğa ekle
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          processQueue(null, newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return axiosInstance(originalRequest);
        } else {
          processQueue(new Error('Token yenilenemedi'), null);
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
