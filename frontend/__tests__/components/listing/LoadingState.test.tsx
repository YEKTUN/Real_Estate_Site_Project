/**
 * LoadingState Component Tests
 * 
 * Yükleme durumu bileşeninin testleri.
 */

import { render, screen } from '@testing-library/react';
import LoadingState from '@/body/listing/components/LoadingState';

// ============================================================================
// TESTS
// ============================================================================

describe('LoadingState', () => {
  describe('Rendering', () => {
    test('should render loading message', () => {
      render(<LoadingState />);

      expect(screen.getByText('İlanlar yükleniyor...')).toBeInTheDocument();
    });

    test('should render spinner element', () => {
      render(<LoadingState />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });
});

