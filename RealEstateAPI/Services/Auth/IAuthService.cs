using RealEstateAPI.DTOs.Auth;

namespace RealEstateAPI.Services.Auth;

/**
 * Auth Service Interface
 * 
 * Kimlik doğrulama işlemleri için servis arayüzü.
 * SOLID prensiplerinden Dependency Inversion'a uygun.
 */
public interface IAuthService
{
    /// <summary>
    /// Kullanıcı kayıt işlemi
    /// </summary>
    /// <param name="registerDto">Kayıt bilgileri</param>
    /// <param name="ipAddress">İstemci IP adresi</param>
    /// <returns>İşlem sonucu</returns>
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto, string? ipAddress = null);

    /// <summary>
    /// Kullanıcı giriş işlemi
    /// </summary>
    /// <param name="loginDto">Giriş bilgileri</param>
    /// <param name="ipAddress">İstemci IP adresi</param>
    /// <returns>İşlem sonucu ve JWT token</returns>
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto, string? ipAddress = null);

    /// <summary>
    /// Token yenileme işlemi
    /// </summary>
    /// <param name="refreshToken">Refresh token</param>
    /// <param name="ipAddress">İstemci IP adresi</param>
    /// <returns>Yeni access token ve refresh token</returns>
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string? ipAddress = null);

    /// <summary>
    /// Refresh token iptal et (logout)
    /// </summary>
    /// <param name="refreshToken">İptal edilecek refresh token</param>
    /// <param name="ipAddress">İstemci IP adresi</param>
    /// <returns>İşlem sonucu</returns>
    Task<AuthResponseDto> RevokeTokenAsync(string refreshToken, string? ipAddress = null);

    /// <summary>
    /// Kullanıcı bilgilerini getir
    /// </summary>
    /// <param name="userId">Kullanıcı ID'si</param>
    /// <returns>Kullanıcı bilgileri</returns>
    Task<UserDto?> GetUserByIdAsync(string userId);

    /// <summary>
    /// Google OAuth ile giriş işlemi
    /// </summary>
    /// <param name="googleLoginDto">Google ID Token</param>
    /// <param name="ipAddress">İstemci IP adresi</param>
    /// <returns>İşlem sonucu ve JWT token</returns>
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto googleLoginDto, string? ipAddress = null);
}
