'use client';

import {
  ListingListDto,
  ListingType,
} from '@/body/redux/slices/listing/DTOs/ListingDTOs';
import { formatPrice } from './formatPrice';

/**
 * İlan Kartı Bileşeni
 * 
 * İlan bilgilerini kart formatında gösterir.
 * Görsel, başlık, konum, özellikler ve fiyat bilgilerini içerir.
 */

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
          aria-label={isFavorited ? 'Favorilerden çıkar' : 'Favorilere ekle'}
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

