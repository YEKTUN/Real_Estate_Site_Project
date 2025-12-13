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
} from '@/body/redux/slices/listing/ListingSlice';
import {
  toggleFavorite,
  selectFavoriteIds,
  selectFavoriteToggling,
} from '@/body/redux/slices/favorite/FavoriteSlice';
import { selectIsAuthenticated } from '@/body/redux/slices/auth/AuthSlice';
import {
  ListingSearchDto,
  ListingCategory,
  ListingSortBy,
} from '@/body/redux/slices/listing/DTOs/ListingDTOs';
import ListingCard from './components/ListingCard';
import SearchFilters from './components/SearchFilters';
import Pagination from './components/Pagination';
import EmptyState from './components/EmptyState';
import LoadingState from './components/LoadingState';

/**
 * İlan Listesi Bileşeni
 * 
 * Tüm ilanları listeler, arama ve filtreleme işlemleri yapar.
 * Redux ile state yönetimi.
 */

export default function Listings() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state
  const listings = useAppSelector(selectListings);
  const pagination = useAppSelector(selectPagination);
  const isLoading = useAppSelector(selectListingLoading);
  const error = useAppSelector(selectListingError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const favoriteIds = useAppSelector(selectFavoriteIds);
  const isToggling = useAppSelector(selectFavoriteToggling);

  // Local filter state
  const [filters, setFilters] = useState<ListingSearchDto>({
    type: undefined,
    category: undefined, // Tüm kategoriler
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
    // Filtreleme var mı kontrolü
    const hasFilters = !!(
      filters.type ||
      filters.category ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.city ||
      filters.roomCount ||
      filters.searchTerm
    );

    console.log('Listings: İlanlar yükleniyor...', { filters, hasFilters });
    
    // Eğer filtre varsa searchListings, yoksa fetchAllListings kullan
    if (hasFilters) {
      dispatch(searchListings(filters));
    } else {
      dispatch(fetchAllListings({ page: filters.page || 1, pageSize: filters.pageSize || 12 }));
    }
  }, [dispatch, filters.type, filters.category, filters.minPrice, filters.maxPrice, filters.city, filters.roomCount, filters.searchTerm, filters.page, filters.pageSize, filters.sortBy]);

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
   * Filtreleri temizle
   */
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      type: undefined,
      category: undefined, // Tüm kategoriler
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

      {/* Arama ve Filtreler */}
      <SearchFilters
        filters={filters}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onClearFilters={handleClearFilters}
        onSortChange={handleSortChange}
      />

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <p className="text-red-700">{error}</p>
          <button onClick={() => dispatch(clearError())} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Sonuç Sayısı */}
      {pagination && (
        <div className="flex items-center">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">{pagination.totalCount}</span> ilan bulundu
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <LoadingState />
      ) : listings.length === 0 ? (
        <EmptyState onClearFilters={handleClearFilters} />
      ) : (
        <>
          {/* İlan Listesi */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorited={favoriteIds.includes(listing.id)}
                isToggling={isToggling}
                onFavoriteToggle={handleFavoriteToggle}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            pagination={pagination}
            currentPage={filters.page || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
