using System.ComponentModel.DataAnnotations;

namespace RealEstateAPI.DTOs.Auth;

/**
 * Login DTO
 * 
 * Kullanıcı giriş işlemi için veri transfer nesnesi.
 */
public class LoginDto
{
    /// <summary>
    /// E-posta adresi veya kullanıcı adı
    /// </summary>
    [Required(ErrorMessage = "E-posta veya kullanıcı adı zorunludur")]
    public string EmailOrUsername { get; set; } = string.Empty;

    /// <summary>
    /// Şifre
    /// </summary>
    [Required(ErrorMessage = "Şifre zorunludur")]
    public string Password { get; set; } = string.Empty;
}

