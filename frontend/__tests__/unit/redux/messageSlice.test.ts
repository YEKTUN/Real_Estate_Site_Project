/**
 * MessageSlice Unit Tests
 * 
 * Redux message slice'ının tüm reducer, action ve async thunk'larını test eder.
 */

import messageReducer, {
  fetchThreads,
  fetchMessages,
  sendMessage,
  deleteThreadAsync,
  markThreadRead,
  selectThreads,
  selectMessagesByThread,
  selectMessageLoading,
  selectMessageSending,
  selectMessageError,
  selectTotalUnread,
} from '@/body/redux/slices/message/MessageSlice';
import {
  MessageState,
  ListingThreadListResponseDto,
  ListingMessageListResponseDto,
  ListingMessageResponseDto,
  CreateListingMessageDto,
} from '@/body/redux/slices/message/DTOs/MessageDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/messageApi', () => ({
  getThreadsApi: jest.fn(),
  getMessagesApi: jest.fn(),
  sendMessageApi: jest.fn(),
  deleteThreadApi: jest.fn(),
}));

// ============================================================================
// TEST DATA
// ============================================================================

const initialState: MessageState = {
  threads: [],
  messagesByThread: {},
  isLoading: false,
  isSending: false,
  error: null,
};

const mockThread = {
  id: 1,
  listingId: 1,
  listingTitle: 'Test Listing',
  sellerId: 'seller-123',
  sellerName: 'Seller',
  buyerId: 'buyer-123',
  buyerName: 'Buyer',
  lastMessageAt: new Date().toISOString(),
  messages: [],
};

const mockMessage = {
  id: 1,
  threadId: 1,
  senderId: 'sender-123',
  senderName: 'Sender',
  content: 'Test message',
  isRead: false,
  createdAt: new Date().toISOString(),
};

// ============================================================================
// TESTS
// ============================================================================

describe('MessageSlice', () => {
  describe('reducer', () => {
    it('should return initial state', () => {
      expect(messageReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });
  });

  describe('fetchThreads', () => {
    it('should handle pending state', () => {
      const action = { type: fetchThreads.pending.type };
      const state = messageReducer(initialState, action);
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled state', () => {
      const response: ListingThreadListResponseDto = {
        success: true,
        message: 'Success',
        threads: [mockThread],
      };
      const action = { type: fetchThreads.fulfilled.type, payload: response };
      const state = messageReducer(initialState, action);
      expect(state.threads).toEqual([mockThread]);
      expect(state.isLoading).toBe(false);
    });

    it('should handle rejected state', () => {
      const action = { type: fetchThreads.rejected.type, payload: 'Error message' };
      const state = messageReducer(initialState, action);
      expect(state.error).toBe('Error message');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('fetchMessages', () => {
    it('should handle fulfilled state', () => {
      const response: ListingMessageListResponseDto = {
        success: true,
        message: 'Success',
        messages: [mockMessage],
      };
      const action = {
        type: fetchMessages.fulfilled.type,
        payload: { ...response, threadId: 1 },
      };
      const state = messageReducer(initialState, action);
      expect(state.messagesByThread[1]).toEqual([mockMessage]);
    });
  });

  describe('sendMessage', () => {
    it('should handle pending state', () => {
      const action = { type: sendMessage.pending.type };
      const state = messageReducer(initialState, action);
      expect(state.isSending).toBe(true);
    });

    it('should handle fulfilled state', () => {
      const response: ListingMessageResponseDto = {
        success: true,
        message: 'Message sent',
        data: mockMessage,
      };
      const action = { type: sendMessage.fulfilled.type, payload: response };
      const state = messageReducer(initialState, action);
      expect(state.isSending).toBe(false);
    });
  });

  describe('deleteThreadAsync', () => {
    it('should handle fulfilled state', () => {
      const stateWithThread = {
        ...initialState,
        threads: [mockThread],
      };
      const action = { type: deleteThreadAsync.fulfilled.type, payload: 1 };
      const state = messageReducer(stateWithThread, action);
      expect(state.threads).toHaveLength(0);
    });
  });

  describe('markThreadRead', () => {
    it('should mark messages as read', () => {
      const stateWithMessages = {
        ...initialState,
        messagesByThread: {
          1: [mockMessage],
        },
      };
      const action = { type: 'message/markThreadRead', payload: 1 };
      const state = messageReducer(stateWithMessages, action);
      expect(state.messagesByThread[1][0].isRead).toBe(true);
    });
  });

  describe('selectors', () => {
    const state = {
      message: {
        threads: [mockThread],
        messagesByThread: { 1: [mockMessage] },
        isLoading: false,
        isSending: false,
        error: null,
      },
    } as any;

    it('selectThreads should return threads', () => {
      expect(selectThreads(state)).toEqual([mockThread]);
    });

    it('selectMessagesByThread should return messages for thread', () => {
      expect(selectMessagesByThread(state)(1)).toEqual([mockMessage]);
    });

    it('selectMessageLoading should return loading state', () => {
      expect(selectMessageLoading(state)).toBe(false);
    });

    it('selectMessageSending should return sending state', () => {
      expect(selectMessageSending(state)).toBe(false);
    });

    it('selectMessageError should return error', () => {
      expect(selectMessageError(state)).toBeNull();
    });

    it('selectTotalUnread should calculate unread count', () => {
      const stateWithUnread = {
        message: {
          ...state.message,
          messagesByThread: {
            1: [
              { ...mockMessage, isRead: false, senderId: 'other-123' },
              { ...mockMessage, id: 2, isRead: true, senderId: 'other-123' },
            ],
          },
        },
      } as any;
      expect(selectTotalUnread(stateWithUnread)).toBe(1);
    });
  });
});

