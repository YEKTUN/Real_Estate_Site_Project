/**
 * UserAvatar Component Tests
 */

import { render, screen } from '../../utils/test-utils';
import UserAvatar from '@/body/panel/components/UserAvatar';

describe('UserAvatar', () => {
  it('should render with placeholder image when no profile picture', () => {
    render(<UserAvatar name="Test" surname="User" />);

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png');
    expect(img).toHaveAttribute('alt', 'Test User');
    expect(img).toHaveAttribute('title', 'Test User');
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

    // Should show placeholder image
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png');
  });

  it('should apply custom className', () => {
    render(
      <UserAvatar name="Test" surname="User" className="custom-class" />
    );

    const img = screen.getByRole('img');
    expect(img).toHaveClass('custom-class');
  });

  it('should render different sizes', () => {
    const { rerender } = render(
      <UserAvatar name="Test" surname="User" size="sm" />
    );

    let img = screen.getByRole('img');
    expect(img).toHaveClass('w-8', 'h-8', 'text-xs');

    rerender(<UserAvatar name="Test" surname="User" size="lg" />);
    img = screen.getByRole('img');
    expect(img).toHaveClass('w-12', 'h-12', 'text-base');
  });
});
