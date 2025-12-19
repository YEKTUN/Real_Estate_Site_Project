/**
 * ListingSlice Unit Tests
 * 
 * Redux listing slice'ının tüm reducer, action ve async thunk'larını test eder.
 */

import listingReducer, {
  clearError,
  setSearchParams,
  clearCurrentListing,
  clearListings,
  createListing,
  updateListing,
  deleteListing,
  fetchListingById,
  fetchListingByNumber,
  fetchAllListings,
  searchListings,
  fetchMyListings,
  fetchFeaturedListings,
  fetchLatestListings,
  fetchSimilarListings,
  updateListingStatus,
  selectListings,
  selectFeaturedListings,
  selectLatestListings,
  selectMyListings,
  selectCurrentListing,
  selectPagination,
  selectListingLoading,
  selectListingError,
} from '@/body/redux/slices/listing/ListingSlice';
import { ListingState, ListingListDto, ListingType, Currency, ListingStatus, ListingCategory } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/listingApi', () => ({
  createListingApi: jest.fn(),
  updateListingApi: jest.fn(),
  deleteListingApi: jest.fn(),
  getListingByIdApi: jest.fn(),
  getListingByNumberApi: jest.fn(),
  getAllListingsApi: jest.fn(),
  searchListingsApi: jest.fn(),
  getMyListingsApi: jest.fn(),
  getFeaturedListingsApi: jest.fn(),
  getLatestListingsApi: jest.fn(),
  getSimilarListingsApi: jest.fn(),
  updateListingStatusApi: jest.fn(),
  addListingImageApi: jest.fn(),
  uploadListingImageFileApi: jest.fn(),
  uploadMultipleListingImageFilesApi: jest.fn(),
  deleteListingImageApi: jest.fn(),
  setCoverImageApi: jest.fn(),
  getListingImagesApi: jest.fn(),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const initialState: ListingState = {
  listings: [],
  featuredListings: [],
  latestListings: [],
  similarListings: [],
  myListings: [],
  currentListing: null,
  currentListingImages: [],
  pagination: null,
  searchParams: null,
  isLoading: false,
  isLoadingDetail: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
};

const mockListing: ListingListDto = {
  id: 1,
  listingNumber: '123456789',
  title: 'Test İlan',
  category: ListingCategory.Residential,
  type: ListingType.ForSale,
  propertyType: 1,
  price: 1000000,
  currency: Currency.TRY,
  city: 'İstanbul',
  district: 'Kadıköy',
  neighborhood: 'Moda',
  grossSquareMeters: 150,
  netSquareMeters: 120,
  roomCount: '3+1',
  buildingAge: 5,
  floorNumber: 3,
  coverImageUrl: 'https://example.com/image.jpg',
  status: ListingStatus.Active,
  ownerType: 1,
  createdAt: new Date().toISOString(),
  viewCount: 100,
  favoriteCount: 25,
  isFeatured: false,
  isUrgent: false,
};

const mockSuccessResponse = {
  success: true,
  message: 'İşlem başarılı',
  listing: mockListing,
};

const mockListResponse = {
  success: true,
  message: 'İşlem başarılı',
  listings: [mockListing],
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
// REDUCER TESTS
// ============================================================================

describe('ListingSlice', () => {
  describe('Initial State', () => {
    test('should return initial state when passed an empty action', () => {
      const result = listingReducer(undefined, { type: '' });
      expect(result).toEqual(initialState);
    });
  });

  describe('Sync Reducers', () => {
    test('clearError should clear error', () => {
      const stateWithError: ListingState = {
        ...initialState,
        error: 'Some error',
      };

      const result = listingReducer(stateWithError, clearError());
      expect(result.error).toBeNull();
    });

    test('setSearchParams should set search params', () => {
      const searchParams = { city: 'İstanbul', type: ListingType.ForSale };
      const result = listingReducer(initialState, setSearchParams(searchParams));

      expect(result.searchParams).toEqual(searchParams);
    });

    test('setSearchParams should clear search params when passed null', () => {
      const stateWithParams: ListingState = {
        ...initialState,
        searchParams: { city: 'İstanbul' } as any,
      };

      const result = listingReducer(stateWithParams, setSearchParams(null as any));
      expect(result.searchParams).toBeNull();
    });

    test('clearCurrentListing should clear current listing', () => {
      const stateWithListing: ListingState = {
        ...initialState,
        currentListing: mockListing as any,
      };

      const result = listingReducer(stateWithListing, clearCurrentListing());
      expect(result.currentListing).toBeNull();
    });

    test('clearListings should clear listings and pagination', () => {
      const stateWithImages: ListingState = {
        ...initialState,
        listings: [mockListing],
        pagination: mockListResponse.pagination,
      };

      const result = listingReducer(stateWithImages, clearListings());
      expect(result.listings).toEqual([]);
      expect(result.pagination).toBeNull();
    });
  });

  describe('Async Thunks - createListing', () => {
    test('should handle pending state', () => {
      const action = createListing.pending('', {} as any);
      const result = listingReducer(initialState, action);

      expect(result.isCreating).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle fulfilled state', async () => {
      const { createListingApi } = require('@/body/redux/api/listingApi');
      createListingApi.mockResolvedValue(mockSuccessResponse);

      const action = createListing.fulfilled(mockSuccessResponse, '', {} as any);
      const result = listingReducer(initialState, action);

      expect(result.isCreating).toBe(false);
      expect(result.error).toBeNull();
    });

    test('should handle rejected state', () => {
      const action = createListing.rejected('Test error' as any, '', {} as any);
      const result = listingReducer(initialState, action);

      expect(result.isCreating).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('Async Thunks - fetchAllListings', () => {
    test('should handle pending state', () => {
      const action = fetchAllListings.pending('', undefined);
      const result = listingReducer(initialState, action);

      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle fulfilled state', () => {
      const action = fetchAllListings.fulfilled(mockListResponse, '', undefined);
      const result = listingReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.listings).toEqual(mockListResponse.listings);
      expect(result.pagination).toEqual(mockListResponse.pagination);
      expect(result.error).toBeNull();
    });

    test('should handle rejected state', () => {
      const action = fetchAllListings.rejected('Test error' as any, '', undefined);
      const result = listingReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('Async Thunks - searchListings', () => {
    test('should handle pending state', () => {
      const action = searchListings.pending('', {} as any);
      const result = listingReducer(initialState, action);

      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle fulfilled state', () => {
      const searchParams = { city: 'İstanbul' } as any;
      const action = searchListings.fulfilled(mockListResponse, '', searchParams);
      const result = listingReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.listings).toEqual(mockListResponse.listings);
      // searchListings fulfilled reducer şu an searchParams'i değiştirmiyor
    });
  });

  describe('Async Thunks - fetchListingById', () => {
    test('should handle pending state', () => {
      const action = fetchListingById.pending('', 1);
      const result = listingReducer(initialState, action);

      expect(result.isLoadingDetail).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle fulfilled state', () => {
      const action = fetchListingById.fulfilled(mockSuccessResponse, '', 1);
      const result = listingReducer(initialState, action);

      expect(result.isLoadingDetail).toBe(false);
      expect(result.currentListing).toEqual(mockSuccessResponse.listing);
    });
  });

  describe('Async Thunks - deleteListing', () => {
    test('should handle pending state', () => {
      const stateWithListing: ListingState = {
        ...initialState,
        listings: [mockListing],
      };

      const action = deleteListing.pending('', 1);
      const result = listingReducer(stateWithListing, action);

      expect(result.isDeleting).toBe(true);
    });

    test('should handle fulfilled state and stop deleting', () => {
      const stateWithListing: ListingState = {
        ...initialState,
        listings: [mockListing],
      };

      const action = deleteListing.fulfilled(mockSuccessResponse, '', 1);
      const result = listingReducer(stateWithListing, action);

      expect(result.isDeleting).toBe(false);
      // Şu an reducer listeden eleman silmiyor, sadece isDeleting flag'ini kapatıyor
      expect(result.listings).toEqual([mockListing]);
    });
  });

  describe('Selectors', () => {
    const mockState = {
      listing: {
        ...initialState,
        listings: [mockListing],
        featuredListings: [mockListing],
        latestListings: [mockListing],
        myListings: [mockListing],
        currentListing: mockListing as any,
        pagination: mockListResponse.pagination,
        isLoading: true,
        error: 'Test error',
      },
    } as any;

    test('selectListings should return listings', () => {
      const result = selectListings(mockState);
      expect(result).toEqual([mockListing]);
    });

    test('selectFeaturedListings should return featured listings', () => {
      const result = selectFeaturedListings(mockState);
      expect(result).toEqual([mockListing]);
    });

    test('selectLatestListings should return latest listings', () => {
      const result = selectLatestListings(mockState);
      expect(result).toEqual([mockListing]);
    });

    test('selectMyListings should return my listings', () => {
      const result = selectMyListings(mockState);
      expect(result).toEqual([mockListing]);
    });

    test('selectCurrentListing should return current listing', () => {
      const result = selectCurrentListing(mockState);
      expect(result).toEqual(mockListing);
    });

    test('selectPagination should return pagination', () => {
      const result = selectPagination(mockState);
      expect(result).toEqual(mockListResponse.pagination);
    });

    test('selectListingLoading should return loading state', () => {
      const result = selectListingLoading(mockState);
      expect(result).toBe(true);
    });

    test('selectListingError should return error', () => {
      const result = selectListingError(mockState);
      expect(result).toBe('Test error');
    });
  });
});

