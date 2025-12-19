/**
 * ListingApi Unit Tests
 * 
 * Listing API fonksiyonlarının testleri.
 */

import {
  createListingApi,
  updateListingApi,
  deleteListingApi,
  getListingByIdApi,
  getAllListingsApi,
  searchListingsApi,
  getMyListingsApi,
} from '@/body/redux/api/listingApi';
import axiosInstance from '@/body/redux/api/axiosInstance';
import { ListingType, ListingCategory, Currency } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/axiosInstance');
jest.mock('@/body/redux/api/cloudinaryApi', () => ({
  uploadListingImageApi: jest.fn(),
  uploadMultipleListingImagesApi: jest.fn(),
  deleteListingImageApi: jest.fn(),
}));

const mockedAxiosInstance = axiosInstance as jest.Mocked<typeof axiosInstance>;

// ============================================================================
// TEST DATA
// ============================================================================

const mockCreateListingDto = {
  title: 'Test İlan',
  category: ListingCategory.Residential,
  type: ListingType.ForSale,
  propertyType: 1,
  price: 1000000,
  currency: Currency.TRY,
  city: 'İstanbul',
  district: 'Kadıköy',
  description: 'Test açıklama',
};

const mockListingResponse = {
  success: true,
  message: 'İşlem başarılı',
  listing: {
    id: 1,
    listingNumber: '123456789',
    ...mockCreateListingDto,
  },
};

const mockListingListResponse = {
  success: true,
  message: 'İşlem başarılı',
  listings: [mockListingResponse.listing],
  pagination: {
    currentPage: 1,
    pageSize: 12,
    totalPages: 1,
    totalCount: 1,
    hasPrevious: false,
    hasNext: false,
  },
};

// ============================================================================
// TESTS
// ============================================================================

describe('ListingApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
    console.error = jest.fn();
  });

  describe('createListingApi', () => {
    test('should create listing successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockListingResponse,
      });

      const result = await createListingApi(mockCreateListingDto);

      expect(result).toEqual(mockListingResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/listing', mockCreateListingDto);
    });

    test('should handle API error with message', async () => {
      const errorResponse = {
        response: {
          status: 400,
          statusText: 'Bad Request',
          data: {
            message: 'Validation failed',
          },
        },
      };

      mockedAxiosInstance.post.mockRejectedValueOnce(errorResponse);

      const result = await createListingApi(mockCreateListingDto);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Validation failed');
    });

    test('should handle validation errors', async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            errors: {
              title: ['Title is required'],
              price: ['Price must be positive'],
            },
          },
        },
      };

      mockedAxiosInstance.post.mockRejectedValueOnce(errorResponse);

      const result = await createListingApi(mockCreateListingDto);

      expect(result.success).toBe(false);
      expect(result.message).toContain('title');
      expect(result.message).toContain('price');
    });

    test('should handle network error', async () => {
      mockedAxiosInstance.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await createListingApi(mockCreateListingDto);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Network error');
    });
  });

  describe('updateListingApi', () => {
    test('should update listing successfully', async () => {
      mockedAxiosInstance.put.mockResolvedValueOnce({
        data: mockListingResponse,
      });

      const result = await updateListingApi(1, { title: 'Updated Title' });

      expect(result).toEqual(mockListingResponse);
      expect(mockedAxiosInstance.put).toHaveBeenCalledWith('/listing/1', { title: 'Updated Title' });
    });

    test('should handle update error', async () => {
      mockedAxiosInstance.put.mockRejectedValueOnce({
        response: {
          status: 404,
          data: {
            message: 'Listing not found',
          },
        },
      });

      const result = await updateListingApi(1, { title: 'Updated Title' });

      expect(result.success).toBe(false);
      // API implementasyonu, hataları generic mesajla sarıyor
      expect(result.message).toBe('İlan güncellenirken bir hata oluştu');
    });
  });

  describe('deleteListingApi', () => {
    test('should delete listing successfully', async () => {
      mockedAxiosInstance.delete.mockResolvedValueOnce({
        data: mockListingResponse,
      });

      const result = await deleteListingApi(1);

      expect(result).toEqual(mockListingResponse);
      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith('/listing/1');
    });
  });

  describe('getListingByIdApi', () => {
    test('should fetch listing by id successfully', async () => {
      mockedAxiosInstance.get.mockResolvedValueOnce({
        data: mockListingResponse,
      });

      const result = await getListingByIdApi(1);

      expect(result).toEqual(mockListingResponse);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/listing/1');
    });
  });

  describe('getAllListingsApi', () => {
    test('should fetch all listings successfully', async () => {
      mockedAxiosInstance.get.mockResolvedValueOnce({
        data: mockListingListResponse,
      });

      const result = await getAllListingsApi(1, 12);

      expect(result).toEqual(mockListingListResponse);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/listing', {
        params: { page: 1, pageSize: 12 },
      });
    });
  });

  describe('searchListingsApi', () => {
    test('should search listings successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockListingListResponse,
      });

      const searchParams = {
        city: 'İstanbul',
        type: ListingType.ForSale,
        page: 1,
        pageSize: 12,
      };

      const result = await searchListingsApi(searchParams);

      expect(result).toEqual(mockListingListResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/listing/search', searchParams);
    });
  });

  describe('getMyListingsApi', () => {
    test('should fetch my listings successfully', async () => {
      mockedAxiosInstance.get.mockResolvedValueOnce({
        data: mockListingListResponse,
      });

      const result = await getMyListingsApi(1, 12);

      expect(result).toEqual(mockListingListResponse);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/listing/my-listings', {
        params: { page: 1, pageSize: 12 },
      });
    });
  });
});

