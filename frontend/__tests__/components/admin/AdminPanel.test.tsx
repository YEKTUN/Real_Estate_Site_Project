/**
 * AdminPanel Integration Tests
 */
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, createAuthenticatedState, createMockUser } from '../../utils/test-utils';
import AdminPanel from '@/body/admin/AdminPanel';
// Import methods to mock their implementations
import { getAdminListingsApi, getAdminModerationRuleApi } from '@/body/redux/api/adminApi';

// Mock Router
const mockPush = jest.fn();
jest.mock('next/navigation', () => {
    return {
        useRouter: () => ({
            push: mockPush,
            replace: jest.fn(),
            prefetch: jest.fn(),
        })
    };
});

// Mock APIs - Simple mocks to avoid hoisting issues
jest.mock('@/body/redux/api/adminApi', () => {
    return {
        getAdminModerationRuleApi: jest.fn(),
        getAdminListingByNumberApi: jest.fn(),
        saveAdminModerationRuleApi: jest.fn(),
        getAdminListingsApi: jest.fn(),
    };
});

describe('AdminPanel', () => {
    const mockAdmin = createMockUser({
        id: 'admin-1',
        name: 'Admin',
        surname: 'User',
        email: 'admin@example.com',
        isAdmin: true
    });

    const mockNonAdmin = createMockUser({
        id: 'user-1',
        name: 'Normal',
        surname: 'User',
        email: 'user@example.com',
        isAdmin: false
    });

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mock implementations
        (getAdminModerationRuleApi as jest.Mock).mockResolvedValue({
            isAutomataEnabled: false,
            blockedKeywords: []
        });

        (getAdminListingsApi as jest.Mock).mockResolvedValue({
            success: true,
            listings: [],
            pagination: {
                page: 1,
                pageSize: 10,
                totalPages: 1,
                totalCount: 0
            }
        });
    });

    test('should redirect to home if user is not admin', () => {
        const authState = createAuthenticatedState({ user: mockNonAdmin });
        render(<AdminPanel />, { preloadedState: { auth: authState } });

        expect(mockPush).toHaveBeenCalledWith('/');
    });

    test('should render dashboard for admin user', async () => {
        const authState = createAuthenticatedState({ user: mockAdmin });
        render(<AdminPanel />, { preloadedState: { auth: authState } });

        expect(screen.getByText('YEKTUN ADMIN')).toBeInTheDocument();
    });

    test('should render navigation filters', () => {
        const authState = createAuthenticatedState({ user: mockAdmin });
        render(<AdminPanel />, { preloadedState: { auth: authState } });

        expect(screen.getByText(/BEKLEYENLER/i)).toBeInTheDocument();
    });

    test('should show empty state when no listings', () => {
        const authState = createAuthenticatedState({ user: mockAdmin });
        render(<AdminPanel />, {
            preloadedState: {
                auth: authState,
                adminListing: {
                    items: [],
                    filters: { page: 1, pageSize: 20, statuses: [] },
                    isLoading: false,
                    pagination: null,
                    error: null,
                    isUpdating: false
                }
            }
        });

        expect(screen.getByText(/İÇERİK BULUNAMADI/i)).toBeInTheDocument();
    });
});
