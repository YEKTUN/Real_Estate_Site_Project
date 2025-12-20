/**
 * MessageApi Unit Tests
 * 
 * Message API fonksiyonlarının testleri.
 */

import {
  getThreadsApi,
  getMessagesApi,
  sendMessageApi,
  deleteThreadApi,
} from '@/body/redux/api/messageApi';
import axiosInstance from '@/body/redux/api/axiosInstance';
import {
  CreateListingMessageDto,
  ListingMessageListResponseDto,
  ListingMessageResponseDto,
  ListingThreadListResponseDto,
} from '@/body/redux/slices/message/DTOs/MessageDTOs';

// ============================================================================
// MOCK SETUP
// ============================================================================

jest.mock('@/body/redux/api/axiosInstance');

const mockedAxiosInstance = axiosInstance as jest.Mocked<typeof axiosInstance>;

// ============================================================================
// TEST DATA
// ============================================================================

const mockThreadsResponse: ListingThreadListResponseDto = {
  success: true,
  message: 'Threads fetched',
  threads: [
    {
      id: 1,
      listingId: 1,
      listingTitle: 'Test Listing',
      sellerId: 'seller-123',
      sellerName: 'Seller',
      buyerId: 'buyer-123',
      buyerName: 'Buyer',
      lastMessageAt: new Date().toISOString(),
      messages: [],
    },
  ],
};

const mockMessagesResponse: ListingMessageListResponseDto = {
  success: true,
  message: 'Messages fetched',
  messages: [
    {
      id: 1,
      threadId: 1,
      senderId: 'sender-123',
      senderName: 'Sender',
      content: 'Test message',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

const mockSendMessageDto: CreateListingMessageDto = {
  content: 'Test message',
  isOffer: false,
};

// ============================================================================
// TESTS
// ============================================================================

describe('MessageApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getThreadsApi', () => {
    it('should fetch threads successfully', async () => {
      mockedAxiosInstance.get.mockResolvedValueOnce({
        data: mockThreadsResponse,
      } as any);

      const result = await getThreadsApi();

      expect(result.success).toBe(true);
      expect(result.threads).toHaveLength(1);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/messages');
    });
  });

  describe('getMessagesApi', () => {
    it('should fetch messages for a thread successfully', async () => {
      mockedAxiosInstance.get.mockResolvedValueOnce({
        data: mockMessagesResponse,
      } as any);

      const result = await getMessagesApi(1);

      expect(result.success).toBe(true);
      expect(result.messages).toHaveLength(1);
      expect(mockedAxiosInstance.get).toHaveBeenCalledWith('/messages/1');
    });
  });

  describe('sendMessageApi', () => {
    it('should send message successfully', async () => {
      const mockResponse: ListingMessageResponseDto = {
        success: true,
        message: 'Message sent',
        data: {
          id: 1,
          threadId: 1,
          senderId: 'sender-123',
          senderName: 'Sender',
          content: 'Test message',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      };

      mockedAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
      } as any);

      const result = await sendMessageApi(1, mockSendMessageDto);

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Test message');
      expect(mockedAxiosInstance.post).toHaveBeenCalledWith(
        '/messages/listing/1',
        mockSendMessageDto
      );
    });

    it('should handle send message error', async () => {
      const error = {
        response: {
          status: 400,
          data: { success: false, message: 'Invalid request' },
        },
      };

      mockedAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(sendMessageApi(1, mockSendMessageDto)).rejects.toEqual(error);
    });
  });

  describe('deleteThreadApi', () => {
    it('should delete thread successfully', async () => {
      mockedAxiosInstance.delete.mockResolvedValueOnce({} as any);

      await deleteThreadApi(1);

      expect(mockedAxiosInstance.delete).toHaveBeenCalledWith('/messages/1');
    });
  });
});

