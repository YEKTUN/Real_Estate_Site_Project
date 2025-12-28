import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../store';
import {
  MessageState,
  ListingThreadListResponseDto,
  ListingMessageListResponseDto,
  ListingMessageResponseDto,
  CreateListingMessageDto,
  ListingMessageDto,
  ListingMessageThreadDto,
} from './DTOs/MessageDTOs';
import { getThreadsApi, getMessagesApi, sendMessageApi, deleteThreadApi, markMessageAsReadApi } from '../../api/messageApi';

const computeUnread = (messages: ListingMessageDto[] | undefined, currentUserId?: string | null) =>
  (messages || []).filter((m) => !m.isRead && m.senderId !== currentUserId).length;

const initialState: MessageState = {
  threads: [],
  messagesByThread: {},
  isLoading: false,
  isSending: false,
  error: null,
};

export const fetchThreads = createAsyncThunk<ListingThreadListResponseDto>(
  'message/fetchThreads',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getThreadsApi();
      if (!res.success) return rejectWithValue(res.message);
      return res;
    } catch {
      return rejectWithValue('Mesajlar yüklenirken hata oluştu');
    }
  }
);

export const fetchMessages = createAsyncThunk<ListingMessageListResponseDto, number>(
  'message/fetchMessages',
  async (threadId, { rejectWithValue }) => {
    try {
      const res = await getMessagesApi(threadId);
      if (!res.success) return rejectWithValue(res.message);
      return { ...res, threadId } as ListingMessageListResponseDto & { threadId: number };
    } catch {
      return rejectWithValue('Mesajlar yüklenirken hata oluştu');
    }
  }
);

export const sendMessage = createAsyncThunk<
  ListingMessageResponseDto,
  { listingId: number; data: CreateListingMessageDto }
>(
  'message/sendMessage',
  async ({ listingId, data }, { rejectWithValue }) => {
    try {
      const res = await sendMessageApi(listingId, data);
      if (!res.success) {
        return rejectWithValue(res.message);
      }
      return res;
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Mesaj gönderilirken hata oluştu';
      return rejectWithValue(msg);
    }
  }
);

export const deleteThreadAsync = createAsyncThunk<number, number>(
  'message/deleteThread',
  async (threadId, { rejectWithValue }) => {
    try {
      await deleteThreadApi(threadId);
      return threadId;
    } catch {
      return rejectWithValue('Mesajlaşma silinirken hata oluştu');
    }
  }
);

export const markMessageRead = createAsyncThunk<
  { messageId: number; threadId: number },
  { messageId: number; threadId: number }
>('message/markMessageRead', async ({ messageId, threadId }, { rejectWithValue }) => {
  try {
    await markMessageAsReadApi(messageId);
    return { messageId, threadId };
  } catch {
    return rejectWithValue('Mesaj okundu olarak işaretlenirken hata oluştu');
  }
});

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    clearMessageError: (state) => {
      state.error = null;
    },
    markThreadRead: (state, action: PayloadAction<number>) => {
      const threadId = action.payload;
      if (state.messagesByThread[threadId]) {
        state.messagesByThread[threadId] = state.messagesByThread[threadId].map((m) => ({
          ...m,
          isRead: true,
        }));
      }
      state.threads = state.threads.map((t) =>
        t.id === threadId
          ? {
            ...t,
            messages: (t.messages || []).map((m) => ({ ...m, isRead: true })),
          }
          : t
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThreads.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchThreads.fulfilled, (state, action: PayloadAction<ListingThreadListResponseDto>) => {
        state.isLoading = false;
        state.threads = action.payload.threads;
      })
      .addCase(fetchThreads.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchMessages.fulfilled,
        (state, action: PayloadAction<ListingMessageListResponseDto & { threadId: number }>) => {
          state.isLoading = false;
          const messages = action.payload.messages;
          state.messagesByThread[action.payload.threadId] = messages;
          state.threads = state.threads.map((t) =>
            t.id === action.payload.threadId
              ? { ...t, messages: messages, lastMessageAt: messages.at(-1)?.createdAt ?? t.lastMessageAt }
              : t
          );
        }
      )
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<ListingMessageResponseDto>) => {
        state.isSending = false;
        const msgData = action.payload.data;
        if (msgData) {
          const msg = { ...msgData, isRead: true };
          const threadId = msg.threadId;
          if (!state.messagesByThread[threadId]) state.messagesByThread[threadId] = [];
          state.messagesByThread[threadId] = [...state.messagesByThread[threadId], msg];
          state.threads = state.threads.map((t) =>
            t.id === threadId
              ? {
                ...t,
                messages: [...(t.messages || []), msg],
                lastMessageAt: msg.createdAt,
              }
              : t
          );
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload as string;
      })
      .addCase(deleteThreadAsync.fulfilled, (state, action: PayloadAction<number>) => {
        const threadId = action.payload;
        delete state.messagesByThread[threadId];
        state.threads = state.threads.filter((t) => t.id !== threadId);
      })
      .addCase(deleteThreadAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(markMessageRead.fulfilled, (state, action) => {
        const { messageId, threadId } = action.payload;
        if (state.messagesByThread[threadId]) {
          state.messagesByThread[threadId] = state.messagesByThread[threadId].map((m) =>
            m.id === messageId ? { ...m, isRead: true } : m
          );
        }
        state.threads = state.threads.map((t) => {
          if (t.id === threadId) {
            const updatedMessages = (t.messages || []).map((m) =>
              m.id === messageId ? { ...m, isRead: true } : m
            );
            return {
              ...t,
              messages: updatedMessages,
            };
          }
          return t;
        });
      });
  },
});

export const { clearMessageError, markThreadRead } = messageSlice.actions;

export const selectThreads = (state: RootState): ListingMessageThreadDto[] => state.message.threads;
export const selectMessagesByThread = (threadId: number) => (state: RootState): ListingMessageDto[] =>
  state.message.messagesByThread[threadId] || [];
export const selectMessageLoading = (state: RootState) => state.message.isLoading;
export const selectMessageSending = (state: RootState) => state.message.isSending;
export const selectMessageError = (state: RootState) => state.message.error;
export const selectThreadUnread = (threadId: number) => (state: RootState) => {
  const currentUserId = state.auth.user?.id;
  const localMsgs = state.message.messagesByThread[threadId];
  if (localMsgs) return computeUnread(localMsgs, currentUserId);
  const thread = state.message.threads.find((t) => t.id === threadId);
  return computeUnread(thread?.messages, currentUserId);
};
export const selectTotalUnread = (state: RootState) => {
  const currentUserId = state.auth.user?.id;
  const byThread = state.message.messagesByThread;
  const fromThreads = state.message.threads.reduce((sum, t) => {
    const unreadFromCache = computeUnread(byThread[t.id], currentUserId);
    if (byThread[t.id]) return sum + unreadFromCache;
    return sum + computeUnread(t.messages, currentUserId);
  }, 0);
  return fromThreads;
};

export default messageSlice.reducer;
