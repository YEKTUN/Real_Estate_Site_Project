'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import {
  fetchAllListings,
  searchListings,
  selectListings,
  selectPagination,
  selectListingLoading,
  selectListingError,
  clearError,
  setSearchParams,
  selectSearchParams,
} from '@/body/redux/slices/listing/ListingSlice';
import {
  toggleFavorite,
  selectFavoriteIds,
  selectFavoriteToggling,
} from '@/body/redux/slices/favorite/FavoriteSlice';
import { selectIsAuthenticated } from '@/body/redux/slices/auth/AuthSlice';
import {
  ListingListDto,
  ListingSearchDto,
  ListingType,
  ListingCategory,
  PropertyType,
  Currency,
  ListingSortBy,
  HeatingType,
} from '@/body/redux/slices/listing/DTOs/ListingDTOs';

/**
 * İlan Listesi Bileşeni
 * 
 * Tüm ilanları listeler, arama ve filtreleme işlemleri yapar.
 * Redux ile state yönetimi.
 */

// İl listesi
const cities = [
  'İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Adana', 
  'Konya', 'Gaziantep', 'Mersin', 'Kayseri', 'Trabzon', 'Samsun'
];

// Oda sayıları
const roomOptions = ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1', '5+2', '6+'];

export default function Listings() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state
  const listings = useAppSelector(selectListings);
  const pagination = useAppSelector(selectPagination);
  const isLoading = useAppSelector(selectListingLoading);
  const error = useAppSelector(selectListingError);
  const searchParams = useAppSelector(selectSearchParams);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const favoriteIds = useAppSelector(selectFavoriteIds);
  const isToggling = useAppSelector(selectFavoriteToggling);

  // Local filter state
  const [filters, setFilters] = useState<ListingSearchDto>({
    type: undefined,
    category: ListingCategory.Residential,
    minPrice: undefined,
    maxPrice: undefined,
    city: undefined,
    roomCount: undefined,
    sortBy: ListingSortBy.Newest,
    page: 1,
    pageSize: 12,
  });

  // Arama input state
  const [searchTerm, setSearchTerm] = useState('');

  // İlk yüklemede ve filtre değişikliklerinde ilanları getir
  useEffect(() => {
    console.log('Listings: İlanlar yükleniyor...', filters);
    dispatch(searchListings(filters));
  }, [dispatch, filters]);

  /**
   * Filtre değişikliği handler
   */
  const handleFilterChange = (key: keyof ListingSearchDto, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1, // Filtre değişince sayfa 1'e dön
    }));
  };

  /**
   * Arama submit handler
   */
  const handleSearch = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      searchTerm: searchTerm || undefined,
      page: 1,
    }));
  }, [searchTerm]);

  /**
   * Enter tuşu ile arama
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * Filtreleri temizle
   */
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      type: undefined,
      category: ListingCategory.Residential,
      minPrice: undefined,
      maxPrice: undefined,
      city: undefined,
      roomCount: undefined,
      sortBy: ListingSortBy.Newest,
      page: 1,
      pageSize: 12,
    });
  };

  /**
   * Sayfa değiştir
   */
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Sıralama değiştir
   */
  const handleSortChange = (sortBy: ListingSortBy) => {
    setFilters(prev => ({ ...prev, sortBy, page: 1 }));
  };

  /**
   * Favori toggle
   */
  const handleFavoriteToggle = async (listingId: number) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    try {
      await dispatch(toggleFavorite(listingId)).unwrap();
    } catch (err) {
      console.error('Favori toggle hatası:', err);
    }
  };

  /**
   * İlan detayına git
   */
  const handleViewDetails = (listingId: number) => {
    router.push(`/properties/${listingId}`);
  };

  /**
   * Fiyat formatla
   */
  const formatPrice = (price: number, type: ListingType, currency: Currency) => {
    const currencySymbol = currency === Currency.TRY ? '₺' : currency === Currency.USD ? '$' : '€';
    const formatted = new Intl.NumberFormat('tr-TR').format(price);
    return type === ListingType.ForRent ? `${currencySymbol}${formatted}/ay` : `${currencySymbol}${formatted}`;
  };

  return (
    <div className="space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Gayrimenkul İlanları
        </h1>
        <p className="text-gray-600 text-lg">
          Binlerce ilan arasından size en uygun olanı bulun
        </p>
      </div>

      {/* Arama Alanı */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="İlan başlığı, konum veya anahtar kelime ara..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">🔍</span>
          </div>
          <button
            onClick={handleSearch}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Ara
          </button>
        </div>

        {/* Filtreler */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {/* İlan Tipi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              İlan Tipi
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value ? parseInt(e.target.value) : undefined)}
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
              onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
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
              onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
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
              onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
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
              onChange={(e) => handleFilterChange('roomCount', e.target.value || undefined)}
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
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <p className="text-red-700">{error}</p>
          <button onClick={() => dispatch(clearError())} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Sonuç Sayısı ve Sıralama */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-gray-600">
          <span className="font-semibold text-gray-800">{pagination?.totalCount || listings.length}</span> ilan bulundu
        </p>
        <select 
          value={filters.sortBy}
          onChange={(e) => handleSortChange(parseInt(e.target.value))}
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

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">İlanlar yükleniyor...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            İlan bulunamadı
          </h3>
          <p className="text-gray-600 mb-6">
            Arama kriterlerinize uygun ilan bulunamadı. Filtreleri değiştirmeyi deneyin.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        /* İlan Listesi */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorited={favoriteIds.includes(listing.id)}
              isToggling={isToggling}
              onFavoriteToggle={handleFavoriteToggle}
              onViewDetails={handleViewDetails}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange((filters.page || 1) - 1)}
            disabled={!pagination.hasPrevious}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Önceki
          </button>
          
          {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  page === (filters.page || 1)
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          {pagination.totalPages > 5 && (
            <>
              <span className="px-2 text-gray-500">...</span>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  pagination.totalPages === (filters.page || 1)
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pagination.totalPages}
              </button>
            </>
          )}
          
          <button
            onClick={() => handlePageChange((filters.page || 1) + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sonraki →
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * İlan Kartı Bileşeni
 */
interface ListingCardProps {
  listing: ListingListDto;
  isFavorited: boolean;
  isToggling: boolean;
  onFavoriteToggle: (listingId: number) => void;
  onViewDetails: (listingId: number) => void;
  formatPrice: (price: number, type: ListingType, currency: Currency) => string;
}

function ListingCard({ 
  listing, 
  isFavorited, 
  isToggling, 
  onFavoriteToggle, 
  onViewDetails, 
  formatPrice 
}: ListingCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer group">
      {/* Görsel */}
      <div 
        className="h-56 bg-gradient-to-br from-blue-400 to-purple-500 relative"
        onClick={() => onViewDetails(listing.id)}
      >
        {listing.coverImageUrl ? (
          <img 
            src={listing.coverImageUrl} 
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white text-6xl">
            🏠
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
            listing.type === ListingType.ForSale ? 'bg-blue-600' : 'bg-green-600'
          }`}>
            {listing.type === ListingType.ForSale ? 'Satılık' : 'Kiralık'}
          </span>
          {listing.isFeatured && (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-yellow-500 text-white">
              ⭐ Öne Çıkan
            </span>
          )}
          {listing.isUrgent && (
            <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-500 text-white">
              🔥 Acil
            </span>
          )}
        </div>
        
        {/* Favori Butonu */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle(listing.id);
          }}
          disabled={isToggling}
          className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors disabled:opacity-50"
        >
          <span className={`text-xl ${isFavorited ? 'text-red-500' : 'text-gray-400'}`}>
            {isFavorited ? '❤️' : '🤍'}
          </span>
        </button>
        
        {/* Görüntülenme */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
            👁️ {listing.viewCount}
          </span>
          <span className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
            ❤️ {listing.favoriteCount}
          </span>
        </div>
      </div>

      {/* İçerik */}
      <div className="p-6" onClick={() => onViewDetails(listing.id)}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>
        </div>

        <p className="text-gray-600 mb-4 flex items-center">
          📍 {listing.district}, {listing.city}
        </p>

        {/* Özellikler */}
        <div className="flex gap-4 mb-4 text-sm text-gray-600">
          {listing.roomCount && (
            <span className="flex items-center gap-1">
              🛏️ {listing.roomCount}
            </span>
          )}
          {listing.netSquareMeters && (
            <span className="flex items-center gap-1">
              📐 {listing.netSquareMeters}m²
            </span>
          )}
          {listing.floorNumber !== undefined && (
            <span className="flex items-center gap-1">
              🏢 {listing.floorNumber}. Kat
            </span>
          )}
        </div>

        {/* Fiyat ve Buton */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {formatPrice(listing.price, listing.type, listing.currency)}
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
            Detaylar
          </button>
        </div>
      </div>
    </div>
  );
}
