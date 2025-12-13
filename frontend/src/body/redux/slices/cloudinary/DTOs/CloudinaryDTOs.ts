/**
 * Cloudinary DTO'ları
 * 
 * Cloudinary görsel yükleme ve yönetim işlemleri için tip tanımlamaları.
 */

// ============================================================================
// UPLOAD RESULT DTO
// ============================================================================

/**
 * Cloudinary görsel yükleme sonuç DTO
 */
export interface CloudinaryUploadResultDto {
  success: boolean;
  message: string;
  publicId?: string;
  secureUrl?: string;
  url?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  format?: string;
  uploadedAt?: string;
  originalFileName?: string;
}

/**
 * Cloudinary görsel silme sonuç DTO
 */
export interface CloudinaryDeleteResultDto {
  success: boolean;
  message: string;
  publicId?: string;
}

/**
 * Çoklu görsel yükleme response DTO
 */
export interface CloudinaryMultiUploadResponseDto {
  success: boolean;
  message: string;
  uploadedImages: CloudinaryUploadResultDto[];
  successCount: number;
  failedCount: number;
  totalCount: number;
}

/**
 * İlan görseli yükleme response DTO
 */
export interface ListingImageUploadResponseDto {
  success: boolean;
  message: string;
  imageId?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  publicId?: string;
}

// ============================================================================
// STATE INTERFACE
// ============================================================================

/**
 * Cloudinary state interface
 */
export interface CloudinaryState {
  // Yükleme durumu
  isUploading: boolean;
  isUploadingMultiple: boolean;
  isDeleting: boolean;
  
  // Son yüklenen görseller
  lastUploadedImage: CloudinaryUploadResultDto | null;
  lastUploadedImages: CloudinaryUploadResultDto[];
  
  // Hata durumu
  error: string | null;
  
  // İlan görseli yükleme durumu
  isUploadingListingImage: boolean;
  lastListingImageUpload: ListingImageUploadResponseDto | null;
}

