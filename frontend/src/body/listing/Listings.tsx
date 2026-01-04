'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
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
  selectFavoriteError,
  clearError as clearFavoriteError,
} from '@/body/redux/slices/favorite/FavoriteSlice';
import { selectIsAuthenticated, selectUser } from '@/body/redux/slices/auth/AuthSlice';
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
import { LayoutGrid as LayoutGridIcon, List as ListIcon } from 'lucide-react';

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
  const currentUser = useAppSelector(selectUser);
  const favoriteIds = useAppSelector(selectFavoriteIds);
  const isToggling = useAppSelector(selectFavoriteToggling);
  const favoriteError = useAppSelector(selectFavoriteError);

  // Favori ID'lerini hızlı arama için Set'e dönüştür (Optimize)
  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  // Applied filters (trigger API call)
  const [appliedFilters, setAppliedFilters] = useState<ListingSearchDto>({
    searchTerm: undefined,
    listingNumber: undefined,
    type: undefined,
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    city: undefined,
    roomCount: undefined,
    minSquareMeters: undefined,
    maxSquareMeters: undefined,
    minBuildingAge: undefined,
    maxBuildingAge: undefined,
    heatingType: undefined,
    buildingStatus: undefined,
    usageStatus: undefined,
    deedStatus: undefined,
    ownerType: undefined,
    sortBy: ListingSortBy.Newest,
    page: 1,
    pageSize: 8,
  });

  // Staged filters (sidebar UI state)
  const [filters, setFilters] = useState<ListingSearchDto>({
    searchTerm: undefined,
    listingNumber: undefined,
    type: undefined,
    category: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    city: undefined,
    roomCount: undefined,
    minSquareMeters: undefined,
    maxSquareMeters: undefined,
    minBuildingAge: undefined,
    maxBuildingAge: undefined,
    heatingType: undefined,
    buildingStatus: undefined,
    usageStatus: undefined,
    deedStatus: undefined,
    ownerType: undefined,
    sortBy: ListingSortBy.Newest,
    page: 1,
    pageSize: 8,
  });

  // Arama input state
  const [searchTerm, setSearchTerm] = useState('');

  // Görünüm modu: 'grid' (kare/2-li) veya 'list' (uzun/dikdörtgen)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      appliedFilters.searchTerm ||
      appliedFilters.listingNumber ||
      appliedFilters.minSquareMeters ||
      appliedFilters.maxSquareMeters ||
      appliedFilters.minBuildingAge ||
      appliedFilters.maxBuildingAge ||
      appliedFilters.heatingType ||
      appliedFilters.buildingStatus ||
      appliedFilters.usageStatus ||
      appliedFilters.deedStatus ||
      appliedFilters.ownerType
    );

    if (hasFilters) {
      dispatch(searchListings(appliedFilters));
    } else {
      dispatch(fetchAllListings({ page: appliedFilters.page || 1, pageSize: appliedFilters.pageSize || 5 }));
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
      searchTerm: undefined,
      listingNumber: undefined,
      type: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      city: undefined,
      roomCount: undefined,
      minSquareMeters: undefined,
      maxSquareMeters: undefined,
      minBuildingAge: undefined,
      maxBuildingAge: undefined,
      heatingType: undefined,
      buildingStatus: undefined,
      usageStatus: undefined,
      deedStatus: undefined,
      ownerType: undefined,
      sortBy: ListingSortBy.Newest,
      page: 1,
      pageSize: 8,
    };
    setFilters(reset);
    setAppliedFilters(reset);
  };

  const handlePageChange = (page: number) => {
    setAppliedFilters(prev => ({ ...prev, page }));
    setFilters(prev => ({ ...prev, page }));

    // Sayfa değiştiğinde en başa (ilanların başladığı yere) yumuşak bir animasyonla kaydır
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
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
    <div className="max-w-[1600px] mx-auto px-4 py-6">
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
              <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid Görünümü"
                >
                  <LayoutGridIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Liste Görünümü"
                >
                  <ListIcon className="w-5 h-5" />
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

          {/* Favorite Error Alert */}
          {favoriteError && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3 animate-shake">
              <span className="text-2xl">❤️</span>
              <p className="text-orange-700 font-medium">Favori işlemi başarısız: {favoriteError}</p>
              <button onClick={() => dispatch(clearFavoriteError())} className="ml-auto text-orange-500 hover:text-orange-700 transition-colors">✕</button>
            </div>
          )}

          {/* Results Area */}
          <div className="relative min-h-[600px]">
            {/* Loading Overlay - Daha yumuşak geçiş için */}
            {isLoading && (
              <div className="absolute inset-x-0 top-20 z-10 flex justify-center pointer-events-none">
                <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-xl border border-blue-50 flex items-center gap-3 animate-bounce">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                  <span className="text-xs font-black text-blue-700 uppercase tracking-widest">Yükleniyor...</span>
                </div>
              </div>
            )}

            <div
              className={`transition-opacity duration-300 ease-in-out ${isLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'
                }`}
            >
              {listings.length === 0 && !isLoading ? (
                <EmptyState onClearFilters={handleClearFilters} />
              ) : (
                <div className={viewMode === 'grid'
                  ? "grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                  : "flex flex-col gap-4"
                }>
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      viewMode={viewMode}
                      isFavorited={favoriteIdSet.has(listing.id)}
                      isToggling={isToggling}
                      onFavoriteToggle={handleFavoriteToggle}
                      onViewDetails={handleViewDetails}
                      currentUserId={currentUser?.id}
                    />
                  ))}
                </div>
              )}
            </div>
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
