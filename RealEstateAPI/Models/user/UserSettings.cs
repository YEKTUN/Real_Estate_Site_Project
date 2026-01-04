using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RealEstateAPI.Models;

/**
 * Kullanıcı Ayarları
 * 
 * Bildirim ve gizlilik tercihleri.
 */
public class UserSettings
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UserId { get; set; } = string.Empty;

    [ForeignKey("UserId")]
    public virtual ApplicationUser? User { get; set; }

    // ============================================================================
    // BİLDİRİM AYARLARI
    // ============================================================================

    public bool EmailNotifications { get; set; } = true;
    public bool SmsNotifications { get; set; } = false;
    public bool PushNotifications { get; set; } = true;
    public bool NewListingNotifications { get; set; } = true;
    public bool PriceDropNotifications { get; set; } = true;
    public bool MessageNotifications { get; set; } = true;

    // ============================================================================
    // GİZLİLİK AYARLARI
    // ============================================================================

    public bool ShowPhone { get; set; } = false;
    public bool ShowEmail { get; set; } = true;
    public bool ProfileVisible { get; set; } = true;
}
