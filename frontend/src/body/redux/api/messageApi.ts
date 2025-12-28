import axiosInstance from './axiosInstance';
import {
  CreateListingMessageDto,
  ListingMessageListResponseDto,
  ListingMessageResponseDto,
  ListingThreadListResponseDto,
} from '../slices/message/DTOs/MessageDTOs';

export const getThreadsApi = async (): Promise<ListingThreadListResponseDto> => {
  const response = await axiosInstance.get<ListingThreadListResponseDto>('/messages');
  return response.data;
};

export const getMessagesApi = async (threadId: number): Promise<ListingMessageListResponseDto> => {
  const response = await axiosInstance.get<ListingMessageListResponseDto>(`/messages/${threadId}`);
  return response.data;
};

export const deleteThreadApi = async (threadId: number): Promise<void> => {
  await axiosInstance.delete(`/messages/${threadId}`);
};

export const markMessageAsReadApi = async (messageId: number): Promise<{ success: boolean; message: string }> => {
  const response = await axiosInstance.patch<{ success: boolean; message: string }>(`/messages/${messageId}/read`);
  return response.data;
};

export const sendMessageApi = async (
  listingId: number,
  data: CreateListingMessageDto
): Promise<ListingMessageResponseDto> => {
  console.log('sendMessageApi: İstek başlatılıyor', {
    listingId,
    data,
    url: `/messages/listing/${listingId}`,
  });

  try {
    const response = await axiosInstance.post<ListingMessageResponseDto>(`/messages/listing/${listingId}`, data);
    console.log('sendMessageApi: Başarılı yanıt', {
      status: response.status,
      data: response.data,
    });
    return response.data;
  } catch (error: any) {
    // Hata ayrıntısını console'a yaz (backend mesajını görmek için)
    console.error('sendMessageApi: Hata oluştu', {
      listingId,
      requestData: data,
      errorType: error?.constructor?.name,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      responseData: error?.response?.data,
      responseHeaders: error?.response?.headers,
      message: error?.message,
      stack: error?.stack,
      config: {
        url: error?.config?.url,
        method: error?.config?.method,
        headers: error?.config?.headers,
        data: error?.config?.data,
      },
    });
    throw error;
  }
};

