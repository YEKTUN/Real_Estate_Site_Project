/**
 * FavoriteListings Component Tests
 * 
 * Favori İlanlar bileşeninin render ve interaksiyon testleri.
 */

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import FavoriteListings from '@/body/panel/components/FavoriteListings';
import favoriteReducer from '@/body/redux/slices/favorite/FavoriteSlice';
import authReducer from '@/body/redux/slices/auth/AuthSlice';
import { ListingType, Currency } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

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

const mockFavorite = {
  id: 1,
  listingId: 1,
  note: 'Test note',
  createdAt: new Date().toISOString(),
  listing: {
    id: 1,
    listingNumber: '123456789',
    title: 'Test İlan',
    price: 1000000,
    type: ListingType.ForSale,
    currency: Currency.TRY,
    coverImageUrl: 'https://example.com/image.jpg',
  },
};

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      favorite: favoriteReducer,
      auth: authReducer,
    },
    preloadedState: {
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

describe('FavoriteListings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render header text when favorites exist', () => {
      const store = createMockStore({
        favorite: {
          favorites: [mockFavorite as any],
          isLoading: false,
          pagination: {
            totalCount: 1,
          },
        },
      });
      render(
        <Provider store={store}>
          <FavoriteListings />
        </Provider>
      );

      expect(
        screen.getByText(/favori ilanınız var/i)
      ).toBeInTheDocument();
    });

    test('should render loading state', () => {
      const store = createMockStore({
        favorite: {
          isLoading: true,
        },
      });

      render(
        <Provider store={store}>
          <FavoriteListings />
        </Provider>
      );

      expect(screen.getByText(/yükleniyor/i)).toBeInTheDocument();
    });

    test('should render empty state when no favorites', () => {
      const store = createMockStore({
        favorite: {
          favorites: [],
          isLoading: false,
        },
      });

      render(
        <Provider store={store}>
          <FavoriteListings />
        </Provider>
      );

      expect(
        screen.getByText(/henüz favori ilanınız yok/i)
      ).toBeInTheDocument();
    });

    test('should render favorites when available', () => {
      const store = createMockStore({
        favorite: {
          favorites: [mockFavorite as any],
          isLoading: false,
        },
      });

      render(
        <Provider store={store}>
          <FavoriteListings />
        </Provider>
      );

      expect(screen.getByText('Test İlan')).toBeInTheDocument();
    });
  });
});

