import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import {
  AuthState,
  LoginRequestDto,
  RegisterRequestDto,
  AuthResponseDto,
  UserDto,
  GoogleLoginRequestDto
} from './DTOs/AuthDTOs';
import {
  loginApi,
  registerApi,
  logoutApi,
  getCurrentUserApi,
  getUserFromStoredToken,
  checkAuthStatus,
  getStoredToken,
  getStoredRefreshToken,
  refreshTokenApi,
  googleLoginApi,
  updateProfilePictureApi,
  deactivateAccountApi,
} from '../../api/authApi';

/**
 * Auth Slice
 *
 * Kimlik doğrulama state yönetimi.
 * Login, Register, Logout, Refresh Token ve token işlemleri.
 */

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const normalizeUser = (user?: UserDto | null): UserDto | null =>
  user ? { ...user, isAdmin: user.isAdmin ?? false, isActive: user.isActive ?? true } : null;

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Login Thunk
 * Kullanıcı giriş işlemi
 */
export const login = createAsyncThunk<AuthResponseDto, LoginRequestDto>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginApi(credentials);

      if (!response.success) {
        return rejectWithValue(response.message);
      }

      return response;
    } catch {
      return rejectWithValue('Giriş işlemi başarısız oldu');
    }
  }
);

/**
 * Register Thunk
 * Kullanıcı kayıt işlemi
 */
export const register = createAsyncThunk<AuthResponseDto, RegisterRequestDto>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await registerApi(userData);

      if (!response.success) {
        return rejectWithValue(response.message);
      }

      return response;
    } catch {
      return rejectWithValue('Kayıt işlemi başarısız oldu');
    }
  }
);

/**
 * Google Login Thunk
 * Google OAuth ile giriş işlemi
 */
export const googleLogin = createAsyncThunk<AuthResponseDto, GoogleLoginRequestDto>(
  'auth/googleLogin',
  async (googleData, { rejectWithValue }) => {
    try {
      console.log('Google Login thunk çalışıyor...');
      const response = await googleLoginApi(googleData);

      if (!response.success) {
        console.log('Google Login başarısız:', response.message);
        return rejectWithValue(response.message);
      }

      console.log('Google Login başarılı:', response);
      return response;
    } catch {
      console.error('Google Login thunk hatası');
      return rejectWithValue('Google ile giriş işlemi başarısız oldu');
    }
  }
);

/**
 * Refresh Token Thunk
 * Token yenileme işlemi
 */
export const refreshToken = createAsyncThunk<AuthResponseDto, void>(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await refreshTokenApi();

      if (!response.success) {
        return rejectWithValue(response.message);
      }

      return response;
    } catch {
      return rejectWithValue('Token yenileme başarısız oldu');
    }
  }
);

/**
 * Profil fotoğrafını güncelle
 */
export const updateProfilePicture = createAsyncThunk<AuthResponseDto, string>(
  'auth/updateProfilePicture',
  async (profilePictureUrl, { rejectWithValue }) => {
    try {
      const response = await updateProfilePictureApi(profilePictureUrl);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Profil fotoğrafı güncellenemedi');
    }
  }
);

/**
 * Get Current User Thunk
 * Mevcut kullanıcı bilgilerini getir
 */
export const getCurrentUser = createAsyncThunk<AuthResponseDto, void>(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCurrentUserApi();

      if (!response.success) {
        return rejectWithValue(response.message);
      }

      return response;
    } catch {
      return rejectWithValue('Kullanıcı bilgileri alınamadı');
    }
  }
);

/**
 * Initialize Auth Thunk
 * Sayfa yüklendiğinde auth durumunu kontrol et
 */
export const initializeAuth = createAsyncThunk<
  { user: UserDto | null; token: string | null; refreshToken: string | null; isAuthenticated: boolean },
  void
>(
  'auth/initialize',
  async () => {
    // Tarayıcı tarafında token var mı ve süresi dolmamış mı?
    const isAuthenticated = checkAuthStatus();
    const token = getStoredToken();
    const refreshToken = getStoredRefreshToken();

    // Kullanıcı oturum açmış görünüyorsa backend'den /auth/me ile
    // güncel kullanıcı bilgilerini (profil fotoğrafı dahil) çek.
    // Backend bu endpoint'te JWT içindeki userId (sub / NameIdentifier)
    // claim'lerinden ilgili kullanıcıyı bulup DB'den getiriyor.
    if (isAuthenticated && token) {
      try {
        const response = await getCurrentUserApi();

        if (response.success) {
          return {
            user: response.user || null,
            token,
            refreshToken,
            isAuthenticated: true,
          };
        }

        // /auth/me başarısız olursa auth state'i sıfırla
        return {
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        };
      } catch {
        return {
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        };
      }
    }

    return {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    };
  }
);

/**
 * Logout Thunk
 * Kullanıcı çıkış işlemi
 */
export const logoutAsync = createAsyncThunk<void, void>(
  'auth/logoutAsync',
  async () => {
    await logoutApi();
  }
);

/**
 * Hesabı Sil (Pasife Al) Thunk
 */
export const deactivateAccount = createAsyncThunk<AuthResponseDto, void>(
  'auth/deactivateAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await deactivateAccountApi();
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Hesap kapatma işlemi başarısız oldu');
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Logout - Kullanıcı çıkışı (sync)
     */
    logout: (state) => {
      logoutApi();
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },

    /**
     * Error'u temizle
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * User bilgisini güncelle
     */
    setUser: (state, action: PayloadAction<UserDto | null>) => {
      state.user = action.payload;
    },

    /**
     * Token'ları güncelle
     */
    setTokens: (state, action: PayloadAction<{ token: string; refreshToken: string }>) => {
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
    },

    /**
     * State'i sıfırla
     */
    resetAuth: () => initialState,
  },
  extraReducers: (builder) => {
    // ========== LOGIN ==========
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = normalizeUser(action.payload.user);
        state.token = action.payload.token || null;
        state.refreshToken = action.payload.refreshToken || null;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // ========== REGISTER ==========
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = normalizeUser(action.payload.user);
        state.token = action.payload.token || null;
        state.refreshToken = action.payload.refreshToken || null;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // ========== GOOGLE LOGIN ==========
    builder
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = normalizeUser(action.payload.user);
        state.token = action.payload.token || null;
        state.refreshToken = action.payload.refreshToken || null;
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload as string;
      });

    // ========== REFRESH TOKEN ==========
    builder
      .addCase(refreshToken.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token || null;
        state.refreshToken = action.payload.refreshToken || null;
        state.user = normalizeUser(action.payload.user) || state.user;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.payload as string;
      });

    // ========== GET CURRENT USER ==========
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = normalizeUser(action.payload.user);
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== INITIALIZE AUTH ==========
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = normalizeUser(action.payload.user);
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = action.payload.isAuthenticated;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // ========== LOGOUT ASYNC ==========
    builder
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });

    // ========== DEACTIVATE ACCOUNT ==========
    builder
      .addCase(deactivateAccount.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deactivateAccount.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(deactivateAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== UPDATE PROFILE PICTURE ==========
    builder
      .addCase(updateProfilePicture.fulfilled, (state, action) => {
        if (action.payload.user) {
          state.user = normalizeUser(action.payload.user);
        }
      })
      .addCase(updateProfilePicture.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

// Actions
export const { logout, clearError, setUser, setTokens, resetAuth } = authSlice.actions;

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectToken = (state: RootState) => state.auth.token;
export const selectRefreshToken = (state: RootState) => state.auth.refreshToken;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectError = (state: RootState) => state.auth.error;
export const selectAuth = (state: RootState) => state.auth;

// Reducer
export default authSlice.reducer;
