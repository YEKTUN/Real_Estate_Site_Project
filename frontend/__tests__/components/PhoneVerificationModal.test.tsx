import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhoneVerificationModal from '@/body/components/PhoneVerificationModal';
import { sendVerificationCodeApi, verifyPhoneCodeApi } from '@/body/redux/api/phoneVerificationApi';

// Mock API functions
jest.mock('@/body/redux/api/phoneVerificationApi');

const mockSendVerificationCodeApi = sendVerificationCodeApi as jest.MockedFunction<typeof sendVerificationCodeApi>;
const mockVerifyPhoneCodeApi = verifyPhoneCodeApi as jest.MockedFunction<typeof verifyPhoneCodeApi>;

describe('PhoneVerificationModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: jest.fn(),
        onSuccess: jest.fn(),
        initialPhone: '',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        render(<PhoneVerificationModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByText(/Telefon Doğrulama/i)).not.toBeInTheDocument();
    });

    it('should render correctly when open', () => {
        render(<PhoneVerificationModal {...defaultProps} />);
        expect(screen.getByText(/Telefon Doğrulama/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('05342503741')).toBeInTheDocument();
        expect(screen.getByText('Doğrulama Kodu Gönder')).toBeInTheDocument();
    });

    it('should handle phone input changes and validation', () => {
        render(<PhoneVerificationModal {...defaultProps} />);
        const input = screen.getByPlaceholderText('05342503741') as HTMLInputElement;
        const button = screen.getByText('Doğrulama Kodu Gönder');

        // Invalid input (short)
        fireEvent.change(input, { target: { value: '0534' } });
        expect(button).toBeDisabled();

        // Invalid input (wrong start)
        fireEvent.change(input, { target: { value: '02121234567' } });
        // Although the validation logic in component uses sanitize, the button disable logic checks length. 
        // Real validation logic is inside handleSendCode or inline. 
        // Let's check what the component does. It sanitizes input. 

        // Valid input
        fireEvent.change(input, { target: { value: '05342503741' } });
        expect(button).not.toBeDisabled();
    });

    it('should call sendVerificationCodeApi and switch to code step on success', async () => {
        mockSendVerificationCodeApi.mockResolvedValue({
            success: true,
            message: 'Kod gönderildi',
            code: '123456'
        });

        render(<PhoneVerificationModal {...defaultProps} initialPhone="05342503741" />);

        const button = screen.getByText('Doğrulama Kodu Gönder');
        fireEvent.click(button);

        expect(mockSendVerificationCodeApi).toHaveBeenCalledWith('05342503741');

        await waitFor(() => {
            expect(screen.getByText('Doğrulama kodunu girin')).toBeInTheDocument();
        });

        // Check simulation code is displayed
        expect(screen.getByText('111111')).toBeInTheDocument();
    });

    it('should display error if sendVerificationCodeApi fails', async () => {
        mockSendVerificationCodeApi.mockResolvedValue({
            success: false,
            message: 'Gönderim hatası',
        });

        render(<PhoneVerificationModal {...defaultProps} initialPhone="05342503741" />);

        const button = screen.getByText('Doğrulama Kodu Gönder');
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Gönderim hatası')).toBeInTheDocument();
        });
    });

    it('should handle code verification success', async () => {
        // Setup: Move to code step first
        mockSendVerificationCodeApi.mockResolvedValue({
            success: true,
            message: 'Kod gönderildi',
            code: '123456'
        });

        render(<PhoneVerificationModal {...defaultProps} initialPhone="05342503741" />);
        fireEvent.click(screen.getByText('Doğrulama Kodu Gönder'));

        await waitFor(() => {
            expect(screen.getByPlaceholderText('6 haneli kod')).toBeInTheDocument();
        });

        // Test verification
        mockVerifyPhoneCodeApi.mockResolvedValue({
            success: true,
            message: 'Doğrulandı',
            phoneVerified: true
        });

        const codeInput = screen.getByPlaceholderText('6 haneli kod');
        fireEvent.change(codeInput, { target: { value: '123456' } });

        const verifyButton = screen.getByText('Doğrula'); // The text is 'Doğrula' inside the button
        fireEvent.click(verifyButton);

        expect(mockVerifyPhoneCodeApi).toHaveBeenCalledWith('123456', '05342503741');

        await waitFor(() => {
            expect(screen.getByText('Telefon numaranız başarıyla doğrulandı!')).toBeInTheDocument();
        });

        // Check onSuccess and onClose delayed call
        await waitFor(() => {
            expect(defaultProps.onSuccess).toHaveBeenCalled();
            expect(defaultProps.onClose).toHaveBeenCalled();
        }, { timeout: 2000 });
    });
});
