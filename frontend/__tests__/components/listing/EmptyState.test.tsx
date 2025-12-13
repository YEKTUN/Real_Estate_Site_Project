/**
 * EmptyState Component Tests
 * 
 * Boş durum bileşeninin testleri.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '@/body/listing/components/EmptyState';

// ============================================================================
// TESTS
// ============================================================================

describe('EmptyState', () => {
  const mockOnClearFilters = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render empty state message', () => {
      render(<EmptyState onClearFilters={mockOnClearFilters} />);

      expect(screen.getByText(/ilan bulunamadı/i)).toBeInTheDocument();
    });

    test('should render description text', () => {
      render(<EmptyState onClearFilters={mockOnClearFilters} />);

      expect(screen.getByText(/arama kriterlerinize uygun ilan bulunamadı/i)).toBeInTheDocument();
    });

    test('should render clear filters button', () => {
      render(<EmptyState onClearFilters={mockOnClearFilters} />);

      expect(screen.getByRole('button', { name: /filtreleri temizle/i })).toBeInTheDocument();
    });

    test('should render house emoji', () => {
      render(<EmptyState onClearFilters={mockOnClearFilters} />);

      expect(screen.getByText('🏠')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('should call onClearFilters when button is clicked', () => {
      render(<EmptyState onClearFilters={mockOnClearFilters} />);

      const clearButton = screen.getByRole('button', { name: /filtreleri temizle/i });
      fireEvent.click(clearButton);

      expect(mockOnClearFilters).toHaveBeenCalledTimes(1);
    });
  });
});

