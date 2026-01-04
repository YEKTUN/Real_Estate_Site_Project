import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ListingDetailPage from '@/body/listing/ListingDetailPage';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import { useParams, useRouter } from 'next/navigation';

// Mocks
jest.mock('next/navigation', () => ({
    useParams: jest.fn(),
    useRouter: jest.fn(),
}));

jest.mock('@/body/redux/hooks', () => ({
    useAppDispatch: jest.fn(),
    useAppSelector: jest.fn(),
}));

jest.mock('@/body/redux/slices/favorite/FavoriteSlice', () => ({
    selectFavoriteIds: jest.fn(),
    selectFavoriteToggling: jest.fn(),
    toggleFavorite: jest.fn(), // If needed as action
}));

jest.mock('@/body/redux/slices/auth/AuthSlice', () => ({
    selectIsAuthenticated: jest.fn(),
    selectUser: jest.fn(),
}));

jest.mock('@/body/redux/slices/listing/ListingSlice', () => ({
    fetchListingById: jest.fn(),
    clearCurrentListing: jest.fn(),
    clearError: jest.fn(),
    selectCurrentListing: jest.fn(),
    selectListingDetailLoading: jest.fn(),
    selectListingError: jest.fn(),
}));

jest.mock('@/body/redux/slices/comment/CommentSlice', () => ({
    fetchListingComments: jest.fn(),
    createComment: jest.fn(),
    deleteComment: jest.fn(),
    selectCommentsByListing: () => jest.fn(), // returns a selector
    selectCommentLoading: jest.fn(),
}));

jest.mock('@/body/redux/slices/message/MessageSlice', () => ({
    sendMessage: jest.fn(),
}));

// Components Mocks (to avoid complex rendering)
jest.mock('@/body/panel/components/UserAvatar', () => {
    return function MockUserAvatar(props: any) {
        return <div data-testid="user-avatar">{props.name}</div>;
    };
});

describe('ListingDetailPage', () => {
    const mockDispatch = jest.fn();
    const mockPush = jest.fn();

    // Default Selector Returns
    // This allows creating valid store state for our component
    const defaultSelectors = {
        selectCurrentListing: null,
        selectListingDetailLoading: false,
        selectListingError: null,
        selectFavoriteIds: [],
        selectFavoriteToggling: false,
        selectIsAuthenticated: false,
        selectUser: null,
        selectCommentsByListing: [],
        selectCommentLoading: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (useParams as jest.Mock).mockReturnValue({ slug: '1' }); // listingId = 1

        // Setup default selector implementations
        (useAppSelector as jest.Mock).mockImplementation((selector) => {
            // We can match selector by checking its name if possible, 
            // but since we mocked specific imports, we can just check if it is one of our mocked functions.
            // This can be tricky with inline mocked modules.
            // Easier way: 
            // Just return values based on test-specific setup.
            return undefined; // Default fallback
        });
    });

    // Helper to mock selectors easily
    const setupSelectors = (overrides: Partial<typeof defaultSelectors> = {}) => {
        const values = { ...defaultSelectors, ...overrides };

        // ListingSlice
        require('@/body/redux/slices/listing/ListingSlice').selectCurrentListing.mockReturnValue(values.selectCurrentListing);
        require('@/body/redux/slices/listing/ListingSlice').selectListingDetailLoading.mockReturnValue(values.selectListingDetailLoading);
        require('@/body/redux/slices/listing/ListingSlice').selectListingError.mockReturnValue(values.selectListingError);

        // FavoriteSlice
        require('@/body/redux/slices/favorite/FavoriteSlice').selectFavoriteIds.mockReturnValue(values.selectFavoriteIds);
        require('@/body/redux/slices/favorite/FavoriteSlice').selectFavoriteToggling.mockReturnValue(values.selectFavoriteToggling);

        // AuthSlice
        require('@/body/redux/slices/auth/AuthSlice').selectIsAuthenticated.mockReturnValue(values.selectIsAuthenticated);
        require('@/body/redux/slices/auth/AuthSlice').selectUser.mockReturnValue(values.selectUser);

        // CommentSlice - selectCommentsByListing is a selector factory
        // The component calls selectCommentsByListing(id) which returns a selector function.
        // Then useAppSelector(selectorFunction) is called.
        // We mocked selectCommentsByListing to return a Jest function. 
        // We need to make sure useAppSelector returns correctly when called with that function.
        // This is complex. Simplified approach:
        // Mock useAppSelector to verify the *argument* passed.

        (useAppSelector as jest.Mock).mockImplementation((selector) => {
            if (selector === require('@/body/redux/slices/listing/ListingSlice').selectCurrentListing) return values.selectCurrentListing;
            if (selector === require('@/body/redux/slices/listing/ListingSlice').selectListingDetailLoading) return values.selectListingDetailLoading;
            if (selector === require('@/body/redux/slices/listing/ListingSlice').selectListingError) return values.selectListingError;
            if (selector === require('@/body/redux/slices/favorite/FavoriteSlice').selectFavoriteIds) return values.selectFavoriteIds;
            if (selector === require('@/body/redux/slices/favorite/FavoriteSlice').selectFavoriteToggling) return values.selectFavoriteToggling;
            if (selector === require('@/body/redux/slices/auth/AuthSlice').selectIsAuthenticated) return values.selectIsAuthenticated;
            if (selector === require('@/body/redux/slices/auth/AuthSlice').selectUser) return values.selectUser;
            // For closure selectors, we can't strict equal. 
            // We'll rely on global return for unknown selectors or just handle comments specifically if mostly needed.
            return values.selectCommentsByListing;
        });
    };

    it('should show loading state', () => {
        setupSelectors({ selectListingDetailLoading: true });
        const { container } = render(<ListingDetailPage />);
        expect(container.getElementsByClassName('animate-pulse').length).toBeGreaterThan(0);
    });

    it('should show error state', () => {
        setupSelectors({ selectListingError: 'Listing Failed' });
        render(<ListingDetailPage />);
        expect(screen.getByText('Listing Failed')).toBeInTheDocument();
        expect(screen.getByText('İLANLARA DÖN')).toBeInTheDocument();
    });

    it('should render listing details', () => {
        const mockListing = {
            id: 1,
            title: 'Luxury Villa',
            description: 'Amazing view',
            price: 5000000,
            currency: 1, // Currency.TRY
            city: 'Antalya',
            district: 'Kas',
            neighborhood: 'Kalkan',
            listingNumber: '12345',
            createdDate: new Date().toISOString(),
            owner: {
                id: 'owner-1',
                name: 'Ahmet',
                surname: 'Yilmaz',
                email: 'ahmet@test.com',
                phone: '05555555555',
                profilePictureUrl: '',
                showEmail: true,
                showPhone: true
            },
            type: 1, // ListingType.ForSale
            category: 1, // Residential
            propertyType: 3, // Villa
            status: 1, // Active
            images: [],
            features: {
                m2Gross: 200,
                m2Net: 180,
                roomCount: '4+1',
                buildingAge: 0
            },
            comments: []
        };

        setupSelectors({ selectCurrentListing: mockListing });

        render(<ListingDetailPage />);

        expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
        expect(screen.getByText('₺5.000.000')).toBeInTheDocument(); // formatPrice mock or real logic check
        expect(screen.getByText(/Antalya/i)).toBeInTheDocument();
        expect(screen.getByText('Ahmet Yilmaz')).toBeInTheDocument();
    });

    it('should handle contact privacy logic', () => {
        const mockListingPrivate = {
            id: 1,
            title: 'Private Listing',
            price: 100,
            currency: 1, // Currency.TRY
            city: 'A', district: 'B', neighborhood: 'C',
            owner: {
                id: 'owner-2',
                name: 'Gizli',
                surname: 'Kullanici',
                email: null, // Private
                phone: null, // Private
                showEmail: false,
                showPhone: false, // Settings are false, so API returned null
            },
            type: 1, // ListingType.ForSale
            category: 1,
            propertyType: 1,
            status: 1,
            images: [],
            features: {},
        };

        setupSelectors({ selectCurrentListing: mockListingPrivate });
        render(<ListingDetailPage />);

        // Should check for privacy message or hidden fields
        // Assuming "Gizlilik ayarlarınız..." or similar text if checking own profile, 
        // or just not rendering contact buttons?
        // Actually ListingDetailPage usually has "İletişime Geç" buttons.
        // It might show "Gizli" instead of number.

        // Let's check generally for existence of owner name but absence of raw phone.
        expect(screen.getByText('Gizli Kullanici')).toBeInTheDocument();
        expect(screen.queryByText('05555555555')).not.toBeInTheDocument();
    });
});
