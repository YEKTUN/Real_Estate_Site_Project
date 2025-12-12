using RealEstateAPI.Models;

namespace RealEstateAPI.Repositories.Listing;

/// <summary>
/// Favori Repository Interface
/// 
/// Favori işlemleri için veritabanı arayüzü.
/// </summary>
public interface IFavoriteRepository
{
    // ============================================================================
    // FAVORİ CRUD İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Favorilere ekle
    /// </summary>
    Task<FavoriteListing> AddAsync(FavoriteListing favorite);

    /// <summary>
    /// Favorilerden kaldır
    /// </summary>
    Task<bool> RemoveAsync(string userId, int listingId);

    /// <summary>
    /// Favori notunu güncelle
    /// </summary>
    Task<FavoriteListing?> UpdateNoteAsync(string userId, int listingId, string? note);

    // ============================================================================
    // FAVORİ LİSTELEME
    // ============================================================================

    /// <summary>
    /// Kullanıcının favorilerini getir
    /// </summary>
    Task<(List<FavoriteListing> Favorites, int TotalCount)> GetByUserIdAsync(string userId, int page, int pageSize);

    /// <summary>
    /// Favori ID'ye göre getir
    /// </summary>
    Task<FavoriteListing?> GetAsync(string userId, int listingId);

    // ============================================================================
    // KONTROL İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Favori mi kontrol et
    /// </summary>
    Task<bool> IsFavoritedAsync(string userId, int listingId);

    /// <summary>
    /// İlanın favori sayısını getir
    /// </summary>
    Task<int> GetFavoriteCountAsync(int listingId);

    /// <summary>
    /// Kullanıcının favori ID'lerini getir
    /// </summary>
    Task<List<int>> GetUserFavoriteIdsAsync(string userId);
}
