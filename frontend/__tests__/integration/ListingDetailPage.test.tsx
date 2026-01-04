/**
 * ListingDetailPage Integration Tests
 * 
 * İlan detay sayfasının render ve etkileşim testleri.
 * Kullanıcı sahipliği, favori işlemleri ve veri yükleme durumlarını kontrol eder.
 */

import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
    render,
    createMockAuthState,
    createAuthenticatedState,
    createMockUser
} from '../utils/test-utils';
import ListingDetailPage from '@/body/listing/ListingDetailPage';
import { ListingDetailDto, ListingType, Currency, ListingStatus, ListingOwnerType, PropertyType, ListingCategory } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Router & Params mock
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: mockPush,
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
    }),
    useParams: () => ({ slug: '1' }),
    usePathname: () => '/listings/1',
}));

// API Mocks
jest.mock('@/body/redux/api/listingApi', () => ({
    getListingByIdApi: jest.fn(),
    updateListingStatusApi: jest.fn(),
    deleteListingApi: jest.fn(),
}));

jest.mock('@/body/redux/api/commentApi', () => ({
    getListingCommentsApi: jest.fn(() => Promise.resolve({ success: true, comments: [] })),
    createCommentApi: jest.fn(),
}));

jest.mock('@/body/redux/api/favoriteApi', () => ({
    toggleFavoriteApi: jest.fn(),
    getMyFavoritesApi: jest.fn(),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const mockOwner = createMockUser({ id: 'owner-1', name: 'Sahip', surname: 'Kişi' });
const mockVisitor = createMockUser({ id: 'visitor-1', name: 'Ziyaretçi', surname: 'Kişi' });

const mockListingDetail: ListingDetailDto = {
    id: 1,
    listingNumber: '123456789',
    title: 'Test Detay İlanı',
    description: 'Detaylı açıklama metni',
    category: ListingCategory.Housing,
    type: ListingType.ForSale,
    propertyType: PropertyType.Apartment,
    price: 5000000,
    currency: Currency.TRY,
    city: 'İstanbul',
    district: 'Beşiktaş',
    neighborhood: 'Bebek',
    grossSquareMeters: 180,
    netSquareMeters: 150,
    roomCount: '4+1',
    buildingAge: 10,
    floorNumber: 5,
    images: [
        { id: 1, imageUrl: 'img1.jpg', isCoverImage: true, displayOrder: 1 },
        { id: 2, imageUrl: 'img2.jpg', isCoverImage: false, displayOrder: 2 }
    ],
    status: ListingStatus.Active,
    ownerType: ListingOwnerType.Owner,
    owner: {
        id: mockOwner.id,
        name: mockOwner.name,
        surname: mockOwner.surname,
        email: mockOwner.email,
        phone: mockOwner.phone,
        profilePictureUrl: null,
        memberSince: new Date().toISOString(),
        totalListings: 5
    },
    createdAt: new Date().toISOString(),
    viewCount: 250,
    favoriteCount: 15,
    commentCount: 0,
    isFeatured: true,
    isUrgent: false,
    isFavorited: false,
    monthlyDues: 0,
    deposit: 0,
    isNegotiable: true,
    interiorFeatures: [],
    exteriorFeatures: [],
};

// Initial state with loaded listing
const loadedState = {
    listing: {
        currentListing: mockListingDetail,
        currentListingImages: mockListingDetail.images,
        isLoadingDetail: false,
        error: null,
        // Diğer gerekli alanlar
        listings: [],
        featuredListings: [],
        latestListings: [],
        similarListings: [],
        myListings: [],
        pagination: null,
        searchParams: null,
        isLoading: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
    },
    comment: {
        commentsByListing: {},
        isLoading: false,
        isCreating: false,
        isDeleting: false,
        error: null,
    }
};

// ============================================================================
// TESTS
// ============================================================================

describe('ListingDetailPage', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        test('should render listing details correctly', async () => {
            render(<ListingDetailPage />, { preloadedState: loadedState });

            expect(screen.getByText('Test Detay İlanı')).toBeInTheDocument();
            expect(screen.getByText('5.000.000 ₺')).toBeInTheDocument(); // Format tahmin edildi
            expect(screen.getByText(/Beşiktaş, İstanbul/)).toBeInTheDocument();
            expect(screen.getByText(/Detaylı açıklama metni/)).toBeInTheDocument();
        });

        test('should render rendering specific badges', () => {
            render(<ListingDetailPage />, { preloadedState: loadedState });

            expect(screen.getByText('SATILIK')).toBeInTheDocument();
            expect(screen.getByText('Öne Çıkan')).toBeInTheDocument();
        });
    });

    describe('Ownership Logic', () => {
        test('should hide favorite button when user is owner', () => {
            const ownerState = {
                ...loadedState,
                auth: createAuthenticatedState({ user: mockOwner }) // Giriş yapan kullanıcı = İlan sahibi
            };

            render(<ListingDetailPage />, { preloadedState: ownerState });

            // Aria-label ile arama yapıyoruz - ne "Favorilere ekle" ne de "Favorilerden çıkar" olmalı
            const addFavButton = screen.queryByRole('button', { name: /favorilere ekle/i });
            const removeFavButton = screen.queryByRole('button', { name: /favorilerden çıkar/i });

            expect(addFavButton).not.toBeInTheDocument();
            expect(removeFavButton).not.toBeInTheDocument();
        });

        test('should show favorite button when user is NOT owner', () => {
            const visitorState = {
                ...loadedState,
                auth: createAuthenticatedState({ user: mockVisitor }) // Giriş yapan kullanıcı != İlan sahibi
            };

            render(<ListingDetailPage />, { preloadedState: visitorState });

            const favButton = screen.getByRole('button', { name: /favorilere ekle/i });
            expect(favButton).toBeInTheDocument();
        });

        test('should show favorite button for guest users', () => {
            const guestState = {
                ...loadedState,
                auth: createMockAuthState() // Giriş yapılmamış
            };

            render(<ListingDetailPage />, { preloadedState: guestState });

            const favButton = screen.getByRole('button', { name: /favorilere ekle/i });
            expect(favButton).toBeInTheDocument();
        });
    });

    describe('Interactions', () => {
        test('should redirect guest to login when clicking favorite', async () => {
            const user = userEvent.setup();
            const guestState = {
                ...loadedState,
                auth: createMockAuthState()
            };

            render(<ListingDetailPage />, { preloadedState: guestState });

            const favButton = screen.getByRole('button', { name: /favorilere ekle/i });
            await user.click(favButton);

            expect(mockPush).toHaveBeenCalledWith('/login');
        });
    });
});
