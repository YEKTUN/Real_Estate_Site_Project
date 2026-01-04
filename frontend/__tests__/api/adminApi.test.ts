import axiosInstance from '@/body/redux/api/axiosInstance';
import {
    getAdminListingsApi,
    approveListingApi,
    rejectListingApi,
    getAdminModerationRuleApi,
    saveAdminModerationRuleApi,
    reopenListingApi,
    updateListingStatusApi,
    getAdminListingByNumberApi,
    findUserByEmailApi,
    toggleAdminUserStatusApi,
    AdminListingFilter,
    AdminModerationRuleDto
} from '@/body/redux/api/adminApi';
import { ListingStatus, ListingCategory, ListingType } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

jest.mock('@/body/redux/api/axiosInstance', () => ({
    get: jest.fn(),
    patch: jest.fn(),
    put: jest.fn(),
}));

describe('adminApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('getAdminListingsApi should call correct endpoint with params', async () => {
        const filter: AdminListingFilter = { page: 1, pageSize: 10, city: 'London' };
        const mockResponse = { data: { listings: [], totalCount: 0 } };
        (axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

        const result = await getAdminListingsApi(filter);

        expect(axiosInstance.get).toHaveBeenCalledWith('/admin/listings', { params: filter });
        expect(result).toEqual(mockResponse.data);
    });

    it('approveListingApi should call patch with auto param', async () => {
        const mockResponse = { data: { success: true } };
        (axiosInstance.patch as jest.Mock).mockResolvedValue(mockResponse);

        const result = await approveListingApi(123, true);

        expect(axiosInstance.patch).toHaveBeenCalledWith('/admin/listings/123/approve', null, { params: { auto: true } });
        expect(result).toEqual(mockResponse.data);
    });

    it('rejectListingApi should call patch with note', async () => {
        const mockResponse = { data: { success: true } };
        (axiosInstance.patch as jest.Mock).mockResolvedValue(mockResponse);

        const result = await rejectListingApi(123, 'Spam');

        expect(axiosInstance.patch).toHaveBeenCalledWith('/admin/listings/123/reject', 'Spam');
        expect(result).toEqual(mockResponse.data);
    });

    it('getAdminModerationRuleApi should return null if no data', async () => {
        (axiosInstance.get as jest.Mock).mockResolvedValue({ data: null });
        const result = await getAdminModerationRuleApi();
        expect(result).toBeNull();
    });

    it('getAdminModerationRuleApi should return data', async () => {
        const mockData: AdminModerationRuleDto = { isAutomataEnabled: true };
        (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });
        const result = await getAdminModerationRuleApi();
        expect(result).toEqual(mockData);
    });

    it('saveAdminModerationRuleApi should call put', async () => {
        const payload: AdminModerationRuleDto = { isAutomataEnabled: true };
        const mockResponse = { data: payload };
        (axiosInstance.put as jest.Mock).mockResolvedValue(mockResponse);

        const result = await saveAdminModerationRuleApi(payload);

        expect(axiosInstance.put).toHaveBeenCalledWith('/admin/moderation-rule', payload);
        expect(result).toEqual(payload);
    });

    it('reopenListingApi should call patch', async () => {
        const mockResponse = { data: { success: true } };
        (axiosInstance.patch as jest.Mock).mockResolvedValue(mockResponse);

        const result = await reopenListingApi(99);

        expect(axiosInstance.patch).toHaveBeenCalledWith('/admin/listings/99/reopen');
        expect(result).toEqual(mockResponse.data);
    });

    it('updateListingStatusApi should call patch with status', async () => {
        const mockResponse = { data: { success: true } };
        (axiosInstance.patch as jest.Mock).mockResolvedValue(mockResponse);

        await updateListingStatusApi(50, ListingStatus.Active);
        expect(axiosInstance.patch).toHaveBeenCalledWith('/admin/listings/50/status', ListingStatus.Active);
    });

    it('findUserByEmailApi should call get with email param', async () => {
        const mockResponse = { data: { id: 1 } };
        (axiosInstance.get as jest.Mock).mockResolvedValue(mockResponse);

        await findUserByEmailApi('test@test.com');
        expect(axiosInstance.get).toHaveBeenCalledWith('/admin/users/find-user-by-email', { params: { email: 'test@test.com' } });
    });

    it('toggleAdminUserStatusApi should call patch', async () => {
        const mockResponse = { data: { success: true } };
        (axiosInstance.patch as jest.Mock).mockResolvedValue(mockResponse);

        await toggleAdminUserStatusApi('user1');
        expect(axiosInstance.patch).toHaveBeenCalledWith('/admin/users/user1/toggle-status');
    });
});
