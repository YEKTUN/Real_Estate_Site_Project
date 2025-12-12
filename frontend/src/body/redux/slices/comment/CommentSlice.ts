import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import {
  CommentState,
  CreateCommentDto,
  UpdateCommentDto,
  CommentResponseDto,
  CommentListResponseDto,
  CommentDto,
} from './DTOs/CommentDTOs';
import {
  getListingCommentsApi,
  createCommentApi,
  updateCommentApi,
  deleteCommentApi,
  getMyCommentsApi,
} from '../../api/commentApi';

/**
 * Comment Slice
 * 
 * Yorum state yönetimi.
 * CRUD işlemleri ve listeleme.
 */

// ============================================================================
// INITIAL STATE
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

// ============================================================================
// ASYNC THUNKS
// ============================================================================

/**
 * İlanın yorumlarını getir
 */
export const fetchListingComments = createAsyncThunk<
  { listingId: number; response: CommentListResponseDto },
  number
>(
  'comment/fetchByListing',
  async (listingId, { rejectWithValue }) => {
    try {
      const response = await getListingCommentsApi(listingId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return { listingId, response };
    } catch {
      return rejectWithValue('Yorumlar yüklenirken bir hata oluştu');
    }
  }
);

/**
 * Yorum ekle
 */
export const createComment = createAsyncThunk<
  { listingId: number; response: CommentResponseDto },
  { listingId: number; data: CreateCommentDto }
>(
  'comment/create',
  async ({ listingId, data }, { rejectWithValue }) => {
    try {
      const response = await createCommentApi(listingId, data);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return { listingId, response };
    } catch {
      return rejectWithValue('Yorum eklenirken bir hata oluştu');
    }
  }
);

/**
 * Yorum güncelle
 */
export const updateComment = createAsyncThunk<
  { listingId: number; commentId: number; response: CommentResponseDto },
  { listingId: number; commentId: number; data: UpdateCommentDto }
>(
  'comment/update',
  async ({ listingId, commentId, data }, { rejectWithValue }) => {
    try {
      const response = await updateCommentApi(listingId, commentId, data);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return { listingId, commentId, response };
    } catch {
      return rejectWithValue('Yorum güncellenirken bir hata oluştu');
    }
  }
);

/**
 * Yorum sil
 */
export const deleteComment = createAsyncThunk<
  { listingId: number; commentId: number },
  { listingId: number; commentId: number }
>(
  'comment/delete',
  async ({ listingId, commentId }, { rejectWithValue }) => {
    try {
      const response = await deleteCommentApi(listingId, commentId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return { listingId, commentId };
    } catch {
      return rejectWithValue('Yorum silinirken bir hata oluştu');
    }
  }
);

/**
 * Kullanıcının yorumlarını getir
 */
export const fetchMyComments = createAsyncThunk<CommentListResponseDto, void>(
  'comment/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyCommentsApi();
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response;
    } catch {
      return rejectWithValue('Yorumlarınız yüklenirken bir hata oluştu');
    }
  }
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Yorumu listede güncelle (yanıtlar dahil)
 */
const updateCommentInList = (
  comments: CommentDto[], 
  commentId: number, 
  updatedComment: CommentDto
): CommentDto[] => {
  return comments.map(comment => {
    if (comment.id === commentId) {
      return updatedComment;
    }
    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: updateCommentInList(comment.replies, commentId, updatedComment),
      };
    }
    return comment;
  });
};

/**
 * Yorumu listeden sil (yanıtlar dahil)
 */
const removeCommentFromList = (comments: CommentDto[], commentId: number): CommentDto[] => {
  return comments
    .filter(comment => comment.id !== commentId)
    .map(comment => ({
      ...comment,
      replies: removeCommentFromList(comment.replies, commentId),
    }));
};

/**
 * Yorumu listeye ekle (yanıt ise parent'ın altına)
 */
const addCommentToList = (
  comments: CommentDto[], 
  newComment: CommentDto, 
  parentCommentId?: number
): CommentDto[] => {
  if (!parentCommentId) {
    return [newComment, ...comments];
  }
  
  return comments.map(comment => {
    if (comment.id === parentCommentId) {
      return {
        ...comment,
        replies: [newComment, ...comment.replies],
      };
    }
    if (comment.replies.length > 0) {
      return {
        ...comment,
        replies: addCommentToList(comment.replies, newComment, parentCommentId),
      };
    }
    return comment;
  });
};

// ============================================================================
// SLICE
// ============================================================================

export const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    // Error'u temizle
    clearError: (state) => {
      state.error = null;
    },
    
    // Belirli bir ilanın yorumlarını temizle
    clearListingComments: (state, action: PayloadAction<number>) => {
      delete state.commentsByListing[action.payload];
      delete state.commentCounts[action.payload];
    },
    
    // State'i sıfırla
    resetCommentState: () => initialState,
  },
  extraReducers: (builder) => {
    // ========== FETCH LISTING COMMENTS ==========
    builder
      .addCase(fetchListingComments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchListingComments.fulfilled, (state, action) => {
        state.isLoading = false;
        const { listingId, response } = action.payload;
        state.commentsByListing[listingId] = response.comments;
        state.commentCounts[listingId] = response.totalCount;
      })
      .addCase(fetchListingComments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ========== CREATE COMMENT ==========
    builder
      .addCase(createComment.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state, action) => {
        state.isCreating = false;
        const { listingId, response } = action.payload;
        
        if (response.comment) {
          const existingComments = state.commentsByListing[listingId] || [];
          state.commentsByListing[listingId] = addCommentToList(
            existingComments, 
            response.comment, 
            response.comment.parentCommentId
          );
          state.commentCounts[listingId] = (state.commentCounts[listingId] || 0) + 1;
        }
      })
      .addCase(createComment.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });

    // ========== UPDATE COMMENT ==========
    builder
      .addCase(updateComment.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state, action) => {
        state.isUpdating = false;
        const { listingId, commentId, response } = action.payload;
        
        if (response.comment) {
          const existingComments = state.commentsByListing[listingId] || [];
          state.commentsByListing[listingId] = updateCommentInList(
            existingComments, 
            commentId, 
            response.comment
          );
        }
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // ========== DELETE COMMENT ==========
    builder
      .addCase(deleteComment.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.isDeleting = false;
        const { listingId, commentId } = action.payload;
        
        const existingComments = state.commentsByListing[listingId] || [];
        state.commentsByListing[listingId] = removeCommentFromList(existingComments, commentId);
        
        if (state.commentCounts[listingId] > 0) {
          state.commentCounts[listingId] -= 1;
        }
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });

    // ========== FETCH MY COMMENTS ==========
    builder
      .addCase(fetchMyComments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyComments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myComments = action.payload.comments;
      })
      .addCase(fetchMyComments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================================================
// EXPORTS
// ============================================================================

// Actions
export const { clearError, clearListingComments, resetCommentState } = commentSlice.actions;

// Selectors
export const selectCommentsByListing = (listingId: number) => (state: RootState) => 
  state.comment.commentsByListing[listingId] || [];
export const selectMyComments = (state: RootState) => state.comment.myComments;
export const selectCommentCount = (listingId: number) => (state: RootState) => 
  state.comment.commentCounts[listingId] || 0;
export const selectCommentLoading = (state: RootState) => state.comment.isLoading;
export const selectCommentCreating = (state: RootState) => state.comment.isCreating;
export const selectCommentUpdating = (state: RootState) => state.comment.isUpdating;
export const selectCommentDeleting = (state: RootState) => state.comment.isDeleting;
export const selectCommentError = (state: RootState) => state.comment.error;

// Reducer
export default commentSlice.reducer;
