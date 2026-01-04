using RealEstateAPI.DTOs.Listing;

namespace RealEstateAPI.Services.Listing;

public interface IMessageService
{
    Task<ListingMessageResponseDto> SendMessageAsync(int listingId, string senderId, CreateListingMessageDto dto);
    Task<ListingThreadListResponseDto> GetThreadsAsync(string userId);
    Task<ListingMessageListResponseDto> GetMessagesAsync(int threadId, string userId);
    Task<bool> DeleteThreadAsync(int threadId, string userId);
    Task<bool> MarkMessageAsReadAsync(int messageId, string userId);
    /// <summary>
    /// Admin olarak ilan sahibine mesaj gönder (ilan durumu değişikliği bildirimi)
    /// </summary>
    Task<bool> SendAdminNotificationAsync(int listingId, string adminUserId, string messageContent);
    Task<ListingMessageResponseDto> RespondToOfferAsync(int messageId, string userId, bool accept);
}

