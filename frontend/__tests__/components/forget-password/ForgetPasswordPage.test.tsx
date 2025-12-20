/**
 * ForgetPasswordPage Component Tests
 */

import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../utils/test-utils';
import ForgetPasswordPage from '@/body/forget-password/ForgetPasswordPage';
import { forgetPasswordApi } from '@/body/redux/api/authApi';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/authApi', () => ({
  forgetPasswordApi: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockedForgetPasswordApi = forgetPasswordApi as jest.MockedFunction<typeof forgetPasswordApi>;

// ============================================================================
// TESTS
// ============================================================================

describe('ForgetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form', () => {
    render(<ForgetPasswordPage />);
    
    expect(screen.getByText('Şifremi Unuttum')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gönder/i })).toBeInTheDocument();
  });

  it('should show error when email is empty', async () => {
    const user = userEvent.setup();
    render(<ForgetPasswordPage />);
    
    const submitButton = screen.getByRole('button', { name: /gönder/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/lütfen email/i)).toBeInTheDocument();
    });
  });

  it('should show error when email format is invalid', async () => {
    const user = userEvent.setup();
    render(<ForgetPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /gönder/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/geçerli bir email/i)).toBeInTheDocument();
    });
  });

  it('should call forgetPasswordApi on valid submit', async () => {
    const user = userEvent.setup();
    mockedForgetPasswordApi.mockResolvedValueOnce({
      success: true,
      message: 'Email gönderildi',
    });
    
    render(<ForgetPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /gönder/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockedForgetPasswordApi).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should show success message on successful API call', async () => {
    const user = userEvent.setup();
    mockedForgetPasswordApi.mockResolvedValueOnce({
      success: true,
      message: 'Email gönderildi',
    });
    
    render(<ForgetPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /gönder/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/email gönderildi/i)).toBeInTheDocument();
    });
  });

  it('should show error message on failed API call', async () => {
    const user = userEvent.setup();
    mockedForgetPasswordApi.mockResolvedValueOnce({
      success: false,
      message: 'Kullanıcı bulunamadı',
    });
    
    render(<ForgetPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /gönder/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/kullanıcı bulunamadı/i)).toBeInTheDocument();
    });
  });

  it('should clear message when typing', async () => {
    const user = userEvent.setup();
    mockedForgetPasswordApi.mockResolvedValueOnce({
      success: false,
      message: 'Error',
    });
    
    render(<ForgetPasswordPage />);
    
    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@example.com');
    
    const submitButton = screen.getByRole('button', { name: /gönder/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
    
    await user.type(emailInput, 'x');
    
    await waitFor(() => {
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
    });
  });
});

