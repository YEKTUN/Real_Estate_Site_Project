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

      expect(screen.getByText('🏠 Real Estimate')).toBeInTheDocument();
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

      // Başlık (heading) olarak iletişim bölümünü kontrol et
      expect(
        screen.getByRole('heading', { name: 'İletişim' })
      ).toBeInTheDocument();
    });

    test('should render copyright text', () => {
      render(<Footer />);

      expect(screen.getByText(/© 2024 Real Estimate/i)).toBeInTheDocument();
    });

    test('should render all navigation links', () => {
      render(<Footer />);

      expect(screen.getByRole('link', { name: 'Tüm İlanlar' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Satılık' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Kiralık' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Konut' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'İş Yeri' })).toBeInTheDocument();
    });

    test('should render contact information', () => {
      render(<Footer />);

      expect(screen.getByText(/info@realestimate.com/)).toBeInTheDocument();
      expect(screen.getByText(/\+90 555 123 4567/)).toBeInTheDocument();
      expect(screen.getByText(/İstanbul, Türkiye/)).toBeInTheDocument();
    });
  });

  describe('Links', () => {
    test('should have correct href for Tüm İlanlar', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: 'Tüm İlanlar' });
      expect(link).toHaveAttribute('href', '/');
    });

    test('should have correct href for Satılık', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: 'Satılık' });
      expect(link).toHaveAttribute('href', '/?type=1');
    });

    test('should have correct href for Kiralık', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: 'Kiralık' });
      expect(link).toHaveAttribute('href', '/?type=2');
    });

    test('should have correct href for Konut', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: 'Konut' });
      expect(link).toHaveAttribute('href', '/?category=1');
    });

    test('should have correct href for İş Yeri', () => {
      render(<Footer />);

      const link = screen.getByRole('link', { name: 'İş Yeri' });
      expect(link).toHaveAttribute('href', '/?category=2');
    });
  });
});
