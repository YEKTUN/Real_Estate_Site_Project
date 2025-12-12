using System.ComponentModel.DataAnnotations;

namespace RealEstateAPI.DTOs.Listing;

// ============================================================================
// FAVORİ DTO'LARI
// ============================================================================

/// <summary>
/// Favori İlan DTO
/// </summary>
public class FavoriteListingDto
{
    public int Id { get; set; }
    public int ListingId { get; set; }
    public ListingListDto Listing { get; set; } = new();
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Favoriye Ekleme DTO
/// </summary>
public class AddFavoriteDto
{
    [StringLength(500, ErrorMessage = "Not en fazla 500 karakter olabilir")]
    public string? Note { get; set; }
}

/// <summary>
/// Favori Not Güncelleme DTO
/// </summary>
public class UpdateFavoriteNoteDto
{
    [StringLength(500, ErrorMessage = "Not en fazla 500 karakter olabilir")]
    public string? Note { get; set; }
}
