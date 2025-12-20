using System.ComponentModel.DataAnnotations;

namespace RealEstateAPI.DTOs.Auth;

/**
 * Change Password DTO
 * 
 * Şifre değiştirme işlemi için veri transfer nesnesi.
 * Eski şifre, yeni şifre ve yeni şifre tekrarı içerir.
 */
public class ChangePasswordDto
{
    /// <summary>
    /// Mevcut şifre (eski şifre)
    /// </summary>
    [Required(ErrorMessage = "Mevcut şifre zorunludur")]
    public string CurrentPassword { get; set; } = string.Empty;

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

