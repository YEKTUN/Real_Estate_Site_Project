import { sendVerificationCodeApi, verifyPhoneCodeApi, getPhoneVerificationStatusApi } from '@/body/redux/api/phoneVerificationApi';
import axiosInstance from '@/body/redux/api/axiosInstance';

// Mock axios instance
jest.mock('@/body/redux/api/axiosInstance');
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('phoneVerificationApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('sendVerificationCodeApi', () => {
        it('should return success response when API call is successful', async () => {
            const mockResponse = { data: { success: true, message: 'Code sent', code: '123456' } };
            mockedAxios.post.mockResolvedValue(mockResponse);

            const result = await sendVerificationCodeApi('05342503741');

            expect(mockedAxios.post).toHaveBeenCalledWith('/PhoneVerification/send-code', { phone: '05342503741' });
            expect(result).toEqual(mockResponse.data);
        });

        it('should return error response when API call fails', async () => {
            const mockError = { response: { data: { message: 'Invalid phone' } } };
            mockedAxios.post.mockRejectedValue(mockError);

            const result = await sendVerificationCodeApi('05342503741');

            expect(result).toEqual({ success: false, message: 'Invalid phone' });
        });
    });

    describe('verifyPhoneCodeApi', () => {
        it('should return success response when verification is successful', async () => {
            const mockResponse = { data: { success: true, message: 'Verified', phoneVerified: true } };
            mockedAxios.post.mockResolvedValue(mockResponse);

            const result = await verifyPhoneCodeApi('123456', '05342503741');

            expect(mockedAxios.post).toHaveBeenCalledWith('/PhoneVerification/verify-code', { code: '123456', phone: '05342503741' });
            expect(result).toEqual(mockResponse.data);
        });

        it('should return error response when verification fails', async () => {
            const mockError = { response: { data: { message: 'Wrong code' } } };
            mockedAxios.post.mockRejectedValue(mockError);

            const result = await verifyPhoneCodeApi('000000', '05342503741');

            expect(result).toEqual({ success: false, message: 'Wrong code' });
        });
    });

    describe('getPhoneVerificationStatusApi', () => {
        it('should return status when successful', async () => {
            const mockResponse = { data: { success: true, phoneVerified: true, hasPhone: true, phone: '05342503741' } };
            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await getPhoneVerificationStatusApi();

            expect(mockedAxios.get).toHaveBeenCalledWith('/PhoneVerification/status');
            expect(result).toEqual(mockResponse.data);
        });

        it('should return default error state when call fails', async () => {
            mockedAxios.get.mockRejectedValue(new Error('Network error'));

            const result = await getPhoneVerificationStatusApi();

            expect(result).toEqual({
                success: false,
                phoneVerified: false,
                hasPhone: false,
                phone: undefined,
            });
        });
    });
});
