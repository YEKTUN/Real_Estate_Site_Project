'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  // Redux state
  const listings = useAppSelector(selectListings);
  const pagination = useAppSelector(selectPagination);
  const isLoading = useAppSelector(selectListingLoading);
  const error = useAppSelector(selectListingError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const favoriteIds = useAppSelector(selectFavoriteIds);
  const isToggling = useAppSelector(selectFavoriteToggling);

  // Applied filters (trigger API call)
  const [appliedFilters, setAppliedFilters] = useState<ListingSearchDto>({
    type: undefined,
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    city: undefined,
    roomCount: undefined,
    sortBy: ListingSortBy.Newest,
    page: 1,
    pageSize: 20,
  });

  // Staged filters (sidebar UI state)
  const [filters, setFilters] = useState<ListingSearchDto>({
    type: undefined,
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    city: undefined,
    roomCount: undefined,
    sortBy: ListingSortBy.Newest,
    page: 1,
    pageSize: 20,
  });

  // Arama input state
  const [searchTerm, setSearchTerm] = useState('');

  // URL Parametrelerini Dinle (Navbar tıklamaları direkt search yapar)
  useEffect(() => {
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const term = searchParams.get('search');

    const newParams = {
      type: type ? parseInt(type) : undefined,
      category: category ? parseInt(category) : undefined,
      searchTerm: term || undefined,
      page: 1,
    };

    setAppliedFilters(prev => ({ ...prev, ...newParams }));
    setFilters(prev => ({ ...prev, ...newParams })); // Sidebar'ı da güncelle

    if (term) setSearchTerm(term);
    else setSearchTerm('');
  }, [searchParams]);

  // İlanları getir (appliedFilters değiştiğinde)
  useEffect(() => {
    const hasFilters = !!(
      appliedFilters.type ||
      appliedFilters.category ||
      appliedFilters.minPrice ||
      appliedFilters.maxPrice ||
      appliedFilters.city ||
      appliedFilters.roomCount ||
      appliedFilters.searchTerm
    );

    if (hasFilters) {
      dispatch(searchListings(appliedFilters));
    } else {
      dispatch(fetchAllListings({ page: appliedFilters.page || 1, pageSize: appliedFilters.pageSize || 20 }));
    }
  }, [dispatch, appliedFilters]);

  /**
   * Filtre değişikliği handler (Sadece staged state'i günceller)
   */
  const handleFilterChange = (key: keyof ListingSearchDto, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  /**
   * Arama submit handler (Filtreleri uygular)
   */
  const handleSearch = useCallback(() => {
    setAppliedFilters({
      ...filters,
      searchTerm: searchTerm || undefined,
      page: 1,
    });
  }, [filters, searchTerm]);

  /**
   * Filtreleri temizle
   */
  const handleClearFilters = () => {
    setSearchTerm('');
    const reset = {
      type: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      city: undefined,
      roomCount: undefined,
      sortBy: ListingSortBy.Newest,
      page: 1,
      pageSize: 20,
    };
    setFilters(reset);
    setAppliedFilters(reset);
  };

  const handlePageChange = (page: number) => {
    setAppliedFilters(prev => ({ ...prev, page }));
    setFilters(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (sortBy: ListingSortBy) => {
    setAppliedFilters(prev => ({ ...prev, sortBy, page: 1 }));
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
    router.push(`/listing/${listingId}`);
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      {/* Header Area */}
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
          Gayrimenkul <span className="text-blue-600">Keşfet</span>
        </h1>
        <div className="h-1.5 w-20 bg-blue-600 rounded-full mb-4"></div>
        <p className="text-gray-500 text-lg max-w-2xl">
          Hayalinizdeki yaşam alanını bulmanız için en geniş portföyü ve gelişmiş arama seçeneklerini sunuyoruz.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Search & Filters (Left) */}
        <aside className="w-full lg:w-[300px] shrink-0">
          <div className="sticky top-24">
            <SearchFilters
              filters={filters}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              onClearFilters={handleClearFilters}
              onSortChange={handleSortChange}
            />
          </div>
        </aside>

        {/* Main Content - Listings (Right) */}
        <div className="flex-1 space-y-8">
          {/* Top Actions & Stats */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            {pagination && (
              <p className="text-gray-700 font-medium">
                Toplam <span className="text-blue-600 font-bold">{pagination.totalCount}</span> ilan listeleniyor
              </p>
            )}
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-400">Görünüm:</span>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button className="p-2 bg-white shadow-sm rounded-md text-blue-600">
                  <span className="text-lg">📱</span>
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <span className="text-lg">≡</span>
                </button>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-shake">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-700 font-medium">{error}</p>
              <button onClick={() => dispatch(clearError())} className="ml-auto text-red-500 hover:text-red-700 transition-colors">✕</button>
            </div>
          )}

          {/* Results Area */}
          <div className="min-h-[600px]">
            {isLoading ? (
              <LoadingState />
            ) : listings.length === 0 ? (
              <EmptyState onClearFilters={handleClearFilters} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
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
            )}
          </div>

          {/* Pagination */}
          {!isLoading && listings.length > 0 && (
            <div className="pt-8 border-t border-gray-100">
              <Pagination
                pagination={pagination}
                currentPage={appliedFilters.page || 1}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
