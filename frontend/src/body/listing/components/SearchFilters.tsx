'use client';

import { ListingSearchDto, ListingCategory, ListingType, ListingSortBy } from '@/body/redux/slices/listing/DTOs/ListingDTOs';

interface SearchFiltersProps {
  filters: ListingSearchDto;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onFilterChange: (key: keyof ListingSearchDto, value: any) => void;
  onSearch: () => void;
  onClearFilters: () => void;
  onSortChange: (sortBy: ListingSortBy) => void;
}

const cities = [
  'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana',
  'Konya', 'Gaziantep', 'Mersin', 'Kayseri', 'Trabzon', 'Samsun'
];

const roomOptions = ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1', '5+2', '6+'];

export default function SearchFilters({
  filters,
  searchTerm,
  onSearchTermChange,
  onFilterChange,
  onSearch,
  onClearFilters,
  onSortChange,
}: SearchFiltersProps) {

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
      {/* Sidebar Header - Compact */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <h2 className="text-sm font-bold uppercase tracking-tight">Filtrele</h2>
        </div>
      </div>

      <div
        className="p-4 space-y-4 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-blue-400 transition-colors"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Text Search - Compact */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arama</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="İlan no, başlık..."
            className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 outline-none transition-all text-xs font-semibold"
          />
        </div>

        {/* Type Selection - Compact */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İlan Tipi</label>
          <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => onFilterChange('type', ListingType.ForSale)}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${filters.type === ListingType.ForSale ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-600'}`}
            >
              Satılık
            </button>
            <button
              onClick={() => onFilterChange('type', ListingType.ForRent)}
              className={`py-1.5 rounded-lg text-xs font-bold transition-all ${filters.type === ListingType.ForRent ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-600'}`}
            >
              Kiralık
            </button>
          </div>
        </div>

        {/* Categories - Grid compact */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kategori</label>
          <div className="flex flex-col gap-1">
            {[
              { id: ListingCategory.Residential, name: 'Konut', icon: '🏠' },
              { id: ListingCategory.Commercial, name: 'İş Yeri', icon: '🏢' },
              { id: ListingCategory.Land, name: 'Arsa', icon: '🌱' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => onFilterChange('category', cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-[11px] transition-all ${filters.category === cat.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-50 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-gray-50" />

        {/* Details Section */}
        <div className="space-y-3">
          {/* City */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Şehir</label>
            <select
              value={filters.city || ''}
              onChange={(e) => onFilterChange('city', e.target.value || undefined)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold"
            >
              <option value="">Tümü</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Fiyat (₺)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Min"
                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[11px] font-semibold"
              />
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Max"
                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[11px] font-semibold"
              />
            </div>
          </div>

          {/* Room Count */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Oda</label>
            <select
              value={filters.roomCount || ''}
              onChange={(e) => onFilterChange('roomCount', e.target.value || undefined)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold"
            >
              <option value="">Tümü</option>
              {roomOptions.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions Section - Shrink-0 to stay at bottom */}
      <div className="p-4 pb-8 bg-gray-50 border-t border-gray-100 shrink-0 space-y-3">
        <button
          onClick={onSearch}
          className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-bold text-xs shadow-md flex items-center justify-center gap-2"
        >
          İLANLARI BUL
        </button>

        <button
          onClick={onClearFilters}
          className="w-full py-1 text-blue-500/80 hover:text-red-500 transition-all font-bold text-[11px] uppercase tracking-widest text-center flex items-center justify-center gap-1.5"
        >
          <span className="text-xs">🔄</span> Filtreleri Sıfırla
        </button>
      </div>
    </div>
  );
}
