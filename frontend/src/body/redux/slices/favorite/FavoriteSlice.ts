import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import {
  FavoriteState,
  AddFavoriteDto,
  UpdateFavoriteNoteDto,
  FavoriteResponseDto,
  FavoriteListResponseDto,
  FavoriteListingDto,
} from './DTOs/FavoriteDTOs';
import {
  getMyFavoritesApi,
  addToFavoritesApi,
  removeFromFavoritesApi,
  toggleFavoriteApi,
  updateFavoriteNoteApi,
  checkFavoriteApi,
} from '../../api/favoriteApi';

/**
 * Favorite Slice
 * 
 * Favori state yönetimi.
 * Ekleme, kaldırma, toggle ve listeleme işlemleri.
 */

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: FavoriteState = {
  favorites: [],
  favoriteIds: [],
  pagination: null,
  isLoading: false,
  isToggling: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * Kullanıcının favorilerini getir
 */
export const fetchMyFavorites = createAsyncThunk<
  FavoriteListResponseDto,
  { page?: number; pageSize?: number } | void
>(
  'favorite/fetchMine',
  async (params, { rejectWithValue }) => {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const response = await getMyFavoritesApi(page, pageSize);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Favorileriniz yüklenirken bir hata oluştu');
    }
  }
);

/**
 * Favorilere ekle
 */
export const addToFavorites = createAsyncThunk<
  { listingId: number; response: FavoriteResponseDto },
  { listingId: number; data?: AddFavoriteDto }
>(
  'favorite/add',
  async ({ listingId, data }, { rejectWithValue }) => {
    try {
      const response = await addToFavoritesApi(listingId, data);
      if (!response.success && !response.isFavorited) {
        return rejectWithValue(response.message);
      }
      return { listingId, response };
    } catch {
      return rejectWithValue('Favori eklenirken bir hata oluştu');
    }
  }
);

/**
 * Favorilerden kaldır
 */
export const removeFromFavorites = createAsyncThunk<
  { listingId: number; response: FavoriteResponseDto },
  number
>(
  'favorite/remove',
  async (listingId, { rejectWithValue }) => {
    try {
      const response = await removeFromFavoritesApi(listingId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return { listingId, response };
    } catch {
      return rejectWithValue('Favori kaldırılırken bir hata oluştu');
    }
  }
);

/**
 * Favori toggle (varsa kaldır, yoksa ekle)
 */
export const toggleFavorite = createAsyncThunk<
  { listingId: number; response: FavoriteResponseDto },
  number
>(
  'favorite/toggle',
  async (listingId, { rejectWithValue }) => {
    try {
      const response = await toggleFavoriteApi(listingId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return { listingId, response };
    } catch {
      return rejectWithValue('Favori işlemi sırasında bir hata oluştu');
    }
  }
);

/**
 * Favori notunu güncelle
 */
export const updateFavoriteNote = createAsyncThunk<
  { listingId: number; note: string | undefined },
  { listingId: number; data: UpdateFavoriteNoteDto }
>(
  'favorite/updateNote',
  async ({ listingId, data }, { rejectWithValue }) => {
    try {
      const response = await updateFavoriteNoteApi(listingId, data);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return { listingId, note: data.note };
    } catch {
      return rejectWithValue('Favori notu güncellenirken bir hata oluştu');
    }
  }
);

/**
 * İlan favori mi kontrol et
 */
export const checkFavorite = createAsyncThunk<
  { listingId: number; isFavorited: boolean },
  number
>(
  'favorite/check',
  async (listingId, { rejectWithValue }) => {
    try {
      const response = await checkFavoriteApi(listingId);
      return { listingId, isFavorited: response.isFavorited };
    } catch {
      return rejectWithValue('Favori durumu kontrol edilirken bir hata oluştu');
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

export const favoriteSlice = createSlice({
  name: 'favorite',
  initialState,
  reducers: {
    // Error'u temizle
    clearError: (state) => {
      state.error = null;
    },

    // Favorileri temizle
    clearFavorites: (state) => {
      state.favorites = [];
      state.favoriteIds = [];
      state.pagination = null;
    },

    // State'i sıfırla
    resetFavoriteState: () => initialState,
  },
  extraReducers: (builder) => {
    // ========== FETCH MY FAVORITES ==========
    builder
      .addCase(fetchMyFavorites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyFavorites.fulfilled, (state, action) => {
        state.isLoading = false;
        state.favorites = action.payload.favorites;
        state.favoriteIds = action.payload.favorites.map(f => f.listingId);
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyFavorites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== ADD TO FAVORITES ==========
    builder
      .addCase(addToFavorites.pending, (state) => {
        state.isToggling = true;
        state.error = null;
      })
      .addCase(addToFavorites.fulfilled, (state, action) => {
        state.isToggling = false;
        const { listingId } = action.payload;

        if (!state.favoriteIds.includes(listingId)) {
          state.favoriteIds.push(listingId);
        }
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.isToggling = false;
        state.error = action.payload as string;
      });

    // ========== REMOVE FROM FAVORITES ==========
    builder
      .addCase(removeFromFavorites.pending, (state) => {
        state.isToggling = true;
        state.error = null;
      })
      .addCase(removeFromFavorites.fulfilled, (state, action) => {
        state.isToggling = false;
        const { listingId } = action.payload;

        state.favoriteIds = state.favoriteIds.filter(id => id !== listingId);
        state.favorites = state.favorites.filter(f => f.listingId !== listingId);

        if (state.pagination && state.pagination.totalCount > 0) {
          state.pagination.totalCount -= 1;
        }
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        state.isToggling = false;
        state.error = action.payload as string;
      });

    // ========== TOGGLE FAVORITE ==========
    builder
      .addCase(toggleFavorite.pending, (state) => {
        state.isToggling = true;
        state.error = null;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        state.isToggling = false;
        const { listingId, response } = action.payload;

        if (response.isFavorited) {
          if (!state.favoriteIds.includes(listingId)) {
            state.favoriteIds.push(listingId);
          }
        } else {
          state.favoriteIds = state.favoriteIds.filter(id => id !== listingId);
          state.favorites = state.favorites.filter(f => f.listingId !== listingId);

          if (state.pagination && state.pagination.totalCount > 0) {
            state.pagination.totalCount -= 1;
          }
        }
      })
      .addCase(toggleFavorite.rejected, (state, action) => {
        state.isToggling = false;
        state.error = action.payload as string;
      });

    // ========== UPDATE FAVORITE NOTE ==========
    builder
      .addCase(updateFavoriteNote.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateFavoriteNote.fulfilled, (state, action) => {
        state.isLoading = false;
        const { listingId, note } = action.payload;

        const favoriteIndex = state.favorites.findIndex(f => f.listingId === listingId);
        if (favoriteIndex !== -1) {
          state.favorites[favoriteIndex].note = note;
        }
      })
      .addCase(updateFavoriteNote.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== CHECK FAVORITE ==========
    builder
      .addCase(checkFavorite.fulfilled, (state, action) => {
        const { listingId, isFavorited } = action.payload;

        if (isFavorited && !state.favoriteIds.includes(listingId)) {
          state.favoriteIds.push(listingId);
        } else if (!isFavorited) {
          state.favoriteIds = state.favoriteIds.filter(id => id !== listingId);
        }
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

// Actions
export const { clearError, clearFavorites, resetFavoriteState } = favoriteSlice.actions;

// Selectors
export const selectFavorites = (state: RootState) => state.favorite.favorites;
export const selectFavoriteIds = (state: RootState) => state.favorite.favoriteIds;
export const selectIsFavorited = (listingId: number) => (state: RootState) =>
  state.favorite.favoriteIds.includes(listingId);
export const selectFavoritePagination = (state: RootState) => state.favorite.pagination;
export const selectFavoriteLoading = (state: RootState) => state.favorite.isLoading;
export const selectFavoriteToggling = (state: RootState) => state.favorite.isToggling;
export const selectFavoriteError = (state: RootState) => state.favorite.error;

// Reducer
export default favoriteSlice.reducer;
