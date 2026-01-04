'use client';

import {
  ListingListDto,
  ListingType,
} from '@/body/redux/slices/listing/DTOs/ListingDTOs';
import { formatPrice } from './formatPrice';

interface ListingCardProps {
  listing: ListingListDto;
  isFavorited: boolean;
  isToggling: boolean;
  onFavoriteToggle: (listingId: number) => void;
  onViewDetails: (listingId: number) => void;
  viewMode?: 'grid' | 'list';
  currentUserId?: string;
}

export default function ListingCard({
  listing,
  isFavorited,
  isToggling,
  onFavoriteToggle,
  onViewDetails,
  viewMode = 'grid',
  currentUserId,
}: ListingCardProps) {
  const isList = viewMode === 'list';
  // Kullanıcı giriş yapmışsa ve ilan sahibi kendisiyse true
  const isOwnListing = !!(currentUserId && listing.ownerId && currentUserId === listing.ownerId);


  return (
    <div
      className={`bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex ring-1 ring-black/5 ${isList ? 'flex-row h-36 sm:h-40' : 'flex-col h-full'
        }`}
    >
      {/* Görsel Alanı */}
      <div
        className={`relative overflow-hidden cursor-pointer shrink-0 ${isList ? 'w-36 sm:w-56 h-full' : 'aspect-[4/3]'
          }`}
        onClick={() => onViewDetails(listing.id)}
      >
        {listing.coverImageUrl ? (
          <img
            src={listing.coverImageUrl}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-4xl">
            🏠
          </div>
        )}

        {/* Overlay Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-black text-white shadow-sm ${listing.type === ListingType.ForSale ? 'bg-orange-500' : 'bg-green-500'
            }`}>
            {listing.type === ListingType.ForSale ? 'SATILIK' : 'KİRALIK'}
          </span>
        </div>

        {/* Favori Butonu (Mobil Grid veya Tüm List görünümleri için) - Sadece kendi ilanı değilse göster */}
        {!isOwnListing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle(listing.id);
            }}
            disabled={isToggling}
            aria-label={isFavorited ? "Favorilerden çıkar" : "Favorilere ekle"}
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-md p-1 rounded-full hover:bg-white transition-all shadow-sm active:scale-90"
          >
            <span className={`text-base ${isFavorited ? 'text-red-500' : 'text-gray-400'}`}>
              {isFavorited ? '❤️' : '🤍'}
            </span>
          </button>
        )}

        {/* Küçük Bilgi Overlay - Sadece Grid modunda ya da mobilde resim üzerinde */}
        {!isList && (
          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black/30 backdrop-blur-[2px] px-2 py-1 rounded-lg">
            <div className="flex gap-2">
              <span className="text-white text-[10px] font-bold flex items-center gap-1 opacity-90">👁️ {listing.viewCount}</span>
              <span className="text-white text-[10px] font-bold flex items-center gap-1 opacity-90">❤️ {listing.favoriteCount}</span>
            </div>
            <span className="text-white text-[10px] font-bold opacity-90">{listing.listingNumber}</span>
          </div>
        )}
      </div>

      {/* İçerik Alanı */}
      <div className={`p-2.5 flex flex-col flex-1 justify-between bg-white min-w-0 ${isList ? 'sm:p-4' : ''}`}>
        <div className="min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className={`font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors ${isList ? 'text-sm sm:text-base' : 'text-sm'}`} title={listing.title}>
              {listing.title}
            </h3>
            {isList && (
              <span className="text-gray-400 text-[9px] font-bold shrink-0 hidden sm:block">#{listing.listingNumber}</span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-1">
            <span className="grayscale">📍</span>
            <span className="truncate font-medium">{listing.district}, {listing.city}</span>
          </div>

          {/* Özellikler Grid */}
          <div className={`flex gap-3 py-1.5 border-y border-gray-50 my-1.5 overflow-x-auto scrollbar-hide ${isList ? 'sm:gap-5 sm:my-2' : ''}`}>
            {listing.roomCount && (
              <div className="flex flex-col items-center min-w-[30px]">
                <span className="text-[9px] text-gray-400 font-bold uppercase">Oda</span>
                <span className="text-[10px] font-black text-gray-700">{listing.roomCount}</span>
              </div>
            )}
            {listing.netSquareMeters && (
              <div className="flex flex-col items-center min-w-[40px]">
                <span className="text-[9px] text-gray-400 font-bold uppercase">m²</span>
                <span className="text-[10px] font-black text-gray-700">{listing.netSquareMeters}</span>
              </div>
            )}
            {listing.floorNumber !== undefined && (
              <div className="flex flex-col items-center min-w-[30px]">
                <span className="text-[9px] text-gray-400 font-bold uppercase">Kat</span>
                <span className="text-[10px] font-black text-gray-700">{listing.floorNumber}</span>
              </div>
            )}
            {isList && (
              <div className="hidden sm:flex flex-col items-center min-w-[50px]">
                <span className="text-[9px] text-gray-400 font-bold uppercase">İzlenme</span>
                <span className="text-[10px] font-black text-gray-700">{listing.viewCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Fiyat Alanı */}
        <div className="mt-1 flex items-center justify-between">
          <div className="flex flex-col">
            <span className={`font-black text-blue-700 ${isList ? 'text-base sm:text-lg' : 'text-[13px]'}`}>
              {formatPrice(listing.price, listing.type, listing.currency)}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(listing.id); }}
            className={`font-black text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all uppercase tracking-tighter shadow-md shadow-blue-100 ${isList ? 'px-4 py-1.5 text-[10px]' : 'px-3 py-1.5 text-[10px]'
              }`}
          >
            İncele
          </button>
        </div>
      </div>
    </div>
  );
}
