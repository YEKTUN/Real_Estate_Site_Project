/**
 * ProfileSection Component Tests
 * 
 * Profil sayfasının render ve temel etkileşim testleri.
 */

import { screen, fireEvent } from '@testing-library/react';
import { render, createAuthenticatedState, createMockUser } from '../../utils/test-utils';
import ProfileSection from '@/body/panel/components/ProfileSection';

// Mock API calls
jest.mock('@/body/redux/api/authApi', () => ({
    changePasswordApi: jest.fn(),
    updateProfileApi: jest.fn(),
}));

jest.mock('@/body/redux/slices/cloudinary/CloudinarySlice', () => ({
    uploadFile: jest.fn(),
    selectIsUploadingFile: jest.fn(() => false),
}));

describe('ProfileSection', () => {
    const mockUser = createMockUser({
        name: 'Test',
        surname: 'User',
        email: 'test@example.com',
        phone: '5551234567',
        profilePictureUrl: 'https://example.com/avatar.jpg'
    });

    const authState = createAuthenticatedState({ user: mockUser });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should render user personal information', () => {
        render(<ProfileSection />, { preloadedState: { auth: authState } });

        // Inputs should have values
        expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
        expect(screen.getByDisplayValue('User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    test('should render edit button', () => {
        render(<ProfileSection />, { preloadedState: { auth: authState } });

        expect(screen.getByText(/DÜZENLE/i)).toBeInTheDocument();
    });

    test('should enable inputs when edit button is clicked', () => {
        render(<ProfileSection />, { preloadedState: { auth: authState } });

        const editButton = screen.getByText(/DÜZENLE/i);
        fireEvent.click(editButton);

        const nameInput = screen.getByDisplayValue('Test');
        expect(nameInput).not.toBeDisabled();

        expect(screen.getByText(/KAYDET/i)).toBeInTheDocument();
        expect(screen.getByText(/İPTAL/i)).toBeInTheDocument();
    });

    test('should render password change section', () => {
        render(<ProfileSection />, { preloadedState: { auth: authState } });

        // Using role for heading is more robust
        const heading = screen.getByRole('heading', { name: /şifre işlemleri/i });
        expect(heading).toBeInTheDocument();

        expect(screen.getByText(/ŞİFRE DEĞİŞTİR/i)).toBeInTheDocument();
    });

    test('should show password change form when clicked', () => {
        render(<ProfileSection />, { preloadedState: { auth: authState } });

        // Click the button showing "ŞİFRE DEĞİŞTİR"
        // Since there might be a heading with similar text, we target the button
        const changePassButton = screen.getByRole('button', { name: /şifre değiştir/i });
        fireEvent.click(changePassButton);

        expect(screen.getByText(/MEVCUT ŞİFRE/i)).toBeInTheDocument();
        expect(screen.getByText(/^YENİ ŞİFRE$/i)).toBeInTheDocument();
        expect(screen.getByText(/YENİ ŞİFRE TEKRAR/i)).toBeInTheDocument();
    });
});
