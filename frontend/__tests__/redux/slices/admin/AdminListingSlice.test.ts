import adminListingReducer, {
    setFilters,
    fetchAdminListings,
    approveListing,
    rejectListing,
    reopenListing,
    updateListingStatus,
    AdminListingState
} from '@/body/redux/slices/admin/AdminListingSlice';
import { ListingStatus } from '@/body/redux/slices/listing/DTOs/ListingDTOs';
import * as adminApi from '@/body/redux/api/adminApi';

jest.mock('@/body/redux/api/adminApi');

describe('AdminListingSlice', () => {
    const initialState: AdminListingState = {
        items: [],
        isLoading: false,
        isUpdating: false,
        error: null,
        filters: {
            page: 1,
            pageSize: 20,
            statuses: [ListingStatus.Pending, ListingStatus.Rejected],
        },
        pagination: null,
    };

    it('should handle initial state', () => {
        expect(adminListingReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle setFilters', () => {
        const actual = adminListingReducer(initialState, setFilters({ city: 'Ankara' }));
        expect(actual.filters.city).toEqual('Ankara');
    });

    describe('fetchAdminListings', () => {
        it('should handle pending', () => {
            const actual = adminListingReducer(initialState, fetchAdminListings.pending('', undefined));
            expect(actual.isLoading).toEqual(true);
            expect(actual.error).toBeNull();
        });

        it('should handle fulfilled', () => {
            const mockData = {
                success: true,
                listings: [{ id: 1, title: 'Test', status: 'Pending' }],
                pagination: { currentPage: 1, totalPages: 1, totalCount: 1, pageSize: 20 }
            };
            const actual = adminListingReducer(initialState, fetchAdminListings.fulfilled(mockData as any, '', {}));

            expect(actual.isLoading).toEqual(false);
            expect(actual.items.length).toEqual(1);
            expect(actual.items[0].status).toEqual(ListingStatus.Pending); // String 'Pending' converted to enum
            expect(actual.pagination).toEqual(mockData.pagination);
        });

        it('should handle rejected', () => {
            const actual = adminListingReducer(initialState, fetchAdminListings.rejected(new Error('Error'), '', undefined, 'Error Message'));
            expect(actual.isLoading).toEqual(false);
            expect(actual.error).toEqual('Error Message');
        });
    });

    describe('approveListing', () => {
        it('should handle pending', () => {
            const actual = adminListingReducer(initialState, approveListing.pending('', { listingId: 1 }));
            expect(actual.isUpdating).toBe(true);
        });

        it('should handle fulfilled', () => {
            // Should remove item from list
            const stateWithItem = { ...initialState, items: [{ id: 1, title: 'T', status: ListingStatus.Pending } as any] };
            const actual = adminListingReducer(stateWithItem, approveListing.fulfilled({ listingId: 1, response: { success: true }, auto: false }, '', { listingId: 1 }));

            expect(actual.isUpdating).toBe(false);
            expect(actual.items.length).toBe(0);
        });
    });

    describe('rejectListing', () => {
        it('should handle fulfilled', () => {
            // Should remove item from list
            const stateWithItem = { ...initialState, items: [{ id: 1, title: 'T', status: ListingStatus.Pending } as any] };
            const actual = adminListingReducer(stateWithItem, rejectListing.fulfilled({ listingId: 1, response: { success: true } }, '', { listingId: 1 }));

            expect(actual.isUpdating).toBe(false);
            expect(actual.items.length).toBe(0);
        });
    });
});
