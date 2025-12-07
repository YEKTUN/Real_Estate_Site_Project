using System.ComponentModel.DataAnnotations;

namespace RealEstateAPI.DTOs.Auth;

/**
 * Register DTO
 * 
 * Kullanıcı kayıt işlemi için veri transfer nesnesi.
 * Özellikler: Name, Surname, Phone, Email, Password
 */
public class RegisterDto
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
    /// Telefon numarası
    /// </summary>
    [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz")]
    [StringLength(20, ErrorMessage = "Telefon numarası en fazla 20 karakter olabilir")]
    public string? Phone { get; set; }

    /// <summary>
    /// E-posta adresi
    /// </summary>
    [Required(ErrorMessage = "E-posta adresi zorunludur")]
    [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Şifre
    /// </summary>
    [Required(ErrorMessage = "Şifre zorunludur")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Şifre en az 8 karakter olmalıdır")]
    public string Password { get; set; } = string.Empty;

    /// <summary>
    /// Şifre tekrarı
    /// </summary>
    [Required(ErrorMessage = "Şifre tekrarı zorunludur")]
    [Compare("Password", ErrorMessage = "Şifreler eşleşmiyor")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
