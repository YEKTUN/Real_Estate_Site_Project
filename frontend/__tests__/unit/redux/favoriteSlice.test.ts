/**
 * FavoriteSlice Unit Tests
 * 
 * Redux favorite slice'ının tüm reducer, action ve async thunk'larını test eder.
 */

import favoriteReducer, {
  clearError,
  clearFavorites,
  fetchMyFavorites,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  updateFavoriteNote,
  checkFavorite,
  selectFavorites,
  selectFavoriteIds,
  selectFavoritePagination,
  selectFavoriteLoading,
  selectFavoriteToggling,
  selectFavoriteError,
} from '@/body/redux/slices/favorite/FavoriteSlice';
import { FavoriteState, FavoriteListingDto } from '@/body/redux/slices/favorite/DTOs/FavoriteDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/favoriteApi', () => ({
  getMyFavoritesApi: jest.fn(),
  addToFavoritesApi: jest.fn(),
  removeFromFavoritesApi: jest.fn(),
  toggleFavoriteApi: jest.fn(),
  updateFavoriteNoteApi: jest.fn(),
  checkFavoriteApi: jest.fn(),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const initialState: FavoriteState = {
  favorites: [],
  favoriteIds: [],
  pagination: null,
  isLoading: false,
  isToggling: false,
  error: null,
};

const mockFavoriteListing: FavoriteListingDto = {
  id: 1,
  listingId: 1,
  note: 'Test note',
  createdAt: new Date().toISOString(),
  listing: {
    id: 1,
    listingNumber: '123456789',
    title: 'Test İlan',
    price: 1000000,
    coverImageUrl: 'https://example.com/image.jpg',
  } as any,
};

const mockFavoriteResponse = {
  success: true,
  message: 'İşlem başarılı',
  favorite: mockFavoriteListing,
  isFavorited: true,
};

const mockFavoriteListResponse = {
  success: true,
  message: 'İşlem başarılı',
  favorites: [mockFavoriteListing],
  pagination: {
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    totalCount: 1,
    hasPrevious: false,
    hasNext: false,
  },
};

// ============================================================================
// REDUCER TESTS
// ============================================================================

describe('FavoriteSlice', () => {
  describe('Initial State', () => {
    test('should return initial state when passed an empty action', () => {
      const result = favoriteReducer(undefined, { type: '' });
      expect(result).toEqual(initialState);
    });
  });

  describe('Sync Reducers', () => {
    test('clearError should clear error', () => {
      const stateWithError: FavoriteState = {
        ...initialState,
        error: 'Some error',
      };

      const result = favoriteReducer(stateWithError, clearError());
      expect(result.error).toBeNull();
    });

    test('clearFavorites should clear all favorites', () => {
      const stateWithFavorites: FavoriteState = {
        ...initialState,
        favorites: [mockFavoriteListing],
        favoriteIds: [1],
      };

      const result = favoriteReducer(stateWithFavorites, clearFavorites());
      expect(result.favorites).toEqual([]);
      expect(result.favoriteIds).toEqual([]);
    });
  });

  describe('Async Thunks - fetchMyFavorites', () => {
    test('should handle pending state', () => {
      const action = fetchMyFavorites.pending('', undefined);
      const result = favoriteReducer(initialState, action);

      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle fulfilled state', () => {
      const action = fetchMyFavorites.fulfilled(mockFavoriteListResponse, '', undefined);
      const result = favoriteReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.favorites).toEqual(mockFavoriteListResponse.favorites);
      expect(result.favoriteIds).toEqual([1]);
      expect(result.pagination).toEqual(mockFavoriteListResponse.pagination);
    });

    test('should handle rejected state', () => {
      // rejectedWithValue senaryosunu simüle et: payload doğrudan hata mesajı
      const action = fetchMyFavorites.rejected('Test error' as any, '', undefined);
      const result = favoriteReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('Async Thunks - addToFavorites', () => {
    test('should handle pending state', () => {
      const action = addToFavorites.pending('', { listingId: 1 });
      const result = favoriteReducer(initialState, action);

      expect(result.isToggling).toBe(true);
    });

    test('should handle fulfilled state', () => {
      const action = addToFavorites.fulfilled(
        { listingId: 1, response: mockFavoriteResponse },
        '',
        { listingId: 1 }
      );
      const result = favoriteReducer(initialState, action);

      expect(result.isToggling).toBe(false);
      expect(result.favoriteIds).toContain(1);
    });
  });

  describe('Async Thunks - removeFromFavorites', () => {
    test('should handle pending state', () => {
      const action = removeFromFavorites.pending('', 1);
      const result = favoriteReducer(initialState, action);

      expect(result.isToggling).toBe(true);
    });

    test('should handle fulfilled state and remove favorite', () => {
      const stateWithFavorite: FavoriteState = {
        ...initialState,
        favoriteIds: [1],
        favorites: [mockFavoriteListing],
      };

      const action = removeFromFavorites.fulfilled(
        { listingId: 1, response: mockFavoriteResponse },
        '',
        1
      );
      const result = favoriteReducer(stateWithFavorite, action);

      expect(result.isToggling).toBe(false);
      expect(result.favoriteIds).not.toContain(1);
    });
  });

  describe('Async Thunks - toggleFavorite', () => {
    test('should handle pending state', () => {
      const action = toggleFavorite.pending('', 1);
      const result = favoriteReducer(initialState, action);

      expect(result.isToggling).toBe(true);
    });

    test('should handle fulfilled state when adding favorite', () => {
      const action = toggleFavorite.fulfilled(
        { listingId: 1, response: mockFavoriteResponse },
        '',
        1
      );
      const result = favoriteReducer(initialState, action);

      expect(result.isToggling).toBe(false);
      expect(result.favoriteIds).toContain(1);
    });

    test('should handle fulfilled state when removing favorite', () => {
      const stateWithFavorite: FavoriteState = {
        ...initialState,
        favoriteIds: [1],
      };

      const action = toggleFavorite.fulfilled(
        { listingId: 1, response: { ...mockFavoriteResponse, isFavorited: false } },
        '',
        1
      );
      const result = favoriteReducer(stateWithFavorite, action);

      expect(result.isToggling).toBe(false);
      expect(result.favoriteIds).not.toContain(1);
    });
  });

  describe('Selectors', () => {
    const mockState = {
      favorite: {
        ...initialState,
        favorites: [mockFavoriteListing],
        favoriteIds: [1],
        isLoading: true,
        isToggling: false,
        error: 'Test error',
      },
    } as any;

    test('selectFavorites should return favorites', () => {
      const result = selectFavorites(mockState);
      expect(result).toEqual([mockFavoriteListing]);
    });

    test('selectFavoriteIds should return favorite ids', () => {
      const result = selectFavoriteIds(mockState);
      expect(result).toEqual([1]);
    });

    test('selectFavoriteLoading should return loading state', () => {
      const result = selectFavoriteLoading(mockState);
      expect(result).toBe(true);
    });

    test('selectFavoriteToggling should return toggling state', () => {
      const result = selectFavoriteToggling(mockState);
      expect(result).toBe(false);
    });

    test('selectFavoriteError should return error', () => {
      const result = selectFavoriteError(mockState);
      expect(result).toBe('Test error');
    });

    test('selectFavoritePagination should return pagination', () => {
      const result = selectFavoritePagination(mockState);
      expect(result).toEqual(mockFavoriteListResponse.pagination);
    });
  });
});

