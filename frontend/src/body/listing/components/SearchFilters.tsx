'use client';

import { ListingSearchDto, ListingCategory, ListingType, ListingSortBy } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

/**
 * Arama ve Filtre Bileşeni
 * 
 * İlan arama ve filtreleme kontrollerini içerir.
 */

// İl listesi
const cities = [
  'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana', 
  'Konya', 'Gaziantep', 'Mersin', 'Kayseri', 'Trabzon', 'Samsun'
];

// Oda sayıları
const roomOptions = ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1', '5+2', '6+'];

interface SearchFiltersProps {
  filters: ListingSearchDto;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onFilterChange: (key: keyof ListingSearchDto, value: any) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  onSortChange: (sortBy: ListingSortBy) => void;
}

export default function SearchFilters({
  filters,
  searchTerm,
  onSearchTermChange,
  onFilterChange,
  onSearch,
  onClearFilters,
  onSortChange,
}: SearchFiltersProps) {
  /**
   * Enter tuşu ile arama
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <>
      {/* Arama Alanı */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="İlan başlığı, konum veya anahtar kelime ara..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          </div>
          <button
            onClick={onSearch}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Ara
          </button>
        </div>

        {/* Filtreler */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          {/* Kategori */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori
            </label>
            <select
              value={filters.category || ''}
              onChange={(e) => onFilterChange('category', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Tümü</option>
              <option value={ListingCategory.Residential}>Konut</option>
              <option value={ListingCategory.Commercial}>İşyeri</option>
              <option value={ListingCategory.Land}>Arsa</option>
            </select>
          </div>

          {/* İlan Tipi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İlan Tipi
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => onFilterChange('type', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Tümü</option>
              <option value={ListingType.ForSale}>Satılık</option>
              <option value={ListingType.ForRent}>Kiralık</option>
            </select>
          </div>

          {/* İl */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İl
            </label>
            <select
              value={filters.city || ''}
              onChange={(e) => onFilterChange('city', e.target.value || undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Tümü</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Min Fiyat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Fiyat
            </label>
            <input
              type="number"
              value={filters.minPrice || ''}
              onChange={(e) => onFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="₺ 0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Max Fiyat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Fiyat
            </label>
            <input
              type="number"
              value={filters.maxPrice || ''}
              onChange={(e) => onFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="₺ 10,000,000"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Oda Sayısı */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Oda Sayısı
            </label>
            <select
              value={filters.roomCount || ''}
              onChange={(e) => onFilterChange('roomCount', e.target.value || undefined)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Tümü</option>
              {roomOptions.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>

          {/* Temizle Butonu */}
          <div className="flex items-end">
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Sıralama */}
      <div className="flex justify-end mt-4">
        <select 
          value={filters.sortBy}
          onChange={(e) => onSortChange(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg outline-none"
        >
          <option value={ListingSortBy.Newest}>En Yeni</option>
          <option value={ListingSortBy.Oldest}>En Eski</option>
          <option value={ListingSortBy.PriceAsc}>Fiyat (Düşükten Yükseğe)</option>
          <option value={ListingSortBy.PriceDesc}>Fiyat (Yüksekten Düşüğe)</option>
          <option value={ListingSortBy.MostViewed}>En Çok Görüntülenen</option>
          <option value={ListingSortBy.MostFavorited}>En Çok Favorilenen</option>
        </select>
      </div>
    </>
  );
}

