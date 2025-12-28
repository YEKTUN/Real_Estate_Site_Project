import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import {
  ListingState,
  CreateListingDto,
  UpdateListingDto,
  ListingSearchDto,
  ListingResponseDto,
  ListingListResponseDto,
  ListingDetailDto,
  ListingListDto,
  ListingStatus,
  UploadImageDto,
  ImageResponseDto,
  ImageListResponseDto,
  ListingImageDto,
} from './DTOs/ListingDTOs';
import {
  createListingApi,
  updateListingApi,
  deleteListingApi,
  getListingByIdApi,
  getListingByNumberApi,
  getAllListingsApi,
  searchListingsApi,
  getMyListingsApi,
  getFeaturedListingsApi,
  getLatestListingsApi,
  getSimilarListingsApi,
  updateListingStatusApi,
  addListingImageApi,
  uploadListingImageFileApi,
  uploadMultipleListingImageFilesApi,
  deleteListingImageApi,
  setCoverImageApi,
  getListingImagesApi,
} from '../../api/listingApi';

/**
 * Listing Slice
 * 
 * İlan state yönetimi.
 * CRUD, arama, listeleme ve görsel işlemleri.
 */

// Backend'den gelen string durumları (Pending, Rejected vb.) sayısal enum'a çevir
const statusMap: Record<string, number> = {
  'Pending': ListingStatus.Pending,
  'Active': ListingStatus.Active,
  'Inactive': ListingStatus.Inactive,
  'Sold': ListingStatus.Sold,
  'Rented': ListingStatus.Rented,
  'Rejected': ListingStatus.Rejected,
  'Expired': ListingStatus.Expired
};

const mapListingStatus = (listing: any) => ({
  ...listing,
  status: typeof listing.status === 'string'
    ? (statusMap[listing.status] ?? listing.status)
    : listing.status
});

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: ListingState = {
  listings: [],
  featuredListings: [],
  latestListings: [],
  similarListings: [],
  myListings: [],
  currentListing: null,
  currentListingImages: [],
  pagination: null,
  searchParams: null,
  isLoading: false,
  isLoadingDetail: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

// ---------- CRUD İŞLEMLERİ ----------

/**
 * Yeni ilan oluştur
 */
export const createListing = createAsyncThunk<ListingResponseDto, CreateListingDto>(
  'listing/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createListingApi(data);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('İlan oluşturulurken bir hata oluştu');
    }
  }
);

/**
 * İlan güncelle
 */
export const updateListing = createAsyncThunk<
  ListingResponseDto,
  { listingId: number; data: UpdateListingDto }
>(
  'listing/update',
  async ({ listingId, data }, { rejectWithValue }) => {
    try {
      const response = await updateListingApi(listingId, data);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('İlan güncellenirken bir hata oluştu');
    }
  }
);

/**
 * İlan sil
 */
export const deleteListing = createAsyncThunk<ListingResponseDto, number>(
  'listing/delete',
  async (listingId, { rejectWithValue }) => {
    try {
      const response = await deleteListingApi(listingId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('İlan silinirken bir hata oluştu');
    }
  }
);

/**
 * İlan detayı getir
 */
export const fetchListingById = createAsyncThunk<ListingResponseDto, number>(
  'listing/fetchById',
  async (listingId, { rejectWithValue }) => {
    try {
      const response = await getListingByIdApi(listingId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('İlan bulunamadı');
    }
  }
);

/**
 * İlan numarasına göre getir
 */
export const fetchListingByNumber = createAsyncThunk<ListingResponseDto, string>(
  'listing/fetchByNumber',
  async (listingNumber, { rejectWithValue }) => {
    try {
      const response = await getListingByNumberApi(listingNumber);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('İlan bulunamadı');
    }
  }
);

// ---------- LİSTELEME & ARAMA ----------

/**
 * Tüm ilanları getir
 */
export const fetchAllListings = createAsyncThunk<
  ListingListResponseDto,
  { page?: number; pageSize?: number } | void
>(
  'listing/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const response = await getAllListingsApi(page, pageSize);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('İlanlar yüklenirken bir hata oluştu');
    }
  }
);

/**
 * İlan ara ve filtrele
 */
export const searchListings = createAsyncThunk<ListingListResponseDto, ListingSearchDto>(
  'listing/search',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await searchListingsApi(searchParams);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('İlan araması yapılırken bir hata oluştu');
    }
  }
);

/**
 * Kullanıcının ilanlarını getir
 */
export const fetchMyListings = createAsyncThunk<
  ListingListResponseDto,
  { page?: number; pageSize?: number } | void
>(
  'listing/fetchMine',
  async (params, { rejectWithValue }) => {
    try {
      const page = params?.page || 1;
      const pageSize = params?.pageSize || 20;
      const response = await getMyListingsApi(page, pageSize);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('İlanlarınız yüklenirken bir hata oluştu');
    }
  }
);

/**
 * Öne çıkan ilanları getir
 */
export const fetchFeaturedListings = createAsyncThunk<ListingListResponseDto, number | void>(
  'listing/fetchFeatured',
  async (count, { rejectWithValue }) => {
    try {
      const response = await getFeaturedListingsApi(count || 10);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Öne çıkan ilanlar yüklenirken bir hata oluştu');
    }
  }
);

/**
 * Son eklenen ilanları getir
 */
export const fetchLatestListings = createAsyncThunk<ListingListResponseDto, number | void>(
  'listing/fetchLatest',
  async (count, { rejectWithValue }) => {
    try {
      const response = await getLatestListingsApi(count || 10);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Son ilanlar yüklenirken bir hata oluştu');
    }
  }
);

/**
 * Benzer ilanları getir
 */
export const fetchSimilarListings = createAsyncThunk<
  ListingListResponseDto,
  { listingId: number; count?: number }
>(
  'listing/fetchSimilar',
  async ({ listingId, count }, { rejectWithValue }) => {
    try {
      const response = await getSimilarListingsApi(listingId, count || 6);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Benzer ilanlar yüklenirken bir hata oluştu');
    }
  }
);

// ---------- DURUM İŞLEMLERİ ----------

/**
 * İlan durumunu güncelle
 */
export const updateListingStatus = createAsyncThunk<
  ListingResponseDto,
  { listingId: number; status: ListingStatus }
>(
  'listing/updateStatus',
  async ({ listingId, status }, { rejectWithValue }) => {
    try {
      const response = await updateListingStatusApi(listingId, status);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('İlan durumu güncellenirken bir hata oluştu');
    }
  }
);

// ---------- GÖRSEL İŞLEMLERİ ----------

/**
 * İlana görsel ekle (URL ile - eski yöntem)
 * 
 * @deprecated Cloudinary entegrasyonu için uploadListingImageFile kullanın
 */
export const addListingImage = createAsyncThunk<
  ImageResponseDto,
  { listingId: number; data: UploadImageDto }
>(
  'listing/addImage',
  async ({ listingId, data }, { rejectWithValue }) => {
    try {
      const response = await addListingImageApi(listingId, data);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Görsel eklenirken bir hata oluştu');
    }
  }
);

/**
 * İlana görsel yükle (Cloudinary ile - dosya yükleme)
 * 
 * Hem Cloudinary'e yükler hem de veritabanına kaydeder.
 */
export const uploadListingImageFile = createAsyncThunk<
  ImageResponseDto,
  {
    listingId: number;
    file: File;
    options?: {
      isCoverImage?: boolean;
      altText?: string;
      displayOrder?: number;
    };
  }
>(
  'listing/uploadImageFile',
  async ({ listingId, file, options }, { rejectWithValue }) => {
    try {
      console.log('📤 Listing slice - Görsel yükleme başlatıldı:', {
        listingId,
        fileName: file.name,
        options,
      });

      const response = await uploadListingImageFileApi(listingId, file, options);

      if (!response.success) {
        return rejectWithValue(response.message);
      }

      console.log('✅ Listing slice - Görsel yükleme başarılı:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Listing slice - Görsel yükleme hatası:', error);
      return rejectWithValue(error.message || 'Görsel yüklenirken bir hata oluştu');
    }
  }
);

/**
 * İlana birden fazla görsel yükle (Cloudinary ile)
 */
export const uploadMultipleListingImageFiles = createAsyncThunk<
  ImageListResponseDto,
  { listingId: number; files: File[] }
>(
  'listing/uploadMultipleImageFiles',
  async ({ listingId, files }, { rejectWithValue }) => {
    try {
      console.log('📤 Listing slice - Çoklu görsel yükleme başlatıldı:', {
        listingId,
        fileCount: files.length,
      });

      const response = await uploadMultipleListingImageFilesApi(listingId, files);

      if (!response.success) {
        return rejectWithValue(response.message);
      }

      console.log('✅ Listing slice - Çoklu görsel yükleme başarılı:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Listing slice - Çoklu görsel yükleme hatası:', error);
      return rejectWithValue(error.message || 'Görseller yüklenirken bir hata oluştu');
    }
  }
);

/**
 * Görsel sil
 */
export const deleteListingImage = createAsyncThunk<
  ImageResponseDto,
  { listingId: number; imageId: number }
>(
  'listing/deleteImage',
  async ({ listingId, imageId }, { rejectWithValue }) => {
    try {
      const response = await deleteListingImageApi(listingId, imageId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Görsel silinirken bir hata oluştu');
    }
  }
);

/**
 * Kapak fotoğrafını değiştir
 */
export const setCoverImage = createAsyncThunk<
  ImageResponseDto,
  { listingId: number; imageId: number }
>(
  'listing/setCoverImage',
  async ({ listingId, imageId }, { rejectWithValue }) => {
    try {
      const response = await setCoverImageApi(listingId, imageId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Kapak fotoğrafı değiştirilirken bir hata oluştu');
    }
  }
);

/**
 * İlanın görsellerini getir
 */
export const fetchListingImages = createAsyncThunk<ImageListResponseDto, number>(
  'listing/fetchImages',
  async (listingId, { rejectWithValue }) => {
    try {
      const response = await getListingImagesApi(listingId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Görseller yüklenirken bir hata oluştu');
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

export const listingSlice = createSlice({
  name: 'listing',
  initialState,
  reducers: {
    // Error'u temizle
    clearError: (state) => {
      state.error = null;
    },

    // Current listing'i temizle
    clearCurrentListing: (state) => {
      state.currentListing = null;
      state.currentListingImages = [];
    },

    // Search params'ı ayarla
    setSearchParams: (state, action: PayloadAction<ListingSearchDto | null>) => {
      state.searchParams = action.payload;
    },

    // Listings'i temizle
    clearListings: (state) => {
      state.listings = [];
      state.pagination = null;
    },

    // State'i sıfırla
    resetListingState: () => initialState,
  },
  extraReducers: (builder) => {
    // ========== CREATE ==========
    builder
      .addCase(createListing.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createListing.fulfilled, (state) => {
        state.isCreating = false;
      })
      .addCase(createListing.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });

    // ========== UPDATE ==========
    builder
      .addCase(updateListing.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateListing.fulfilled, (state) => {
        state.isUpdating = false;
      })
      .addCase(updateListing.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // ========== DELETE ==========
    builder
      .addCase(deleteListing.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteListing.fulfilled, (state) => {
        state.isDeleting = false;
      })
      .addCase(deleteListing.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });

    // ========== FETCH BY ID ==========
    builder
      .addCase(fetchListingById.pending, (state) => {
        state.isLoadingDetail = true;
        state.error = null;
      })
      .addCase(fetchListingById.fulfilled, (state, action) => {
        state.isLoadingDetail = false;
        state.currentListing = action.payload.listing ? mapListingStatus(action.payload.listing) : null;
      })
      .addCase(fetchListingById.rejected, (state, action) => {
        state.isLoadingDetail = false;
        state.error = action.payload as string;
      });

    // ========== FETCH BY NUMBER ==========
    builder
      .addCase(fetchListingByNumber.pending, (state) => {
        state.isLoadingDetail = true;
        state.error = null;
      })
      .addCase(fetchListingByNumber.fulfilled, (state, action) => {
        state.isLoadingDetail = false;
        state.currentListing = action.payload.listing ? mapListingStatus(action.payload.listing) : null;
      })
      .addCase(fetchListingByNumber.rejected, (state, action) => {
        state.isLoadingDetail = false;
        state.error = action.payload as string;
      });

    // ========== FETCH ALL ==========
    builder
      .addCase(fetchAllListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.listings = (action.payload.listings || []).map(mapListingStatus);
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== SEARCH ==========
    builder
      .addCase(searchListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.listings = (action.payload.listings || []).map(mapListingStatus);
        state.pagination = action.payload.pagination;
      })
      .addCase(searchListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== FETCH MY LISTINGS ==========
    builder
      .addCase(fetchMyListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myListings = (action.payload.listings || []).map(mapListingStatus);
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMyListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== FETCH FEATURED ==========
    builder
      .addCase(fetchFeaturedListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredListings = (action.payload.listings || []).map(mapListingStatus);
      })
      .addCase(fetchFeaturedListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== FETCH LATEST ==========
    builder
      .addCase(fetchLatestListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLatestListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.latestListings = (action.payload.listings || []).map(mapListingStatus);
      })
      .addCase(fetchLatestListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== FETCH SIMILAR ==========
    builder
      .addCase(fetchSimilarListings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSimilarListings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.similarListings = (action.payload.listings || []).map(mapListingStatus);
      })
      .addCase(fetchSimilarListings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== UPDATE STATUS ==========
    builder
      .addCase(updateListingStatus.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateListingStatus.fulfilled, (state) => {
        state.isUpdating = false;
      })
      .addCase(updateListingStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // ========== FETCH IMAGES ==========
    builder
      .addCase(fetchListingImages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchListingImages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentListingImages = action.payload.images;
      })
      .addCase(fetchListingImages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== ADD IMAGE (URL ile - eski yöntem) ==========
    builder
      .addCase(addListingImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addListingImage.fulfilled, (state, action) => {
        state.isLoading = false;
        // Görselleri yeniden yükle
        if (state.currentListing && action.payload.image) {
          state.currentListingImages.push(action.payload.image);
        }
      })
      .addCase(addListingImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== UPLOAD IMAGE FILE (Cloudinary ile) ==========
    builder
      .addCase(uploadListingImageFile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadListingImageFile.fulfilled, (state, action) => {
        state.isLoading = false;
        // Yeni görseli current listing'e ekle
        if (state.currentListing && action.payload.image) {
          state.currentListingImages.push(action.payload.image);
        }
      })
      .addCase(uploadListingImageFile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== UPLOAD MULTIPLE IMAGE FILES (Cloudinary ile) ==========
    builder
      .addCase(uploadMultipleListingImageFiles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadMultipleListingImageFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        // Yeni görselleri current listing'e ekle
        if (state.currentListing && action.payload.images) {
          state.currentListingImages.push(...action.payload.images);
        }
      })
      .addCase(uploadMultipleListingImageFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== DELETE IMAGE ==========
    builder
      .addCase(deleteListingImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteListingImage.fulfilled, (state, action) => {
        state.isLoading = false;
        // Silinen görseli listeden çıkar
        // action.payload.imageId kullanarak silinebilir
      })
      .addCase(deleteListingImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== SET COVER IMAGE ==========
    builder
      .addCase(setCoverImage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setCoverImage.fulfilled, (state, action) => {
        state.isLoading = false;
        // Kapak fotoğrafını güncelle
        if (state.currentListingImages.length > 0) {
          state.currentListingImages.forEach((img) => {
            img.isCoverImage = false;
          });
          // action.payload.imageId ile kapak fotoğrafını bul ve ayarla
        }
      })
      .addCase(setCoverImage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

// Actions
export const {
  clearError,
  clearCurrentListing,
  setSearchParams,
  clearListings,
  resetListingState
} = listingSlice.actions;

// Selectors
export const selectListings = (state: RootState) => state.listing.listings;
export const selectFeaturedListings = (state: RootState) => state.listing.featuredListings;
export const selectLatestListings = (state: RootState) => state.listing.latestListings;
export const selectSimilarListings = (state: RootState) => state.listing.similarListings;
export const selectMyListings = (state: RootState) => state.listing.myListings;
export const selectCurrentListing = (state: RootState) => state.listing.currentListing;
export const selectCurrentListingImages = (state: RootState) => state.listing.currentListingImages;
export const selectPagination = (state: RootState) => state.listing.pagination;
export const selectSearchParams = (state: RootState) => state.listing.searchParams;
export const selectListingLoading = (state: RootState) => state.listing.isLoading;
export const selectListingDetailLoading = (state: RootState) => state.listing.isLoadingDetail;
export const selectListingCreating = (state: RootState) => state.listing.isCreating;
export const selectListingUpdating = (state: RootState) => state.listing.isUpdating;
export const selectListingDeleting = (state: RootState) => state.listing.isDeleting;
export const selectListingError = (state: RootState) => state.listing.error;

// Reducer
export default listingSlice.reducer;
