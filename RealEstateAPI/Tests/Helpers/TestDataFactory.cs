using RealEstateAPI.DTOs.Auth;
using RealEstateAPI.Models;
using System.Text;
using System.Text.Json;

namespace RealEstateAPI.Tests.Helpers;

/// <summary>
/// Test Data Factory
/// 
/// Test verilerini oluşturmak için yardımcı sınıf.
/// Mock nesneler ve test verileri burada tanımlanır.
/// </summary>
public static class TestDataFactory
{
    // ============================================================================
    // USER DATA
    // ============================================================================

    /// <summary>
    /// Test için ApplicationUser oluşturur
    /// </summary>
    /// <param name="id">Kullanıcı ID (opsiyonel)</param>
    /// <param name="email">Email (opsiyonel)</param>
    /// <returns>ApplicationUser nesnesi</returns>
    public static ApplicationUser CreateTestUser(
        string? id = null, 
        string? email = null,
        string? name = null,
        string? surname = null)
    {
        return new ApplicationUser
        {
            Id = id ?? Guid.NewGuid().ToString(),
            UserName = email ?? "test@example.com",
            Email = email ?? "test@example.com",
            Name = name ?? "Test",
            Surname = surname ?? "User",
            Phone = "5551234567",
            PhoneNumber = "5551234567",
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = true
        };
    }

    /// <summary>
    /// Test için birden fazla kullanıcı oluşturur
    /// </summary>
    /// <param name="count">Oluşturulacak kullanıcı sayısı</param>
    /// <returns>Kullanıcı listesi</returns>
    public static List<ApplicationUser> CreateTestUsers(int count)
    {
        var users = new List<ApplicationUser>();
        for (int i = 1; i <= count; i++)
        {
            users.Add(CreateTestUser(
                id: Guid.NewGuid().ToString(),
                email: $"user{i}@example.com",
                name: $"User{i}",
                surname: $"Test{i}"
            ));
        }
        return users;
    }

    // ============================================================================
    // DTO DATA
    // ============================================================================

    /// <summary>
    /// Test için LoginDto oluşturur
    /// </summary>
    public static LoginDto CreateLoginDto(
        string? email = null, 
        string? password = null)
    {
        return new LoginDto
        {
            EmailOrUsername = email ?? "test@example.com",
            Password = password ?? "Test123!@#"
        };
    }

    /// <summary>
    /// Test için RegisterDto oluşturur
    /// </summary>
    public static RegisterDto CreateRegisterDto(
        string? name = null,
        string? surname = null,
        string? email = null,
        string? password = null,
        string? phone = null)
    {
        var pwd = password ?? "Test123!@#";
        return new RegisterDto
        {
            Name = name ?? "Test",
            Surname = surname ?? "User",
            Email = email ?? "newuser@example.com",
            Phone = phone ?? "5559876543",
            Password = pwd,
            ConfirmPassword = pwd
        };
    }

    /// <summary>
    /// Başarılı AuthResponseDto oluşturur
    /// </summary>
    public static AuthResponseDto CreateSuccessAuthResponse(
        ApplicationUser? user = null,
        string? token = null,
        string? refreshToken = null)
    {
        var testUser = user ?? CreateTestUser();
        return new AuthResponseDto
        {
            Success = true,
            Message = "İşlem başarılı",
            Token = token ?? "test-jwt-token",
            RefreshToken = refreshToken ?? "test-refresh-token",
            ExpiresIn = 3600,
            User = new UserDto
            {
                Id = testUser.Id,
                Name = testUser.Name,
                Surname = testUser.Surname,
                Email = testUser.Email ?? string.Empty,
                Phone = testUser.Phone
            }
        };
    }

    /// <summary>
    /// Başarısız AuthResponseDto oluşturur
    /// </summary>
    public static AuthResponseDto CreateFailedAuthResponse(string message = "İşlem başarısız")
    {
        return new AuthResponseDto
        {
            Success = false,
            Message = message
        };
    }

    // ============================================================================
    // REFRESH TOKEN DATA
    // ============================================================================

    /// <summary>
    /// Test için RefreshToken oluşturur
    /// </summary>
    public static RefreshToken CreateRefreshToken(
        string? userId = null,
        string? token = null,
        bool isActive = true,
        int expiresInDays = 7)
    {
        var refreshToken = new RefreshToken
        {
            Id = new Random().Next(1, 10000),
            Token = token ?? Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            UserId = userId ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(expiresInDays),
            IsRevoked = !isActive,
            IsUsed = false,
            CreatedByIp = "127.0.0.1"
        };

        return refreshToken;
    }

    /// <summary>
    /// Süresi dolmuş RefreshToken oluşturur
    /// </summary>
    public static RefreshToken CreateExpiredRefreshToken(string? userId = null)
    {
        return new RefreshToken
        {
            Id = new Random().Next(1, 10000),
            Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            UserId = userId ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            ExpiresAt = DateTime.UtcNow.AddDays(-3), // Süresi dolmuş
            IsRevoked = false,
            IsUsed = false
        };
    }

    /// <summary>
    /// İptal edilmiş RefreshToken oluşturur
    /// </summary>
    public static RefreshToken CreateRevokedRefreshToken(string? userId = null)
    {
        return new RefreshToken
        {
            Id = new Random().Next(1, 10000),
            Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            UserId = userId ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            ExpiresAt = DateTime.UtcNow.AddDays(2),
            IsRevoked = true, // İptal edilmiş
            IsUsed = false,
            RevokedAt = DateTime.UtcNow.AddDays(-1)
        };
    }

    /// <summary>
    /// Kullanılmış RefreshToken oluşturur
    /// </summary>
    public static RefreshToken CreateUsedRefreshToken(string? userId = null)
    {
        return new RefreshToken
        {
            Id = new Random().Next(1, 10000),
            Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            UserId = userId ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            ExpiresAt = DateTime.UtcNow.AddDays(2),
            IsRevoked = false,
            IsUsed = true, // Kullanılmış
            ReplacedByToken = "new-token"
        };
    }

    // ============================================================================
    // CONFIGURATION DATA
    // ============================================================================

    /// <summary>
    /// Test için JWT ayarlarını içeren Dictionary oluşturur
    /// </summary>
    public static Dictionary<string, string?> CreateJwtSettings()
    {
        return new Dictionary<string, string?>
        {
            {"JwtSettings:SecretKey", "YourSuperSecretKeyForTestingPurposes123456789!"},
            {"JwtSettings:Issuer", "RealEstateAPI.Test"},
            {"JwtSettings:Audience", "RealEstateAPI.Test.Client"},
            {"JwtSettings:ExpirationMinutes", "60"},
            {"JwtSettings:RefreshTokenExpirationDays", "7"}
        };
    }

    // ============================================================================
    // GOOGLE OAUTH DATA
    // ============================================================================

    /// <summary>
    /// Test için GoogleLoginDto oluşturur
    /// </summary>
    /// <param name="idToken">Google ID Token (opsiyonel - varsayılan mock token)</param>
    public static GoogleLoginDto CreateGoogleLoginDto(string? idToken = null)
    {
        return new GoogleLoginDto
        {
            IdToken = idToken ?? CreateMockGoogleIdToken()
        };
    }

    /// <summary>
    /// Test için GoogleUserInfo oluşturur
    /// </summary>
    public static GoogleUserInfo CreateGoogleUserInfo(
        string? googleId = null,
        string? email = null,
        string? name = null,
        string? surname = null,
        bool emailVerified = true,
        string? picture = null)
    {
        return new GoogleUserInfo
        {
            GoogleId = googleId ?? "google-user-id-123456789",
            Email = email ?? "googleuser@gmail.com",
            Name = name ?? "Google",
            Surname = surname ?? "User",
            EmailVerified = emailVerified,
            Picture = picture ?? "https://lh3.googleusercontent.com/a/default-user"
        };
    }

    /// <summary>
    /// Google kullanıcısı olan ApplicationUser oluşturur
    /// </summary>
    public static ApplicationUser CreateGoogleUser(
        string? id = null,
        string? email = null,
        string? name = null,
        string? surname = null,
        string? googleId = null,
        string? profilePictureUrl = null)
    {
        return new ApplicationUser
        {
            Id = id ?? Guid.NewGuid().ToString(),
            UserName = email ?? "googleuser@gmail.com",
            Email = email ?? "googleuser@gmail.com",
            Name = name ?? "Google",
            Surname = surname ?? "User",
            Phone = null,
            PhoneNumber = null,
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = true,
            GoogleId = googleId ?? "google-user-id-123456789",
            ProfilePictureUrl = profilePictureUrl ?? "https://lh3.googleusercontent.com/a/default-user"
        };
    }

    /// <summary>
    /// Mock Google ID Token oluşturur (test amaçlı)
    /// Gerçek bir Google token'ı değil, sadece test için mock değer
    /// </summary>
    public static string CreateMockGoogleIdToken()
    {
        // Mock bir JWT benzeri token oluştur
        var header = Convert.ToBase64String(Encoding.UTF8.GetBytes("{\"alg\":\"RS256\",\"typ\":\"JWT\"}"));
        var payload = Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
        {
            sub = "google-user-id-123456789",
            email = "googleuser@gmail.com",
            email_verified = true,
            given_name = "Google",
            family_name = "User",
            picture = "https://lh3.googleusercontent.com/a/default-user",
            aud = "test-google-client-id.apps.googleusercontent.com",
            iss = "https://accounts.google.com",
            exp = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds()
        })));
        var signature = Convert.ToBase64String(Encoding.UTF8.GetBytes("mock-signature"));

        return $"{header}.{payload}.{signature}";
    }

    /// <summary>
    /// Google OAuth başarılı yanıt oluşturur
    /// </summary>
    public static AuthResponseDto CreateGoogleSuccessAuthResponse(
        ApplicationUser? user = null,
        string? token = null,
        string? refreshToken = null)
    {
        var testUser = user ?? CreateGoogleUser();
        return new AuthResponseDto
        {
            Success = true,
            Message = "Google ile giriş başarılı",
            Token = token ?? "google-jwt-token",
            RefreshToken = refreshToken ?? "google-refresh-token",
            ExpiresIn = 3600,
            User = new UserDto
            {
                Id = testUser.Id,
                Name = testUser.Name,
                Surname = testUser.Surname,
                Email = testUser.Email ?? string.Empty,
                Phone = testUser.Phone
            }
        };
    }

    /// <summary>
    /// Boş Google ID Token ile GoogleLoginDto oluşturur
    /// </summary>
    public static GoogleLoginDto CreateEmptyGoogleLoginDto()
    {
        return new GoogleLoginDto
        {
            IdToken = string.Empty
        };
    }

    /// <summary>
    /// Geçersiz Google ID Token ile GoogleLoginDto oluşturur
    /// </summary>
    public static GoogleLoginDto CreateInvalidGoogleLoginDto()
    {
        return new GoogleLoginDto
        {
            IdToken = "invalid-google-token"
        };
    }
}
