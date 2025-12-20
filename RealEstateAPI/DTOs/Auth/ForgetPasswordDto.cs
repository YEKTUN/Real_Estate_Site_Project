using System.ComponentModel.DataAnnotations;

namespace RealEstateAPI.DTOs.Auth;

/**
 * Forget Password DTO
 * 
 * Şifre sıfırlama isteği için veri transfer nesnesi.
 * Kullanıcı email adresini gönderir, sistem email'e şifre sıfırlama linki gönderir.
 */
public class ForgetPasswordDto
{
    /// <summary>
    /// E-posta adresi
    /// </summary>
    [Required(ErrorMessage = "E-posta adresi zorunludur")]
    [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz")]
    public string Email { get; set; } = string.Empty;
}

