/**
 * CloudinaryApi Unit Tests
 * 
 * Cloudinary API fonksiyonlarının testleri.
 */

import {
  uploadImageApi,
  uploadMultipleImagesApi,
  deleteImageApi,
  uploadListingImageApi,
  uploadMultipleListingImagesApi,
  deleteListingImageApi,
} from '@/body/redux/api/cloudinaryApi';
import axiosInstance from '@/body/redux/api/axiosInstance';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/axiosInstance');
const mockedAxiosInstance = axiosInstance as jest.Mocked<typeof axiosInstance>;

// ============================================================================
// TEST DATA
// ============================================================================

const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

const mockUploadResponse = {
  success: true,
  message: 'Yükleme başarılı',
  url: 'https://example.com/image.jpg',
  publicId: 'test-public-id',
  width: 1920,
  height: 1080,
  format: 'jpg',
  bytes: 500000,
};

const mockListingImageUploadResponse = {
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
// TESTS
// ============================================================================

describe('CloudinaryApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadImageApi', () => {
    test('should upload image successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockUploadResponse,
      });

      const result = await uploadImageApi(mockFile, 'test-folder');

      expect(result).toEqual(mockUploadResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalled();
      const callArgs = mockedAxiosInstance.post.mock.calls[0];
      // Gerçek endpoint: /ImageUpload/upload
      expect(callArgs[0]).toBe('/ImageUpload/upload');
    });

    test('should handle upload error', async () => {
      mockedAxiosInstance.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            message: 'Upload failed',
          },
        },
      });

      const result = await uploadImageApi(mockFile);

      expect(result.success).toBe(false);
    });
  });

  describe('uploadMultipleImagesApi', () => {
    test('should upload multiple images successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Yükleme başarılı',
        images: [mockUploadResponse, mockUploadResponse],
      };

      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await uploadMultipleImagesApi([mockFile, mockFile], 'test-folder');

      expect(result).toEqual(mockResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalled();
    });
  });

  describe('deleteImageApi', () => {
    test('should delete image successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Silme başarılı',
      };

      mockedAxiosInstance.delete.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await deleteImageApi('test-public-id');

      expect(result).toEqual(mockResponse);
      // Gerçek endpoint: /ImageUpload/{publicId}
      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith('/ImageUpload/test-public-id');
    });
  });

  describe('uploadListingImageApi', () => {
    test('should upload listing image successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockListingImageUploadResponse,
      });

      const result = await uploadListingImageApi(1, mockFile, {
        isCoverImage: true,
      });

      expect(result).toEqual(mockListingImageUploadResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalled();
      const callArgs = mockedAxiosInstance.post.mock.calls[0];
      // Gerçek endpoint: /ImageUpload/listing/{id}?isCoverImage=true
      expect(callArgs[0]).toBe('/ImageUpload/listing/1?isCoverImage=true');
    });
  });

  describe('uploadMultipleListingImagesApi', () => {
    test('should upload multiple listing images successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Yükleme başarılı',
        images: [
          mockListingImageUploadResponse.image,
          mockListingImageUploadResponse.image,
        ],
      };

      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await uploadMultipleListingImagesApi(1, [mockFile, mockFile]);

      expect(result).toEqual(mockResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalled();
      const callArgs = mockedAxiosInstance.post.mock.calls[0];
      expect(callArgs[0]).toBe('/ImageUpload/listing/1/multiple');
    });
  });

  describe('deleteListingImageApi', () => {
    test('should delete listing image successfully', async () => {
      mockedAxiosInstance.delete.mockResolvedValueOnce({
        data: mockListingImageUploadResponse,
      });

      const result = await deleteListingImageApi(1, 1);

      expect(result).toEqual(mockListingImageUploadResponse);
      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith('/ImageUpload/listing/1/image/1');
    });
  });
});

