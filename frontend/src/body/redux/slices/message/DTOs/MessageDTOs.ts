export interface ListingMessageDto {
  id: number;
  threadId: number;
  senderId: string;
  senderName: string;
  senderSurname?: string | null;
  senderProfilePictureUrl?: string | null;
  content: string;
  offerPrice?: number | null;
  isOffer: boolean;
   attachmentUrl?: string | null;
   attachmentType?: string | null;
   attachmentFileName?: string | null;
   attachmentFileSize?: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface ListingMessageThreadDto {
  id: number;
  listingId: number;
  listingTitle: string;
  sellerId: string;
  sellerName: string;
  sellerSurname?: string | null;
  sellerProfilePictureUrl?: string | null;
  buyerId: string;
  buyerName: string;
  buyerSurname?: string | null;
  buyerProfilePictureUrl?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  messages: ListingMessageDto[];
}

export interface ListingMessageResponseDto {
  success: boolean;
  message: string;
  data?: ListingMessageDto;
}

export interface ListingMessageListResponseDto {
  success: boolean;
  message: string;
  messages: ListingMessageDto[];
}

export interface ListingThreadListResponseDto {
  success: boolean;
  message: string;
  threads: ListingMessageThreadDto[];
}

export interface CreateListingMessageDto {
  content: string;
  offerPrice?: number | null;
  isOffer?: boolean;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentFileName?: string | null;
  attachmentFileSize?: number | null;
}

export interface MessageState {
  threads: ListingMessageThreadDto[];
  messagesByThread: Record<number, ListingMessageDto[]>;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

