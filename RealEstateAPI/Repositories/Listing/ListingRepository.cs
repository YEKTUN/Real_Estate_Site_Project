using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Data;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;

namespace RealEstateAPI.Repositories.Listing;

/// <summary>
/// İlan Repository Implementasyonu
/// 
/// İlan ile ilgili tüm veritabanı işlemlerini gerçekleştirir.
/// </summary>
public class ListingRepository : IListingRepository
{
    private readonly ApplicationDbContext _context;

    public ListingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // ============================================================================
    // İLAN CRUD İŞLEMLERİ
    // ============================================================================

    public async Task<Models.Listing> CreateAsync(Models.Listing listing)
    {
        listing.ListingNumber = await GenerateListingNumberAsync();
        listing.CreatedAt = DateTime.UtcNow;
        
        await _context.Listings.AddAsync(listing);
        await _context.SaveChangesAsync();
        
        return listing;
    }

    public async Task<Models.Listing> UpdateAsync(Models.Listing listing)
    {
        listing.UpdatedAt = DateTime.UtcNow;
        _context.Listings.Update(listing);
        await _context.SaveChangesAsync();
        
        return listing;
    }

    public async Task<bool> DeleteAsync(int listingId)
    {
        var listing = await _context.Listings.FindAsync(listingId);
        if (listing == null) return false;

        listing.Status = ListingStatus.Inactive;
        listing.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<Models.Listing?> GetByIdAsync(int listingId)
    {
        return await _context.Listings
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.Id == listingId);
    }

    public async Task<Models.Listing?> GetByListingNumberAsync(string listingNumber)
    {
        return await _context.Listings
            .Include(l => l.User)
            .FirstOrDefaultAsync(l => l.ListingNumber == listingNumber);
    }

    public async Task<Models.Listing?> GetByIdWithDetailsAsync(int listingId)
    {
        return await _context.Listings
            .Include(l => l.User)
            .Include(l => l.Images.OrderBy(i => i.DisplayOrder))
            .Include(l => l.InteriorFeatures)
            .Include(l => l.ExteriorFeatures)
            .Include(l => l.Comments.Where(c => c.IsActive && c.ParentCommentId == null))
                .ThenInclude(c => c.User)
            .Include(l => l.Comments.Where(c => c.IsActive && c.ParentCommentId == null))
                .ThenInclude(c => c.Replies.Where(r => r.IsActive))
                    .ThenInclude(r => r.User)
            .FirstOrDefaultAsync(l => l.Id == listingId);
    }

    // ============================================================================
    // İLAN LİSTELEME & ARAMA
    // ============================================================================

    public async Task<(List<Models.Listing> Listings, int TotalCount)> GetAllAsync(int page, int pageSize)
    {
        // Sadece onaylanmış (Active) ilanları göster
        var query = _context.Listings
            .Where(l => l.Status == ListingStatus.Active)
            .Include(l => l.Images.Where(i => i.IsCoverImage))
            .OrderByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync();
        var listings = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (listings, totalCount);
    }

    public async Task<(List<Models.Listing> Listings, int TotalCount)> SearchAsync(ListingSearchDto searchDto)
    {
        // Sadece onaylanmış (Active) ilanları göster
        var query = _context.Listings
            .Where(l => l.Status == ListingStatus.Active)
            .Include(l => l.Images.Where(i => i.IsCoverImage))
            .Include(l => l.InteriorFeatures)
            .Include(l => l.ExteriorFeatures)
            .AsQueryable();

        // Arama terimi
        if (!string.IsNullOrWhiteSpace(searchDto.SearchTerm))
        {
            var term = searchDto.SearchTerm.ToLower();
            query = query.Where(l => 
                l.Title.ToLower().Contains(term) || 
                l.Description.ToLower().Contains(term) ||
                l.City.ToLower().Contains(term) ||
                l.District.ToLower().Contains(term));
        }

        // Kategori & Tip Filtreleri
        if (searchDto.Category.HasValue)
            query = query.Where(l => l.Category == searchDto.Category.Value);

        if (searchDto.Type.HasValue)
            query = query.Where(l => l.Type == searchDto.Type.Value);

        if (searchDto.PropertyType.HasValue)
            query = query.Where(l => l.PropertyType == searchDto.PropertyType.Value);

        // Fiyat Aralığı
        if (searchDto.MinPrice.HasValue)
            query = query.Where(l => l.Price >= searchDto.MinPrice.Value);

        if (searchDto.MaxPrice.HasValue)
            query = query.Where(l => l.Price <= searchDto.MaxPrice.Value);

        if (searchDto.Currency.HasValue)
            query = query.Where(l => l.Currency == searchDto.Currency.Value);

        // Konum Filtreleri
        if (!string.IsNullOrWhiteSpace(searchDto.City))
            query = query.Where(l => l.City.ToLower() == searchDto.City.ToLower());

        if (!string.IsNullOrWhiteSpace(searchDto.District))
            query = query.Where(l => l.District.ToLower() == searchDto.District.ToLower());

        if (!string.IsNullOrWhiteSpace(searchDto.Neighborhood))
            query = query.Where(l => l.Neighborhood != null && l.Neighborhood.ToLower().Contains(searchDto.Neighborhood.ToLower()));

        // Alan Filtreleri (Net m²)
        if (searchDto.MinSquareMeters.HasValue)
            query = query.Where(l => l.NetSquareMeters >= searchDto.MinSquareMeters.Value);

        if (searchDto.MaxSquareMeters.HasValue)
            query = query.Where(l => l.NetSquareMeters <= searchDto.MaxSquareMeters.Value);

        // Oda Filtreleri
        if (!string.IsNullOrWhiteSpace(searchDto.RoomCount))
            query = query.Where(l => l.RoomCount == searchDto.RoomCount);

        if (searchDto.RoomCounts != null && searchDto.RoomCounts.Any())
            query = query.Where(l => l.RoomCount != null && searchDto.RoomCounts.Contains(l.RoomCount));

        // Bina Özellikleri
        if (searchDto.MinBuildingAge.HasValue)
            query = query.Where(l => l.BuildingAge >= searchDto.MinBuildingAge.Value);

        if (searchDto.MaxBuildingAge.HasValue)
            query = query.Where(l => l.BuildingAge <= searchDto.MaxBuildingAge.Value);

        if (searchDto.MinFloor.HasValue)
            query = query.Where(l => l.FloorNumber >= searchDto.MinFloor.Value);

        if (searchDto.MaxFloor.HasValue)
            query = query.Where(l => l.FloorNumber <= searchDto.MaxFloor.Value);

        // Diğer Filtreler
        if (searchDto.HeatingType.HasValue)
            query = query.Where(l => l.HeatingType == searchDto.HeatingType.Value);

        if (searchDto.BuildingStatus.HasValue)
            query = query.Where(l => l.BuildingStatus == searchDto.BuildingStatus.Value);

        if (searchDto.UsageStatus.HasValue)
            query = query.Where(l => l.UsageStatus == searchDto.UsageStatus.Value);

        if (searchDto.DeedStatus.HasValue)
            query = query.Where(l => l.DeedStatus == searchDto.DeedStatus.Value);

        if (searchDto.OwnerType.HasValue)
            query = query.Where(l => l.OwnerType == searchDto.OwnerType.Value);

        // Boolean Filtreler
        if (searchDto.IsSuitableForCredit.HasValue)
            query = query.Where(l => l.IsSuitableForCredit == searchDto.IsSuitableForCredit.Value);

        if (searchDto.IsSuitableForTrade.HasValue)
            query = query.Where(l => l.IsSuitableForTrade == searchDto.IsSuitableForTrade.Value);

        if (searchDto.IsFeatured.HasValue)
            query = query.Where(l => l.IsFeatured == searchDto.IsFeatured.Value);

        if (searchDto.IsUrgent.HasValue)
            query = query.Where(l => l.IsUrgent == searchDto.IsUrgent.Value);

        // Özellik Filtreleri
        if (searchDto.InteriorFeatures != null && searchDto.InteriorFeatures.Any())
        {
            foreach (var feature in searchDto.InteriorFeatures)
            {
                query = query.Where(l => l.InteriorFeatures.Any(f => f.FeatureType == feature));
            }
        }

        if (searchDto.ExteriorFeatures != null && searchDto.ExteriorFeatures.Any())
        {
            foreach (var feature in searchDto.ExteriorFeatures)
            {
                query = query.Where(l => l.ExteriorFeatures.Any(f => f.FeatureType == feature));
            }
        }

        // Sıralama
        query = searchDto.SortBy switch
        {
            ListingSortBy.Newest => searchDto.SortDescending 
                ? query.OrderByDescending(l => l.CreatedAt) 
                : query.OrderBy(l => l.CreatedAt),
            ListingSortBy.Oldest => searchDto.SortDescending 
                ? query.OrderBy(l => l.CreatedAt) 
                : query.OrderByDescending(l => l.CreatedAt),
            ListingSortBy.PriceAsc => query.OrderBy(l => l.Price),
            ListingSortBy.PriceDesc => query.OrderByDescending(l => l.Price),
            ListingSortBy.MostViewed => query.OrderByDescending(l => l.ViewCount),
            ListingSortBy.MostFavorited => query.OrderByDescending(l => l.FavoriteCount),
            _ => query.OrderByDescending(l => l.CreatedAt)
        };

        var totalCount = await query.CountAsync();
        var listings = await query
            .Skip((searchDto.Page - 1) * searchDto.PageSize)
            .Take(searchDto.PageSize)
            .ToListAsync();

        return (listings, totalCount);
    }

    public async Task<(List<Models.Listing> Listings, int TotalCount)> GetForAdminAsync(AdminListingFilterDto filter)
    {
        var query = _context.Listings
            .Include(l => l.Images.Where(i => i.IsCoverImage))
            .Include(l => l.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim();
            var termLower = term.ToLower();
            
            // İlan numarası tam eşleşmesi kontrolü (benzersiz)
            // İlan numarası genellikle sadece rakamlardan oluşur (9 haneli)
            if (term.All(char.IsDigit) && term.Length >= 6)
            {
                // Tam eşleşme varsa sadece o ilanı döndür (sadece Pending olanları)
                var exactMatch = await _context.Listings
                    .Include(l => l.Images.Where(i => i.IsCoverImage))
                    .Include(l => l.User)
                    .FirstOrDefaultAsync(l => l.ListingNumber == term && l.Status == ListingStatus.Pending);
                    
                if (exactMatch != null)
                {
                    return (new List<Models.Listing> { exactMatch }, 1);
                }
                // Eğer tam eşleşme varsa ama Pending değilse, boş liste döndür
                return (new List<Models.Listing>(), 0);
            }
            
            // Tam eşleşme yoksa normal arama yap
            query = query.Where(l =>
                l.ListingNumber.ToLower().Contains(termLower) ||
                l.Title.ToLower().Contains(termLower) ||
                l.Description.ToLower().Contains(termLower) ||
                l.City.ToLower().Contains(termLower) ||
                l.District.ToLower().Contains(termLower) ||
                (l.User != null && l.User.Email != null && l.User.Email.ToLower().Contains(termLower)));
        }

        // Varsayılan olarak sadece Pending (onay bekleyen) ilanları göster
        // Eğer statuses filtresi belirtilmişse onu kullan, yoksa sadece Pending göster
        if (filter.Statuses != null && filter.Statuses.Any())
        {
            query = query.Where(l => filter.Statuses.Contains(l.Status));
        }
        else
        {
            // Statuses filtresi yoksa, sadece Pending ilanları göster
            query = query.Where(l => l.Status == ListingStatus.Pending);
        }

        if (!string.IsNullOrWhiteSpace(filter.City))
        {
            var city = filter.City.ToLower();
            query = query.Where(l => l.City.ToLower() == city);
        }

        if (!string.IsNullOrWhiteSpace(filter.District))
        {
            var district = filter.District.ToLower();
            query = query.Where(l => l.District.ToLower() == district);
        }

        if (!string.IsNullOrWhiteSpace(filter.OwnerEmail))
        {
            var ownerEmail = filter.OwnerEmail.ToLower();
            query = query.Where(l => l.User != null && l.User.Email != null && l.User.Email.ToLower() == ownerEmail);
        }

        if (filter.Type.HasValue)
        {
            query = query.Where(l => l.Type == filter.Type.Value);
        }

        if (filter.Category.HasValue)
        {
            query = query.Where(l => l.Category == filter.Category.Value);
        }

        query = query.OrderByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync();
        var listings = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        return (listings, totalCount);
    }

    public async Task<(List<Models.Listing> Listings, int TotalCount)> GetByUserIdAsync(string userId, int page, int pageSize)
    {
        var query = _context.Listings
            .Where(l => l.UserId == userId)
            .Include(l => l.Images.Where(i => i.IsCoverImage))
            .OrderByDescending(l => l.CreatedAt);

        var totalCount = await query.CountAsync();
        var listings = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (listings, totalCount);
    }

    public async Task<List<Models.Listing>> GetFeaturedAsync(int count)
    {
        return await _context.Listings
            .Where(l => l.Status == ListingStatus.Active && l.IsFeatured)
            .Include(l => l.Images.Where(i => i.IsCoverImage))
            .OrderByDescending(l => l.CreatedAt)
            .Take(count)
            .ToListAsync();
    }

    public async Task<List<Models.Listing>> GetLatestAsync(int count)
    {
        return await _context.Listings
            .Where(l => l.Status == ListingStatus.Active)
            .Include(l => l.Images.Where(i => i.IsCoverImage))
            .OrderByDescending(l => l.CreatedAt)
            .Take(count)
            .ToListAsync();
    }

    public async Task<List<Models.Listing>> GetSimilarAsync(int listingId, int count)
    {
        var listing = await _context.Listings.FindAsync(listingId);
        if (listing == null) return new List<Models.Listing>();

        return await _context.Listings
            .Where(l => l.Status == ListingStatus.Active && 
                        l.Id != listingId &&
                        l.Category == listing.Category &&
                        l.Type == listing.Type &&
                        l.City == listing.City)
            .Include(l => l.Images.Where(i => i.IsCoverImage))
            .OrderByDescending(l => l.CreatedAt)
            .Take(count)
            .ToListAsync();
    }

    // ============================================================================
    // İLAN DURUMU
    // ============================================================================

    public async Task<bool> UpdateStatusAsync(int listingId, ListingStatus status, string? rejectionReason = null)
    {
        var listing = await _context.Listings.FindAsync(listingId);
        if (listing == null) return false;

        listing.Status = status;
        listing.UpdatedAt = DateTime.UtcNow;

        if (status == ListingStatus.Active && listing.PublishedAt == null)
        {
            listing.PublishedAt = DateTime.UtcNow;
        }

        // Reddedilme durumunda RejectionReason ve RejectedAt set et
        if (status == ListingStatus.Rejected)
        {
            listing.RejectionReason = rejectionReason;
            listing.RejectedAt = DateTime.UtcNow;
        }
        // Pending'e geri dönüldüğünde (reopen) reddedilme bilgilerini temizle
        else if (status == ListingStatus.Pending)
        {
            listing.RejectionReason = null;
            listing.RejectedAt = null;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task IncrementViewCountAsync(int listingId)
    {
        var listing = await _context.Listings.FindAsync(listingId);
        if (listing != null)
        {
            listing.ViewCount++;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<string> GenerateListingNumberAsync()
    {
        var random = new Random();
        string listingNumber;
        int maxAttempts = 100; // Maksimum deneme sayısı
        int attempt = 0;
        
        do
        {
            attempt++;
            // Format: 123456789 (9 haneli)
            listingNumber = random.Next(100000000, 999999999).ToString();
            
            // Eğer maksimum deneme sayısına ulaşıldıysa, timestamp ekleyerek benzersizlik sağla
            if (attempt >= maxAttempts)
            {
                var timestamp = DateTime.UtcNow.Ticks % 1000000000; // Son 9 haneyi al
                listingNumber = timestamp.ToString().PadLeft(9, '0');
                // Hala varsa, GUID'in son 9 karakterini kullan
                if (await _context.Listings.AnyAsync(l => l.ListingNumber == listingNumber))
                {
                    var guidPart = Guid.NewGuid().ToString("N").Substring(0, 9);
                    listingNumber = guidPart;
                }
                break;
            }
        } 
        while (await _context.Listings.AnyAsync(l => l.ListingNumber == listingNumber));

        return listingNumber;
    }

    // ============================================================================
    // GÖRSEL İŞLEMLERİ
    // ============================================================================

    public async Task<ListingImage> AddImageAsync(ListingImage image)
    {
        image.UploadedAt = DateTime.UtcNow;
        
        // Eğer kapak fotoğrafı olarak işaretlenmişse, diğerlerini kaldır
        if (image.IsCoverImage)
        {
            var existingCovers = await _context.ListingImages
                .Where(i => i.ListingId == image.ListingId && i.IsCoverImage)
                .ToListAsync();
            
            foreach (var cover in existingCovers)
            {
                cover.IsCoverImage = false;
            }
        }

        await _context.ListingImages.AddAsync(image);
        await _context.SaveChangesAsync();
        
        return image;
    }

    public async Task<bool> DeleteImageAsync(int imageId)
    {
        var image = await _context.ListingImages.FindAsync(imageId);
        if (image == null) return false;

        _context.ListingImages.Remove(image);
        await _context.SaveChangesAsync();
        
        return true;
    }

    public async Task<bool> SetCoverImageAsync(int listingId, int imageId)
    {
        var images = await _context.ListingImages
            .Where(i => i.ListingId == listingId)
            .ToListAsync();

        foreach (var image in images)
        {
            image.IsCoverImage = image.Id == imageId;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<ListingImage>> GetImagesAsync(int listingId)
    {
        return await _context.ListingImages
            .Where(i => i.ListingId == listingId)
            .OrderBy(i => i.DisplayOrder)
            .ToListAsync();
    }

    // ============================================================================
    // ÖZELLİK İŞLEMLERİ
    // ============================================================================

    public async Task UpdateInteriorFeaturesAsync(int listingId, List<InteriorFeatureType> features)
    {
        // Mevcut özellikleri sil
        var existingFeatures = await _context.Set<ListingInteriorFeature>()
            .Where(f => f.ListingId == listingId)
            .ToListAsync();
        
        _context.RemoveRange(existingFeatures);

        // Yeni özellikleri ekle
        var newFeatures = features.Select(f => new ListingInteriorFeature
        {
            ListingId = listingId,
            FeatureType = f
        });

        await _context.AddRangeAsync(newFeatures);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateExteriorFeaturesAsync(int listingId, List<ExteriorFeatureType> features)
    {
        // Mevcut özellikleri sil
        var existingFeatures = await _context.Set<ListingExteriorFeature>()
            .Where(f => f.ListingId == listingId)
            .ToListAsync();
        
        _context.RemoveRange(existingFeatures);

        // Yeni özellikleri ekle
        var newFeatures = features.Select(f => new ListingExteriorFeature
        {
            ListingId = listingId,
            FeatureType = f
        });

        await _context.AddRangeAsync(newFeatures);
        await _context.SaveChangesAsync();
    }

    // ============================================================================
    // KONTROL İŞLEMLERİ
    // ============================================================================

    public async Task<bool> IsOwnerAsync(int listingId, string userId)
    {
        return await _context.Listings
            .AnyAsync(l => l.Id == listingId && l.UserId == userId);
    }

    public async Task<bool> ExistsAsync(int listingId)
    {
        return await _context.Listings.AnyAsync(l => l.Id == listingId);
    }
}
