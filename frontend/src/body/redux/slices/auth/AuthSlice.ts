import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import { 
  AuthState, 
  LoginRequestDto, 
  RegisterRequestDto, 
  AuthResponseDto,
  UserDto 
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
  refreshTokenApi
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
    const isAuthenticated = checkAuthStatus();
    
    if (isAuthenticated) {
      const user = getUserFromStoredToken();
      const token = getStoredToken();
      const refreshToken = getStoredRefreshToken();
      
      return {
        user,
        token,
        refreshToken,
        isAuthenticated: true
      };
    }
    
    return {
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false
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
        state.user = action.payload.user || null;
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
        state.user = action.payload.user || null;
        state.token = action.payload.token || null;
        state.refreshToken = action.payload.refreshToken || null;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
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
        state.user = action.payload.user || state.user;
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
        state.user = action.payload.user || null;
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
        state.user = action.payload.user;
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
