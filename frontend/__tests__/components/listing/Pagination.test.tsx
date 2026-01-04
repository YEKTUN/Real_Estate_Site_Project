/**
 * Pagination Component Tests
 * 
 * Sayfalama bileşeninin testleri.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import Pagination from '@/body/listing/components/Pagination';
import { PaginationDto } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

// ============================================================================
// TEST DATA
// ============================================================================

const mockPagination: PaginationDto = {
  currentPage: 1,
  pageSize: 12,
  totalPages: 5,
  totalCount: 50,
  hasPrevious: false,
  hasNext: true,
};

// ============================================================================
// TESTS
// ============================================================================

describe('Pagination', () => {
  const mockOnPageChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should not render when pagination is null', () => {
      const { container } = render(
        <Pagination pagination={null} currentPage={1} onPageChange={mockOnPageChange} />
      );

      expect(container.firstChild).toBeNull();
    });

    test('should not render when totalPages is 1', () => {
      const singlePagePagination: PaginationDto = {
        ...mockPagination,
        totalPages: 1,
      };

      const { container } = render(
        <Pagination pagination={singlePagePagination} currentPage={1} onPageChange={mockOnPageChange} />
      );

      expect(container.firstChild).toBeNull();
    });

    test('should render pagination controls', () => {
      render(
        <Pagination pagination={mockPagination} currentPage={1} onPageChange={mockOnPageChange} />
      );

      expect(screen.getByRole('button', { name: /Go to previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Go to next page/i })).toBeInTheDocument();
    });

    test('should render page numbers', () => {
      render(
        <Pagination pagination={mockPagination} currentPage={1} onPageChange={mockOnPageChange} />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    test('should highlight current page', () => {
      render(
        <Pagination pagination={mockPagination} currentPage={2} onPageChange={mockOnPageChange} />
      );

      const currentPageButton = screen.getByText('2');
      expect(currentPageButton).toHaveClass('bg-blue-600', 'text-white');
    });

    test('should disable Previous button on first page', () => {
      render(
        <Pagination pagination={mockPagination} currentPage={1} onPageChange={mockOnPageChange} />
      );

      const prevButton = screen.getByRole('button', { name: /Go to previous page/i });
      expect(prevButton).toBeDisabled();
    });

    test('should disable Next button on last page', () => {
      const lastPagePagination: PaginationDto = {
        ...mockPagination,
        currentPage: 5,
        hasNext: false,
        hasPrevious: true,
      };

      render(
        <Pagination pagination={lastPagePagination} currentPage={5} onPageChange={mockOnPageChange} />
      );

      const nextButton = screen.getByRole('button', { name: /Go to next page/i });
      expect(nextButton).toBeDisabled();
    });

    test('should show ellipsis when totalPages > 5', () => {
      const largePagination: PaginationDto = {
        ...mockPagination,
        totalPages: 10,
      };

      render(
        <Pagination pagination={largePagination} currentPage={1} onPageChange={mockOnPageChange} />
      );

      expect(screen.getByText('More pages')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('should call onPageChange when page number is clicked', () => {
      render(
        <Pagination pagination={mockPagination} currentPage={1} onPageChange={mockOnPageChange} />
      );

      const page2Button = screen.getByText('2');
      fireEvent.click(page2Button);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    test('should call onPageChange when Previous button is clicked', () => {
      const paginationWithPrevious: PaginationDto = {
        ...mockPagination,
        currentPage: 2,
        hasPrevious: true,
      };

      render(
        <Pagination pagination={paginationWithPrevious} currentPage={2} onPageChange={mockOnPageChange} />
      );

      const prevButton = screen.getByRole('button', { name: /Go to previous page/i });
      fireEvent.click(prevButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    test('should call onPageChange when Next button is clicked', () => {
      render(
        <Pagination pagination={mockPagination} currentPage={1} onPageChange={mockOnPageChange} />
      );

      const nextButton = screen.getByRole('button', { name: /Go to next page/i });
      fireEvent.click(nextButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    test('should call onPageChange when last page is clicked', () => {
      const largePagination: PaginationDto = {
        ...mockPagination,
        totalPages: 10,
      };

      render(
        <Pagination pagination={largePagination} currentPage={1} onPageChange={mockOnPageChange} />
      );

      const lastPageButton = screen.getByText('10');
      fireEvent.click(lastPageButton);

      expect(mockOnPageChange).toHaveBeenCalledWith(10);
    });
  });
});

