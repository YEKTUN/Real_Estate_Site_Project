/**
 * SearchFilters Component Tests
 * 
 * Arama ve filtreleme bileşeninin testleri.
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
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

      const searchInput = screen.getByPlaceholderText(/kelime veya cümle/i);
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

      expect(screen.getByRole('button', { name: /ilanları filtrele/i })).toBeInTheDocument();
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
      expect(screen.getByText(/^İl$/)).toBeInTheDocument();
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

      const priceContainer = screen.getByText(/fiyat aralığı/i).closest('.space-y-1') as HTMLElement;
      expect(within(priceContainer).getByPlaceholderText('Min')).toBeInTheDocument();
      expect(within(priceContainer).getByPlaceholderText('Max')).toBeInTheDocument();
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

      expect(screen.getByRole('button', { name: /filtreleri sıfırla/i })).toBeInTheDocument();
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

      const searchInput = screen.getByPlaceholderText(/kelime veya cümle/i);
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

      const searchButton = screen.getByRole('button', { name: /ilanları filtrele/i });
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

      const searchInput = screen.getByPlaceholderText(/kelime veya cümle/i);
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

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

      const konutBtn = screen.getByRole('button', { name: /konut/i });
      fireEvent.click(konutBtn);

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

      const satilikBtn = screen.getByRole('button', { name: /satılık/i });
      fireEvent.click(satilikBtn);

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

      // City select'i label üzerinden bulmak yerine, label'in yanındaki select'i al
      const cityLabel = screen.getByText(/^İl$/);
      const citySelect = cityLabel.parentElement?.querySelector('select') as HTMLSelectElement;
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

      const priceContainer = screen.getByText(/fiyat aralığı/i).closest('.space-y-1') as HTMLElement;
      const minPriceInput = within(priceContainer).getByPlaceholderText('Min');
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

      const clearButton = screen.getByRole('button', { name: /filtreleri sıfırla/i });
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

      expect(screen.getByRole('button', { name: /konut/i })).toHaveClass('bg-blue-50');
      expect(screen.getByRole('button', { name: /satılık/i })).toHaveClass('bg-white');
      expect(screen.getByDisplayValue('İstanbul')).toBeInTheDocument();
      expect(screen.getByDisplayValue('100000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('500000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3+1')).toBeInTheDocument();
    });
  });
});

