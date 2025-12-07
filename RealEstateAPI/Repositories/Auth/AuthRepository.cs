using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Data;
using RealEstateAPI.Models;

namespace RealEstateAPI.Repositories.Auth;

/**
 * Auth Repository
 * 
 * Kimlik doğrulama işlemleri için repository implementasyonu.
 * Veritabanı işlemlerini yönetir.
 */
public class AuthRepository : IAuthRepository
{
    private readonly ApplicationDbContext _context;

    public AuthRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    // ============================================================================
    // USER METHODS
    // ============================================================================

    /// <summary>
    /// E-posta adresine göre kullanıcı bul
    /// </summary>
    public async Task<ApplicationUser?> GetUserByEmailAsync(string email)
    {
        return await _context.Users
            .OfType<ApplicationUser>()
            .FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == email.ToLower());
    }

    /// <summary>
    /// ID'ye göre kullanıcı bul
    /// </summary>
    public async Task<ApplicationUser?> GetUserByIdAsync(string userId)
    {
        return await _context.Users
            .OfType<ApplicationUser>()
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    /// <summary>
    /// E-posta adresi kullanımda mı kontrol et
    /// </summary>
    public async Task<bool> IsEmailExistsAsync(string email)
    {
        return await _context.Users
            .OfType<ApplicationUser>()
            .AnyAsync(u => u.Email != null && u.Email.ToLower() == email.ToLower());
    }

    // ============================================================================
    // REFRESH TOKEN METHODS
    // ============================================================================

    /// <summary>
    /// Refresh token kaydet
    /// </summary>
    public async Task SaveRefreshTokenAsync(RefreshToken refreshToken)
    {
        await _context.RefreshTokens.AddAsync(refreshToken);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Token değerine göre refresh token bul
    /// </summary>
    public async Task<RefreshToken?> GetRefreshTokenAsync(string token)
    {
        return await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == token);
    }

    /// <summary>
    /// Kullanıcının tüm refresh token'larını iptal et
    /// </summary>
    public async Task RevokeAllUserRefreshTokensAsync(string userId)
    {
        var tokens = await _context.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Refresh token güncelle
    /// </summary>
    public async Task UpdateRefreshTokenAsync(RefreshToken refreshToken)
    {
        _context.RefreshTokens.Update(refreshToken);
        await _context.SaveChangesAsync();
    }

    /// <summary>
    /// Süresi dolmuş refresh token'ları temizle
    /// </summary>
    public async Task CleanupExpiredRefreshTokensAsync()
    {
        var expiredTokens = await _context.RefreshTokens
            .Where(rt => rt.ExpiresAt < DateTime.UtcNow || rt.IsRevoked || rt.IsUsed)
            .Where(rt => rt.CreatedAt < DateTime.UtcNow.AddDays(-30)) // 30 günden eski
            .ToListAsync();

        _context.RefreshTokens.RemoveRange(expiredTokens);
        await _context.SaveChangesAsync();
    }
}
