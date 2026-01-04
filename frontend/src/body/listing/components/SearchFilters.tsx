import {
  ListingSearchDto,
  ListingCategory,
  ListingType,
  ListingSortBy,
  HeatingType,
  BuildingStatus,
  UsageStatus,
  DeedStatus,
  ListingOwnerType
} from '@/body/redux/slices/listing/DTOs/ListingDTOs';

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  // İlan numarası araması varsa diğer filtreleri pasifize etme görseli
  const isIdSearchActive = !!filters.listingNumber;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex flex-col max-h-[calc(100vh-140px)]">
      {/* Sidebar Header - Compact */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white shrink-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <h2 className="text-sm font-bold uppercase tracking-tight">Gelişmiş Filtreleme</h2>
          </div>
          {isIdSearchActive && (
            <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">ID AKTİF</span>
          )}
        </div>
      </div>

      <div
        className="p-4 space-y-5 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-blue-400 transition-colors"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* ID Arama - Öncelikli */}
        <div className="space-y-1 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
            İlan No ile Ara
          </label>
          <input
            type="text"
            value={filters.listingNumber || ''}
            onChange={(e) => onFilterChange('listingNumber', e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Örn: 123456789"
            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:border-blue-500 outline-none transition-all text-xs font-bold text-blue-700 placeholder:text-blue-300"
          />
          <p className="text-[9px] text-blue-400 font-medium">Bu alan doluysa diğer filtreler yok sayılır.</p>
        </div>

        <div className={`space-y-5 transition-all duration-300 ${isIdSearchActive ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
          {/* Kelime ile Arama */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Başlık ve Açıklamada Ara</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Kelime veya cümle yazın..."
              className="w-full px-3 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-blue-500 outline-none transition-all text-xs font-semibold"
            />
          </div>

          <hr className="border-gray-100" />

          {/* City Selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İl</label>
            <select
              value={filters.city || ''}
              onChange={(e) => onFilterChange('city', e.target.value || undefined)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px_10px] bg-[right:8px_center] bg-no-repeat"
            >
              <option value="">Tümü</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* Type Selection */}
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

          {/* Categories */}
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-bold text-[11px] transition-all ${filters.category === cat.id ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-gray-50 bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                >
                  <span className="text-sm">{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Property Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Emlak Tipi</label>
            <select
              value={filters.propertyType || ''}
              onChange={(e) => onFilterChange('propertyType', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px_10px] bg-[right:8px_center] bg-no-repeat"
            >
              <option value="">Tümü</option>
              <option value={1}>Daire</option>
              <option value={2}>Rezidans</option>
              <option value={3}>Villa</option>
              <option value={4}>Çiftlik Evi</option>
              <option value={5}>Köşk / Konak</option>
              <option value={6}>Yalı</option>
              <option value={7}>Yazlık</option>
              <option value={8}>Kooperatif</option>
              <option value={9}>Prefabrik</option>
              <option value={10}>Müstakil Ev</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Fiyat Aralığı (₺)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Min"
                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[11px] font-semibold focus:bg-white focus:border-blue-200"
              />
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => onFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Max"
                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[11px] font-semibold focus:bg-white focus:border-blue-200"
              />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Advanced Stats */}
        <div className="space-y-4">
          {/* Net Square Meters */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Metrekare (Net m²)</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.minSquareMeters || ''}
                onChange={(e) => onFilterChange('minSquareMeters', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Min"
                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[11px] font-semibold focus:bg-white focus:border-blue-200"
              />
              <input
                type="number"
                value={filters.maxSquareMeters || ''}
                onChange={(e) => onFilterChange('maxSquareMeters', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Max"
                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[11px] font-semibold focus:bg-white focus:border-blue-200"
              />
            </div>
          </div>

          {/* Room Count */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Oda Sayısı</label>
            <select
              value={filters.roomCount || ''}
              onChange={(e) => onFilterChange('roomCount', e.target.value || undefined)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px_10px] bg-[right:8px_center] bg-no-repeat"
            >
              <option value="">Tümü</option>
              {roomOptions.map(room => (
                <option key={room} value={room}>{room}</option>
              ))}
            </select>
          </div>

          {/* Building Age */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Bina Yaşı</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.minBuildingAge || ''}
                onChange={(e) => onFilterChange('minBuildingAge', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Min"
                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[11px] font-semibold focus:bg-white focus:border-blue-200"
              />
              <input
                type="number"
                value={filters.maxBuildingAge || ''}
                onChange={(e) => onFilterChange('maxBuildingAge', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Max"
                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[11px] font-semibold focus:bg-white focus:border-blue-200"
              />
            </div>
          </div>

          {/* Floor Number */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Bulunduğu Kat</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.minFloor || ''}
                onChange={(e) => onFilterChange('minFloor', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Min"
                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[11px] font-semibold focus:bg-white focus:border-blue-200"
              />
              <input
                type="number"
                value={filters.maxFloor || ''}
                onChange={(e) => onFilterChange('maxFloor', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Max"
                className="w-full px-2 py-1.5 bg-gray-50 border border-transparent rounded-lg text-[11px] font-semibold focus:bg-white focus:border-blue-200"
              />
            </div>
          </div>

          {/* Heating Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Isıtma Tipi</label>
            <select
              value={filters.heatingType || ''}
              onChange={(e) => onFilterChange('heatingType', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px_10px] bg-[right:8px_center] bg-no-repeat"
            >
              <option value="">Tümü</option>
              <option value={HeatingType.NaturalGas}>Doğalgaz</option>
              <option value={HeatingType.Central}>Merkezi</option>
              <option value={HeatingType.AirConditioning}>Klima</option>
              <option value={HeatingType.FloorHeating}>Yerden Isıtma</option>
              <option value={HeatingType.Coal}>Soba</option>
              <option value={HeatingType.None}>Yok</option>
            </select>
          </div>

          {/* Building Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Bina Durumu</label>
            <select
              value={filters.buildingStatus || ''}
              onChange={(e) => onFilterChange('buildingStatus', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px_10px] bg-[right:8px_center] bg-no-repeat"
            >
              <option value="">Tümü</option>
              <option value={BuildingStatus.Zero}>Sıfır</option>
              <option value={BuildingStatus.SecondHand}>İkinci El</option>
              <option value={BuildingStatus.UnderConstruction}>İnşaat Halinde</option>
              <option value={BuildingStatus.Renovated}>Yenilenmiş</option>
            </select>
          </div>

          {/* Usage Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Kullanım Durumu</label>
            <select
              value={filters.usageStatus || ''}
              onChange={(e) => onFilterChange('usageStatus', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px_10px] bg-[right:8px_center] bg-no-repeat"
            >
              <option value="">Tümü</option>
              <option value={UsageStatus.Empty}>Boş</option>
              <option value={UsageStatus.TenantOccupied}>Kiracılı</option>
              <option value={UsageStatus.OwnerOccupied}>Mülk Sahibi Oturuyor</option>
            </select>
          </div>

          {/* Deed Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Tapu Durumu</label>
            <select
              value={filters.deedStatus || ''}
              onChange={(e) => onFilterChange('deedStatus', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px_10px] bg-[right:8px_center] bg-no-repeat"
            >
              <option value="">Tümü</option>
              <option value={DeedStatus.Title}>Kat Mülkiyeti</option>
              <option value={DeedStatus.SharedTitle}>Hisseli Tapu</option>
              <option value={DeedStatus.Cooperative}>Kooperatif</option>
              <option value={DeedStatus.Construction}>Kat İrtifakı</option>
              <option value={DeedStatus.Other}>Diğer</option>
            </select>
          </div>

          {/* Owner Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Kimden</label>
            <select
              value={filters.ownerType || ''}
              onChange={(e) => onFilterChange('ownerType', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px_10px] bg-[right:8px_center] bg-no-repeat"
            >
              <option value="">Tümü</option>
              <option value={ListingOwnerType.Owner}>Sahibinden</option>
              <option value={ListingOwnerType.RealEstateAgent}>Emlak Ofisinden</option>
              <option value={ListingOwnerType.Builder}>İnşaat Firmasından</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Sıralama</label>
            <select
              value={filters.sortBy || ListingSortBy.Newest}
              onChange={(e) => onSortChange(parseInt(e.target.value))}
              className="w-full px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg outline-none text-[11px] font-semibold appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:10px_10px] bg-[right:8px_center] bg-no-repeat"
            >
              <option value={ListingSortBy.Newest}>En Yeni</option>
              <option value={ListingSortBy.Oldest}>En Eski</option>
              <option value={ListingSortBy.PriceAsc}>Fiyat (Artan)</option>
              <option value={ListingSortBy.PriceDesc}>Fiyat (Azalan)</option>
              <option value={ListingSortBy.MostViewed}>En Çok Görüntülenen</option>
              <option value={ListingSortBy.MostFavorited}>En Çok Favorilenen</option>
            </select>
          </div>

          {/* Binary Filters */}
          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!filters.isSuitableForCredit}
                onChange={(e) => onFilterChange('isSuitableForCredit', e.target.checked || undefined)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] font-bold text-gray-600 group-hover:text-blue-600 transition-colors">Krediye Uygun</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!filters.isSuitableForTrade}
                onChange={(e) => onFilterChange('isSuitableForTrade', e.target.checked || undefined)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px] font-bold text-gray-600 group-hover:text-blue-600 transition-colors">Takaslı</span>
            </label>
          </div>
        </div>
      </div>

      {/* Actions Section - Shrink-0 to stay at bottom */}
      <div className="p-4 pb-8 bg-gray-50 border-t border-gray-100 shrink-0 space-y-3">
        <button
          onClick={onSearch}
          className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-black text-xs shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          {isIdSearchActive ? 'İLAN NUMARASI İLE BUL' : 'İLANLARI FİLTRELE'}
        </button>

        <button
          onClick={onClearFilters}
          className="w-full py-1 text-gray-400 hover:text-red-500 transition-all font-bold text-[10px] uppercase tracking-widest text-center flex items-center justify-center gap-1.5"
        >
          <span className="text-xs">🔄</span> Filtreleri Sıfırla
        </button>
      </div>
    </div>
  );
}
