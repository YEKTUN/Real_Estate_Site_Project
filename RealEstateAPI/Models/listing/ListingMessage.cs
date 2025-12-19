using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateAPI.Models;

/// <summary>
/// İlan mesajı (metin veya fiyat teklifi)
/// </summary>
public class ListingMessage
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ThreadId { get; set; }

    [Required]
    public string SenderId { get; set; } = string.Empty;

    [Required]
    [StringLength(1000)]
    public string Content { get; set; } = string.Empty;

    /// <summary>Teklif fiyatı opsiyonel</summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal? OfferPrice { get; set; }

    /// <summary>Mesaj teklif içeriyor mu</summary>
    public bool IsOffer { get; set; }

    /// <summary>Opsiyonel ek dosya URL'i (Cloudinary vb.)</summary>
    [StringLength(500)]
    public string? AttachmentUrl { get; set; }

    /// <summary>Ek dosya tipi (image/video/document)</summary>
    [StringLength(50)]
    public string? AttachmentType { get; set; }

    /// <summary>Ek dosya adı</summary>
    [StringLength(200)]
    public string? AttachmentFileName { get; set; }

    /// <summary>Ek dosya boyutu (byte)</summary>
    public long? AttachmentFileSize { get; set; }

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual ListingMessageThread Thread { get; set; } = null!;

    [ForeignKey(nameof(SenderId))]
    public virtual ApplicationUser Sender { get; set; } = null!;
}

