using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateAPI.Models;

/// <summary>
/// İlan Yorumu Modeli
/// 
/// Kullanıcıların ilanlara yaptığı yorumları yönetir.
/// Yorum yapan kullanıcı ve ilan ilişkisi tutulur.
/// </summary>
public class ListingComment
{
    /// <summary>
    /// Yorum ID'si
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
    /// Yorum yapan kullanıcı ID'si
    /// </summary>
    [Required]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Yorum yapan kullanıcı (Navigation Property)
    /// </summary>
    [ForeignKey("UserId")]
    public virtual ApplicationUser? User { get; set; }

    /// <summary>
    /// Yorum içeriği
    /// </summary>
    [Required(ErrorMessage = "Yorum içeriği zorunludur")]
    [StringLength(1000, MinimumLength = 5, ErrorMessage = "Yorum 5-1000 karakter arasında olmalıdır")]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Üst yorum ID'si (Yanıtlar için)
    /// </summary>
    public int? ParentCommentId { get; set; }

    /// <summary>
    /// Üst yorum referansı (Navigation Property)
    /// </summary>
    [ForeignKey("ParentCommentId")]
    public virtual ListingComment? ParentComment { get; set; }

    /// <summary>
    /// Alt yorumlar (Yanıtlar)
    /// </summary>
    public virtual ICollection<ListingComment> Replies { get; set; } = new List<ListingComment>();

    /// <summary>
    /// Yorum oluşturulma tarihi
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Yorum güncellenme tarihi
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Yorum aktif mi? (Soft delete için)
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Yorum düzenlendi mi?
    /// </summary>
    public bool IsEdited { get; set; } = false;
}
