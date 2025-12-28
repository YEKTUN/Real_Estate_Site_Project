/**
 * Listings Component Tests
 * 
 * İlan listesi bileşeninin render ve interaksiyon testleri.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Listings from '@/body/listing/Listings';
import listingReducer from '@/body/redux/slices/listing/ListingSlice';
import favoriteReducer from '@/body/redux/slices/favorite/FavoriteSlice';
import authReducer from '@/body/redux/slices/auth/AuthSlice';
import { ListingCategory, ListingType, Currency, ListingStatus } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

jest.mock('@/body/redux/slices/listing/ListingSlice', () => {
  const original = jest.requireActual('@/body/redux/slices/listing/ListingSlice');
  return {
    ...original,
    fetchAllListings: jest.fn(() => ({ type: 'listing/fetchAllListings/pending' })),
    searchListings: jest.fn(() => ({ type: 'listing/searchListings/pending' })),
  };
});

// ============================================================================
// MOCK SETUP
// ============================================================================

const mockSearchParams = {
  get: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockListing = {
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

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      listing: listingReducer,
      favorite: favoriteReducer,
      auth: authReducer,
    },
    preloadedState: {
      listing: {
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
        ...initialState.listing,
      },
      favorite: {
        favorites: [],
        favoriteIds: [],
        pagination: null,
        isLoading: false,
        isToggling: false,
        error: null,
        ...initialState.favorite,
      },
      auth: {
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        ...initialState.auth,
      },
    },
  });
};

// ============================================================================
// TESTS
// ============================================================================

describe('Listings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render component title', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <Listings />
        </Provider>
      );

      expect(screen.getByText(/tüm ilanlar/i)).toBeInTheDocument();
    });

    test('should render search filters', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <Listings />
        </Provider>
      );

      expect(screen.getByPlaceholderText(/ilan başlığı, konum/i)).toBeInTheDocument();
    });

    test('should render loading state', () => {
      const store = createMockStore({
        listing: {
          isLoading: true,
        },
      });

      render(
        <Provider store={store}>
          <Listings />
        </Provider>
      );

      expect(screen.getByText(/ilanlar yükleniyor/i)).toBeInTheDocument();
    });

    test('should render empty state when no listings', () => {
      const store = createMockStore({
        listing: {
          listings: [],
          isLoading: false,
        },
      });

      render(
        <Provider store={store}>
          <Listings />
        </Provider>
      );

      expect(screen.getByText(/ilan bulunamadı/i)).toBeInTheDocument();
    });

    test('should render listings when available', () => {
      const store = createMockStore({
        listing: {
          listings: [mockListing],
          isLoading: false,
        },
      });

      render(
        <Provider store={store}>
          <Listings />
        </Provider>
      );

      expect(screen.getByText('Test İlan')).toBeInTheDocument();
    });

    test('should render pagination when pagination exists', () => {
      const store = createMockStore({
        listing: {
          listings: [mockListing],
          isLoading: false,
          pagination: {
            currentPage: 1,
            pageSize: 12,
            totalPages: 2,
            totalCount: 2,
            hasPrevious: false,
            hasNext: true,
          },
        },
      });

      render(
        <Provider store={store}>
          <Listings />
        </Provider>
      );

      expect(screen.getByRole('button', { name: /sonraki/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should render error message when error exists', () => {
      const store = createMockStore({
        listing: {
          listings: [],
          isLoading: false,
          error: 'Bir hata oluştu',
        },
      });

      render(
        <Provider store={store}>
          <Listings />
        </Provider>
      );

      expect(screen.getByText(/bir hata oluştu/i)).toBeInTheDocument();
    });
  });
});

