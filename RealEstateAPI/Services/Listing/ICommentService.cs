using RealEstateAPI.DTOs.Listing;

namespace RealEstateAPI.Services.Listing;

/// <summary>
/// Yorum Service Interface
/// 
/// Yorum iş mantığı için arayüz.
/// </summary>
public interface ICommentService
{
    // ============================================================================
    // YORUM CRUD İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Yorum ekle
    /// </summary>
    Task<CommentResponseDto> CreateAsync(int listingId, CreateCommentDto dto, string userId);

    /// <summary>
    /// Yorum güncelle
    /// </summary>
    Task<CommentResponseDto> UpdateAsync(int commentId, UpdateCommentDto dto, string userId);

    /// <summary>
    /// Yorum sil
    /// </summary>
    Task<CommentResponseDto> DeleteAsync(int commentId, string userId);

    // ============================================================================
    // YORUM LİSTELEME
    // ============================================================================

    /// <summary>
    /// İlanın yorumlarını getir
    /// </summary>
    Task<CommentListResponseDto> GetByListingIdAsync(int listingId, string? userId = null);

    /// <summary>
    /// Kullanıcının yorumlarını getir
    /// </summary>
    Task<CommentListResponseDto> GetMyCommentsAsync(string userId);
}
