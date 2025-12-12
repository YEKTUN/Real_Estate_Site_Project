'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import { 
  fetchMyListings,
  deleteListing,
  updateListingStatus,
  selectMyListings,
  selectPagination,
  selectListingLoading,
  selectListingDeleting,
  selectListingError,
  clearError 
} from '@/body/redux/slices/listing/ListingSlice';
import { 
  ListingListDto, 
  ListingStatus,
  ListingType,
  Currency
} from '@/body/redux/slices/listing/DTOs/ListingDTOs';

/**
 * İlanlarım Bileşeni
 * 
 * Kullanıcının kendi ilanlarını listeler ve yönetir - Redux entegrasyonu ile.
 * - İlan listesi (API'den)
 * - Durum filtreleme (Aktif, Beklemede, Pasif)
 * - İlan düzenleme/silme
 * - İlan istatistikleri
 */

// Durum renkleri ve etiketleri
const statusConfig: Record<ListingStatus, { label: string; color: string; dot: string }> = {
  [ListingStatus.Active]: { label: 'Aktif', color: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  [ListingStatus.Pending]: { label: 'Beklemede', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  [ListingStatus.Inactive]: { label: 'Pasif', color: 'bg-gray-100 text-gray-700', dot: 'bg-gray-500' },
  [ListingStatus.Sold]: { label: 'Satıldı', color: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  [ListingStatus.Rented]: { label: 'Kiralandı', color: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  [ListingStatus.Rejected]: { label: 'Reddedildi', color: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  [ListingStatus.Expired]: { label: 'Süresi Doldu', color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
};

export default function MyListings() {
  const dispatch = useAppDispatch();
  
  // Redux state
  const listings = useAppSelector(selectMyListings);
  const pagination = useAppSelector(selectPagination);
  const isLoading = useAppSelector(selectListingLoading);
  const isDeleting = useAppSelector(selectListingDeleting);
  const error = useAppSelector(selectListingError);

  // Local state
  const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // İlanları yükle
  useEffect(() => {
    console.log('MyListings: İlanlar yükleniyor...');
    dispatch(fetchMyListings({ page: currentPage, pageSize: 10 }));
  }, [dispatch, currentPage]);

  /**
   * Filtrelenmiş ilanlar
   */
  const filteredListings = listings.filter((listing) => {
    if (statusFilter === 'all') return true;
    return listing.status === statusFilter;
  });

  /**
   * İstatistikleri hesapla
   */
  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === ListingStatus.Active).length,
    totalViews: listings.reduce((sum, l) => sum + l.viewCount, 0),
    totalFavorites: listings.reduce((sum, l) => sum + l.favoriteCount, 0),
  };

  /**
   * Fiyat formatla
   */
  const formatPrice = (price: number, type: ListingType, currency: Currency) => {
    const currencySymbol = currency === Currency.TRY ? '₺' : currency === Currency.USD ? '$' : '€';
    const formatted = new Intl.NumberFormat('tr-TR').format(price);
    return type === ListingType.ForRent ? `${currencySymbol}${formatted}/ay` : `${currencySymbol}${formatted}`;
  };

  /**
   * İlan silme
   */
  const handleDelete = async (id: number) => {
    if (window.confirm('Bu ilanı silmek istediğinizden emin misiniz?')) {
      try {
        console.log('İlan siliniyor:', id);
        await dispatch(deleteListing(id)).unwrap();
        // Listeyi yenile
        dispatch(fetchMyListings({ page: currentPage, pageSize: 10 }));
      } catch (err) {
        console.error('İlan silme hatası:', err);
      }
    }
  };

  /**
   * İlan durumu değiştirme
   */
  const handleStatusChange = async (id: number, newStatus: ListingStatus) => {
    try {
      console.log('İlan durumu değiştiriliyor:', id, newStatus);
      await dispatch(updateListingStatus({ listingId: id, status: newStatus })).unwrap();
      // Listeyi yenile
      dispatch(fetchMyListings({ page: currentPage, pageSize: 10 }));
    } catch (err) {
      console.error('Durum değiştirme hatası:', err);
    }
  };

  /**
   * Sayfa değiştir
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Loading state
  if (isLoading && listings.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">İlanlarınız yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <p className="text-red-700">{error}</p>
          <button onClick={() => dispatch(clearError())} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-sm text-gray-600">Toplam İlan</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-gray-600">Aktif İlan</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">{stats.totalViews}</p>
          <p className="text-sm text-gray-600">Toplam Görüntülenme</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-red-600">{stats.totalFavorites}</p>
          <p className="text-sm text-gray-600">Toplam Favori</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            statusFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tümü
          <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
            {listings.length}
          </span>
        </button>
        {[ListingStatus.Active, ListingStatus.Pending, ListingStatus.Inactive].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {statusConfig[status].label}
            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {listings.filter((l) => l.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* İlan Listesi */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {statusFilter === 'all' ? 'Henüz ilanınız yok' : 'Bu durumda ilan bulunamadı'}
          </h3>
          <p className="text-gray-600 mb-6">
            İlk ilanınızı vererek başlayın!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => (
            <ListingCard 
              key={listing.id} 
              listing={listing}
              isDeleting={isDeleting}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              formatPrice={formatPrice}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrevious}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Önceki
          </button>
          
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
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
  isDeleting: boolean;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: ListingStatus) => void;
  formatPrice: (price: number, type: ListingType, currency: Currency) => string;
}

function ListingCard({ listing, isDeleting, onDelete, onStatusChange, formatPrice }: ListingCardProps) {
  const config = statusConfig[listing.status] || statusConfig[ListingStatus.Pending];
  
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Görsel */}
        <div className="w-full md:w-48 h-36 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex-shrink-0 relative overflow-hidden">
          {listing.coverImageUrl ? (
            <img 
              src={listing.coverImageUrl} 
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-4xl">
              🏠
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
              listing.type === ListingType.ForSale ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
            }`}>
              {listing.type === ListingType.ForSale ? 'Satılık' : 'Kiralık'}
            </span>
          </div>
          {listing.isFeatured && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white">
                ⭐ Öne Çıkan
              </span>
            </div>
          )}
        </div>

        {/* Bilgiler */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">
                {listing.title}
              </h3>
              <p className="text-gray-600 text-sm flex items-center gap-1">
                📍 {listing.district}, {listing.city}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                İlan No: {listing.listingNumber}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${config.color}`}>
              <span className={`w-2 h-2 rounded-full ${config.dot}`}></span>
              {config.label}
            </div>
          </div>

          {/* Özellikler */}
          <div className="flex gap-4 mt-3 text-sm text-gray-600">
            {listing.roomCount && <span>🛏️ {listing.roomCount}</span>}
            {listing.netSquareMeters && <span>📐 {listing.netSquareMeters}m²</span>}
            {listing.floorNumber !== undefined && <span>🏢 {listing.floorNumber}. Kat</span>}
            {listing.buildingAge !== undefined && <span>📅 {listing.buildingAge} yaşında</span>}
          </div>

          {/* Fiyat ve İstatistikler */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="text-xl font-bold text-blue-600">
              {formatPrice(listing.price, listing.type, listing.currency)}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                👁️ {listing.viewCount}
              </span>
              <span className="flex items-center gap-1">
                ❤️ {listing.favoriteCount}
              </span>
              <span className="flex items-center gap-1">
                📅 {new Date(listing.createdAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex md:flex-col gap-2 md:border-l md:pl-4 border-gray-100">
          <button className="flex-1 md:flex-none px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold">
            ✏️ Düzenle
          </button>
          {listing.status === ListingStatus.Active ? (
            <button
              onClick={() => onStatusChange(listing.id, ListingStatus.Inactive)}
              className="flex-1 md:flex-none px-4 py-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-semibold"
            >
              ⏸️ Durdur
            </button>
          ) : listing.status === ListingStatus.Inactive ? (
            <button
              onClick={() => onStatusChange(listing.id, ListingStatus.Active)}
              className="flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-semibold"
            >
              ▶️ Aktifleştir
            </button>
          ) : null}
          <button
            onClick={() => onDelete(listing.id)}
            disabled={isDeleting}
            className="flex-1 md:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold disabled:opacity-50"
          >
            🗑️ Sil
          </button>
        </div>
      </div>
    </div>
  );
}
