import axiosInstance from './axiosInstance';
import {
  AddFavoriteDto,
  UpdateFavoriteNoteDto,
  FavoriteResponseDto,
  FavoriteListResponseDto,
} from '../slices/favorite/DTOs/FavoriteDTOs';

/**
 * Favorite API
 * 
 * Favori işlemleri için API fonksiyonları.
 * axiosInstance kullanarak backend ile iletişim kurar.
 */

// ============================================================================
// FAVORİ İŞLEMLERİ
// ============================================================================

/**
 * Kullanıcının favorilerini getir
 */
export const getMyFavoritesApi = async (
  page: number = 1, 
  pageSize: number = 20
): Promise<FavoriteListResponseDto> => {
  try {
    console.log('Favoriler isteği:', { page, pageSize });
    const response = await axiosInstance.get<FavoriteListResponseDto>('/favorites', {
      params: { page, pageSize },
    });
    console.log('Favoriler yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Favoriler hatası:', error);
    return {
      success: false,
      message: 'Favorileriniz yüklenirken bir hata oluştu',
      favorites: [],
      pagination: {
        currentPage: 1,
        pageSize: 20,
        totalPages: 0,
        totalCount: 0,
        hasPrevious: false,
        hasNext: false,
      },
    };
  }
};

/**
 * Favorilere ekle
 */
export const addToFavoritesApi = async (
  listingId: number, 
  data?: AddFavoriteDto
): Promise<FavoriteResponseDto> => {
  try {
    console.log('Favoriye ekleme isteği:', { listingId, data });
    const response = await axiosInstance.post<FavoriteResponseDto>(
      `/favorites/${listingId}`, 
      data || {}
    );
    console.log('Favoriye ekleme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Favoriye ekleme hatası:', error);
    return {
      success: false,
      message: 'Favori eklenirken bir hata oluştu',
      isFavorited: false,
    };
  }
};

/**
 * Favorilerden kaldır
 */
export const removeFromFavoritesApi = async (listingId: number): Promise<FavoriteResponseDto> => {
  try {
    console.log('Favoriden kaldırma isteği:', listingId);
    const response = await axiosInstance.delete<FavoriteResponseDto>(`/favorites/${listingId}`);
    console.log('Favoriden kaldırma yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Favoriden kaldırma hatası:', error);
    return {
      success: false,
      message: 'Favori kaldırılırken bir hata oluştu',
      isFavorited: true,
    };
  }
};

/**
 * Favori toggle (varsa kaldır, yoksa ekle)
 */
export const toggleFavoriteApi = async (listingId: number): Promise<FavoriteResponseDto> => {
  try {
    console.log('Favori toggle isteği:', listingId);
    const response = await axiosInstance.post<FavoriteResponseDto>(`/favorites/${listingId}/toggle`);
    console.log('Favori toggle yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Favori toggle hatası:', error);
    return {
      success: false,
      message: 'Favori işlemi sırasında bir hata oluştu',
      isFavorited: false,
    };
  }
};

/**
 * Favori notunu güncelle
 */
export const updateFavoriteNoteApi = async (
  listingId: number, 
  data: UpdateFavoriteNoteDto
): Promise<FavoriteResponseDto> => {
  try {
    console.log('Favori not güncelleme isteği:', { listingId, data });
    const response = await axiosInstance.patch<FavoriteResponseDto>(
      `/favorites/${listingId}/note`, 
      data
    );
    console.log('Favori not güncelleme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Favori not güncelleme hatası:', error);
    return {
      success: false,
      message: 'Favori notu güncellenirken bir hata oluştu',
      isFavorited: true,
    };
  }
};

/**
 * İlan favori mi kontrol et
 */
export const checkFavoriteApi = async (listingId: number): Promise<FavoriteResponseDto> => {
  try {
    console.log('Favori kontrol isteği:', listingId);
    const response = await axiosInstance.get<FavoriteResponseDto>(`/favorites/${listingId}/check`);
    console.log('Favori kontrol yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Favori kontrol hatası:', error);
    return {
      success: false,
      message: 'Favori durumu kontrol edilirken bir hata oluştu',
      isFavorited: false,
    };
  }
};
