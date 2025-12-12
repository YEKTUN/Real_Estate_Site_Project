/**
 * Favorite DTO'ları
 * 
 * Favori işlemleri için tip tanımlamaları.
 * Backend API'leri ile uyumlu.
 */

import { ListingListDto, PaginationDto } from '../../listing/DTOs/ListingDTOs';

// ============================================================================
// FAVORİ DTO'LARI
// ============================================================================

/**
 * Favori İlan DTO
 */
export interface FavoriteListingDto {
  id: number;
  listingId: number;
  listing: ListingListDto;
  note?: string;
  createdAt: string;
}

/**
 * Favoriye Ekleme DTO
 */
export interface AddFavoriteDto {
  note?: string;
}

/**
 * Favori Not Güncelleme DTO
 */
export interface UpdateFavoriteNoteDto {
  note?: string;
}

// ============================================================================
// RESPONSE DTO'LARI
// ============================================================================

/**
 * Favori İşlemleri için Response DTO
 */
export interface FavoriteResponseDto {
  success: boolean;
  message: string;
  isFavorited: boolean;
}

/**
 * Favori Listesi için Response DTO
 */
export interface FavoriteListResponseDto {
  success: boolean;
  message: string;
  favorites: FavoriteListingDto[];
  pagination: PaginationDto;
}

// ============================================================================
// STATE TİPİ
// ============================================================================

export interface FavoriteState {
  // Favoriler
  favorites: FavoriteListingDto[];
  
  // Favori ID'leri (hızlı kontrol için)
  favoriteIds: number[];
  
  // Sayfalama
  pagination: PaginationDto | null;
  
  // Loading states
  isLoading: boolean;
  isToggling: boolean;
  
  // Error
  error: string | null;
}
