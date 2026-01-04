using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;

namespace RealEstateAPI.Repositories.Listing;

/// <summary>
/// İlan Repository Interface
/// 
/// İlan ile ilgili veritabanı işlemleri için arayüz.
/// SOLID - Interface Segregation prensibine uygun.
/// </summary>
public interface IListingRepository
{
    // ============================================================================
    // İLAN CRUD İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Yeni ilan oluştur
    /// </summary>
    Task<Models.Listing> CreateAsync(Models.Listing listing);

    /// <summary>
    /// İlan güncelle
    /// </summary>
    Task<Models.Listing> UpdateAsync(Models.Listing listing);

    /// <summary>
    /// İlan sil (Soft delete)
    /// </summary>
    Task<bool> DeleteAsync(int listingId);

    /// <summary>
    /// İlan ID'ye göre getir
    /// </summary>
    Task<Models.Listing?> GetByIdAsync(int listingId);

    /// <summary>
    /// İlan numarasına göre getir
    /// </summary>
    Task<Models.Listing?> GetByListingNumberAsync(string listingNumber);

    /// <summary>
    /// İlan detayları ile birlikte getir (Images, Features dahil)
    /// </summary>
    Task<Models.Listing?> GetByIdWithDetailsAsync(int listingId);

    // ============================================================================
    // İLAN LİSTELEME & ARAMA
    // ============================================================================

    /// <summary>
    /// Tüm ilanları listele (Sayfalama ile)
    /// </summary>
    Task<(List<Models.Listing> Listings, int TotalCount)> GetAllAsync(int page, int pageSize);

    /// <summary>
    /// Filtreleme ve arama ile ilanları getir
    /// </summary>
    Task<(List<Models.Listing> Listings, int TotalCount)> SearchAsync(ListingSearchDto searchDto);

    /// <summary>
    /// Kullanıcının ilanlarını getir
    /// </summary>
    Task<(List<Models.Listing> Listings, int TotalCount)> GetByUserIdAsync(string userId, int page, int pageSize);

    /// <summary>
    /// Öne çıkan ilanları getir
    /// </summary>
    Task<List<Models.Listing>> GetFeaturedAsync(int count);

    /// <summary>
    /// Son eklenen ilanları getir
    /// </summary>
    Task<List<Models.Listing>> GetLatestAsync(int count);

    /// <summary>
    /// Benzer ilanları getir
    /// </summary>
    Task<List<Models.Listing>> GetSimilarAsync(int listingId, int count);

    /// <summary>
    /// Admin paneli için ilan listesi (tüm durumlar)
    /// </summary>
    Task<(List<Models.Listing> Listings, int TotalCount)> GetForAdminAsync(AdminListingFilterDto filter);

    // ============================================================================
    // İLAN DURUMU
    // ============================================================================

    /// <summary>
    /// İlan durumunu güncelle
    /// </summary>
    Task<bool> UpdateStatusAsync(int listingId, ListingStatus status, string? rejectionReason = null);

    /// <summary>
    /// Görüntülenme sayısını artır
    /// </summary>
    Task IncrementViewCountAsync(int listingId);

    /// <summary>
    /// İlan numarası oluştur (Benzersiz)
    /// </summary>
    Task<string> GenerateListingNumberAsync();

    // ============================================================================
    // GÖRSEL İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// İlana görsel ekle
    /// </summary>
    Task<ListingImage> AddImageAsync(ListingImage image);

    /// <summary>
    /// Görsel sil
    /// </summary>
    Task<bool> DeleteImageAsync(int imageId);

    /// <summary>
    /// Kapak fotoğrafını değiştir
    /// </summary>
    Task<bool> SetCoverImageAsync(int listingId, int imageId);

    /// <summary>
    /// İlanın görsellerini getir
    /// </summary>
    Task<List<ListingImage>> GetImagesAsync(int listingId);

    // ============================================================================
    // ÖZELLİK İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// İç özellikleri güncelle
    /// </summary>
    Task UpdateInteriorFeaturesAsync(int listingId, List<InteriorFeatureType> features);

    /// <summary>
    /// Dış özellikleri güncelle
    /// </summary>
    Task UpdateExteriorFeaturesAsync(int listingId, List<ExteriorFeatureType> features);

    // ============================================================================
    // KONTROL İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// İlan sahibi mi kontrol et
    /// </summary>
    Task<bool> IsOwnerAsync(int listingId, string userId);

    /// <summary>
    /// Kullanıcının tüm ilanlarının durumunu güncelle
    /// </summary>
    Task<bool> UpdateUserListingsStatusAsync(string userId, ListingStatus status);

    /// <summary>
    /// İlan var mı kontrol et
    /// </summary>
    Task<bool> ExistsAsync(int listingId);
}
