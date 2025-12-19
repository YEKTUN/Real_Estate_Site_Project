import axiosInstance from './axiosInstance';
import {
  CloudinaryUploadResultDto,
  CloudinaryDeleteResultDto,
  CloudinaryMultiUploadResponseDto,
  ListingImageUploadResponseDto,
} from '../slices/cloudinary/DTOs/CloudinaryDTOs';

/**
 * Cloudinary API
 * 
 * Cloudinary görsel yükleme ve yönetim işlemleri için API fonksiyonları.
 * FormData kullanarak dosya yükleme işlemleri yapar.
 */

// ============================================================================
// GENEL GÖRSEL YÜKLEME
// ============================================================================

/**
 * Tek görsel yükle (Cloudinary'e)
 * 
 * @param file Yüklenecek görsel dosyası
 * @param folder Opsiyonel klasör adı
 * @returns Yükleme sonucu
 */
export const uploadImageApi = async (
  file: File,
  folder?: string
): Promise<CloudinaryUploadResultDto> => {
  try {
    console.log('📤 Görsel yükleme isteği:', { fileName: file.name, size: file.size, folder });

    // FormData oluştur
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    // Content-Type'ı multipart/form-data olarak ayarla
    const response = await axiosInstance.post<CloudinaryUploadResultDto>(
      '/ImageUpload/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('✅ Görsel yükleme yanıtı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Görsel yükleme hatası:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Görsel yüklenirken bir hata oluştu',
    };
  }
};

/**
 * Birden fazla görsel yükle (Cloudinary'e)
 * 
 * @param files Yüklenecek görsel dosyaları
 * @param folder Opsiyonel klasör adı
 * @returns Yükleme sonuçları
 */
export const uploadMultipleImagesApi = async (
  files: File[],
  folder?: string
): Promise<CloudinaryMultiUploadResponseDto> => {
  try {
    console.log('📤 Çoklu görsel yükleme isteği:', { count: files.length, folder });

    // FormData oluştur
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await axiosInstance.post<CloudinaryMultiUploadResponseDto>(
      '/ImageUpload/upload-multiple',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('✅ Çoklu görsel yükleme yanıtı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Çoklu görsel yükleme hatası:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Görseller yüklenirken bir hata oluştu',
      uploadedImages: [],
      successCount: 0,
      failedCount: files.length,
      totalCount: files.length,
    };
  }
};

// ============================================================================
// DOSYA YÜKLEME (GENEL) - Mesaj ekleri için
// ============================================================================

export const uploadFileApi = async (
  file: File,
  folder?: string
): Promise<CloudinaryUploadResultDto> => {
  try {
    console.log('📤 Dosya yükleme isteği:', { fileName: file.name, size: file.size, folder });

    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await axiosInstance.post<CloudinaryUploadResultDto>(
      '/ImageUpload/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('✅ Dosya yükleme yanıtı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Dosya yükleme hatası:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Dosya yüklenirken bir hata oluştu',
    };
  }
};

/**
 * Görsel sil (Cloudinary'den)
 * 
 * @param publicId Cloudinary Public ID
 * @returns Silme sonucu
 */
export const deleteImageApi = async (
  publicId: string
): Promise<CloudinaryDeleteResultDto> => {
  try {
    console.log('🗑️ Görsel silme isteği:', publicId);

    const response = await axiosInstance.delete<CloudinaryDeleteResultDto>(
      `/ImageUpload/${publicId}`
    );

    console.log('✅ Görsel silme yanıtı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Görsel silme hatası:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Görsel silinirken bir hata oluştu',
      publicId,
    };
  }
};

// ============================================================================
// İLAN GÖRSELLERİ
// ============================================================================

/**
 * İlana görsel yükle ve kaydet
 * 
 * Hem Cloudinary'e yükler hem de veritabanına kaydeder.
 * 
 * @param listingId İlan ID
 * @param file Yüklenecek görsel
 * @param isCoverImage Kapak fotoğrafı olarak ayarla
 * @param altText Görsel açıklaması
 * @param displayOrder Görüntüleme sırası
 * @returns Yükleme sonucu
 */
export const uploadListingImageApi = async (
  listingId: number,
  file: File,
  options?: {
    isCoverImage?: boolean;
    altText?: string;
    displayOrder?: number;
  }
): Promise<ListingImageUploadResponseDto> => {
  try {
    console.log('📤 İlan görseli yükleme isteği:', {
      listingId,
      fileName: file.name,
      options,
    });

    // FormData oluştur
    const formData = new FormData();
    formData.append('file', file);
    
    // Query parametreleri için URL oluştur
    const params = new URLSearchParams();
    if (options?.isCoverImage !== undefined) {
      params.append('isCoverImage', options.isCoverImage.toString());
    }
    if (options?.altText) {
      params.append('altText', options.altText);
    }
    if (options?.displayOrder !== undefined) {
      params.append('displayOrder', options.displayOrder.toString());
    }

    const url = `/ImageUpload/listing/${listingId}${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await axiosInstance.post<ListingImageUploadResponseDto>(
      url,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('✅ İlan görseli yükleme yanıtı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ İlan görseli yükleme hatası:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Görsel yüklenirken bir hata oluştu',
    };
  }
};

/**
 * İlana birden fazla görsel yükle
 * 
 * @param listingId İlan ID
 * @param files Yüklenecek görseller
 * @returns Yükleme sonuçları
 */
export const uploadMultipleListingImagesApi = async (
  listingId: number,
  files: File[]
): Promise<CloudinaryMultiUploadResponseDto> => {
  try {
    console.log('📤 İlana çoklu görsel yükleme isteği:', {
      listingId,
      count: files.length,
    });

    // FormData oluştur
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axiosInstance.post<CloudinaryMultiUploadResponseDto>(
      `/ImageUpload/listing/${listingId}/multiple`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log('✅ İlana çoklu görsel yükleme yanıtı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ İlana çoklu görsel yükleme hatası:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Görseller yüklenirken bir hata oluştu',
      uploadedImages: [],
      successCount: 0,
      failedCount: files.length,
      totalCount: files.length,
    };
  }
};

/**
 * İlan görselini sil
 * 
 * Hem Cloudinary'den hem de veritabanından siler.
 * 
 * @param listingId İlan ID
 * @param imageId Görsel ID
 * @returns Silme sonucu
 */
export const deleteListingImageApi = async (
  listingId: number,
  imageId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🗑️ İlan görseli silme isteği:', { listingId, imageId });

    const response = await axiosInstance.delete<{ success: boolean; message: string }>(
      `/ImageUpload/listing/${listingId}/image/${imageId}`
    );

    console.log('✅ İlan görseli silme yanıtı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ İlan görseli silme hatası:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Görsel silinirken bir hata oluştu',
    };
  }
};

