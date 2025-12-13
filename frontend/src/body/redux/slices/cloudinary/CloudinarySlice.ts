import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import {
  CloudinaryState,
  CloudinaryUploadResultDto,
  CloudinaryDeleteResultDto,
  CloudinaryMultiUploadResponseDto,
  ListingImageUploadResponseDto,
} from './DTOs/CloudinaryDTOs';
import {
  uploadImageApi,
  uploadMultipleImagesApi,
  deleteImageApi,
  uploadListingImageApi,
  uploadMultipleListingImagesApi,
  deleteListingImageApi,
} from '../../api/cloudinaryApi';

/**
 * Cloudinary Slice
 * 
 * Cloudinary görsel yükleme ve yönetim state yönetimi.
 * Görsel yükleme, silme ve ilan görseli işlemleri.
 */

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: CloudinaryState = {
  isUploading: false,
  isUploadingMultiple: false,
  isDeleting: false,
  lastUploadedImage: null,
  lastUploadedImages: [],
  error: null,
  isUploadingListingImage: false,
  lastListingImageUpload: null,
};

// ============================================================================
// ASYNC THUNKS
// ============================================================================

// ---------- GENEL GÖRSEL YÜKLEME ----------

/**
 * Tek görsel yükle
 */
export const uploadImage = createAsyncThunk<
  CloudinaryUploadResultDto,
  { file: File; folder?: string }
>(
  'cloudinary/uploadImage',
  async ({ file, folder }, { rejectWithValue }) => {
    try {
      const response = await uploadImageApi(file, folder);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Görsel yüklenirken bir hata oluştu');
    }
  }
);

/**
 * Birden fazla görsel yükle
 */
export const uploadMultipleImages = createAsyncThunk<
  CloudinaryMultiUploadResponseDto,
  { files: File[]; folder?: string }
>(
  'cloudinary/uploadMultipleImages',
  async ({ files, folder }, { rejectWithValue }) => {
    try {
      const response = await uploadMultipleImagesApi(files, folder);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Görseller yüklenirken bir hata oluştu');
    }
  }
);

/**
 * Görsel sil
 */
export const deleteImage = createAsyncThunk<
  CloudinaryDeleteResultDto,
  string
>(
  'cloudinary/deleteImage',
  async (publicId, { rejectWithValue }) => {
    try {
      const response = await deleteImageApi(publicId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Görsel silinirken bir hata oluştu');
    }
  }
);

// ---------- İLAN GÖRSELLERİ ----------

/**
 * İlana görsel yükle
 */
export const uploadListingImage = createAsyncThunk<
  ListingImageUploadResponseDto,
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
  'cloudinary/uploadListingImage',
  async ({ listingId, file, options }, { rejectWithValue }) => {
    try {
      const response = await uploadListingImageApi(listingId, file, options);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Görsel yüklenirken bir hata oluştu');
    }
  }
);

/**
 * İlana birden fazla görsel yükle
 */
export const uploadMultipleListingImages = createAsyncThunk<
  CloudinaryMultiUploadResponseDto,
  { listingId: number; files: File[] }
>(
  'cloudinary/uploadMultipleListingImages',
  async ({ listingId, files }, { rejectWithValue }) => {
    try {
      const response = await uploadMultipleListingImagesApi(listingId, files);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Görseller yüklenirken bir hata oluştu');
    }
  }
);

/**
 * İlan görselini sil
 */
export const deleteListingImage = createAsyncThunk<
  { success: boolean; message: string },
  { listingId: number; imageId: number }
>(
  'cloudinary/deleteListingImage',
  async ({ listingId, imageId }, { rejectWithValue }) => {
    try {
      const response = await deleteListingImageApi(listingId, imageId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Görsel silinirken bir hata oluştu');
    }
  }
);

// ============================================================================
// SLICE
// ============================================================================

const cloudinarySlice = createSlice({
  name: 'cloudinary',
  initialState,
  reducers: {
    /**
     * Hata durumunu temizle
     */
    clearError: (state) => {
      state.error = null;
    },
    /**
     * Son yüklenen görseli temizle
     */
    clearLastUploadedImage: (state) => {
      state.lastUploadedImage = null;
    },
    /**
     * Son yüklenen görselleri temizle
     */
    clearLastUploadedImages: (state) => {
      state.lastUploadedImages = [];
    },
    /**
     * Son ilan görseli yükleme sonucunu temizle
     */
    clearLastListingImageUpload: (state) => {
      state.lastListingImageUpload = null;
    },
    /**
     * Tüm state'i sıfırla
     */
    resetCloudinaryState: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // ========================================================================
    // TEK GÖRSEL YÜKLEME
    // ========================================================================
    builder
      .addCase(uploadImage.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadImage.fulfilled, (state, action: PayloadAction<CloudinaryUploadResultDto>) => {
        state.isUploading = false;
        state.lastUploadedImage = action.payload;
        state.error = null;
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // ÇOKLU GÖRSEL YÜKLEME
    // ========================================================================
    builder
      .addCase(uploadMultipleImages.pending, (state) => {
        state.isUploadingMultiple = true;
        state.error = null;
      })
      .addCase(
        uploadMultipleImages.fulfilled,
        (state, action: PayloadAction<CloudinaryMultiUploadResponseDto>) => {
          state.isUploadingMultiple = false;
          state.lastUploadedImages = action.payload.uploadedImages.filter((img) => img.success);
          state.error = null;
        }
      )
      .addCase(uploadMultipleImages.rejected, (state, action) => {
        state.isUploadingMultiple = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // GÖRSEL SİLME
    // ========================================================================
    builder
      .addCase(deleteImage.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(
        deleteImage.fulfilled,
        (state, action: PayloadAction<CloudinaryDeleteResultDto>) => {
          state.isDeleting = false;
          // Silinen görseli listeden çıkar
          state.lastUploadedImages = state.lastUploadedImages.filter(
            (img) => img.publicId !== action.payload.publicId
          );
          if (state.lastUploadedImage?.publicId === action.payload.publicId) {
            state.lastUploadedImage = null;
          }
          state.error = null;
        }
      )
      .addCase(deleteImage.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // İLAN GÖRSELİ YÜKLEME
    // ========================================================================
    builder
      .addCase(uploadListingImage.pending, (state) => {
        state.isUploadingListingImage = true;
        state.error = null;
      })
      .addCase(
        uploadListingImage.fulfilled,
        (state, action: PayloadAction<ListingImageUploadResponseDto>) => {
          state.isUploadingListingImage = false;
          state.lastListingImageUpload = action.payload;
          state.error = null;
        }
      )
      .addCase(uploadListingImage.rejected, (state, action) => {
        state.isUploadingListingImage = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // İLAN ÇOKLU GÖRSEL YÜKLEME
    // ========================================================================
    builder
      .addCase(uploadMultipleListingImages.pending, (state) => {
        state.isUploadingListingImage = true;
        state.error = null;
      })
      .addCase(
        uploadMultipleListingImages.fulfilled,
        (state, action: PayloadAction<CloudinaryMultiUploadResponseDto>) => {
          state.isUploadingListingImage = false;
          state.lastUploadedImages = action.payload.uploadedImages.filter((img) => img.success);
          state.error = null;
        }
      )
      .addCase(uploadMultipleListingImages.rejected, (state, action) => {
        state.isUploadingListingImage = false;
        state.error = action.payload as string;
      });

    // ========================================================================
    // İLAN GÖRSELİ SİLME
    // ========================================================================
    builder
      .addCase(deleteListingImage.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteListingImage.fulfilled, (state) => {
        state.isDeleting = false;
        state.error = null;
      })
      .addCase(deleteListingImage.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================================================
// ACTIONS
// ============================================================================

export const {
  clearError,
  clearLastUploadedImage,
  clearLastUploadedImages,
  clearLastListingImageUpload,
  resetCloudinaryState,
} = cloudinarySlice.actions;

// ============================================================================
// SELECTORS
// ============================================================================

/**
 * Cloudinary state'ini al
 */
export const selectCloudinaryState = (state: RootState) => state.cloudinary;

/**
 * Yükleme durumunu al
 */
export const selectIsUploading = (state: RootState) => state.cloudinary.isUploading;
export const selectIsUploadingMultiple = (state: RootState) => state.cloudinary.isUploadingMultiple;
export const selectIsUploadingListingImage = (state: RootState) =>
  state.cloudinary.isUploadingListingImage;
export const selectIsDeleting = (state: RootState) => state.cloudinary.isDeleting;

/**
 * Son yüklenen görselleri al
 */
export const selectLastUploadedImage = (state: RootState) => state.cloudinary.lastUploadedImage;
export const selectLastUploadedImages = (state: RootState) => state.cloudinary.lastUploadedImages;

/**
 * Son ilan görseli yükleme sonucunu al
 */
export const selectLastListingImageUpload = (state: RootState) =>
  state.cloudinary.lastListingImageUpload;

/**
 * Hata durumunu al
 */
export const selectCloudinaryError = (state: RootState) => state.cloudinary.error;

// ============================================================================
// REDUCER
// ============================================================================

export default cloudinarySlice.reducer;

