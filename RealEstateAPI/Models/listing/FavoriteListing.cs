using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateAPI.Models;

/// <summary>
/// Favori İlan Modeli
/// 
/// Kullanıcıların favori ilanlarını takip etmek için kullanılır.
/// Many-to-Many ilişkisi için ara tablo.
/// </summary>
public class FavoriteListing
{
    /// <summary>
    /// Favori ID'si
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Kullanıcı ID'si
    /// </summary>
    [Required]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Kullanıcı referansı (Navigation Property)
    /// </summary>
    [ForeignKey("UserId")]
    public virtual ApplicationUser? User { get; set; }

    /// <summary>
    /// İlan ID'si
    /// </summary>
    [Required]
    public int ListingId { get; set; }

    /// <summary>
    /// İlan referansı (Navigation Property)
    /// </summary>
    [ForeignKey("ListingId")]
    public virtual Listing? Listing { get; set; }

    /// <summary>
    /// Favorilere eklenme tarihi
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Not (Kullanıcının ilanla ilgili özel notu)
    /// </summary>
    [StringLength(500)]
    public string? Note { get; set; }
}
