/**
 * FavoriteApi Unit Tests
 * 
 * Favorite API fonksiyonlarının testleri.
 */

import {
  getMyFavoritesApi,
  addToFavoritesApi,
  removeFromFavoritesApi,
  toggleFavoriteApi,
  checkFavoriteApi,
} from '@/body/redux/api/favoriteApi';
import axiosInstance from '@/body/redux/api/axiosInstance';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/axiosInstance');
const mockedAxiosInstance = axiosInstance as jest.Mocked<typeof axiosInstance>;

// ============================================================================
// TEST DATA
// ============================================================================

const mockFavoriteResponse = {
  success: true,
  message: 'İşlem başarılı',
  favorite: {
    id: 1,
    listingId: 1,
    note: 'Test note',
  },
  isFavorited: true,
};

const mockFavoriteListResponse = {
  success: true,
  message: 'İşlem başarılı',
  favorites: [mockFavoriteResponse.favorite],
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
// TESTS
// ============================================================================

describe('FavoriteApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyFavoritesApi', () => {
    test('should fetch favorites successfully', async () => {
      mockedAxiosInstance.get.mockResolvedValueOnce({
        data: mockFavoriteListResponse,
      });

      const result = await getMyFavoritesApi(1, 20);

      expect(result).toEqual(mockFavoriteListResponse);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/favorite/my', {
        params: { page: 1, pageSize: 20 },
      });
    });

    test('should handle error', async () => {
      mockedAxiosInstance.get.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            message: 'Unauthorized',
          },
        },
      });

      const result = await getMyFavoritesApi(1, 20);

      expect(result.success).toBe(false);
    });
  });

  describe('addToFavoritesApi', () => {
    test('should add to favorites successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockFavoriteResponse,
      });

      const result = await addToFavoritesApi(1, { note: 'Test note' });

      expect(result).toEqual(mockFavoriteResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/favorite/1', {
        note: 'Test note',
      });
    });
  });

  describe('removeFromFavoritesApi', () => {
    test('should remove from favorites successfully', async () => {
      mockedAxiosInstance.delete.mockResolvedValueOnce({
        data: mockFavoriteResponse,
      });

      const result = await removeFromFavoritesApi(1);

      expect(result).toEqual(mockFavoriteResponse);
      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith('/favorite/1');
    });
  });

  describe('toggleFavoriteApi', () => {
    test('should toggle favorite successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockFavoriteResponse,
      });

      const result = await toggleFavoriteApi(1);

      expect(result).toEqual(mockFavoriteResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/favorite/1/toggle');
    });
  });

  describe('checkFavoriteApi', () => {
    test('should check favorite status successfully', async () => {
      mockedAxiosInstance.get.mockResolvedValueOnce({
        data: mockFavoriteResponse,
      });

      const result = await checkFavoriteApi(1);

      expect(result).toEqual(mockFavoriteResponse);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/favorite/1/check');
    });
  });
});

