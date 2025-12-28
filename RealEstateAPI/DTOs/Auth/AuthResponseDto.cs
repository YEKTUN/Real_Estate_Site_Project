namespace RealEstateAPI.DTOs.Auth;

/**
 * Auth Response DTO
 * 
 * Kimlik doğrulama işlemleri sonucu dönen yanıt nesnesi.
 */
public class AuthResponseDto
{
    /// <summary>
    /// İşlem başarılı mı?
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Yanıt mesajı
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// JWT Access Token
    /// </summary>
    public string? Token { get; set; }

    /// <summary>
    /// Refresh Token
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// Access Token geçerlilik süresi (saniye)
    /// </summary>
    public int? ExpiresIn { get; set; }

    /// <summary>
    /// Kullanıcı bilgileri
    /// </summary>
    public UserDto? User { get; set; }
}

/**
 * User DTO
 * 
 * Kullanıcı bilgileri için veri transfer nesnesi.
 */
public class UserDto
{
    /// <summary>
    /// Kullanıcı ID'si
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Kullanıcının adı
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Kullanıcının soyadı
    /// </summary>
    public string Surname { get; set; } = string.Empty;

    /// <summary>
    /// Telefon numarası
    /// </summary>
    public string? Phone { get; set; }

    /// <summary>
    /// E-posta adresi
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Profil fotoğrafı URL'i
    /// </summary>
    public string? ProfilePictureUrl { get; set; }

    /// <summary>
    /// Kullanıcının admin yetkisi var mı?
    /// </summary>
    public bool IsAdmin { get; set; }
}

/**
 * Refresh Token Request DTO
 * 
 * Token yenileme isteği için
 */
public class RefreshTokenRequestDto
{
    /// <summary>
    /// Refresh Token
    /// </summary>
    public string RefreshToken { get; set; } = string.Empty;
}
