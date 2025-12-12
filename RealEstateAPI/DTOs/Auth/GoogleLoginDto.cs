namespace RealEstateAPI.DTOs.Auth;

/**
 * Google Login DTO
 * 
 * Google OAuth ile giriş için gerekli veri transfer nesnesi.
 * Frontend'den gelen Google ID Token'ı içerir.
 */
public class GoogleLoginDto
{
    /// <summary>
    /// Google OAuth'dan alınan ID Token (JWT formatında)
    /// Bu token Google tarafından doğrulanacak ve kullanıcı bilgileri çıkarılacak.
    /// </summary>
    public string IdToken { get; set; } = string.Empty;
}

/**
 * Google User Info
 * 
 * Google ID Token'dan çıkarılan kullanıcı bilgileri.
 */
public class GoogleUserInfo
{
    /// <summary>
    /// Google kullanıcı ID'si (subject claim)
    /// </summary>
    public string GoogleId { get; set; } = string.Empty;

    /// <summary>
    /// Kullanıcının e-posta adresi
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// E-posta doğrulanmış mı?
    /// </summary>
    public bool EmailVerified { get; set; }

    /// <summary>
    /// Kullanıcının adı (given_name)
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Kullanıcının soyadı (family_name)
    /// </summary>
    public string Surname { get; set; } = string.Empty;

    /// <summary>
    /// Kullanıcının profil fotoğrafı URL'i
    /// </summary>
    public string? Picture { get; set; }
}
