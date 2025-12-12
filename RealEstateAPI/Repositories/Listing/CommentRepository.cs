using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Data;
using RealEstateAPI.Models;

namespace RealEstateAPI.Repositories.Listing;

/// <summary>
/// Yorum Repository Implementasyonu
/// 
/// Yorum işlemleri için veritabanı operasyonları.
/// </summary>
public class CommentRepository : ICommentRepository
{
    private readonly ApplicationDbContext _context;

    public CommentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // ============================================================================
    // YORUM CRUD İŞLEMLERİ
    // ============================================================================

    public async Task<ListingComment> CreateAsync(ListingComment comment)
    {
        comment.CreatedAt = DateTime.UtcNow;
        comment.IsActive = true;
        
        await _context.ListingComments.AddAsync(comment);
        await _context.SaveChangesAsync();
        
        // User bilgisini yükle
        await _context.Entry(comment)
            .Reference(c => c.User)
            .LoadAsync();
        
        return comment;
    }

    public async Task<ListingComment> UpdateAsync(ListingComment comment)
    {
        comment.UpdatedAt = DateTime.UtcNow;
        comment.IsEdited = true;
        
        _context.ListingComments.Update(comment);
        await _context.SaveChangesAsync();
        
        return comment;
    }

    public async Task<bool> DeleteAsync(int commentId)
    {
        var comment = await _context.ListingComments.FindAsync(commentId);
        if (comment == null) return false;

        // Soft delete
        comment.IsActive = false;
        comment.UpdatedAt = DateTime.UtcNow;
        
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ListingComment?> GetByIdAsync(int commentId)
    {
        return await _context.ListingComments
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == commentId && c.IsActive);
    }

    // ============================================================================
    // YORUM LİSTELEME
    // ============================================================================

    public async Task<List<ListingComment>> GetByListingIdAsync(int listingId)
    {
        // Ana yorumları getir (ParentCommentId null olanlar)
        return await _context.ListingComments
            .Where(c => c.ListingId == listingId && c.IsActive && c.ParentCommentId == null)
            .Include(c => c.User)
            .Include(c => c.Replies.Where(r => r.IsActive))
                .ThenInclude(r => r.User)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<ListingComment>> GetByUserIdAsync(string userId)
    {
        return await _context.ListingComments
            .Where(c => c.UserId == userId && c.IsActive)
            .Include(c => c.Listing)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<int> GetCommentCountAsync(int listingId)
    {
        return await _context.ListingComments
            .CountAsync(c => c.ListingId == listingId && c.IsActive);
    }

    // ============================================================================
    // KONTROL İŞLEMLERİ
    // ============================================================================

    public async Task<bool> IsOwnerAsync(int commentId, string userId)
    {
        return await _context.ListingComments
            .AnyAsync(c => c.Id == commentId && c.UserId == userId);
    }

    public async Task<bool> ExistsAsync(int commentId)
    {
        return await _context.ListingComments
            .AnyAsync(c => c.Id == commentId && c.IsActive);
    }
}
