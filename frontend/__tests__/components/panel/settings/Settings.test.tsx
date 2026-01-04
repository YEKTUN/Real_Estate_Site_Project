import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Settings from '@/body/panel/components/Settings';
import { useAppDispatch } from '@/body/redux/hooks';
import axiosInstance from '@/body/redux/api/axiosInstance';
import { logoutAsync, deactivateAccount } from '@/body/redux/slices/auth/AuthSlice';

jest.mock('@/body/redux/hooks', () => ({
    useAppDispatch: jest.fn(),
}));

jest.mock('@/body/redux/api/axiosInstance');
jest.mock('@/body/redux/slices/auth/AuthSlice', () => ({
    logoutAsync: jest.fn(),
    deactivateAccount: jest.fn(),
}));

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

describe('Settings Component', () => {
    const mockDispatch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useAppDispatch as jest.Mock).mockReturnValue(mockDispatch);

        // Mock get/put
        (axiosInstance.get as jest.Mock).mockResolvedValue({
            data: {
                emailNotifications: true,
                smsNotifications: false,
                pushNotifications: true,
                newListingNotifications: true,
                priceDropNotifications: true,
                messageNotifications: true,
                showPhone: false,
                showEmail: true,
                profileVisible: true
            }
        });

        (axiosInstance.put as jest.Mock).mockResolvedValue({ data: { success: true } });

        (deactivateAccount as unknown as jest.Mock).mockReturnValue({
            type: 'auth/deactivateAccount/fulfilled',
            payload: 'Success'
        });

        // Mock Thunk Return for logout
        (logoutAsync as unknown as jest.Mock).mockReturnValue({ unwrap: () => Promise.resolve() });

        // We also need to distinguish `deactivateAccount.fulfilled.match`
        const da = require('@/body/redux/slices/auth/AuthSlice').deactivateAccount;
        da.fulfilled = { match: (action: any) => action.type === 'auth/deactivateAccount/fulfilled' };
    });

    it('should load and display settings', async () => {
        render(<Settings />);

        await waitFor(() => {
            // "E-posta" appears multiple times (Notification settings and Privacy settings)
            expect(screen.getAllByText('E-posta').length).toBeGreaterThan(0);
            // Check if toggle state is reflected
            // Since we use visual divs for checked state, we might check class names or surrounding logic.
            // The "E-posta" text is there. Ideally we check if it is ON.
            // Our toggle component uses 'bg-blue-600' for checked.
        });
    });

    it('should toggle setting and save', async () => {
        render(<Settings />);
        await waitFor(() => expect(screen.getAllByText('E-posta').length).toBeGreaterThan(0));

        // Find the specific toggle. "E-posta" is text inside the toggle.
        const toggles = screen.getAllByText('E-posta');
        const emailToggleText = toggles.find(el => el.closest('div[class*="group"]'));

        if (!emailToggleText) throw new Error('Toggle text not found');
        const emailToggle = emailToggleText.closest('div[class*="group"]');
        if (!emailToggle) throw new Error('Toggle container not found');

        fireEvent.click(emailToggle);

        await waitFor(() => {
            expect(axiosInstance.put).toHaveBeenCalledWith('/usersettings', expect.objectContaining({
                EmailNotifications: false // Toggled from true
            }));
        });
    });

    it('should handle deactivate account flow', async () => {
        render(<Settings />);

        const deleteBtn = screen.getByText('Hesabı Sil');
        fireEvent.click(deleteBtn);

        expect(screen.getByText('Hesabınızı Silmek İstiyor Musunuz?')).toBeInTheDocument();

        const confirmBtn = screen.getByText('Hesabı Silmeyi Onayla');
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(deactivateAccount).toHaveBeenCalled();
        });
    });
});
