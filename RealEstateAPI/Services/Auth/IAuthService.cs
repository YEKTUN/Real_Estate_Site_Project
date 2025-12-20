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
    /// Kullanıcının profil fotoğrafını güncelle
    /// </summary>
    /// <param name="userId">Kullanıcı ID'si</param>
    /// <param name="profilePictureUrl">Yeni profil fotoğrafı URL'i</param>
    Task<AuthResponseDto> UpdateProfilePictureAsync(string userId, string profilePictureUrl);

    /// <summary>
    /// Google OAuth ile giriş işlemi
    /// </summary>
    /// <param name="googleLoginDto">Google ID Token</param>
    /// <param name="ipAddress">İstemci IP adresi</param>
    /// <returns>İşlem sonucu ve JWT token</returns>
    Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto googleLoginDto, string? ipAddress = null);

    /// <summary>
    /// Şifre sıfırlama isteği - Email'e token gönderir
    /// </summary>
    /// <param name="forgetPasswordDto">Email adresi</param>
    /// <returns>İşlem sonucu</returns>
    Task<AuthResponseDto> ForgetPasswordAsync(ForgetPasswordDto forgetPasswordDto);

    /// <summary>
    /// Şifre sıfırlama - Token ile yeni şifre belirleme
    /// </summary>
    /// <param name="resetPasswordDto">Token, email ve yeni şifre</param>
    /// <returns>İşlem sonucu</returns>
    Task<AuthResponseDto> ResetPasswordAsync(ResetPasswordDto resetPasswordDto);

    /// <summary>
    /// Şifre değiştirme - Mevcut şifre ile yeni şifre belirleme
    /// </summary>
    /// <param name="userId">Kullanıcı ID'si</param>
    /// <param name="changePasswordDto">Mevcut şifre, yeni şifre ve yeni şifre tekrarı</param>
    /// <returns>İşlem sonucu</returns>
    Task<AuthResponseDto> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto);
}
