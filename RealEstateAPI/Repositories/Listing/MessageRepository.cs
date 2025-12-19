using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Data;
using RealEstateAPI.Models;

namespace RealEstateAPI.Repositories.Listing;

public class MessageRepository : IMessageRepository
{
    private readonly ApplicationDbContext _context;

    public MessageRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ListingMessageThread?> GetThreadAsync(int listingId, string buyerId, string sellerId)
    {
        return await _context.ListingMessageThreads
            .Include(t => t.Messages.OrderByDescending(m => m.CreatedAt))
            .FirstOrDefaultAsync(t => t.ListingId == listingId && t.BuyerId == buyerId && t.SellerId == sellerId);
    }

    public async Task<ListingMessageThread?> GetThreadByIdAsync(int threadId)
    {
        return await _context.ListingMessageThreads
            .Include(t => t.Seller)
            .Include(t => t.Buyer)
            .Include(t => t.Messages.OrderBy(m => m.CreatedAt))
                .ThenInclude(m => m.Sender)
            .Include(t => t.Listing)
            .FirstOrDefaultAsync(t => t.Id == threadId);
    }

    public async Task<List<ListingMessageThread>> GetThreadsForUserAsync(string userId)
    {
        return await _context.ListingMessageThreads
            .Include(t => t.Listing)
            .Include(t => t.Seller)
            .Include(t => t.Buyer)
            .Include(t => t.Messages.OrderByDescending(m => m.CreatedAt))
                .ThenInclude(m => m.Sender)
            .Where(t => t.BuyerId == userId || t.SellerId == userId)
            .OrderByDescending(t => t.LastMessageAt ?? t.CreatedAt)
            .ToListAsync();
    }

    public async Task<ListingMessageThread?> GetThreadByListingAndUserAsync(int listingId, string userId)
    {
        return await _context.ListingMessageThreads
            .Include(t => t.Seller)
            .Include(t => t.Buyer)
            .Include(t => t.Messages.OrderByDescending(m => m.CreatedAt))
                .ThenInclude(m => m.Sender)
            .Include(t => t.Listing)
            .Where(t => t.ListingId == listingId && (t.BuyerId == userId || t.SellerId == userId))
            .OrderByDescending(t => t.LastMessageAt ?? t.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> DeleteThreadAsync(int threadId, string userId)
    {
        var thread = await _context.ListingMessageThreads
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == threadId && (t.BuyerId == userId || t.SellerId == userId));

        if (thread == null)
        {
            return false;
        }

        _context.ListingMessages.RemoveRange(thread.Messages);
        _context.ListingMessageThreads.Remove(thread);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ListingMessage>> GetMessagesAsync(int threadId)
    {
        return await _context.ListingMessages
            .Include(m => m.Sender)
            .Where(m => m.ThreadId == threadId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();
    }

    public async Task<ListingMessage> AddMessageAsync(ListingMessage message)
    {
        _context.ListingMessages.Add(message);
        await _context.SaveChangesAsync();
        return message;
    }

    public async Task<ListingMessageThread> AddThreadAsync(ListingMessageThread thread)
    {
        _context.ListingMessageThreads.Add(thread);
        await _context.SaveChangesAsync();
        return thread;
    }

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}

