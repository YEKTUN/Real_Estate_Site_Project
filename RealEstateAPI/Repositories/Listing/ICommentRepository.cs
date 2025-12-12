using RealEstateAPI.Models;

namespace RealEstateAPI.Repositories.Listing;

/// <summary>
/// Yorum Repository Interface
/// 
/// Yorum işlemleri için veritabanı arayüzü.
/// </summary>
public interface ICommentRepository
{
    // ============================================================================
    // YORUM CRUD İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Yorum oluştur
    /// </summary>
    Task<ListingComment> CreateAsync(ListingComment comment);

    /// <summary>
    /// Yorum güncelle
    /// </summary>
    Task<ListingComment> UpdateAsync(ListingComment comment);

    /// <summary>
    /// Yorum sil (Soft delete)
    /// </summary>
    Task<bool> DeleteAsync(int commentId);

    /// <summary>
    /// Yorum ID'ye göre getir
    /// </summary>
    Task<ListingComment?> GetByIdAsync(int commentId);

    // ============================================================================
    // YORUM LİSTELEME
    // ============================================================================

    /// <summary>
    /// İlanın yorumlarını getir (Ana yorumlar ve yanıtları ile)
    /// </summary>
    Task<List<ListingComment>> GetByListingIdAsync(int listingId);

    /// <summary>
    /// Kullanıcının yorumlarını getir
    /// </summary>
    Task<List<ListingComment>> GetByUserIdAsync(string userId);

    /// <summary>
    /// İlanın yorum sayısını getir
    /// </summary>
    Task<int> GetCommentCountAsync(int listingId);

    // ============================================================================
    // KONTROL İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Yorum sahibi mi kontrol et
    /// </summary>
    Task<bool> IsOwnerAsync(int commentId, string userId);

    /// <summary>
    /// Yorum var mı kontrol et
    /// </summary>
    Task<bool> ExistsAsync(int commentId);
}
