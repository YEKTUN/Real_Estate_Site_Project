/**
 * CommentSlice Unit Tests
 * 
 * Redux comment slice'ının tüm reducer, action ve async thunk'larını test eder.
 */

import commentReducer, {
  clearError,
  clearListingComments,
  resetCommentState,
  fetchListingComments,
  createComment,
  updateComment,
  deleteComment,
  fetchMyComments,
  selectCommentsByListing,
  selectCommentCount,
  selectMyComments,
  selectIsLoading,
  selectError,
} from '@/body/redux/slices/comment/CommentSlice';
import { CommentState, CommentDto } from '@/body/redux/slices/comment/DTOs/CommentDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/commentApi', () => ({
  getListingCommentsApi: jest.fn(),
  createCommentApi: jest.fn(),
  updateCommentApi: jest.fn(),
  deleteCommentApi: jest.fn(),
  getMyCommentsApi: jest.fn(),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const initialState: CommentState = {
  commentsByListing: {},
  myComments: [],
  commentCounts: {},
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
};

const mockComment: CommentDto = {
  id: 1,
  listingId: 1,
  userId: 'user1',
  userName: 'Test User',
  userAvatarUrl: 'https://example.com/avatar.jpg',
  content: 'Test comment',
  parentCommentId: null,
  replies: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isEdited: false,
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
// REDUCER TESTS
// ============================================================================

describe('CommentSlice', () => {
  describe('Initial State', () => {
    test('should return initial state when passed an empty action', () => {
      const result = commentReducer(undefined, { type: '' });
      expect(result).toEqual(initialState);
    });
  });

  describe('Sync Reducers', () => {
    test('clearError should clear error', () => {
      const stateWithError: CommentState = {
        ...initialState,
        error: 'Some error',
      };

      const result = commentReducer(stateWithError, clearError());
      expect(result.error).toBeNull();
    });

    test('clearListingComments should clear comments for a listing', () => {
      const stateWithComments: CommentState = {
        ...initialState,
        commentsByListing: {
          1: [mockComment],
        },
        commentCounts: {
          1: 1,
        },
      };

      const result = commentReducer(stateWithComments, clearListingComments(1));
      expect(result.commentsByListing[1]).toBeUndefined();
      expect(result.commentCounts[1]).toBeUndefined();
    });

    test('resetCommentState should reset to initial state', () => {
      const stateWithData: CommentState = {
        ...initialState,
        commentsByListing: { 1: [mockComment] },
        myComments: [mockComment],
        error: 'Error',
      };

      const result = commentReducer(stateWithData, resetCommentState());
      expect(result).toEqual(initialState);
    });
  });

  describe('Async Thunks - fetchListingComments', () => {
    test('should handle pending state', () => {
      const action = fetchListingComments.pending('', 1);
      const result = commentReducer(initialState, action);

      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle fulfilled state', () => {
      const action = fetchListingComments.fulfilled(
        { listingId: 1, response: mockCommentListResponse },
        '',
        1
      );
      const result = commentReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.commentsByListing[1]).toEqual([mockComment]);
      expect(result.commentCounts[1]).toBe(1);
    });

    test('should handle rejected state', () => {
      const action = fetchListingComments.rejected(new Error('Test error'), '', 1);
      const result = commentReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Test error');
    });
  });

  describe('Async Thunks - createComment', () => {
    test('should handle pending state', () => {
      const action = createComment.pending('', { listingId: 1, data: {} as any });
      const result = commentReducer(initialState, action);

      expect(result.isCreating).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should handle fulfilled state and add comment to listing', () => {
      const stateWithComments: CommentState = {
        ...initialState,
        commentsByListing: {
          1: [],
        },
        commentCounts: {
          1: 0,
        },
      };

      const action = createComment.fulfilled(
        { listingId: 1, response: mockCommentResponse },
        '',
        { listingId: 1, data: {} as any }
      );
      const result = commentReducer(stateWithComments, action);

      expect(result.isCreating).toBe(false);
      expect(result.commentsByListing[1]).toContainEqual(mockComment);
      expect(result.commentCounts[1]).toBe(1);
    });

    test('should handle fulfilled state with parent comment', () => {
      const parentComment: CommentDto = {
        ...mockComment,
        id: 2,
        replies: [],
      };

      const replyComment: CommentDto = {
        ...mockComment,
        id: 1,
        parentCommentId: 2,
      };

      const stateWithComments: CommentState = {
        ...initialState,
        commentsByListing: {
          1: [parentComment],
        },
        commentCounts: {
          1: 1,
        },
      };

      const action = createComment.fulfilled(
        { listingId: 1, response: { ...mockCommentResponse, comment: replyComment } },
        '',
        { listingId: 1, data: { parentCommentId: 2 } as any }
      );
      const result = commentReducer(stateWithComments, action);

      expect(result.isCreating).toBe(false);
      const parent = result.commentsByListing[1].find(c => c.id === 2);
      expect(parent?.replies).toContainEqual(replyComment);
    });
  });

  describe('Async Thunks - updateComment', () => {
    test('should handle pending state', () => {
      const action = updateComment.pending('', { listingId: 1, commentId: 1, data: {} as any });
      const result = commentReducer(initialState, action);

      expect(result.isUpdating).toBe(true);
    });

    test('should handle fulfilled state and update comment', () => {
      const updatedComment: CommentDto = {
        ...mockComment,
        content: 'Updated comment',
        isEdited: true,
      };

      const stateWithComments: CommentState = {
        ...initialState,
        commentsByListing: {
          1: [mockComment],
        },
      };

      const action = updateComment.fulfilled(
        { listingId: 1, response: { ...mockCommentResponse, comment: updatedComment } },
        '',
        { listingId: 1, commentId: 1, data: {} as any }
      );
      const result = commentReducer(stateWithComments, action);

      expect(result.isUpdating).toBe(false);
      const updated = result.commentsByListing[1].find(c => c.id === 1);
      expect(updated?.content).toBe('Updated comment');
      expect(updated?.isEdited).toBe(true);
    });
  });

  describe('Async Thunks - deleteComment', () => {
    test('should handle pending state', () => {
      const action = deleteComment.pending('', { listingId: 1, commentId: 1 });
      const result = commentReducer(initialState, action);

      expect(result.isDeleting).toBe(true);
    });

    test('should handle fulfilled state and remove comment', () => {
      const stateWithComments: CommentState = {
        ...initialState,
        commentsByListing: {
          1: [mockComment],
        },
        commentCounts: {
          1: 1,
        },
      };

      const action = deleteComment.fulfilled(
        { listingId: 1, response: mockCommentResponse },
        '',
        { listingId: 1, commentId: 1 }
      );
      const result = commentReducer(stateWithComments, action);

      expect(result.isDeleting).toBe(false);
      expect(result.commentsByListing[1]).not.toContainEqual(mockComment);
      expect(result.commentCounts[1]).toBe(0);
    });
  });

  describe('Async Thunks - fetchMyComments', () => {
    test('should handle pending state', () => {
      const action = fetchMyComments.pending('', undefined);
      const result = commentReducer(initialState, action);

      expect(result.isLoading).toBe(true);
    });

    test('should handle fulfilled state', () => {
      const action = fetchMyComments.fulfilled(
        { success: true, message: '', comments: [mockComment] },
        '',
        undefined
      );
      const result = commentReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.myComments).toEqual([mockComment]);
    });
  });

  describe('Selectors', () => {
    const mockState = {
      comment: {
        ...initialState,
        commentsByListing: {
          1: [mockComment],
        },
        commentCounts: {
          1: 1,
        },
        myComments: [mockComment],
        isLoading: true,
        error: 'Test error',
      },
    } as any;

    test('selectCommentsByListing should return comments for listing', () => {
      const result = selectCommentsByListing(1)(mockState);
      expect(result).toEqual([mockComment]);
    });

    test('selectCommentCount should return count for listing', () => {
      const result = selectCommentCount(1)(mockState);
      expect(result).toBe(1);
    });

    test('selectMyComments should return my comments', () => {
      const result = selectMyComments(mockState);
      expect(result).toEqual([mockComment]);
    });

    test('selectIsLoading should return loading state', () => {
      const result = selectIsLoading(mockState);
      expect(result).toBe(true);
    });

    test('selectError should return error', () => {
      const result = selectError(mockState);
      expect(result).toBe('Test error');
    });
  });
});

