using RealEstateAPI.Models;

namespace RealEstateAPI.Repositories.Auth;

/**
 * Auth Repository Interface
 * 
 * Kimlik doğrulama işlemleri için repository arayüzü.
 * SOLID prensiplerinden Interface Segregation'a uygun.
 */
public interface IAuthRepository
{
    // ============================================================================
    // USER METHODS
    // ============================================================================

    /// <summary>
    /// E-posta adresine göre kullanıcı bul
    /// </summary>
    /// <param name="email">E-posta adresi</param>
    /// <returns>Bulunan kullanıcı veya null</returns>
    Task<ApplicationUser?> GetUserByEmailAsync(string email);

    /// <summary>
    /// ID'ye göre kullanıcı bul
    /// </summary>
    /// <param name="userId">Kullanıcı ID'si</param>
    /// <returns>Bulunan kullanıcı veya null</returns>
    Task<ApplicationUser?> GetUserByIdAsync(string userId);

    /// <summary>
    /// E-posta adresi kullanımda mı kontrol et
    /// </summary>
    /// <param name="email">E-posta adresi</param>
    /// <returns>Kullanımda ise true</returns>
    Task<bool> IsEmailExistsAsync(string email);

    // ============================================================================
    // REFRESH TOKEN METHODS
    // ============================================================================

    /// <summary>
    /// Refresh token kaydet
    /// </summary>
    /// <param name="refreshToken">Refresh token</param>
    Task SaveRefreshTokenAsync(RefreshToken refreshToken);

    /// <summary>
    /// Token değerine göre refresh token bul
    /// </summary>
    /// <param name="token">Token değeri</param>
    /// <returns>Refresh token veya null</returns>
    Task<RefreshToken?> GetRefreshTokenAsync(string token);

    /// <summary>
    /// Kullanıcının tüm refresh token'larını iptal et
    /// </summary>
    /// <param name="userId">Kullanıcı ID'si</param>
    Task RevokeAllUserRefreshTokensAsync(string userId);

    /// <summary>
    /// Refresh token güncelle
    /// </summary>
    /// <param name="refreshToken">Güncellenecek token</param>
    Task UpdateRefreshTokenAsync(RefreshToken refreshToken);

    /// <summary>
    /// Süresi dolmuş refresh token'ları temizle
    /// </summary>
    Task CleanupExpiredRefreshTokensAsync();
}
