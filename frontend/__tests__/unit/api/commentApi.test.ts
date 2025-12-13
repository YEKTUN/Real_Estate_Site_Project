/**
 * CommentApi Unit Tests
 * 
 * Comment API fonksiyonlarının testleri.
 */

import {
  getListingCommentsApi,
  createCommentApi,
  updateCommentApi,
  deleteCommentApi,
  getMyCommentsApi,
} from '@/body/redux/api/commentApi';
import axiosInstance from '@/body/redux/api/axiosInstance';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/axiosInstance');
const mockedAxiosInstance = axiosInstance as jest.Mocked<typeof axiosInstance>;

// ============================================================================
// TEST DATA
// ============================================================================

const mockComment = {
  id: 1,
  listingId: 1,
  userId: 'user1',
  userName: 'Test User',
  content: 'Test comment',
  createdAt: new Date().toISOString(),
};

const mockCommentResponse = {
  success: true,
  message: 'İşlem başarılı',
  comment: mockComment,
};

const mockCommentListResponse = {
  success: true,
  message: 'İşlem başarılı',
  comments: [mockComment],
  totalCount: 1,
};

// ============================================================================
// TESTS
// ============================================================================

describe('CommentApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getListingCommentsApi', () => {
    test('should fetch comments successfully', async () => {
      mockedAxiosInstance.get.mockResolvedValueOnce({
        data: mockCommentListResponse,
      });

      const result = await getListingCommentsApi(1);

      expect(result).toEqual(mockCommentListResponse);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/comment/listing/1');
    });

    test('should handle error', async () => {
      mockedAxiosInstance.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: {
            message: 'Listing not found',
          },
        },
      });

      const result = await getListingCommentsApi(1);

      expect(result.success).toBe(false);
    });
  });

  describe('createCommentApi', () => {
    test('should create comment successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockCommentResponse,
      });

      const result = await createCommentApi(1, { content: 'Test comment' });

      expect(result).toEqual(mockCommentResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/comment/listing/1', {
        content: 'Test comment',
      });
    });

    test('should create reply comment successfully', async () => {
      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockCommentResponse,
      });

      const result = await createCommentApi(1, {
        content: 'Reply comment',
        parentCommentId: 2,
      });

      expect(result).toEqual(mockCommentResponse);
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith('/comment/listing/1', {
        content: 'Reply comment',
        parentCommentId: 2,
      });
    });
  });

  describe('updateCommentApi', () => {
    test('should update comment successfully', async () => {
      const updatedComment = {
        ...mockComment,
        content: 'Updated comment',
      };

      mockedAxiosInstance.put.mockResolvedValueOnce({
        data: {
          ...mockCommentResponse,
          comment: updatedComment,
        },
      });

      const result = await updateCommentApi(1, 1, { content: 'Updated comment' });

      expect(result.comment.content).toBe('Updated comment');
      expect(mockedAxiosInstance.put).toHaveBeenCalledWith('/comment/1', {
        content: 'Updated comment',
      });
    });
  });

  describe('deleteCommentApi', () => {
    test('should delete comment successfully', async () => {
      mockedAxiosInstance.delete.mockResolvedValueOnce({
        data: mockCommentResponse,
      });

      const result = await deleteCommentApi(1);

      expect(result).toEqual(mockCommentResponse);
      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith('/comment/1');
    });
  });

  describe('getMyCommentsApi', () => {
    test('should fetch my comments successfully', async () => {
      mockedAxiosInstance.get.mockResolvedValueOnce({
        data: {
          success: true,
          message: 'İşlem başarılı',
          comments: [mockComment],
        },
      });

      const result = await getMyCommentsApi();

      expect(result.success).toBe(true);
      expect(result.comments).toEqual([mockComment]);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/comment/my');
    });
  });
});

