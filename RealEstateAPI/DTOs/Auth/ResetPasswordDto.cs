using System.ComponentModel.DataAnnotations;

namespace RealEstateAPI.DTOs.Auth;

/**
 * Reset Password DTO
 * 
 * Şifre sıfırlama işlemi için veri transfer nesnesi.
 * Email'den gelen token ile birlikte yeni şifre belirlenir.
 */
public class ResetPasswordDto
{
    /// <summary>
    /// Şifre sıfırlama token'ı (email'den gelen)
    /// </summary>
    [Required(ErrorMessage = "Token zorunludur")]
    public string Token { get; set; } = string.Empty;

    /// <summary>
    /// E-posta adresi
    /// </summary>
    [Required(ErrorMessage = "E-posta adresi zorunludur")]
    [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Yeni şifre
    /// </summary>
    [Required(ErrorMessage = "Yeni şifre zorunludur")]
    [StringLength(100, MinimumLength = 8, ErrorMessage = "Şifre en az 8 karakter olmalıdır")]
    public string NewPassword { get; set; } = string.Empty;

    /// <summary>
    /// Yeni şifre tekrarı
    /// </summary>
    [Required(ErrorMessage = "Şifre tekrarı zorunludur")]
    [Compare("NewPassword", ErrorMessage = "Şifreler eşleşmiyor")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

