/**
 * Footer Component Tests
 * 
 * Footer bileşeninin render ve link testleri.
 */

import { render, screen } from '@testing-library/react';
import Footer from '@/body/components/Footer';

// ============================================================================
// TESTS
// ============================================================================

describe('Footer', () => {
  describe('Rendering', () => {
    test('should render company name', () => {
      render(<Footer />);

      expect(screen.getByText('🏠 Real Estate')).toBeInTheDocument();
    });

    test('should render company description', () => {
      render(<Footer />);

      expect(screen.getByText(/hayalinizdeki evi bulmak için/i)).toBeInTheDocument();
    });

    test('should render quick links section', () => {
      render(<Footer />);

      expect(screen.getByText('Hızlı Bağlantılar')).toBeInTheDocument();
    });

    test('should render contact section', () => {
      render(<Footer />);

      expect(screen.getByText('İletişim')).toBeInTheDocument();
    });

    test('should render copyright text', () => {
      render(<Footer />);

      expect(screen.getByText(/© 2024 Real Estate/i)).toBeInTheDocument();
    });

    test('should render all navigation links', () => {
      render(<Footer />);

      expect(screen.getByRole('link', { name: 'Ana Sayfa' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'İlanlar' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Hakkımızda' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'İletişim' })).toBeInTheDocument();
    });

    test('should render contact information', () => {
      render(<Footer />);

      expect(screen.getByText(/info@realestate.com/)).toBeInTheDocument();
      expect(screen.getByText(/\+90 555 123 4567/)).toBeInTheDocument();
      expect(screen.getByText(/İstanbul, Türkiye/)).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    test('should have correct href for Ana Sayfa', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: 'Ana Sayfa' });
      expect(link).toHaveAttribute('href', '/');
    });

    test('should have correct href for İlanlar', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: 'İlanlar' });
      expect(link).toHaveAttribute('href', '/properties');
    });

    test('should have correct href for Hakkımızda', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: 'Hakkımızda' });
      expect(link).toHaveAttribute('href', '/about');
    });

    test('should have correct href for İletişim', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: 'İletişim' });
      expect(link).toHaveAttribute('href', '/contact');
    });
  });
});

