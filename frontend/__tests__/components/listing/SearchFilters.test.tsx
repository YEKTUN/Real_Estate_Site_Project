/**
 * SearchFilters Component Tests
 * 
 * Arama ve filtreleme bileşeninin testleri.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import SearchFilters from '@/body/listing/components/SearchFilters';
import { ListingSearchDto, ListingCategory, ListingType, ListingSortBy } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

// ============================================================================
// TEST DATA
// ============================================================================

const mockFilters: ListingSearchDto = {
  type: undefined,
  category: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  city: undefined,
  roomCount: undefined,
  sortBy: ListingSortBy.Newest,
  page: 1,
  pageSize: 12,
};

// ============================================================================
// TESTS
// ============================================================================

describe('SearchFilters', () => {
  const mockOnSearchTermChange = jest.fn();
  const mockOnFilterChange = jest.fn();
  const mockOnSearch = jest.fn();
  const mockOnClearFilters = jest.fn();
  const mockOnSortChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('should render search input', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const searchInput = screen.getByPlaceholderText(/ilan başlığı, konum/i);
      expect(searchInput).toBeInTheDocument();
    });

    test('should render search button', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByRole('button', { name: /ara/i })).toBeInTheDocument();
    });

    test('should render all filter dropdowns', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByLabelText(/kategori/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ilan tipi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/il/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/oda sayısı/i)).toBeInTheDocument();
    });

    test('should render price inputs', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByLabelText(/min fiyat/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/max fiyat/i)).toBeInTheDocument();
    });

    test('should render clear filters button', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByRole('button', { name: /temizle/i })).toBeInTheDocument();
    });

    test('should render sort dropdown', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const sortSelect = screen.getByDisplayValue(/en yeni/i);
      expect(sortSelect).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    test('should call onSearchTermChange when search input changes', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const searchInput = screen.getByPlaceholderText(/ilan başlığı, konum/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(mockOnSearchTermChange).toHaveBeenCalledWith('test');
    });

    test('should call onSearch when search button is clicked', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm="test search"
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const searchButton = screen.getByRole('button', { name: /ara/i });
      fireEvent.click(searchButton);

      expect(mockOnSearch).toHaveBeenCalled();
    });

    test('should call onSearch when Enter key is pressed in search input', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm="test"
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const searchInput = screen.getByPlaceholderText(/ilan başlığı, konum/i);
      fireEvent.keyPress(searchInput, { key: 'Enter', code: 'Enter' });

      expect(mockOnSearch).toHaveBeenCalled();
    });

    test('should call onFilterChange when category filter changes', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const categorySelect = screen.getByLabelText(/kategori/i);
      fireEvent.change(categorySelect, { target: { value: String(ListingCategory.Residential) } });

      expect(mockOnFilterChange).toHaveBeenCalledWith('category', ListingCategory.Residential);
    });

    test('should call onFilterChange when type filter changes', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const typeSelect = screen.getByLabelText(/ilan tipi/i);
      fireEvent.change(typeSelect, { target: { value: String(ListingType.ForSale) } });

      expect(mockOnFilterChange).toHaveBeenCalledWith('type', ListingType.ForSale);
    });

    test('should call onFilterChange when city filter changes', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const citySelect = screen.getByLabelText(/il/i);
      fireEvent.change(citySelect, { target: { value: 'İstanbul' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith('city', 'İstanbul');
    });

    test('should call onFilterChange when minPrice input changes', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const minPriceInput = screen.getByLabelText(/min fiyat/i);
      fireEvent.change(minPriceInput, { target: { value: '100000' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith('minPrice', 100000);
    });

    test('should call onClearFilters when clear button is clicked', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm="test"
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const clearButton = screen.getByRole('button', { name: /temizle/i });
      fireEvent.click(clearButton);

      expect(mockOnClearFilters).toHaveBeenCalled();
    });

    test('should call onSortChange when sort dropdown changes', () => {
      render(
        <SearchFilters
          filters={mockFilters}
          searchTerm=""
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      const sortSelect = screen.getByDisplayValue(/en yeni/i);
      fireEvent.change(sortSelect, { target: { value: String(ListingSortBy.PriceAsc) } });

      expect(mockOnSortChange).toHaveBeenCalledWith(ListingSortBy.PriceAsc);
    });
  });

  describe('Filter Values', () => {
    test('should display current filter values', () => {
      const filtersWithValues: ListingSearchDto = {
        ...mockFilters,
        category: ListingCategory.Residential,
        type: ListingType.ForSale,
        city: 'İstanbul',
        minPrice: 100000,
        maxPrice: 500000,
        roomCount: '3+1',
      };

      render(
        <SearchFilters
          filters={filtersWithValues}
          searchTerm="test"
          onSearchTermChange={mockOnSearchTermChange}
          onFilterChange={mockOnFilterChange}
          onSearch={mockOnSearch}
          onClearFilters={mockOnClearFilters}
          onSortChange={mockOnSortChange}
        />
      );

      expect(screen.getByDisplayValue('Konut')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Satılık')).toBeInTheDocument();
      expect(screen.getByDisplayValue('İstanbul')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('500000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3+1')).toBeInTheDocument();
    });
  });
});

