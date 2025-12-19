using RealEstateAPI.DTOs.Listing;

namespace RealEstateAPI.Services.Listing;

public interface IMessageService
{
    Task<ListingMessageResponseDto> SendMessageAsync(int listingId, string senderId, CreateListingMessageDto dto);
    Task<ListingThreadListResponseDto> GetThreadsAsync(string userId);
    Task<ListingMessageListResponseDto> GetMessagesAsync(int threadId, string userId);
    Task<bool> DeleteThreadAsync(int threadId, string userId);
}

