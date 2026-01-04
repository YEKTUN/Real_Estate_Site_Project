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
    test('should render brand and description', () => {
      render(<Footer />);
      expect(screen.getByText('RealEstimate')).toBeInTheDocument();
      expect(screen.getByText(/Gayrimenkul dünyasında güvenin ve yeniliğin adresi/i)).toBeInTheDocument();
    });

    test('should render section headings', () => {
      render(<Footer />);
      expect(screen.getByRole('heading', { name: 'Hızlı Erişim' })).toBeInTheDocument();
      // There are two "İletişim" headings? No, one is Hızlı Erişim links, one is Contact Info header.
      // Actually in the new file:
      // One header "Hızlı Erişim"
      // One header "İletişim"
      // One header "Bülten"
      expect(screen.getByRole('heading', { name: 'İletişim' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Bülten' })).toBeInTheDocument();
    });

    test('should render copyright text', () => {
      render(<Footer />);
      const year = new Date().getFullYear();
      expect(screen.getByText(new RegExp(`© ${year} RealEstimate Gayrimenkul`, 'i'))).toBeInTheDocument();
    });

    test('should render contact information', () => {
      render(<Footer />);
      expect(screen.getByText(/Levent Mah. Büyükdere Cad/i)).toBeInTheDocument();
      expect(screen.getByText('+90 212 555 1234')).toBeInTheDocument();
      expect(screen.getByText('info@realestimate.com')).toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    test('should render quick links with correct hrefs', () => {
      render(<Footer />);

      const homeLink = screen.getByRole('link', { name: 'Ana Sayfa' });
      expect(homeLink).toHaveAttribute('href', '/');

      const aboutLink = screen.getByRole('link', { name: 'Hakkımızda' });
      expect(aboutLink).toHaveAttribute('href', '/about');

      const listingsLink = screen.getByRole('link', { name: 'İlanlar' });
      expect(listingsLink).toHaveAttribute('href', '/');

      const contactLink = screen.getByRole('link', { name: 'İletişim' });
      expect(contactLink).toHaveAttribute('href', '/contact');
    });

    test('should render social media links', () => {
      render(<Footer />);
      // Social links don't have text, but they are links.
      // We can check by href or we can add aria-labels in source if needed, 
      // but for now let's just check if links with specific hrefs exist.

      // Generic check removed


      // Check specific social links by href
      const allLinks = screen.getAllByRole('link');
      expect(allLinks.some(link => link.getAttribute('href') === 'https://facebook.com/realestimate')).toBe(true);
      expect(allLinks.some(link => link.getAttribute('href') === 'https://twitter.com/realestimate')).toBe(true);
      expect(allLinks.some(link => link.getAttribute('href') === 'https://instagram.com/realestimate')).toBe(true);
      expect(allLinks.some(link => link.getAttribute('href') === 'https://linkedin.com/company/realestimate')).toBe(true);
    });

    test('should render bottom links', () => {
      render(<Footer />);
      expect(screen.getByRole('link', { name: 'Gizlilik Politikası' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Kullanım Şartları' })).toBeInTheDocument();
    });
  });

  describe('Newsletter', () => {
    test('should render newsletter form', () => {
      render(<Footer />);
      expect(screen.getByPlaceholderText('E-posta adresiniz')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Abone Ol/i })).toBeInTheDocument();
    });
  });
});
