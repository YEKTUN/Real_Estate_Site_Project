import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPage from '@/body/auth/RegisterPage';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import { register, clearError } from '@/body/redux/slices/auth/AuthSlice';
import { useRouter } from 'next/navigation';

// Mocks
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

jest.mock('@/body/redux/hooks', () => ({
    useAppDispatch: jest.fn(),
    useAppSelector: jest.fn(),
}));

jest.mock('@/body/redux/slices/auth/AuthSlice', () => ({
    register: jest.fn(),
    clearError: jest.fn(),
    selectIsLoading: jest.fn(),
    selectError: jest.fn(),
    selectIsAuthenticated: jest.fn(),
}));

jest.mock('@/body/auth/components/GoogleLoginButton', () => {
    return function MockGoogleLoginButton() {
        return <div data-testid="google-signup-button">Google Signup</div>;
    };
});

// Mock validation utils if needed, but using real ones is better for integration.
// Assuming they work. If tests fail due to validation, we know where to look.

describe('RegisterPage', () => {
    const mockDispatch = jest.fn();
    const mockPush = jest.fn();

    const defaultSelectors = {
        isLoading: false,
        error: null,
        isAuthenticated: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);
        (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
        (register as unknown as jest.Mock).mockReturnValue({ type: 'auth/register/pending' });

        setupSelectors();
    });

    const setupSelectors = (overrides: Partial<typeof defaultSelectors> = {}) => {
        const values = { ...defaultSelectors, ...overrides };

        (useAppSelector as jest.Mock).mockImplementation((selector) => {
            const authSlice = require('@/body/redux/slices/auth/AuthSlice');
            if (selector === authSlice.selectIsLoading) return values.isLoading;
            if (selector === authSlice.selectError) return values.error;
            if (selector === authSlice.selectIsAuthenticated) return values.isAuthenticated;
            return undefined;
        });
    };

    const fillForm = () => {
        fireEvent.change(screen.getByPlaceholderText('Ahmet'), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText('Yılmaz'), { target: { value: 'User' } });
        fireEvent.change(screen.getByPlaceholderText('adiniz@ornek.com'), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText('05342503741'), { target: { value: '05555555555' } });

        // Handling password inputs (multiple inputs with potentially same type, use name or placeholder)
        // Using placeholder which seems unique enough or name attribute via querySelector
        // Inputs: name="password", name="confirmPassword".
        const passwordInput = screen.container.querySelector('input[name="password"]');
        const confirmInput = screen.container.querySelector('input[name="confirmPassword"]');

        if (passwordInput) fireEvent.change(passwordInput, { target: { value: 'Pass1234' } });
        if (confirmInput) fireEvent.change(confirmInput, { target: { value: 'Pass1234' } });

        // Check terms
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
    };

    it('should render register form', () => {
        const { container } = render(<RegisterPage />);

        expect(screen.getByText('Hesap Oluştur')).toBeInTheDocument();
        expect(container.querySelector('input[name="name"]')).toBeInTheDocument();
        expect(container.querySelector('input[name="surname"]')).toBeInTheDocument();
        expect(container.querySelector('input[name="email"]')).toBeInTheDocument();
        expect(container.querySelector('input[name="phone"]')).toBeInTheDocument();
        expect(container.querySelector('input[name="password"]')).toBeInTheDocument();
        expect(container.querySelector('input[name="confirmPassword"]')).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Kayıt Ol' })).toBeInTheDocument();
    });

    it('should show validation errors on submit with empty fields', async () => {
        const { container } = render(<RegisterPage />);

        const submitBtn = screen.getByRole('button', { name: 'Kayıt Ol' });
        fireEvent.click(submitBtn);

        // Expect validation messages. Note: Component updates state and re-renders.
        // It uses `validateField` on submit.
        expect(screen.getByText('Ad en az 2 karakter olmalıdır')).toBeInTheDocument();
        // Check other errors...
        expect(screen.getByText('Kullanım koşullarını kabul etmelisiniz')).toBeInTheDocument();
    });

    it('should validate password match', () => {
        const { container } = render(<RegisterPage />);

        const passwordInput = container.querySelector('input[name="password"]');
        const confirmInput = container.querySelector('input[name="confirmPassword"]');

        if (passwordInput && confirmInput) {
            fireEvent.change(passwordInput, { target: { value: 'Pass1234' } });
            fireEvent.change(confirmInput, { target: { value: 'Different' } });

            // Trigger blur or submit to validate?
            // Component calls validateField in handleChange too for 'confirmPassword'?
            // Logic: handleChange calls validateField(name, value).
            // CASE 'confirmPassword': if (value !== formData.password) ...

            // Need to verify 'Different' triggers mismatch error.
            expect(screen.getByText('Şifreler eşleşmiyor')).toBeInTheDocument();
        } else {
            throw new Error('Inputs not found');
        }
    });

    it('should submit form with valid data', async () => {
        // Need to wrap in helper to access screen/container inside
        const { container } = render(<RegisterPage />);
        screen.container = container; // Hack for fillForm using global screen? No, fillForm uses screen imported from lib.
        // But screen relies on global DOM. render() binds it.
        // However, helper function needs to find elements.

        // Manually fill here to be safe
        fireEvent.change(container.querySelector('input[name="name"]')!, { target: { value: 'Test' } });
        fireEvent.change(container.querySelector('input[name="surname"]')!, { target: { value: 'User' } });
        fireEvent.change(container.querySelector('input[name="email"]')!, { target: { value: 'test@example.com' } });
        fireEvent.change(container.querySelector('input[name="phone"]')!, { target: { value: '05555555555' } });
        fireEvent.change(container.querySelector('input[name="password"]')!, { target: { value: 'Pass1234' } });
        fireEvent.change(container.querySelector('input[name="confirmPassword"]')!, { target: { value: 'Pass1234' } });

        const checkbox = screen.getByRole('checkbox');
        if (!checkbox.hasAttribute('checked')) fireEvent.click(checkbox);

        const submitBtn = screen.getByRole('button', { name: 'Kayıt Ol' });
        fireEvent.click(submitBtn);

        expect(mockDispatch).toHaveBeenCalledWith(register({
            name: 'Test',
            surname: 'User',
            email: 'test@example.com',
            phone: '05555555555',
            password: 'Pass1234',
            confirmPassword: 'Pass1234'
        }));
    });

    it('should redirect if authenticated', () => {
        setupSelectors({ isAuthenticated: true });
        render(<RegisterPage />);
        expect(mockPush).toHaveBeenCalledWith('/panel');
    });
});
