/**
 * ResetPasswordPage Component Tests
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/test-utils';
import ResetPasswordPage from '@/body/forget-password/ResetPasswordPage';
import { resetPasswordApi } from '@/body/redux/api/authApi';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/authApi', () => ({
  resetPasswordApi: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => {
      if (key === 'token') return 'test-token';
      if (key === 'email') return 'test@example.com';
      return null;
    },
  }),
}));

const mockedResetPasswordApi = resetPasswordApi as jest.MockedFunction<typeof resetPasswordApi>;

// ============================================================================
// TESTS
// ============================================================================

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should render the form with token and email from URL', () => {
    render(<ResetPasswordPage />);

    expect(screen.getByText(/şifre sıfırla/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/yeni şifre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/şifre tekrarı/i)).toBeInTheDocument();
  });

  it('should show error when password is too short', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/yeni şifre/i);
    await user.type(passwordInput, 'short');

    const submitButton = screen.getByRole('button', { name: /sıfırla/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/en az 8 karakter/i)).toBeInTheDocument();
    });
  });

  it('should show error when passwords do not match', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/yeni şifre/i);
    const confirmInput = screen.getByLabelText(/şifre tekrarı/i);

    await user.type(passwordInput, 'NewPass123!');
    await user.type(confirmInput, 'DifferentPass123!');

    const submitButton = screen.getByRole('button', { name: /sıfırla/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/şifreler eşleşmiyor/i)).toBeInTheDocument();
    });
  });

  it('should call resetPasswordApi on valid submit', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockedResetPasswordApi.mockResolvedValueOnce({
      success: true,
      message: 'Şifre sıfırlandı',
    });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/yeni şifre/i);
    const confirmInput = screen.getByLabelText(/şifre tekrarı/i);

    await user.type(passwordInput, 'NewPass123!');
    await user.type(confirmInput, 'NewPass123!');

    const submitButton = screen.getByRole('button', { name: /sıfırla/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockedResetPasswordApi).toHaveBeenCalledWith(
        'test-token',
        'test@example.com',
        'NewPass123!',
        'NewPass123!'
      );
    });
  });

  it('should redirect to login after successful reset', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockedResetPasswordApi.mockResolvedValueOnce({
      success: true,
      message: 'Şifre sıfırlandı',
    });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/yeni şifre/i);
    const confirmInput = screen.getByLabelText(/şifre tekrarı/i);

    await user.type(passwordInput, 'NewPass123!');
    await user.type(confirmInput, 'NewPass123!');

    const submitButton = screen.getByRole('button', { name: /sıfırla/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/şifre sıfırlandı/i)).toBeInTheDocument();
    });

    jest.advanceTimersByTime(3000);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('should show error message on failed API call', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockedResetPasswordApi.mockResolvedValueOnce({
      success: false,
      message: 'Geçersiz token',
    });

    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText(/yeni şifre/i);
    const confirmInput = screen.getByLabelText(/şifre tekrarı/i);

    await user.type(passwordInput, 'NewPass123!');
    await user.type(confirmInput, 'NewPass123!');

    const submitButton = screen.getByRole('button', { name: /sıfırla/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/geçersiz token/i)).toBeInTheDocument();
    });
  });
});

