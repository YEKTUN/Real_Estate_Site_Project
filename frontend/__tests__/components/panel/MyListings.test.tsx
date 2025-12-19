/**
 * MyListings Component Tests
 * 
 * İlanlarım bileşeninin render ve interaksiyon testleri.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import MyListings from '@/body/panel/components/MyListings';
import listingReducer from '@/body/redux/slices/listing/ListingSlice';
import authReducer from '@/body/redux/slices/auth/AuthSlice';
import { ListingStatus, ListingType, Currency, ListingCategory } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
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

describe('MyListings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render component title', () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <MyListings />
        </Provider>
      );

      expect(screen.getByText(/ilanlarım/i)).toBeInTheDocument();
    });

    test('should render loading state', () => {
      const store = createMockStore({
        listing: {
          isLoading: true,
        },
      });

      render(
        <Provider store={store}>
          <MyListings />
        </Provider>
      );

      expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument();
    });

    test('should render empty state when no listings', () => {
      const store = createMockStore({
        listing: {
          myListings: [],
          isLoading: false,
        },
      });

      render(
        <Provider store={store}>
          <MyListings />
        </Provider>
      );

      expect(screen.getByText(/ilan bulunamadı/i)).toBeInTheDocument();
    });

    test('should render listings when available', () => {
      const store = createMockStore({
        listing: {
          myListings: [mockListing],
          isLoading: false,
        },
      });

      render(
        <Provider store={store}>
          <MyListings />
        </Provider>
      );

      expect(screen.getByText('Test İlan')).toBeInTheDocument();
    });

    test('should render statistics', () => {
      const store = createMockStore({
        listing: {
          myListings: [mockListing],
          isLoading: false,
        },
      });

      render(
        <Provider store={store}>
          <MyListings />
        </Provider>
      );

      expect(screen.getByText(/toplam ilan/i)).toBeInTheDocument();
      expect(screen.getByText(/aktif ilan/i)).toBeInTheDocument();
    });
  });

  describe('Status Filter', () => {
    test('should render status filter buttons', () => {
      const store = createMockStore({
        listing: {
          myListings: [mockListing],
          isLoading: false,
        },
      });

      render(
        <Provider store={store}>
          <MyListings />
        </Provider>
      );

      // Durum filtre butonları: Tümü, Aktif, Beklemede, Pasif
      expect(screen.getByRole('button', { name: /tümü/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /aktif/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /beklemede/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pasif/i })).toBeInTheDocument();
    });
  });
});

