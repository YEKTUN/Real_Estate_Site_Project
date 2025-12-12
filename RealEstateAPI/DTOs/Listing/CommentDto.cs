using System.ComponentModel.DataAnnotations;

namespace RealEstateAPI.DTOs.Listing;

// ============================================================================
// YORUM DTO'LARI
// ============================================================================

/// <summary>
/// Yorum Listesi için DTO
/// </summary>
public class CommentDto
{
    public int Id { get; set; }
    public int ListingId { get; set; }
    public string Content { get; set; } = string.Empty;
    public CommentUserDto User { get; set; } = new();
    public int? ParentCommentId { get; set; }
    public List<CommentDto> Replies { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsEdited { get; set; }
    public bool IsOwner { get; set; } // Giriş yapmış kullanıcının yorumu mu?
}

/// <summary>
/// Yorum Yapan Kullanıcı DTO
/// </summary>
public class CommentUserDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
}

/// <summary>
/// Yorum Oluşturma DTO
/// </summary>
public class CreateCommentDto
{
    [Required(ErrorMessage = "Yorum içeriği zorunludur")]
    [StringLength(1000, MinimumLength = 5, ErrorMessage = "Yorum 5-1000 karakter arasında olmalıdır")]
    public string Content { get; set; } = string.Empty;

    /// <summary>
    /// Yanıt olarak yazılıyorsa üst yorum ID'si
    /// </summary>
    public int? ParentCommentId { get; set; }
}

/// <summary>
/// Yorum Güncelleme DTO
/// </summary>
public class UpdateCommentDto
{
    [Required(ErrorMessage = "Yorum içeriği zorunludur")]
    [StringLength(1000, MinimumLength = 5, ErrorMessage = "Yorum 5-1000 karakter arasında olmalıdır")]
    public string Content { get; set; } = string.Empty;
}
