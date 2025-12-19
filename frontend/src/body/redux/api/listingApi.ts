import axiosInstance from './axiosInstance';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingSearchDto,
  ListingResponseDto,
  ListingListResponseDto,
  ImageResponseDto,
  ImageListResponseDto,
  UploadImageDto,
  ListingStatus,
} from '../slices/listing/DTOs/ListingDTOs';
import {
  uploadListingImageApi,
  uploadMultipleListingImagesApi,
  deleteListingImageApi as deleteCloudinaryListingImageApi,
} from './cloudinaryApi';

/**
 * Listing API
 * 
 * İlan işlemleri için API fonksiyonları.
 * axiosInstance kullanarak backend ile iletişim kurar.
 */

// ============================================================================
// İLAN CRUD İŞLEMLERİ
// ============================================================================

/**
 * Yeni ilan oluştur
 */
export const createListingApi = async (data: CreateListingDto): Promise<ListingResponseDto> => {
  try {
    console.log('İlan oluşturma isteği:', data);
    const response = await axiosInstance.post<ListingResponseDto>('/listing', data);
    console.log('İlan oluşturma yanıtı:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('İlan oluşturma hatası:', error);
    
    // Tüm response'u logla (debug için)
    if (error.response) {
      console.error('Backend response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
    }
    
    // Backend'den gelen hata mesajını al
    if (error.response?.data?.message) {
      console.error('Backend hata mesajı:', error.response.data.message);
      return {
        success: false,
        message: error.response.data.message,
      };
    }
    
    // ModelState validation hataları için (errors objesi varsa)
    if (error.response?.data?.errors) {
      const validationErrors = Object.entries(error.response.data.errors)
        .map(([key, value]: [string, any]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('; ');
      console.error('Validation hataları:', validationErrors);
      return {
        success: false,
        message: `Validation hataları: ${validationErrors}`,
      };
    }
    
    // Axios error mesajı
    if (error.message) {
      console.error('Axios hata mesajı:', error.message);
      return {
        success: false,
        message: `İlan oluşturulurken bir hata oluştu: ${error.message}`,
      };
    }
    
    return {
      success: false,
      message: 'İlan oluşturulurken bir hata oluştu',
    };
  }
};

/**
 * İlan güncelle
 */
export const updateListingApi = async (
  listingId: number, 
  data: UpdateListingDto
): Promise<ListingResponseDto> => {
  try {
    console.log('İlan güncelleme isteği:', listingId, data);
    const response = await axiosInstance.put<ListingResponseDto>(`/listing/${listingId}`, data);
    console.log('İlan güncelleme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('İlan güncelleme hatası:', error);
    return {
      success: false,
      message: 'İlan güncellenirken bir hata oluştu',
    };
  }
};

/**
 * İlan sil
 */
export const deleteListingApi = async (listingId: number): Promise<ListingResponseDto> => {
  try {
    console.log('İlan silme isteği:', listingId);
    const response = await axiosInstance.delete<ListingResponseDto>(`/listing/${listingId}`);
    console.log('İlan silme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('İlan silme hatası:', error);
    return {
      success: false,
      message: 'İlan silinirken bir hata oluştu',
    };
  }
};

/**
 * İlan detayı getir
 */
export const getListingByIdApi = async (listingId: number): Promise<ListingResponseDto> => {
  try {
    console.log('İlan detay isteği:', listingId);
    const response = await axiosInstance.get<ListingResponseDto>(`/listing/${listingId}`);
    console.log('İlan detay yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('İlan detay hatası:', error);
    return {
      success: false,
      message: 'İlan bulunamadı',
    };
  }
};

/**
 * İlan numarasına göre getir
 */
export const getListingByNumberApi = async (listingNumber: string): Promise<ListingResponseDto> => {
  try {
    console.log('İlan numarası ile istek:', listingNumber);
    const response = await axiosInstance.get<ListingResponseDto>(`/listing/number/${listingNumber}`);
    console.log('İlan numarası yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('İlan numarası hatası:', error);
    return {
      success: false,
      message: 'İlan bulunamadı',
    };
  }
};

// ============================================================================
// İLAN LİSTELEME & ARAMA
// ============================================================================

/**
 * Tüm ilanları listele
 */
export const getAllListingsApi = async (
  page: number = 1, 
  pageSize: number = 20
): Promise<ListingListResponseDto> => {
  try {
    console.log('İlan listesi isteği:', { page, pageSize });
    const response = await axiosInstance.get<ListingListResponseDto>('/listing', {
      params: { page, pageSize },
    });
    console.log('İlan listesi yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('İlan listesi hatası:', error);
    return {
      success: false,
      message: 'İlanlar yüklenirken bir hata oluştu',
      listings: [],
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
 * İlan ara ve filtrele
 */
export const searchListingsApi = async (
  searchParams: ListingSearchDto
): Promise<ListingListResponseDto> => {
  try {
    console.log('İlan arama isteği:', searchParams);
    const response = await axiosInstance.post<ListingListResponseDto>('/listing/search', searchParams);
    console.log('İlan arama yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('İlan arama hatası:', error);
    return {
      success: false,
      message: 'İlan araması yapılırken bir hata oluştu',
      listings: [],
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
 * Kullanıcının kendi ilanlarını getir
 */
export const getMyListingsApi = async (
  page: number = 1, 
  pageSize: number = 20
): Promise<ListingListResponseDto> => {
  try {
    console.log('Kullanıcı ilanları isteği:', { page, pageSize });
    const response = await axiosInstance.get<ListingListResponseDto>('/listing/my-listings', {
      params: { page, pageSize },
    });
    console.log('Kullanıcı ilanları yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Kullanıcı ilanları hatası:', error);
    return {
      success: false,
      message: 'İlanlarınız yüklenirken bir hata oluştu',
      listings: [],
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
 * Belirli bir kullanıcının ilanlarını getir
 * 
 * Profil sayfalarında başka kullanıcıların ilanlarını göstermek için kullanılır.
 */
export const getListingsByUserApi = async (
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ListingListResponseDto> => {
  try {
    console.log('Kullanıcı ilanları (profil) isteği:', { userId, page, pageSize });
    const response = await axiosInstance.get<ListingListResponseDto>(`/listing/user/${userId}`, {
      params: { page, pageSize },
    });
    console.log('Kullanıcı ilanları (profil) yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Kullanıcı ilanları (profil) hatası:', error);
    return {
      success: false,
      message: 'Kullanıcının ilanları yüklenirken bir hata oluştu',
      listings: [],
      pagination: {
        currentPage: 1,
        pageSize,
        totalPages: 0,
        totalCount: 0,
        hasPrevious: false,
        hasNext: false,
      },
    };
  }
};

/**
 * Öne çıkan ilanları getir
 */
export const getFeaturedListingsApi = async (count: number = 10): Promise<ListingListResponseDto> => {
  try {
    console.log('Öne çıkan ilanlar isteği:', count);
    const response = await axiosInstance.get<ListingListResponseDto>('/listing/featured', {
      params: { count },
    });
    console.log('Öne çıkan ilanlar yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Öne çıkan ilanlar hatası:', error);
    return {
      success: false,
      message: 'Öne çıkan ilanlar yüklenirken bir hata oluştu',
      listings: [],
      pagination: {
        currentPage: 1,
        pageSize: count,
        totalPages: 0,
        totalCount: 0,
        hasPrevious: false,
        hasNext: false,
      },
    };
  }
};

/**
 * Son eklenen ilanları getir
 */
export const getLatestListingsApi = async (count: number = 10): Promise<ListingListResponseDto> => {
  try {
    console.log('Son ilanlar isteği:', count);
    const response = await axiosInstance.get<ListingListResponseDto>('/listing/latest', {
      params: { count },
    });
    console.log('Son ilanlar yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Son ilanlar hatası:', error);
    return {
      success: false,
      message: 'Son ilanlar yüklenirken bir hata oluştu',
      listings: [],
      pagination: {
        currentPage: 1,
        pageSize: count,
        totalPages: 0,
        totalCount: 0,
        hasPrevious: false,
        hasNext: false,
      },
    };
  }
};

/**
 * Benzer ilanları getir
 */
export const getSimilarListingsApi = async (
  listingId: number, 
  count: number = 6
): Promise<ListingListResponseDto> => {
  try {
    console.log('Benzer ilanlar isteği:', { listingId, count });
    const response = await axiosInstance.get<ListingListResponseDto>(`/listing/${listingId}/similar`, {
      params: { count },
    });
    console.log('Benzer ilanlar yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Benzer ilanlar hatası:', error);
    return {
      success: false,
      message: 'Benzer ilanlar yüklenirken bir hata oluştu',
      listings: [],
      pagination: {
        currentPage: 1,
        pageSize: count,
        totalPages: 0,
        totalCount: 0,
        hasPrevious: false,
        hasNext: false,
      },
    };
  }
};

// ============================================================================
// İLAN DURUMU
// ============================================================================

/**
 * İlan durumunu güncelle
 */
export const updateListingStatusApi = async (
  listingId: number, 
  status: ListingStatus
): Promise<ListingResponseDto> => {
  try {
    console.log('İlan durumu güncelleme isteği:', { listingId, status });
    const response = await axiosInstance.patch<ListingResponseDto>(
      `/listing/${listingId}/status`, 
      status
    );
    console.log('İlan durumu güncelleme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('İlan durumu güncelleme hatası:', error);
    return {
      success: false,
      message: 'İlan durumu güncellenirken bir hata oluştu',
    };
  }
};

// ============================================================================
// GÖRSEL İŞLEMLERİ
// ============================================================================

/**
 * İlana görsel ekle (URL ile - eski yöntem, hala destekleniyor)
 * 
 * @deprecated Cloudinary entegrasyonu için uploadListingImageFileApi kullanın
 */
export const addListingImageApi = async (
  listingId: number, 
  data: UploadImageDto
): Promise<ImageResponseDto> => {
  try {
    console.log('Görsel ekleme isteği (URL ile):', { listingId, data });
    const response = await axiosInstance.post<ImageResponseDto>(
      `/listing/${listingId}/images`, 
      data
    );
    console.log('Görsel ekleme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Görsel ekleme hatası:', error);
    return {
      success: false,
      message: 'Görsel eklenirken bir hata oluştu',
    };
  }
};

/**
 * İlana görsel yükle (Cloudinary ile - dosya yükleme)
 * 
 * Hem Cloudinary'e yükler hem de veritabanına kaydeder.
 * 
 * @param listingId İlan ID
 * @param file Yüklenecek görsel dosyası
 * @param options Görsel seçenekleri (kapak fotoğrafı, alt text, sıralama)
 * @returns Yükleme sonucu
 */
export const uploadListingImageFileApi = async (
  listingId: number,
  file: File,
  options?: {
    isCoverImage?: boolean;
    altText?: string;
    displayOrder?: number;
  }
): Promise<ImageResponseDto> => {
  try {
    console.log('📤 İlan görseli yükleme isteği (Cloudinary):', {
      listingId,
      fileName: file.name,
      fileSize: file.size,
      options,
    });

    // Cloudinary API'sini kullan
    const cloudinaryResponse = await uploadListingImageApi(listingId, file, options);

    if (!cloudinaryResponse.success) {
      return {
        success: false,
        message: cloudinaryResponse.message,
      };
    }

    // Cloudinary response'unu ImageResponseDto formatına dönüştür
    return {
      success: true,
      message: cloudinaryResponse.message,
      image: cloudinaryResponse.imageId
        ? {
            id: cloudinaryResponse.imageId,
            imageUrl: cloudinaryResponse.imageUrl || '',
            thumbnailUrl: cloudinaryResponse.thumbnailUrl,
            altText: options?.altText,
            isCoverImage: options?.isCoverImage || false,
            displayOrder: options?.displayOrder || 0,
          }
        : undefined,
    };
  } catch (error: any) {
    console.error('❌ İlan görseli yükleme hatası:', error);
    return {
      success: false,
      message: error.message || 'Görsel yüklenirken bir hata oluştu',
    };
  }
};

/**
 * İlana birden fazla görsel yükle (Cloudinary ile)
 * 
 * @param listingId İlan ID
 * @param files Yüklenecek görsel dosyaları
 * @returns Yükleme sonuçları
 */
export const uploadMultipleListingImageFilesApi = async (
  listingId: number,
  files: File[]
): Promise<ImageListResponseDto> => {
  try {
    console.log('📤 İlana çoklu görsel yükleme isteği (Cloudinary):', {
      listingId,
      fileCount: files.length,
    });

    // Cloudinary API'sini kullan
    const cloudinaryResponse = await uploadMultipleListingImagesApi(listingId, files);

    if (!cloudinaryResponse.success) {
      return {
        success: false,
        message: cloudinaryResponse.message,
        images: [],
      };
    }

    // Cloudinary response'unu ImageListResponseDto formatına dönüştür
    const images = cloudinaryResponse.uploadedImages
      .filter((img) => img.success)
      .map((img, index) => ({
        id: 0, // Backend'den dönen gerçek ID'yi kullanmak için API'yi güncellemek gerekebilir
        imageUrl: img.secureUrl || img.url || '',
        thumbnailUrl: img.thumbnailUrl,
        altText: undefined,
        isCoverImage: index === 0, // İlk görseli kapak yap
        displayOrder: index,
      }));

    return {
      success: true,
      message: cloudinaryResponse.message,
      images,
    };
  } catch (error: any) {
    console.error('❌ İlana çoklu görsel yükleme hatası:', error);
    return {
      success: false,
      message: error.message || 'Görseller yüklenirken bir hata oluştu',
      images: [],
    };
  }
};

/**
 * Görsel sil (Cloudinary entegrasyonu ile)
 * 
 * Hem Cloudinary'den hem de veritabanından siler.
 */
export const deleteListingImageApi = async (
  listingId: number, 
  imageId: number
): Promise<ImageResponseDto> => {
  try {
    console.log('🗑️ Görsel silme isteği (Cloudinary):', { listingId, imageId });
    
    // Cloudinary API'sini kullan (hem Cloudinary'den hem veritabanından siler)
    const cloudinaryResponse = await deleteCloudinaryListingImageApi(listingId, imageId);

    if (!cloudinaryResponse.success) {
      return {
        success: false,
        message: cloudinaryResponse.message,
      };
    }

    return {
      success: true,
      message: cloudinaryResponse.message,
    };
  } catch (error: any) {
    console.error('❌ Görsel silme hatası:', error);
    return {
      success: false,
      message: error.message || 'Görsel silinirken bir hata oluştu',
    };
  }
};

/**
 * Kapak fotoğrafını değiştir
 */
export const setCoverImageApi = async (
  listingId: number, 
  imageId: number
): Promise<ImageResponseDto> => {
  try {
    console.log('Kapak fotoğrafı değiştirme isteği:', { listingId, imageId });
    const response = await axiosInstance.patch<ImageResponseDto>(
      `/listing/${listingId}/images/${imageId}/cover`
    );
    console.log('Kapak fotoğrafı değiştirme yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Kapak fotoğrafı değiştirme hatası:', error);
    return {
      success: false,
      message: 'Kapak fotoğrafı değiştirilirken bir hata oluştu',
    };
  }
};

/**
 * İlanın görsellerini getir
 */
export const getListingImagesApi = async (listingId: number): Promise<ImageListResponseDto> => {
  try {
    console.log('Görseller isteği:', listingId);
    const response = await axiosInstance.get<ImageListResponseDto>(`/listing/${listingId}/images`);
    console.log('Görseller yanıtı:', response.data);
    return response.data;
  } catch (error) {
    console.error('Görseller hatası:', error);
    return {
      success: false,
      message: 'Görseller yüklenirken bir hata oluştu',
      images: [],
    };
  }
};
