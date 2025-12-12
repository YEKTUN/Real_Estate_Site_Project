import axiosInstance from './axiosInstance';
import {
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
  CommentListResponseDto,
} from '../slices/comment/DTOs/CommentDTOs';

/**
 * Comment API
 * 
 * Yorum işlemleri için API fonksiyonları.
 * axiosInstance kullanarak backend ile iletişim kurar.
 */

// ============================================================================
// YORUM CRUD İŞLEMLERİ
// ============================================================================

/**
 * İlanın yorumlarını getir
 */
export const getListingCommentsApi = async (listingId: number): Promise<CommentListResponseDto> => {
  try {
    console.log('Yorumlar isteği:', listingId);
    const response = await axiosInstance.get<CommentListResponseDto>(
      `/listings/${listingId}/comments`
    );
    console.log('Yorumlar yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Yorumlar hatası:', error);
    return {
      success: false,
      message: 'Yorumlar yüklenirken bir hata oluştu',
      comments: [],
      totalCount: 0,
    };
  }
};

/**
 * Yorum ekle
 */
export const createCommentApi = async (
  listingId: number, 
  data: CreateCommentDto
): Promise<CommentResponseDto> => {
  try {
    console.log('Yorum ekleme isteği:', { listingId, data });
    const response = await axiosInstance.post<CommentResponseDto>(
      `/listings/${listingId}/comments`, 
      data
    );
    console.log('Yorum ekleme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    return {
      success: false,
      message: 'Yorum eklenirken bir hata oluştu',
    };
  }
};

/**
 * Yorum güncelle
 */
export const updateCommentApi = async (
  listingId: number,
  commentId: number, 
  data: UpdateCommentDto
): Promise<CommentResponseDto> => {
  try {
    console.log('Yorum güncelleme isteği:', { listingId, commentId, data });
    const response = await axiosInstance.put<CommentResponseDto>(
      `/listings/${listingId}/comments/${commentId}`, 
      data
    );
    console.log('Yorum güncelleme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Yorum güncelleme hatası:', error);
    return {
      success: false,
      message: 'Yorum güncellenirken bir hata oluştu',
    };
  }
};

/**
 * Yorum sil
 */
export const deleteCommentApi = async (
  listingId: number,
  commentId: number
): Promise<CommentResponseDto> => {
  try {
    console.log('Yorum silme isteği:', { listingId, commentId });
    const response = await axiosInstance.delete<CommentResponseDto>(
      `/listings/${listingId}/comments/${commentId}`
    );
    console.log('Yorum silme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Yorum silme hatası:', error);
    return {
      success: false,
      message: 'Yorum silinirken bir hata oluştu',
    };
  }
};

// ============================================================================
// KULLANICI YORUMLARI
// ============================================================================

/**
 * Kullanıcının tüm yorumlarını getir
 */
export const getMyCommentsApi = async (): Promise<CommentListResponseDto> => {
  try {
    console.log('Kullanıcı yorumları isteği');
    const response = await axiosInstance.get<CommentListResponseDto>('/my-comments');
    console.log('Kullanıcı yorumları yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Kullanıcı yorumları hatası:', error);
    return {
      success: false,
      message: 'Yorumlarınız yüklenirken bir hata oluştu',
      comments: [],
      totalCount: 0,
    };
  }
};
