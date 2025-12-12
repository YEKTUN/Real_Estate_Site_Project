using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Data;
using RealEstateAPI.Models;

namespace RealEstateAPI.Repositories.Listing;

/// <summary>
/// Favori Repository Implementasyonu
/// 
/// Favori işlemleri için veritabanı operasyonları.
/// </summary>
public class FavoriteRepository : IFavoriteRepository
{
    private readonly ApplicationDbContext _context;

    public FavoriteRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // ============================================================================
    // FAVORİ CRUD İŞLEMLERİ
    // ============================================================================

    public async Task<FavoriteListing> AddAsync(FavoriteListing favorite)
    {
        favorite.CreatedAt = DateTime.UtcNow;
        
        await _context.FavoriteListings.AddAsync(favorite);
        
        // İlanın favori sayısını artır
        var listing = await _context.Listings.FindAsync(favorite.ListingId);
        if (listing != null)
        {
            listing.FavoriteCount++;
        }
        
        await _context.SaveChangesAsync();
        
        return favorite;
    }

    public async Task<bool> RemoveAsync(string userId, int listingId)
    {
        var favorite = await _context.FavoriteListings
            .FirstOrDefaultAsync(f => f.UserId == userId && f.ListingId == listingId);
        
        if (favorite == null) return false;

        _context.FavoriteListings.Remove(favorite);
        
        // İlanın favori sayısını azalt
        var listing = await _context.Listings.FindAsync(listingId);
        if (listing != null && listing.FavoriteCount > 0)
        {
            listing.FavoriteCount--;
        }
        
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<FavoriteListing?> UpdateNoteAsync(string userId, int listingId, string? note)
    {
        var favorite = await _context.FavoriteListings
            .FirstOrDefaultAsync(f => f.UserId == userId && f.ListingId == listingId);
        
        if (favorite == null) return null;

        favorite.Note = note;
        await _context.SaveChangesAsync();
        
        return favorite;
    }

    // ============================================================================
    // FAVORİ LİSTELEME
    // ============================================================================

    public async Task<(List<FavoriteListing> Favorites, int TotalCount)> GetByUserIdAsync(string userId, int page, int pageSize)
    {
        var query = _context.FavoriteListings
            .Where(f => f.UserId == userId)
            .Include(f => f.Listing)
                .ThenInclude(l => l!.Images.Where(i => i.IsCoverImage))
            .OrderByDescending(f => f.CreatedAt);

        var totalCount = await query.CountAsync();
        var favorites = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (favorites, totalCount);
    }

    public async Task<FavoriteListing?> GetAsync(string userId, int listingId)
    {
        return await _context.FavoriteListings
            .Include(f => f.Listing)
            .FirstOrDefaultAsync(f => f.UserId == userId && f.ListingId == listingId);
    }

    // ============================================================================
    // KONTROL İŞLEMLERİ
    // ============================================================================

    public async Task<bool> IsFavoritedAsync(string userId, int listingId)
    {
        return await _context.FavoriteListings
            .AnyAsync(f => f.UserId == userId && f.ListingId == listingId);
    }

    public async Task<int> GetFavoriteCountAsync(int listingId)
    {
        return await _context.FavoriteListings
            .CountAsync(f => f.ListingId == listingId);
    }

    public async Task<List<int>> GetUserFavoriteIdsAsync(string userId)
    {
        return await _context.FavoriteListings
            .Where(f => f.UserId == userId)
            .Select(f => f.ListingId)
            .ToListAsync();
    }
}
