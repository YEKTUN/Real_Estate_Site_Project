import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth/AuthSlice';

/**
 * Redux Store Yapılandırması
 * 
 * Bu dosya, uygulamanın merkezi state yönetimi için Redux store'unu yapılandırır.
 * Tüm slice'lar burada birleştirilir ve store oluşturulur.
 */

// Store'u oluştur
export const store = configureStore({
  reducer: {
    // Slice'lar buraya eklenir
    auth: authReducer,
  },
  // Middleware yapılandırması (varsayılan middleware'ler otomatik eklenir)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Serileştirilemez değerler için uyarıları kapat (gerekirse)
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
  // Development modunda Redux DevTools aktif
  devTools: process.env.NODE_ENV !== 'production',
});

/**
 * RootState Tipi
 * Store'un tüm state'ini temsil eder
 * useSelector hook'unda tip güvenliği için kullanılır
 */
export type RootState = ReturnType<typeof store.getState>;

/**
 * AppDispatch Tipi
 * Store'un dispatch fonksiyonunun tipini temsil eder
 * useDispatch hook'unda tip güvenliği için kullanılır
 */
export type AppDispatch = typeof store.dispatch;

