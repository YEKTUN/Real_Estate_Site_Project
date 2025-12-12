/**
 * Comment DTO'ları
 * 
 * Yorum işlemleri için tip tanımlamaları.
 * Backend API'leri ile uyumlu.
 */

// ============================================================================
// YORUM DTO'LARI
// ============================================================================

/**
 * Yorum Yapan Kullanıcı DTO
 */
export interface CommentUserDto {
  id: string;
  name: string;
  surname: string;
  profilePictureUrl?: string;
}

/**
 * Yorum DTO
 */
export interface CommentDto {
  id: number;
  listingId: number;
  content: string;
  user: CommentUserDto;
  parentCommentId?: number;
  replies: CommentDto[];
  createdAt: string;
  updatedAt?: string;
  isEdited: boolean;
  isOwner: boolean;
}

/**
 * Yorum Oluşturma DTO
 */
export interface CreateCommentDto {
  content: string;
  parentCommentId?: number;
}

/**
 * Yorum Güncelleme DTO
 */
export interface UpdateCommentDto {
  content: string;
}

// ============================================================================
// RESPONSE DTO'LARI
// ============================================================================

/**
 * Yorum İşlemleri için Response DTO
 */
export interface CommentResponseDto {
  success: boolean;
  message: string;
  comment?: CommentDto;
}

/**
 * Yorum Listesi için Response DTO
 */
export interface CommentListResponseDto {
  success: boolean;
  message: string;
  comments: CommentDto[];
  totalCount: number;
}

// ============================================================================
// STATE TİPİ
// ============================================================================

export interface CommentState {
  // Yorumlar (İlan ID'ye göre gruplandırılmış)
  commentsByListing: { [listingId: number]: CommentDto[] };
  
  // Kullanıcının kendi yorumları
  myComments: CommentDto[];
  
  // Toplam yorum sayıları (İlan ID'ye göre)
  commentCounts: { [listingId: number]: number };
  
  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error
  error: string | null;
}
