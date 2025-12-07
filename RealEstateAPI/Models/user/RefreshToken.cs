using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateAPI.Models;

/**
 * Refresh Token Model
 * 
 * JWT Access Token yenilemek için kullanılan token.
 * Veritabanında saklanır ve kullanıcıya bağlıdır.
 */
public class RefreshToken
{
    /// <summary>
    /// Refresh Token benzersiz kimliği
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Token değeri (GUID)
    /// </summary>
    [Required]
    [StringLength(500)]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// Token oluşturulma tarihi
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Token son kullanma tarihi
    /// </summary>
    public DateTime ExpiresAt { get; set; }

    /// <summary>
    /// Token iptal edildi mi?
    /// </summary>
    public bool IsRevoked { get; set; } = false;

    /// <summary>
    /// Token kullanıldı mı? (Bir kez kullanılabilir)
    /// </summary>
    public bool IsUsed { get; set; } = false;

    /// <summary>
    /// Token'ın oluşturulduğu IP adresi
    /// </summary>
    [StringLength(50)]
    public string? CreatedByIp { get; set; }

    /// <summary>
    /// Token iptal edildiğinde IP adresi
    /// </summary>
    [StringLength(50)]
    public string? RevokedByIp { get; set; }

    /// <summary>
    /// Token iptal tarihi
    /// </summary>
    public DateTime? RevokedAt { get; set; }

    /// <summary>
    /// Bu token yerine oluşturulan yeni token
    /// </summary>
    [StringLength(500)]
    public string? ReplacedByToken { get; set; }

    /// <summary>
    /// Kullanıcı ID'si (Foreign Key)
    /// </summary>
    [Required]
    public string UserId { get; set; } = string.Empty;

    /// <summary>
    /// Kullanıcı (Navigation Property)
    /// </summary>
    [ForeignKey("UserId")]
    public virtual ApplicationUser? User { get; set; }

    /// <summary>
    /// Token geçerli mi?
    /// </summary>
    public bool IsActive => !IsRevoked && !IsUsed && DateTime.UtcNow < ExpiresAt;
}
