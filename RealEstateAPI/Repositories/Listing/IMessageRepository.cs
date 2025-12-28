using RealEstateAPI.Models;

namespace RealEstateAPI.Repositories.Listing;

public interface IMessageRepository
{
    Task<ListingMessageThread?> GetThreadAsync(int listingId, string buyerId, string sellerId);
    Task<ListingMessageThread?> GetThreadByIdAsync(int threadId, string? userId = null);
    Task<List<ListingMessageThread>> GetThreadsForUserAsync(string userId);
    Task<ListingMessageThread?> GetThreadByListingAndUserAsync(int listingId, string userId);
    Task<bool> DeleteThreadAsync(int threadId, string userId);
    Task<List<ListingMessage>> GetMessagesAsync(int threadId);
    Task<ListingMessage> AddMessageAsync(ListingMessage message);
    Task<ListingMessageThread> AddThreadAsync(ListingMessageThread thread);
    Task<bool> MarkMessageAsReadAsync(int messageId, string userId);
    Task SaveChangesAsync();
}

