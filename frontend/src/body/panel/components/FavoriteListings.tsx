'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MapPin,
  BedDouble,
  Maximize,
  Calendar,
  Trash2,
  ExternalLink,
  StickyNote,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Check
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/body/redux/hooks';
import {
  fetchMyFavorites,
  toggleFavorite,
  removeFromFavorites,
  updateFavoriteNote,
  selectFavorites,
  selectFavoriteIds,
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
  const favoriteIds = useAppSelector(selectFavoriteIds);
  const pagination = useAppSelector(selectFavoritePagination);
  const isLoading = useAppSelector(selectFavoriteLoading);
  const isToggling = useAppSelector(selectFavoriteToggling);
  const error = useAppSelector(selectFavoriteError);

  // Constants
  const PAGE_SIZE = 6;

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');

  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Favorileri yükle
  useEffect(() => {
    console.log('FavoriteListings: Favoriler yükleniyor...');
    dispatch(fetchMyFavorites({ page: currentPage, pageSize: PAGE_SIZE }));
  }, [dispatch, currentPage, PAGE_SIZE]);

  // Sayfa boşalınca bir önceki sayfaya dön
  useEffect(() => {
    if (favorites.length === 0 && currentPage > 1 && !isLoading) {
      setCurrentPage(prev => prev - 1);
    }
  }, [favorites.length, currentPage, isLoading]);

  /**
   * Fiyat formatla
   */
  const formatPrice = (price: number, type: ListingType, currency: Currency) => {
    const currencySymbol = currency === Currency.TRY ? '₺' : currency === Currency.USD ? '$' : '€';
    const formatted = new Intl.NumberFormat('tr-TR').format(price);
    return type === ListingType.ForRent ? `${currencySymbol}${formatted}/ay` : `${currencySymbol}${formatted}`;
  };

  /**
   * Favori toggle (Ekle/Kaldır)
   */
  const handleToggleFavorite = async (listingId: number) => {
    try {
      console.log('Favori durumu değiştiriliyor:', listingId);
      const result = await dispatch(toggleFavorite(listingId)).unwrap();

      // Eğer favoriden çıkarıldıysa ve sayfada başka ilan kalmadıysa veya sayfa yapısını korumak için yenile
      if (!result.response.isFavorited) {
        dispatch(fetchMyFavorites({ page: currentPage, pageSize: PAGE_SIZE }));
      }
    } catch (err) {
      console.error('Favori değiştirme hatası:', err);
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
      dispatch(fetchMyFavorites({ page: currentPage, pageSize: PAGE_SIZE }));
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
      try {
        for (const fav of favorites) {
          await dispatch(removeFromFavorites(fav.listingId)).unwrap();
        }
        setSelectedIds([]);
        setIsSelectionMode(false);
        // İlk sayfaya dön ve yenile
        setCurrentPage(1);
        dispatch(fetchMyFavorites({ page: 1, pageSize: PAGE_SIZE }));
      } catch (err) {
        console.error('Tümünü temizleme hatası:', err);
      }
    }
  };

  /**
   * Seçim modunu yönet
   */
  const toggleSelection = (listingId: number) => {
    setSelectedIds(prev =>
      prev.includes(listingId)
        ? prev.filter(id => id !== listingId)
        : [...prev, listingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === favorites.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(favorites.map(f => f.listingId));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`${selectedIds.length} ilanı favorilerden kaldırmak istediğinize emin misiniz?`)) {
      try {
        for (const id of selectedIds) {
          await dispatch(removeFromFavorites(id)).unwrap();
        }
        setSelectedIds([]);
        setIsSelectionMode(false);

        // Mevcut sayfayı yenile
        dispatch(fetchMyFavorites({ page: currentPage, pageSize: PAGE_SIZE }));
      } catch (err) {
        console.error('Toplu silme hatası:', err);
      }
    }
  };

  /**
   * Sayfa değiştir
   */
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Backend'den limitli gelse bile client-side koruması
  const totalItems = pagination?.totalCount || favorites.length;
  const totalPages = pagination?.totalPages || Math.ceil(favorites.length / PAGE_SIZE);

  // Eğer backend sayfalamayı desteklemiyorsa (tümünü dönüyorsa) lokalde kes
  // Eğer destekliyorsa zaten gelen liste doğru boyuttadır
  const displayedFavorites = favorites.length > PAGE_SIZE
    ? favorites.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : favorites;

  // Loading state
  if (isLoading && favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
          <Heart className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
        </div>
        <p className="mt-6 text-slate-500 font-black text-xs uppercase tracking-[0.2em]">Favorileriniz Hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">
      {/* Error Alert - Premium */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top duration-300 shadow-sm">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
            <span className="text-xl">⚠️</span>
          </div>
          <div className="flex-1">
            <h5 className="font-bold text-red-900 text-sm">İşlem Başarısız</h5>
            <p className="text-red-700 text-xs">{error}</p>
          </div>
          <button onClick={() => dispatch(clearError())} className="p-2 hover:bg-white rounded-xl transition-colors text-red-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">FAVORİLERİM</h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">
            {isSelectionMode ? `${selectedIds.length} İLAN SEÇİLDİ` : 'BEĞENDİĞİNİZ TÜM İLANLAR BİR ARADA'}
          </p>
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-2">
            {!isSelectionMode ? (
              <>
                <div className="hidden sm:block px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Toplam</p>
                  <p className="text-xs font-bold text-slate-800 mt-1">{totalItems}</p>
                </div>
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all font-black text-[9px] uppercase tracking-widest"
                >
                  SEÇ
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={isToggling}
                  className="flex items-center gap-2 px-4 py-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest border border-red-100 disabled:opacity-30"
                >
                  TÜMÜNÜ TEMİZLE
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-indigo-100 transition-all"
                >
                  {selectedIds.length === favorites.length ? 'SEÇİMİ KALDIR' : 'TÜMÜNÜ SEÇ'}
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={selectedIds.length === 0}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100 disabled:opacity-30 disabled:shadow-none"
                >
                  SİL ({selectedIds.length})
                </button>
                <button
                  onClick={() => {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  İPTAL
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border border-slate-100 shadow-sm text-center">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-8 relative">
            <Heart className="w-10 h-10 text-indigo-600" />
            <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-20" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-3">Favori İlanınız Yok</h3>
          <p className="text-slate-500 max-w-sm mb-8 font-medium">Beğendiğiniz ilanları favorilere ekleyerek burada görebilir, üzerlerine notlar alabilirsiniz.</p>
          <button
            onClick={() => router.push('/properties')}
            className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-slate-200"
          >
            <Search className="w-4 h-4" /> İLANLARI KEŞFET
          </button>
        </div>
      ) : (
        <div
          key={currentPage}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {displayedFavorites.map((favorite, index) => (
            <div
              key={favorite.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="group bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 flex flex-col h-full animate-in fade-in zoom-in-95 fill-mode-both"
            >
              {/* Image Section */}
              <div className="h-28 relative overflow-hidden shrink-0">
                {favorite.listing.coverImageUrl ? (
                  <img
                    src={favorite.listing.coverImageUrl}
                    alt={favorite.listing.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                    <Heart className="w-10 h-10 text-slate-200" />
                  </div>
                )}

                {/* Selection Overlay */}
                {isSelectionMode && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelection(favorite.listingId);
                    }}
                    className={`absolute inset-0 z-20 cursor-pointer transition-all ${selectedIds.includes(favorite.listingId) ? 'bg-indigo-600/20' : 'bg-black/5 hover:bg-black/10'
                      }`}
                  >
                    <div className={`absolute top-4 left-4 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedIds.includes(favorite.listingId)
                      ? 'bg-indigo-600 border-indigo-600 shadow-lg'
                      : 'bg-white/80 border-white shadow-sm'
                      }`}>
                      {selectedIds.includes(favorite.listingId) && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                )}

                {/* Overlay Badges */}
                {!isSelectionMode && (
                  <div className="absolute inset-x-0 top-0 p-4 flex items-start justify-between bg-gradient-to-b from-black/40 to-transparent z-10">
                    <div className="flex flex-col gap-1.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white backdrop-blur-md ${favorite.listing.type === ListingType.ForSale ? 'bg-indigo-600/80' : 'bg-green-600/80'
                        }`}>
                        {favorite.listing.type === ListingType.ForSale ? 'SATILIK' : 'KİRALIK'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleFavorite(favorite.listingId)}
                      disabled={isToggling}
                      className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-md hover:bg-white hover:scale-110 transition-all text-red-500 disabled:opacity-50"
                    >
                      <Heart className={`w-3.5 h-3.5 ${favoriteIds.includes(favorite.listingId) ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                )}

                {/* Price Label on Image */}
                <div className="absolute bottom-4 right-4 z-10">
                  <div className="px-3 py-1.5 bg-slate-900/80 backdrop-blur-md rounded-xl text-white font-black text-xs tracking-tight shadow-lg border border-white/10">
                    {formatPrice(favorite.listing.price, favorite.listing.type, favorite.listing.currency)}
                  </div>
                </div>

                {/* Date Badge */}
                <div className="absolute bottom-4 left-4 z-10">
                  <div className="px-2.5 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg border border-white/50 flex items-center gap-1.5 shadow-sm">
                    <Calendar className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-tight">
                      {new Date(favorite.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-3 flex flex-col grow">
                <div className="grow">
                  <h3
                    onClick={() => !isSelectionMode && handleViewDetails(favorite.listingId)}
                    className={`text-[11px] font-bold text-slate-800 line-clamp-1 transition-colors leading-tight mb-1 ${!isSelectionMode ? 'hover:text-indigo-600 cursor-pointer' : ''
                      }`}
                  >
                    {favorite.listing.title}
                  </h3>

                  <div className="flex items-center gap-1 text-slate-400 mb-2">
                    <MapPin className="w-2 h-2 shrink-0" />
                    <span className="text-[7px] font-bold uppercase tracking-tight truncate">
                      {favorite.listing.district}, {favorite.listing.city}
                    </span>
                  </div>

                  {/* Badges/Features */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {favorite.listing.roomCount && (
                      <div className="px-1 py-0.5 bg-slate-50 rounded border border-slate-100 flex items-center gap-0.5 group/feat">
                        <BedDouble className="w-1.5 h-1.5 text-slate-400 group-hover/feat:text-indigo-500 transition-colors" />
                        <span className="text-[7px] font-bold text-slate-600">{favorite.listing.roomCount}</span>
                      </div>
                    )}
                    {favorite.listing.netSquareMeters && (
                      <div className="px-1 py-0.5 bg-slate-50 rounded border border-slate-100 flex items-center gap-0.5 group/feat">
                        <Maximize className="w-1.5 h-1.5 text-slate-400 group-hover/feat:text-indigo-500 transition-colors" />
                        <span className="text-[7px] font-bold text-slate-600">{favorite.listing.netSquareMeters} m²</span>
                      </div>
                    )}
                  </div>

                  {/* Compact Note Section */}
                  <div className="mb-2 pt-2 border-t border-slate-50">
                    {editingNoteId === favorite.listingId ? (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        <textarea
                          value={noteText}
                          autoFocus
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Notunuz..."
                          className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-100 rounded-xl text-xs font-medium resize-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300 outline-none text-indigo-900 min-h-[60px]"
                          maxLength={500}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveNote(favorite.listingId)}
                            className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all"
                          >
                            KAYDET
                          </button>
                          <button
                            onClick={() => { setEditingNoteId(null); setNoteText(''); }}
                            className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                          >
                            İPTAL
                          </button>
                        </div>
                      </div>
                    ) : favorite.note ? (
                      <div
                        onClick={() => !isSelectionMode && handleStartEditNote(favorite.listingId, favorite.note)}
                        className={`p-2 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[9px] font-medium text-indigo-900 relative group/note ${!isSelectionMode ? 'cursor-pointer hover:bg-indigo-100 transition-all' : ''
                          }`}
                      >
                        <div className="flex items-start gap-1">
                          <StickyNote className="w-2 h-2 text-indigo-400 shrink-0 mt-0.5" />
                          <p className="italic leading-snug line-clamp-2">"{favorite.note}"</p>
                        </div>
                      </div>
                    ) : (
                      !isSelectionMode && (
                        <button
                          onClick={() => handleStartEditNote(favorite.listingId, '')}
                          className="flex items-center gap-2 w-full p-2 border border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <Plus className="w-3 h-3" /> NOT EKLE
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                {!isSelectionMode && (
                  <button
                    onClick={() => handleViewDetails(favorite.listingId)}
                    className="w-full py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-100 mt-auto flex items-center justify-center gap-2"
                  >
                    İLAN DETAYI <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination - Premium */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 py-6 pt-8 border-t border-slate-100">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
            disabled={currentPage === 1}
            className="w-10 h-10 flex items-center justify-center border border-slate-100 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm group"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 transition-transform group-hover:-translate-x-1" />
          </button>

          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                className={`w-8 h-8 rounded-lg transition-all font-black text-[10px] ${page === currentPage
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105'
                  : 'text-slate-400 hover:text-slate-800 hover:bg-white'
                  }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
            disabled={currentPage === totalPages}
            className="w-10 h-10 flex items-center justify-center border border-slate-100 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm group"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
}
