using RealEstateAPI.DTOs.Listing;

namespace RealEstateAPI.Services.Listing;

/// <summary>
/// Favori Service Interface
/// 
/// Favori iş mantığı için arayüz.
/// </summary>
public interface IFavoriteService
{
    // ============================================================================
    // FAVORİ İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Favorilere ekle
    /// </summary>
    Task<FavoriteResponseDto> AddToFavoritesAsync(int listingId, AddFavoriteDto? dto, string userId);

    /// <summary>
    /// Favorilerden kaldır
    /// </summary>
    Task<FavoriteResponseDto> RemoveFromFavoritesAsync(int listingId, string userId);

    /// <summary>
    /// Favori toggle (varsa kaldır, yoksa ekle)
    /// </summary>
    Task<FavoriteResponseDto> ToggleFavoriteAsync(int listingId, string userId);

    /// <summary>
    /// Favori notunu güncelle
    /// </summary>
    Task<FavoriteResponseDto> UpdateNoteAsync(int listingId, UpdateFavoriteNoteDto dto, string userId);

    // ============================================================================
    // FAVORİ LİSTELEME
    // ============================================================================

    /// <summary>
    /// Kullanıcının favorilerini getir
    /// </summary>
    Task<FavoriteListResponseDto> GetMyFavoritesAsync(string userId, int page = 1, int pageSize = 20);

    /// <summary>
    /// Favori mi kontrol et
    /// </summary>
    Task<bool> IsFavoritedAsync(int listingId, string userId);
}
