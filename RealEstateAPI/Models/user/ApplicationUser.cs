using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace RealEstateAPI.Models;

/**
 * Application User
 * 
 * ASP.NET Identity ile entegre kullanıcı modeli.
 * Login ve Register işlemleri için kullanılır.
 * 
 * Özellikler: Name, Surname, Phone, Email, Password
 */
public class ApplicationUser : IdentityUser
{
    /// <summary>
    /// Kullanıcının adı
    /// </summary>
    [Required(ErrorMessage = "Ad zorunludur")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Ad 2-50 karakter arasında olmalıdır")]
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Kullanıcının soyadı
    /// </summary>
    [Required(ErrorMessage = "Soyad zorunludur")]
    [StringLength(50, MinimumLength = 2, ErrorMessage = "Soyad 2-50 karakter arasında olmalıdır")]
    public string Surname { get; set; } = string.Empty;

    /// <summary>
    /// Kullanıcının telefon numarası
    /// </summary>
    [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz")]
    [StringLength(20, ErrorMessage = "Telefon numarası en fazla 20 karakter olabilir")]
    public string? Phone { get; set; }

    /// <summary>
    /// Hesap oluşturulma tarihi
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Son güncelleme tarihi
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    // ============================================================================
    // GOOGLE OAUTH FIELDS
    // ============================================================================

    /// <summary>
    /// Google OAuth ile giriş yapan kullanıcının Google ID'si
    /// Null ise kullanıcı normal email/şifre ile kayıt olmuştur
    /// </summary>
    [StringLength(100)]
    public string? GoogleId { get; set; }

    /// <summary>
    /// Google profil fotoğrafı URL'i
    /// </summary>
    [StringLength(500)]
    public string? ProfilePictureUrl { get; set; }

    /// <summary>
    /// Kullanıcı Google ile mi giriş yaptı?
    /// </summary>
    public bool IsGoogleUser => !string.IsNullOrEmpty(GoogleId);

    // ============================================================================
    // İLAN İLİŞKİLERİ
    // ============================================================================

    /// <summary>
    /// Kullanıcının yayınladığı ilanlar
    /// </summary>
    public virtual ICollection<Listing> Listings { get; set; } = new List<Listing>();

    /// <summary>
    /// Kullanıcının favori ilanları
    /// </summary>
    public virtual ICollection<FavoriteListing> FavoriteListings { get; set; } = new List<FavoriteListing>();
}
