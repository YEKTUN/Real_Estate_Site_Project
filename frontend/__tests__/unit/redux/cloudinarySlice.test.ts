/**
 * CloudinarySlice Unit Tests
 * 
 * Redux cloudinary slice'ının tüm reducer, action ve async thunk'larını test eder.
 */

import cloudinaryReducer, {
  clearError,
  clearLastUpload,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  uploadListingImage,
  uploadMultipleListingImages,
  deleteListingImage,
  selectIsUploading,
  selectIsUploadingMultiple,
  selectIsDeleting,
  selectLastUploadedImage,
  selectLastUploadedImages,
  selectError,
} from '@/body/redux/slices/cloudinary/CloudinarySlice';
import { CloudinaryState } from '@/body/redux/slices/cloudinary/DTOs/CloudinaryDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/cloudinaryApi', () => ({
  uploadImageApi: jest.fn(),
  uploadMultipleImagesApi: jest.fn(),
  deleteImageApi: jest.fn(),
  uploadListingImageApi: jest.fn(),
  uploadMultipleListingImagesApi: jest.fn(),
  deleteListingImageApi: jest.fn(),
}));

// ============================================================================
// TEST DATA
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

const mockUploadResult = {
  success: true,
  message: 'Yükleme başarılı',
  url: 'https://example.com/image.jpg',
  publicId: 'test-public-id',
  width: 1920,
  height: 1080,
  format: 'jpg',
  bytes: 500000,
};

const mockListingImageUploadResult = {
  success: true,
  message: 'Yükleme başarılı',
  image: {
    id: 1,
    listingId: 1,
    url: 'https://example.com/image.jpg',
    publicId: 'test-public-id',
    isCoverImage: false,
    displayOrder: 1,
  },
};

// ============================================================================
// REDUCER TESTS
// ============================================================================

describe('CloudinarySlice', () => {
  describe('Initial State', () => {
    test('should return initial state when passed an empty action', () => {
      const result = cloudinaryReducer(undefined, { type: '' });
      expect(result).toEqual(initialState);
    });
  });

  describe('Sync Reducers', () => {
    test('clearError should clear error', () => {
      const stateWithError: CloudinaryState = {
        ...initialState,
        error: 'Some error',
      };

      const result = cloudinaryReducer(stateWithError, clearError());
      expect(result.error).toBeNull();
    });

    test('clearLastUpload should clear last uploaded image', () => {
      const stateWithUpload: CloudinaryState = {
        ...initialState,
        lastUploadedImage: mockUploadResult,
        lastUploadedImages: [mockUploadResult],
      };

      const result = cloudinaryReducer(stateWithUpload, clearLastUpload());
      expect(result.lastUploadedImage).toBeNull();
      expect(result.lastUploadedImages).toEqual([]);
    });
  });

  describe('Async Thunks - uploadImage', () => {
    test('should handle pending state', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const action = uploadImage.pending('', { file });
      const result = cloudinaryReducer(initialState, action);

      expect(result.isUploading).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle fulfilled state', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const action = uploadImage.fulfilled(mockUploadResult, '', { file });
      const result = cloudinaryReducer(initialState, action);

      expect(result.isUploading).toBe(false);
      expect(result.lastUploadedImage).toEqual(mockUploadResult);
    });

    test('should handle rejected state', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const action = uploadImage.rejected(new Error('Test error'), '', { file });
      const result = cloudinaryReducer(initialState, action);

      expect(result.isUploading).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('Async Thunks - uploadMultipleImages', () => {
    test('should handle pending state', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];
      const action = uploadMultipleImages.pending('', { files });
      const result = cloudinaryReducer(initialState, action);

      expect(result.isUploadingMultiple).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle fulfilled state', () => {
      const files = [
        new File(['test1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['test2'], 'test2.jpg', { type: 'image/jpeg' }),
      ];
      const mockResponse = {
        success: true,
        message: 'Yükleme başarılı',
        images: [mockUploadResult, mockUploadResult],
      };

      const action = uploadMultipleImages.fulfilled(mockResponse, '', { files });
      const result = cloudinaryReducer(initialState, action);

      expect(result.isUploadingMultiple).toBe(false);
      expect(result.lastUploadedImages).toEqual(mockResponse.images);
    });
  });

  describe('Async Thunks - deleteImage', () => {
    test('should handle pending state', () => {
      const action = deleteImage.pending('', 'test-public-id');
      const result = cloudinaryReducer(initialState, action);

      expect(result.isDeleting).toBe(true);
    });

    test('should handle fulfilled state', () => {
      const mockDeleteResult = {
        success: true,
        message: 'Silme başarılı',
      };

      const action = deleteImage.fulfilled(mockDeleteResult, '', 'test-public-id');
      const result = cloudinaryReducer(initialState, action);

      expect(result.isDeleting).toBe(false);
    });
  });

  describe('Async Thunks - uploadListingImage', () => {
    test('should handle pending state', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const action = uploadListingImage.pending('', { listingId: 1, file });
      const result = cloudinaryReducer(initialState, action);

      expect(result.isUploadingListingImage).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle fulfilled state', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const action = uploadListingImage.fulfilled(
        mockListingImageUploadResult,
        '',
        { listingId: 1, file }
      );
      const result = cloudinaryReducer(initialState, action);

      expect(result.isUploadingListingImage).toBe(false);
      expect(result.lastListingImageUpload).toEqual(mockListingImageUploadResult.image);
    });
  });

  describe('Selectors', () => {
    const mockState = {
      cloudinary: {
        ...initialState,
        isUploading: true,
        isUploadingMultiple: false,
        isDeleting: false,
        lastUploadedImage: mockUploadResult,
        lastUploadedImages: [mockUploadResult],
        error: 'Test error',
      },
    } as any;

    test('selectIsUploading should return uploading state', () => {
      const result = selectIsUploading(mockState);
      expect(result).toBe(true);
    });

    test('selectIsUploadingMultiple should return multiple uploading state', () => {
      const result = selectIsUploadingMultiple(mockState);
      expect(result).toBe(false);
    });

    test('selectIsDeleting should return deleting state', () => {
      const result = selectIsDeleting(mockState);
      expect(result).toBe(false);
    });

    test('selectLastUploadedImage should return last uploaded image', () => {
      const result = selectLastUploadedImage(mockState);
      expect(result).toEqual(mockUploadResult);
    });

    test('selectLastUploadedImages should return last uploaded images', () => {
      const result = selectLastUploadedImages(mockState);
      expect(result).toEqual([mockUploadResult]);
    });

    test('selectError should return error', () => {
      const result = selectError(mockState);
      expect(result).toBe('Test error');
    });
  });
});

