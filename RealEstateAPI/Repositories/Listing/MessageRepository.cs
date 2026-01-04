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

    public async Task<ListingMessageThread?> GetThreadByIdAsync(int threadId, string? userId = null)
    {
        var query = _context.ListingMessageThreads
            .Include(t => t.Seller)
            .Include(t => t.Buyer)
            .Include(t => t.Messages.OrderBy(m => m.CreatedAt))
                .ThenInclude(m => m.Sender)
            .Include(t => t.Listing)
            .Where(t => t.Id == threadId);

        // Eğer userId verildiyse, kullanıcının silmediği thread'leri getir
        if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(t => !(t.BuyerId == userId && t.DeletedByBuyer)
                && !(t.SellerId == userId && t.DeletedBySeller));
        }

        return await query.FirstOrDefaultAsync();
    }

    public async Task<List<ListingMessageThread>> GetThreadsForUserAsync(string userId)
    {
        return await _context.ListingMessageThreads
            .Include(t => t.Listing)
            .Include(t => t.Seller)
            .Include(t => t.Buyer)
            .Include(t => t.Messages.OrderByDescending(m => m.CreatedAt))
                .ThenInclude(m => m.Sender)
            .Where(t => (t.BuyerId == userId || t.SellerId == userId)
                && !(t.BuyerId == userId && t.DeletedByBuyer)
                && !(t.SellerId == userId && t.DeletedBySeller))
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
            .Where(t => t.ListingId == listingId && (t.BuyerId == userId || t.SellerId == userId)
                && !(t.BuyerId == userId && t.DeletedByBuyer)
                && !(t.SellerId == userId && t.DeletedBySeller))
            .OrderByDescending(t => t.LastMessageAt ?? t.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<bool> DeleteThreadAsync(int threadId, string userId)
    {
        var thread = await _context.ListingMessageThreads
            .FirstOrDefaultAsync(t => t.Id == threadId && (t.BuyerId == userId || t.SellerId == userId));

        if (thread == null)
        {
            return false;
        }

        // Soft delete: Kullanıcının rolüne göre ilgili flag'i set et
        if (thread.BuyerId == userId)
        {
            thread.DeletedByBuyer = true;
        }
        else if (thread.SellerId == userId)
        {
            thread.DeletedBySeller = true;
        }

        thread.UpdatedAt = DateTime.UtcNow;
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

    public async Task<bool> MarkMessageAsReadAsync(int messageId, string userId)
    {
        // Mesajı ve thread'i birlikte getir
        var message = await _context.ListingMessages
            .Include(m => m.Thread)
            .FirstOrDefaultAsync(m => m.Id == messageId);

        if (message == null)
        {
            return false;
        }

        // Kullanıcının bu mesaja erişim hakkı var mı kontrol et (thread'in seller veya buyer'ı olmalı)
        var thread = message.Thread;
        if (thread == null || (thread.BuyerId != userId && thread.SellerId != userId))
        {
            return false;
        }

        // Sadece kullanıcının kendi gönderdiği mesajları okundu yapmamalıyız
        // Ancak kullanıcı mesajı görüyorsa okundu yapabilir
        // En önemli kural: Sadece diğer kullanıcıdan gelen mesajları okundu yapabiliriz
        if (message.SenderId == userId)
        {
            // Kendi mesajınız zaten okundu sayılır
            message.IsRead = true;
        }
        else
        {
            // Başkasından gelen mesajı okundu yap
            message.IsRead = true;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ListingMessage?> GetMessageByIdAsync(int messageId)
    {
        return await _context.ListingMessages
            .Include(m => m.Thread)
            .Include(m => m.Sender)
            .FirstOrDefaultAsync(m => m.Id == messageId);
    }

    public Task SaveChangesAsync() => _context.SaveChangesAsync();
}

