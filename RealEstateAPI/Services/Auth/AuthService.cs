using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using RealEstateAPI.DTOs.Auth;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Auth;

namespace RealEstateAPI.Services.Auth;

/**
 * Auth Service
 * 
 * Kimlik doğrulama işlemlerinin iş mantığını içerir.
 * Login, Register, Refresh Token ve JWT token oluşturma işlemlerini yönetir.
 */
public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IAuthRepository _authRepository;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IAuthRepository authRepository,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _authRepository = authRepository;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Kullanıcı kayıt işlemi
    /// </summary>
    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto, string? ipAddress = null)
    {
        try
        {
            // E-posta kontrolü
            if (await _authRepository.IsEmailExistsAsync(registerDto.Email))
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Bu e-posta adresi zaten kullanımda"
                };
            }

            // Yeni kullanıcı oluştur
            var user = new ApplicationUser
            {
                UserName = registerDto.Email,
                Email = registerDto.Email,
                Name = registerDto.Name,
                Surname = registerDto.Surname,
                Phone = registerDto.Phone,
                PhoneNumber = registerDto.Phone,
                CreatedAt = DateTime.UtcNow
            };

            // Identity ile kullanıcı oluştur
            var result = await _userManager.CreateAsync(user, registerDto.Password);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("Kullanıcı oluşturulamadı: {Errors}", errors);

                return new AuthResponseDto
                {
                    Success = false,
                    Message = $"Kayıt başarısız: {errors}"
                };
            }

            _logger.LogInformation("Yeni kullanıcı kaydedildi: {Email}", user.Email);

            // JWT token ve Refresh token oluştur
            var accessToken = GenerateJwtToken(user);
            var refreshToken = await GenerateRefreshTokenAsync(user.Id, ipAddress);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Kayıt başarılı",
                Token = accessToken,
                RefreshToken = refreshToken.Token,
                ExpiresIn = GetTokenExpirationInSeconds(),
                User = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kayıt işlemi sırasında hata oluştu");
            return new AuthResponseDto
            {
                Success = false,
                Message = "Kayıt işlemi sırasında bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Kullanıcı giriş işlemi
    /// </summary>
    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto, string? ipAddress = null)
    {
        try
        {
            // Kullanıcıyı e-posta ile bul
            var user = await _authRepository.GetUserByEmailAsync(loginDto.EmailOrUsername);

            if (user == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Geçersiz e-posta veya şifre"
                };
            }

            // Şifre doğrulama
            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, lockoutOnFailure: true);

            if (result.IsLockedOut)
            {
                _logger.LogWarning("Kullanıcı hesabı kilitlendi: {Email}", user.Email);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Hesabınız geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin."
                };
            }

            if (!result.Succeeded)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Geçersiz e-posta veya şifre"
                };
            }

            _logger.LogInformation("Kullanıcı giriş yaptı: {Email}", user.Email);

            // JWT token ve Refresh token oluştur
            var accessToken = GenerateJwtToken(user);
            var refreshToken = await GenerateRefreshTokenAsync(user.Id, ipAddress);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Giriş başarılı",
                Token = accessToken,
                RefreshToken = refreshToken.Token,
                ExpiresIn = GetTokenExpirationInSeconds(),
                User = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Giriş işlemi sırasında hata oluştu");
            return new AuthResponseDto
            {
                Success = false,
                Message = "Giriş işlemi sırasında bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Token yenileme işlemi
    /// </summary>
    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, string? ipAddress = null)
    {
        try
        {
            // Refresh token'ı bul
            var storedToken = await _authRepository.GetRefreshTokenAsync(refreshToken);

            if (storedToken == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Geçersiz refresh token"
                };
            }

            // Token geçerli mi kontrol et
            if (!storedToken.IsActive)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Refresh token süresi dolmuş veya iptal edilmiş"
                };
            }

            // Kullanıcıyı bul
            var user = storedToken.User;
            if (user == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Kullanıcı bulunamadı"
                };
            }

            // Eski token'ı kullanıldı olarak işaretle
            storedToken.IsUsed = true;
            storedToken.RevokedAt = DateTime.UtcNow;
            storedToken.RevokedByIp = ipAddress;

            // Yeni token'lar oluştur
            var newAccessToken = GenerateJwtToken(user);
            var newRefreshToken = await GenerateRefreshTokenAsync(user.Id, ipAddress);

            // Eski token'ı güncelle - yeni token referansı ekle
            storedToken.ReplacedByToken = newRefreshToken.Token;
            await _authRepository.UpdateRefreshTokenAsync(storedToken);

            _logger.LogInformation("Token yenilendi: {UserId}", user.Id);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Token yenilendi",
                Token = newAccessToken,
                RefreshToken = newRefreshToken.Token,
                ExpiresIn = GetTokenExpirationInSeconds(),
                User = MapToUserDto(user)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token yenileme sırasında hata oluştu");
            return new AuthResponseDto
            {
                Success = false,
                Message = "Token yenileme sırasında bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Refresh token iptal et (logout)
    /// </summary>
    public async Task<AuthResponseDto> RevokeTokenAsync(string refreshToken, string? ipAddress = null)
    {
        try
        {
            var storedToken = await _authRepository.GetRefreshTokenAsync(refreshToken);

            if (storedToken == null || !storedToken.IsActive)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Geçersiz veya zaten iptal edilmiş token"
                };
            }

            // Token'ı iptal et
            storedToken.IsRevoked = true;
            storedToken.RevokedAt = DateTime.UtcNow;
            storedToken.RevokedByIp = ipAddress;
            await _authRepository.UpdateRefreshTokenAsync(storedToken);

            _logger.LogInformation("Refresh token iptal edildi: {UserId}", storedToken.UserId);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Çıkış başarılı"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token iptal sırasında hata oluştu");
            return new AuthResponseDto
            {
                Success = false,
                Message = "Çıkış işlemi sırasında bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Kullanıcı bilgilerini getir
    /// </summary>
    public async Task<UserDto?> GetUserByIdAsync(string userId)
    {
        var user = await _authRepository.GetUserByIdAsync(userId);

        if (user == null)
            return null;

        return MapToUserDto(user);
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    /// <summary>
    /// ApplicationUser'ı UserDto'ya dönüştür
    /// </summary>
    private static UserDto MapToUserDto(ApplicationUser user)
    {
        return new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Surname = user.Surname,
            Phone = user.Phone,
            Email = user.Email ?? string.Empty
        };
    }

    /// <summary>
    /// JWT Access Token oluştur
    /// </summary>
    private string GenerateJwtToken(ApplicationUser user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyHere123456789!";
        var issuer = jwtSettings["Issuer"] ?? "RealEstateAPI";
        var audience = jwtSettings["Audience"] ?? "RealEstateFrontend";
        var expirationMinutes = int.Parse(jwtSettings["ExpirationMinutes"] ?? "60");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Token claim'leri
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.GivenName, user.Name),
            new Claim(JwtRegisteredClaimNames.FamilyName, user.Surname),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id)
        };

        // Token oluştur
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Refresh Token oluştur ve veritabanına kaydet
    /// </summary>
    private async Task<RefreshToken> GenerateRefreshTokenAsync(string userId, string? ipAddress)
    {
        var refreshTokenExpirationDays = int.Parse(_configuration["JwtSettings:RefreshTokenExpirationDays"] ?? "7");

        // Güvenli rastgele token oluştur
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);

        var refreshToken = new RefreshToken
        {
            Token = Convert.ToBase64String(randomBytes),
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(refreshTokenExpirationDays),
            CreatedByIp = ipAddress
        };

        // Veritabanına kaydet
        await _authRepository.SaveRefreshTokenAsync(refreshToken);

        return refreshToken;
    }

    /// <summary>
    /// Access Token geçerlilik süresini saniye cinsinden al
    /// </summary>
    private int GetTokenExpirationInSeconds()
    {
        var expirationMinutes = int.Parse(_configuration["JwtSettings:ExpirationMinutes"] ?? "60");
        return expirationMinutes * 60;
    }
}
