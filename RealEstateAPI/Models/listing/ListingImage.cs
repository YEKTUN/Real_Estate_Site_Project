using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateAPI.Models;

/// <summary>
/// İlan Görseli Modeli
/// 
/// Bir ilana ait görsellerin yönetimi için kullanılır.
/// Kapak fotoğrafı, sıralama ve alternatif metin destekler.
/// </summary>
public class ListingImage
{
    /// <summary>
    /// Görsel ID'si
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// İlan ID'si (Foreign Key)
    /// </summary>
    [Required]
    public int ListingId { get; set; }

    /// <summary>
    /// İlan referansı (Navigation Property)
    /// </summary>
    [ForeignKey("ListingId")]
    public virtual Listing? Listing { get; set; }

    /// <summary>
    /// Görsel URL'i
    /// </summary>
    [Required]
    [StringLength(500)]
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>
    /// Küçük boyutlu görsel URL'i (Thumbnail)
    /// </summary>
    [StringLength(500)]
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Alternatif metin (SEO ve erişilebilirlik için)
    /// </summary>
    [StringLength(200)]
    public string? AltText { get; set; }

    /// <summary>
    /// Kapak fotoğrafı mı?
    /// </summary>
    public bool IsCoverImage { get; set; } = false;

    /// <summary>
    /// Sıralama (Görsellerin gösterim sırası)
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// Dosya boyutu (byte)
    /// </summary>
    public long? FileSize { get; set; }

    /// <summary>
    /// Görsel genişliği (pixel)
    /// </summary>
    public int? Width { get; set; }

    /// <summary>
    /// Görsel yüksekliği (pixel)
    /// </summary>
    public int? Height { get; set; }

    /// <summary>
    /// Yükleme tarihi
    /// </summary>
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
