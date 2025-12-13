import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth/AuthSlice';
import listingReducer from './slices/listing/ListingSlice';
import commentReducer from './slices/comment/CommentSlice';
import favoriteReducer from './slices/favorite/FavoriteSlice';
import cloudinaryReducer from './slices/cloudinary/CloudinarySlice';

/**
 * Redux Store Yapılandırması
 * 
 * Bu dosya, uygulamanın merkezi state yönetimi için Redux store'unu yapılandırır.
 * Tüm slice'lar burada birleştirilir ve store oluşturulur.
 * 
 * Mevcut Slice'lar:
 * - auth: Kimlik doğrulama (login, register, logout)
 * - listing: İlan işlemleri (CRUD, arama, listeleme)
 * - comment: Yorum işlemleri (CRUD)
 * - favorite: Favori işlemleri (ekleme, kaldırma, toggle)
 * - cloudinary: Görsel yükleme ve yönetim (Cloudinary entegrasyonu)
 */

// Store'u oluştur
export const store = configureStore({
  reducer: {
    // Auth Slice - Kimlik doğrulama
    auth: authReducer,
    
    // Listing Slice - İlan işlemleri
    listing: listingReducer,
    
    // Comment Slice - Yorum işlemleri
    comment: commentReducer,
    
    // Favorite Slice - Favori işlemleri
    favorite: favoriteReducer,
    
    // Cloudinary Slice - Görsel yükleme ve yönetim
    cloudinary: cloudinaryReducer,
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

