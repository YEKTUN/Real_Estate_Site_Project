using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateAPI.Models;

/// <summary>
/// İlan mesajlaşma kanalı (satıcı - alıcı arası)
/// </summary>
public class ListingMessageThread
{
    [Key]
    public int Id { get; set; }

    /// <summary>İlgili ilan</summary>
    [Required]
    public int ListingId { get; set; }

    /// <summary>İlan sahibi</summary>
    [Required]
    public string SellerId { get; set; } = string.Empty;

    /// <summary>Mesajı başlatan/alıcı</summary>
    [Required]
    public string BuyerId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastMessageAt { get; set; }

    /// <summary>Buyer tarafından silindi mi?</summary>
    public bool DeletedByBuyer { get; set; } = false;

    /// <summary>Seller tarafından silindi mi?</summary>
    public bool DeletedBySeller { get; set; } = false;

    // Navigation
    public virtual Listing Listing { get; set; } = null!;

    [ForeignKey(nameof(SellerId))]
    public virtual ApplicationUser Seller { get; set; } = null!;

    [ForeignKey(nameof(BuyerId))]
    public virtual ApplicationUser Buyer { get; set; } = null!;

    public virtual ICollection<ListingMessage> Messages { get; set; } = new List<ListingMessage>();
}

