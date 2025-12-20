/**
 * UserAvatar Component Tests
 */

import { render, screen } from '../../utils/test-utils';
import UserAvatar from '@/body/panel/components/UserAvatar';

describe('UserAvatar', () => {
  it('should render with name initial when no profile picture', () => {
    render(<UserAvatar name="Test" surname="User" />);
    
    expect(screen.getByText('TU')).toBeInTheDocument();
  });

  it('should render with profile picture when provided', () => {
    render(
      <UserAvatar
        name="Test"
        surname="User"
        profilePictureUrl="https://example.com/avatar.jpg"
      />
    );
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(img).toHaveAttribute('alt', 'Test User');
  });

  it('should render with placeholder when no name', () => {
    render(<UserAvatar name="" surname="" />);
    
    // Should show placeholder
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <UserAvatar name="Test" surname="User" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should render different sizes', () => {
    const { rerender } = render(
      <UserAvatar name="Test" surname="User" size="sm" />
    );
    
    expect(screen.getByText('TU')).toBeInTheDocument();
    
    rerender(<UserAvatar name="Test" surname="User" size="lg" />);
    expect(screen.getByText('TU')).toBeInTheDocument();
  });
});

