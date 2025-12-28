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
}

export default function ListingCard({
  listing,
  isFavorited,
  isToggling,
  onFavoriteToggle,
  onViewDetails,
}: ListingCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full ring-1 ring-black/5">
      {/* Görsel Alanı */}
      <div
        className="relative aspect-[4/3] overflow-hidden cursor-pointer"
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
          <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-black text-white shadow-sm ${listing.type === ListingType.ForSale ? 'bg-orange-500' : 'bg-green-500'
            }`}>
            {listing.type === ListingType.ForSale ? 'SATILIK' : 'KİRALIK'}
          </span>
          {listing.isUrgent && (
            <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-black bg-red-600 text-white shadow-sm">
              ACİL
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
          className="absolute top-2 right-2 bg-white/80 backdrop-blur-md p-1.5 rounded-full hover:bg-white transition-all shadow-sm active:scale-90"
        >
          <span className={`text-base ${isFavorited ? 'text-red-500' : 'text-gray-400'}`}>
            {isFavorited ? '❤️' : '🤍'}
          </span>
        </button>

        {/* Küçük Bilgi Overlay */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black/30 backdrop-blur-[2px] px-2 py-1 rounded-lg">
          <div className="flex gap-2">
            <span className="text-white text-[10px] font-bold flex items-center gap-1 opacity-90">👁️ {listing.viewCount}</span>
            <span className="text-white text-[10px] font-bold flex items-center gap-1 opacity-90">❤️ {listing.favoriteCount}</span>
          </div>
          <span className="text-white text-[10px] font-bold opacity-90">{listing.listingNumber}</span>
        </div>
      </div>

      {/* İçerik Alanı - Daha Zarif */}
      <div className="p-3 flex flex-col flex-1 justify-between bg-white">
        <div>
          <h3 className="text-sm font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1" title={listing.title}>
            {listing.title}
          </h3>

          <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-2">
            <span className="grayscale">📍</span>
            <span className="truncate font-medium">{listing.district}, {listing.city}</span>
          </div>

          {/* Minimalist Özellikler Grid */}
          <div className="flex gap-3 py-2 border-y border-gray-50 my-2 overflow-x-auto scrollbar-hide">
            {listing.roomCount && (
              <div className="flex flex-col items-center min-w-[30px]">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Oda</span>
                <span className="text-[11px] font-black text-gray-700">{listing.roomCount}</span>
              </div>
            )}
            {listing.netSquareMeters && (
              <div className="flex flex-col items-center min-w-[30px]">
                <span className="text-[10px] text-gray-400 font-bold uppercase">m²</span>
                <span className="text-[11px] font-black text-gray-700">{listing.netSquareMeters}</span>
              </div>
            )}
            {listing.floorNumber !== undefined && (
              <div className="flex flex-col items-center min-w-[30px]">
                <span className="text-[10px] text-gray-400 font-bold uppercase">Kat</span>
                <span className="text-[11px] font-black text-gray-700">{listing.floorNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Fiyat Alanı - Premium */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] font-black text-blue-700">
              {formatPrice(listing.price, listing.type, listing.currency)}
            </span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onViewDetails(listing.id); }}
            className="text-[10px] font-black text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all uppercase tracking-tighter"
          >
            Detay
          </button>
        </div>
      </div>
    </div>
  );
}
