'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import {
  fetchMyFavorites,
  removeFromFavorites,
  updateFavoriteNote,
  selectFavorites,
  selectFavoritePagination,
  selectFavoriteLoading,
  selectFavoriteToggling,
  selectFavoriteError,
  clearError,
} from '@/body/redux/slices/favorite/FavoriteSlice';
import { 
  ListingType,
  Currency 
} from '@/body/redux/slices/listing/DTOs/ListingDTOs';

/**
 * Favori İlanlar Bileşeni
 * 
 * Kullanıcının favori olarak işaretlediği ilanları listeler - Redux entegrasyonu ile.
 * - Favori ilanlar listesi (API'den)
 * - Favoriden kaldırma
 * - Favori notu ekleme/düzenleme
 * - İlan detayına gitme
 */

export default function FavoriteListings() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Redux state
  const favorites = useAppSelector(selectFavorites);
  const pagination = useAppSelector(selectFavoritePagination);
  const isLoading = useAppSelector(selectFavoriteLoading);
  const isToggling = useAppSelector(selectFavoriteToggling);
  const error = useAppSelector(selectFavoriteError);

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  // Favorileri yükle
  useEffect(() => {
    console.log('FavoriteListings: Favoriler yükleniyor...');
    dispatch(fetchMyFavorites({ page: currentPage, pageSize: 12 }));
  }, [dispatch, currentPage]);

  /**
   * Fiyat formatla
   */
  const formatPrice = (price: number, type: ListingType, currency: Currency) => {
    const currencySymbol = currency === Currency.TRY ? '₺' : currency === Currency.USD ? '$' : '€';
    const formatted = new Intl.NumberFormat('tr-TR').format(price);
    return type === ListingType.ForRent ? `${currencySymbol}${formatted}/ay` : `${currencySymbol}${formatted}`;
  };

  /**
   * Favoriden kaldır
   */
  const handleRemoveFavorite = async (listingId: number) => {
    try {
      console.log('Favoriden kaldırılıyor:', listingId);
      await dispatch(removeFromFavorites(listingId)).unwrap();
    } catch (err) {
      console.error('Favori kaldırma hatası:', err);
    }
  };

  /**
   * Not düzenlemeye başla
   */
  const handleStartEditNote = (listingId: number, currentNote: string | undefined) => {
    setEditingNoteId(listingId);
    setNoteText(currentNote || '');
  };

  /**
   * Not kaydet
   */
  const handleSaveNote = async (listingId: number) => {
    try {
      console.log('Not kaydediliyor:', listingId, noteText);
      await dispatch(updateFavoriteNote({ 
        listingId, 
        data: { note: noteText || undefined } 
      })).unwrap();
      setEditingNoteId(null);
      setNoteText('');
      // Listeyi yenile
      dispatch(fetchMyFavorites({ page: currentPage, pageSize: 12 }));
    } catch (err) {
      console.error('Not kaydetme hatası:', err);
    }
  };

  /**
   * İlan detayına git
   */
  const handleViewDetails = (listingId: number) => {
    router.push(`/properties/${listingId}`);
  };

  /**
   * Tümünü temizle
   */
  const handleClearAll = async () => {
    if (window.confirm('Tüm favorilerinizi silmek istediğinizden emin misiniz?')) {
      for (const fav of favorites) {
        await dispatch(removeFromFavorites(fav.listingId));
      }
    }
  };

  /**
   * Sayfa değiştir
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Loading state
  if (isLoading && favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Favorileriniz yükleniyor...</p>
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

      {/* Header */}
      {favorites.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">{pagination?.totalCount || favorites.length}</span> favori ilanınız var
          </p>
          <button
            onClick={handleClearAll}
            disabled={isToggling}
            className="text-red-600 hover:text-red-700 text-sm font-semibold disabled:opacity-50"
          >
            🗑️ Tümünü Temizle
          </button>
        </div>
      )}

      {/* Favori Listesi */}
      {favorites.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Henüz favori ilanınız yok
          </h3>
          <p className="text-gray-600 mb-6">
            Beğendiğiniz ilanları favorilere ekleyerek burada görebilirsiniz.
          </p>
          <button
            onClick={() => router.push('/properties')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
          >
            🏠 İlanları Keşfet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
            >
              {/* Görsel */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative">
                {favorite.listing.coverImageUrl ? (
                  <img 
                    src={favorite.listing.coverImageUrl} 
                    alt={favorite.listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-6xl">
                    🏠
                  </div>
                )}
                
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${
                    favorite.listing.type === ListingType.ForSale ? 'bg-blue-600' : 'bg-green-600'
                  }`}>
                    {favorite.listing.type === ListingType.ForSale ? 'Satılık' : 'Kiralık'}
                  </span>
                </div>

                {favorite.listing.isFeatured && (
                  <div className="absolute top-3 left-20">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500 text-white">
                      ⭐
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => handleRemoveFavorite(favorite.listingId)}
                  disabled={isToggling}
                  className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <span className="text-red-500 text-xl">❤️</span>
                </button>
              </div>

              {/* İçerik */}
              <div className="p-4">
                <h3 
                  onClick={() => handleViewDetails(favorite.listingId)}
                  className="text-lg font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {favorite.listing.title}
                </h3>
                <p className="text-gray-600 text-sm flex items-center gap-1 mb-3">
                  📍 {favorite.listing.district}, {favorite.listing.city}
                </p>

                {/* Özellikler */}
                <div className="flex gap-3 mb-3 text-sm text-gray-600">
                  {favorite.listing.roomCount && <span>🛏️ {favorite.listing.roomCount}</span>}
                  {favorite.listing.netSquareMeters && <span>📐 {favorite.listing.netSquareMeters}m²</span>}
                </div>

                {/* Not */}
                {editingNoteId === favorite.listingId ? (
                  <div className="mb-3">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Not ekleyin..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      rows={2}
                      maxLength={500}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSaveNote(favorite.listingId)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                      >
                        Kaydet
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteId(null);
                          setNoteText('');
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : favorite.note ? (
                  <div 
                    onClick={() => handleStartEditNote(favorite.listingId, favorite.note)}
                    className="mb-3 p-2 bg-yellow-50 rounded-lg text-sm text-yellow-800 cursor-pointer hover:bg-yellow-100"
                  >
                    📝 {favorite.note}
                  </div>
                ) : (
                  <button
                    onClick={() => handleStartEditNote(favorite.listingId, '')}
                    className="mb-3 text-xs text-gray-500 hover:text-blue-600"
                  >
                    + Not ekle
                  </button>
                )}

                {/* Fiyat ve Aksiyon */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xl font-bold text-blue-600">
                    {formatPrice(favorite.listing.price, favorite.listing.type, favorite.listing.currency)}
                  </div>
                  <button 
                    onClick={() => handleViewDetails(favorite.listingId)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                  >
                    Detaylar
                  </button>
                </div>

                {/* Favoriye Eklenme Tarihi */}
                <p className="text-xs text-gray-400 mt-2">
                  Favorilere eklendi: {new Date(favorite.createdAt).toLocaleDateString('tr-TR')}
                </p>
              </div>
            </div>
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
