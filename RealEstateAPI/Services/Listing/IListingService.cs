using RealEstateAPI.DTOs.Listing;

namespace RealEstateAPI.Services.Listing;

/// <summary>
/// İlan Service Interface
/// 
/// İlan iş mantığı için arayüz.
/// SOLID - Interface Segregation prensibine uygun.
/// </summary>
public interface IListingService
{
    // ============================================================================
    // İLAN CRUD İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Yeni ilan oluştur
    /// </summary>
    Task<ListingResponseDto> CreateAsync(CreateListingDto dto, string userId);

    /// <summary>
    /// İlan güncelle
    /// </summary>
    Task<ListingResponseDto> UpdateAsync(int listingId, UpdateListingDto dto, string userId);

    /// <summary>
    /// İlan sil
    /// </summary>
    Task<ListingResponseDto> DeleteAsync(int listingId, string userId);

    /// <summary>
    /// İlan detayı getir
    /// </summary>
    Task<ListingResponseDto> GetByIdAsync(int listingId, string? userId = null);

    /// <summary>
    /// İlan numarasına göre getir
    /// </summary>
    Task<ListingResponseDto> GetByListingNumberAsync(string listingNumber, string? userId = null);

    // ============================================================================
    // İLAN LİSTELEME & ARAMA
    // ============================================================================

    /// <summary>
    /// Tüm ilanları listele
    /// </summary>
    Task<ListingListResponseDto> GetAllAsync(int page = 1, int pageSize = 20);

    /// <summary>
    /// İlan ara ve filtrele
    /// </summary>
    Task<ListingListResponseDto> SearchAsync(ListingSearchDto searchDto);

    /// <summary>
    /// Kullanıcının ilanlarını getir
    /// </summary>
    Task<ListingListResponseDto> GetMyListingsAsync(string userId, int page = 1, int pageSize = 20);

    /// <summary>
    /// Öne çıkan ilanları getir
    /// </summary>
    Task<ListingListResponseDto> GetFeaturedAsync(int count = 10);

    /// <summary>
    /// Son eklenen ilanları getir
    /// </summary>
    Task<ListingListResponseDto> GetLatestAsync(int count = 10);

    /// <summary>
    /// Admin paneli için ilan listesi
    /// </summary>
    Task<ListingListResponseDto> GetForAdminAsync(AdminListingFilterDto filter);

    /// <summary>
    /// Benzer ilanları getir
    /// </summary>
    Task<ListingListResponseDto> GetSimilarAsync(int listingId, int count = 6);

    // ============================================================================
    // İLAN DURUMU
    // ============================================================================

    /// <summary>
    /// İlan durumunu güncelle
    /// </summary>
    Task<ListingResponseDto> UpdateStatusAsync(int listingId, Models.ListingStatus status, string userId);

    /// <summary>
    /// Admin olarak ilan durumunu güncelle
    /// </summary>
    Task<ListingResponseDto> UpdateStatusAsAdminAsync(int listingId, Models.ListingStatus status, string adminUserId, string? note = null, bool autoApprove = false);

    // ============================================================================
    // GÖRSEL İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// İlana görsel ekle
    /// </summary>
    Task<ImageResponseDto> AddImageAsync(int listingId, UploadImageDto dto, string userId);

    /// <summary>
    /// Görsel sil
    /// </summary>
    Task<ImageResponseDto> DeleteImageAsync(int listingId, int imageId, string userId);

    /// <summary>
    /// Kapak fotoğrafını değiştir
    /// </summary>
    Task<ImageResponseDto> SetCoverImageAsync(int listingId, int imageId, string userId);

    /// <summary>
    /// İlanın görsellerini getir
    /// </summary>
    Task<ImageListResponseDto> GetImagesAsync(int listingId);
}
