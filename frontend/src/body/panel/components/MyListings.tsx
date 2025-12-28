'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import UpdateListingModal from './UpdateListingModal';

/**
 * İlanlarım Bileşeni
 * 
 * Kullanıcının kendi ilanlarını listeler ve yönetir.
 * - Modern kart tasarımı
 * - İlan düzenleme (Modal)
 * - Aktif/Pasif toggle
 * - İstatistikler
 */

const statusConfig: Record<ListingStatus, { label: string; color: string; dot: string; bg: string }> = {
  [ListingStatus.Active]: { label: 'Yayında', color: 'text-green-700', bg: 'bg-green-50', dot: 'bg-green-500' },
  [ListingStatus.Pending]: { label: 'Onay Bekliyor', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  [ListingStatus.Inactive]: { label: 'Pasif (Gizli)', color: 'text-gray-600', bg: 'bg-gray-100', dot: 'bg-gray-400' },
  [ListingStatus.Sold]: { label: 'Satıldı', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  [ListingStatus.Rented]: { label: 'Kiralandı', color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  [ListingStatus.Rejected]: { label: 'Reddedildi', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
  [ListingStatus.Expired]: { label: 'Süresi Doldu', color: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-500' },
};

export default function MyListings() {
  const dispatch = useAppDispatch();

  const listings = useAppSelector(selectMyListings);
  const pagination = useAppSelector(selectPagination);
  const isLoading = useAppSelector(selectListingLoading);
  const isDeleting = useAppSelector(selectListingDeleting);
  const error = useAppSelector(selectListingError);

  const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingListingId, setEditingListingId] = useState<number | null>(null);

  useEffect(() => {
    dispatch(fetchMyListings({ page: currentPage, pageSize: 10 }));
  }, [dispatch, currentPage]);

  const filteredListings = listings.filter((listing) => {
    if (statusFilter === 'all') return true;
    return listing.status === statusFilter;
  });

  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === ListingStatus.Active).length,
    totalViews: listings.reduce((sum, l) => sum + l.viewCount, 0),
    totalFavorites: listings.reduce((sum, l) => sum + l.favoriteCount, 0),
  };

  const handleStatusToggle = async (id: number, currentStatus: ListingStatus) => {
    // Sadece Aktif ve Pasif arasında geçişe izin ver
    if (currentStatus !== ListingStatus.Active && currentStatus !== ListingStatus.Inactive) {
      return;
    }

    const newStatus = currentStatus === ListingStatus.Active ? ListingStatus.Inactive : ListingStatus.Active;
    try {
      await dispatch(updateListingStatus({ listingId: id, status: newStatus })).unwrap();
      dispatch(fetchMyListings({ page: currentPage, pageSize: 10 }));
    } catch (err) {
      console.error('Durum değiştirme hatası:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bu ilanı tamamen silmek istediğinizden emin misiniz?')) {
      try {
        await dispatch(deleteListing(id)).unwrap();
        dispatch(fetchMyListings({ page: currentPage, pageSize: 10 }));
      } catch (err) {
        console.error('İlan silme hatası:', err);
      }
    }
  };

  if (isLoading && listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-500 font-bold">İlanlarınız Getiriliyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Toplam İlan', value: stats.total, color: 'blue', icon: '📋' },
          { label: 'Yayındaki İlan', value: stats.active, color: 'green', icon: '✅' },
          { label: 'Görüntülenme', value: stats.totalViews, color: 'purple', icon: '👁️' },
          { label: 'Favoriler', value: stats.totalFavorites, color: 'orange', icon: '❤️' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-50 hover:shadow-xl transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${s.color}-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-125`}></div>
            <p className="text-sm font-black text-gray-400 uppercase mb-1">{s.label}</p>
            <div className="flex items-end gap-2">
              <span className={`text-3xl font-black text-${s.color}-600`}>{s.value}</span>
              <span className="text-xl mb-1">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Kontrol Paneli: Filtrele & Arama */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${statusFilter === 'all' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
          >
            TÜMÜ ({listings.length})
          </button>
          {[ListingStatus.Active, ListingStatus.Pending, ListingStatus.Inactive].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${statusFilter === status ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
            >
              {statusConfig[status].label.toUpperCase()} ({listings.filter((l) => l.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* İlan Gradi */}
      <div className="space-y-4">
        {filteredListings.length === 0 ? (
          <div className="bg-gray-50 rounded-[40px] py-20 text-center border-2 border-dashed border-gray-200">
            <span className="text-6xl grayscale opacity-30">📂</span>
            <h3 className="text-xl font-black text-gray-400 mt-6">BULUNAMADI</h3>
            <p className="text-gray-400">Henüz bu kriterlere uygun ilanınız yok.</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <ListingActionCard
              key={listing.id}
              listing={listing}
              onEdit={() => setEditingListingId(listing.id)}
              onDelete={() => handleDelete(listing.id)}
              onToggleStatus={() => handleStatusToggle(listing.id, listing.status)}
              isDeleting={isDeleting}
            />
          ))
        )}
      </div>

      {/* Modal */}
      {editingListingId && (
        <UpdateListingModal
          listingId={editingListingId}
          onClose={() => setEditingListingId(null)}
          currentPage={currentPage}
        />
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-10">
          {/* Pagination logic here - reuse the styled one from Listings.tsx */}
        </div>
      )}
    </div>
  );
}

interface ListingActionCardProps {
  listing: ListingListDto;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  isDeleting: boolean;
}

/**
 * Aksiyonlanabilir İlan Kartı (Redesigned)
 */
function ListingActionCard({ listing, onEdit, onDelete, onToggleStatus, isDeleting }: ListingActionCardProps) {
  const config = statusConfig[listing.status] || statusConfig[ListingStatus.Pending];

  const formatPrice = (price: number, type: ListingType, currency: Currency) => {
    const symbol = currency === Currency.TRY ? '₺' : currency === Currency.USD ? '$' : '€';
    const formatted = new Intl.NumberFormat('tr-TR').format(price);
    return `${formatted} ${symbol}`;
  };

  return (
    <div className={`bg-white rounded-3xl p-4 shadow-sm border border-gray-100 hover:shadow-2xl transition-all group ${listing.status === ListingStatus.Inactive ? 'opacity-80 grayscale-[0.5]' : ''}`}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Görsel Bölümü */}
        <div className="relative w-full lg:w-48 h-36 rounded-2xl overflow-hidden shrink-0">
          {listing.coverImageUrl ? (
            <img src={listing.coverImageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-3xl">🏠</div>
          )}
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-black uppercase shadow-sm">
            {listing.type === ListingType.ForSale ? 'SATILIK' : 'KİRALIK'}
          </div>
        </div>

        {/* Bilgi Bölümü */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <Link href={`/listing/${listing.id}`}>
                <h3 className="text-lg font-black text-gray-800 tracking-tight hover:text-blue-600 transition-colors uppercase cursor-pointer">
                  {listing.title}
                </h3>
              </Link>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`}></span>
                {config.label}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1">📍 {listing.district}, {listing.city}</span>
              <span className="flex items-center gap-1">🆔 #{listing.listingNumber}</span>
              <span className="flex items-center gap-1">🛏️ {listing.roomCount}</span>
              <span className="flex items-center gap-1">📐 {listing.netSquareMeters}m²</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-50 mt-4 pt-3">
            <div className="text-xl font-black text-blue-600">
              {formatPrice(listing.price, listing.type, listing.currency)}
            </div>
            <div className="flex gap-4 text-xs font-bold text-gray-400">
              <span className="flex items-center gap-1">👁️ {listing.viewCount}</span>
              <span className="flex items-center gap-1">❤️ {listing.favoriteCount}</span>
            </div>
          </div>
        </div>

        {/* Aksiyon Butonları - Modern Düzen */}
        <div className="flex lg:flex-col items-center justify-center gap-2 lg:pl-6 lg:border-l border-gray-50 min-w-[140px]">
          <button
            onClick={onEdit}
            className="w-full py-2.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            ✏️ DÜZENLE
          </button>

          {/* Durum Değiştirme Butonu - Kısıtlanmış Mantık */}
          {(listing.status === ListingStatus.Active || listing.status === ListingStatus.Inactive) ? (
            <button
              onClick={onToggleStatus}
              className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${listing.status === ListingStatus.Active
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white'
                : 'bg-green-50 text-green-700 hover:bg-green-600 hover:text-white'
                }`}
            >
              {listing.status === ListingStatus.Active ? '⏸️ PASİF YAP' : '▶️ YAYINA AL'}
            </button>
          ) : (
            <div className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border-2 border-dashed ${listing.status === ListingStatus.Pending ? 'bg-gray-50 text-gray-400 border-gray-200' : 'bg-red-50 text-red-400 border-red-100'
              }`}>
              {listing.status === ListingStatus.Pending ? '⏳ ONAY BEKLENİYOR' : '❌ REDDEDİLDİ'}
            </div>
          )}

          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
          >
            🗑️ SİL
          </button>
        </div>
      </div>
    </div>
  );
}
