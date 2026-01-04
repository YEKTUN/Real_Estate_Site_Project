using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using RealEstateAPI.DTOs.Auth;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Auth;
using RealEstateAPI.Services.Email;

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
    private readonly IEmailService _emailService;
    private readonly Repositories.Listing.IListingRepository _listingRepository;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IAuthRepository authRepository,
        IConfiguration configuration,
        ILogger<AuthService> logger,
        IEmailService emailService,
        Repositories.Listing.IListingRepository listingRepository)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _authRepository = authRepository;
        _configuration = configuration;
        _logger = logger;
        _emailService = emailService;
        _listingRepository = listingRepository;
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
                User = MapToUserDto(user, true)
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

            // Hesap aktiflik kontrolü
            if (!user.IsActive)
            {
                _logger.LogWarning("Pasif hesap giriş denemesi: {Email}", user.Email);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Hesabınız pasif durumdadır. Lütfen destek ile iletişime geçin."
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
                User = MapToUserDto(user, true)
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

            // Kullanıcı aktiflik kontrolü
            if (!user.IsActive)
            {
                _logger.LogWarning("Pasif hesap token yenileme denemesi: {Email}", user.Email);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Hesabınız pasif durumdadır. Lütfen destek ile iletişime geçin."
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
                User = MapToUserDto(user, true)
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
    public async Task<UserDto?> GetUserByIdAsync(string userId, string? currentUserId = null)
    {
        var user = await _authRepository.GetUserByIdAsync(userId);

        if (user == null)
            return null;

        // Gizlilik ayarlarını veritabanından kesin olarak çek (Include bAzan yetmeyebiliyor)
        // Bunun için _authRepository'ye erişimimiz var veya Context'e ihtiyacımız olabilir.
        // AuthService içinde Context yoksa Repo üzerinden yapalım. 
        // Ama Repository zaten Include yapıyor. Yine de ListingService'deki gibi garantiye alalım.
        // AuthService'e context eklememişiz ama repoda var.
        
        // Eğer kullanıcı kendi profilini izliyorsa gizliliği yok say
        bool ignorePrivacy = !string.IsNullOrEmpty(currentUserId) && currentUserId == userId;

        return MapToUserDto(user, ignorePrivacy);
    }

    /// <summary>
    /// Kullanıcının profil fotoğrafını güncelle
    /// </summary>
    public async Task<AuthResponseDto> UpdateProfilePictureAsync(string userId, string profilePictureUrl)
    {
        try
        {
            var user = await _authRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Kullanıcı bulunamadı"
                };
            }

            user.ProfilePictureUrl = profilePictureUrl;
            user.UpdatedAt = DateTime.UtcNow;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("Profil fotoğrafı güncellenemedi: {Errors}", errors);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Profil fotoğrafı güncellenemedi: " + errors
                };
            }

            return new AuthResponseDto
            {
                Success = true,
                Message = "Profil fotoğrafı güncellendi",
                User = MapToUserDto(user, true)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Profil fotoğrafı güncellenirken hata oluştu");
            return new AuthResponseDto
            {
                Success = false,
                Message = "Profil fotoğrafı güncellenirken bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Google OAuth ile giriş işlemi
    /// Kullanıcı varsa giriş yapar, yoksa yeni kullanıcı oluşturur
    /// </summary>
    public async Task<AuthResponseDto> GoogleLoginAsync(GoogleLoginDto googleLoginDto, string? ipAddress = null)
    {
        try
        {
            _logger.LogInformation("Google OAuth giriş isteği alındı");

            // Google ID Token'ı doğrula ve kullanıcı bilgilerini al
            var googleUserInfo = await ValidateGoogleTokenAsync(googleLoginDto.IdToken);

            if (googleUserInfo == null)
            {
                _logger.LogWarning("Google token doğrulaması başarısız");
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Geçersiz Google token"
                };
            }

            _logger.LogInformation("Google token doğrulandı: {Email}", googleUserInfo.Email);

            // E-posta ile mevcut kullanıcıyı kontrol et
            var existingUser = await _authRepository.GetUserByEmailAsync(googleUserInfo.Email);

            ApplicationUser user;

            if (existingUser != null)
            {
                // Mevcut kullanıcı - Google bilgilerini güncelle
                user = existingUser;

                // Hesap aktiflik kontrolü
                if (!user.IsActive)
                {
                    _logger.LogWarning("Pasif hesap Google giriş denemesi: {Email}", user.Email);
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = "Hesabınız pasif durumdadır. Lütfen destek ile iletişime geçin."
                    };
                }
                
                // Google ID yoksa ekle (normal kayıt olmuş ama şimdi Google ile giriş yapıyor)
                if (string.IsNullOrEmpty(user.GoogleId))
                {
                    user.GoogleId = googleUserInfo.GoogleId;
                    user.ProfilePictureUrl = googleUserInfo.Picture;
                    user.UpdatedAt = DateTime.UtcNow;
                    await _userManager.UpdateAsync(user);
                    _logger.LogInformation("Mevcut kullanıcıya Google ID eklendi: {Email}", user.Email);
                }

                _logger.LogInformation("Google ile mevcut kullanıcı giriş yaptı: {Email}", user.Email);
            }
            else
            {
                // Yeni kullanıcı oluştur
                user = new ApplicationUser
                {
                    UserName = googleUserInfo.Email,
                    Email = googleUserInfo.Email,
                    EmailConfirmed = googleUserInfo.EmailVerified,
                    Name = googleUserInfo.Name,
                    Surname = googleUserInfo.Surname,
                    GoogleId = googleUserInfo.GoogleId,
                    ProfilePictureUrl = googleUserInfo.Picture,
                    CreatedAt = DateTime.UtcNow
                };

                // Google kullanıcıları için rastgele şifre oluştur (kullanılmayacak ama Identity gereksinimi)
                var randomPassword = GenerateRandomPassword();
                var createResult = await _userManager.CreateAsync(user, randomPassword);

                if (!createResult.Succeeded)
                {
                    var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                    _logger.LogError("Google kullanıcısı oluşturulamadı: {Errors}", errors);
                    
                    return new AuthResponseDto
                    {
                        Success = false,
                        Message = $"Kullanıcı oluşturulamadı: {errors}"
                    };
                }

                _logger.LogInformation("Google ile yeni kullanıcı kaydedildi: {Email}", user.Email);
            }

            // JWT token ve Refresh token oluştur
            var accessToken = GenerateJwtToken(user);
            var refreshToken = await GenerateRefreshTokenAsync(user.Id, ipAddress);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Google ile giriş başarılı",
                Token = accessToken,
                RefreshToken = refreshToken.Token,
                ExpiresIn = GetTokenExpirationInSeconds(),
                User = MapToUserDto(user, true)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google OAuth işlemi sırasında hata oluştu");
            return new AuthResponseDto
            {
                Success = false,
                Message = "Google ile giriş sırasında bir hata oluştu"
            };
        }
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    /// <summary>
    /// ApplicationUser'ı UserDto'ya dönüştür
    /// </summary>
    private static UserDto MapToUserDto(ApplicationUser user, bool ignorePrivacy = false)
    {
        // Gizlilik ayarlarını al
        var settings = user.Settings;
        var showPhone = settings?.ShowPhone ?? false;
        var showEmail = settings?.ShowEmail ?? false;
        
        // Eğer ignorePrivacy true ise (User kendi datasına bakıyorsa) ayarları görmezden gel
        bool canShowPhone = ignorePrivacy || showPhone;
        bool canShowEmail = ignorePrivacy || showEmail;

        return new UserDto
        {
            Id = user.Id,
            Name = user.Name,
            Surname = user.Surname,
            // Kesin gizlilik: Eğer (Kendi datası değilse) VE (Ayarı kapalıysa) null dön
            Phone = canShowPhone ? user.Phone : null,
            Email = canShowEmail ? (user.Email ?? string.Empty) : null,
            ProfilePictureUrl = user.ProfilePictureUrl,
            IsAdmin = user.IsAdmin,
            IsActive = user.IsActive,
            ShowPhone = showPhone,
            ShowEmail = showEmail
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
            // NOT: Profil fotoğrafı URL'i de token'a eklenir ki frontend sayfa yenilemelerinde
            // ek bir API çağrısı olmadan güncel profil fotoğrafını okuyabilsin.
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.GivenName, user.Name),
                new Claim(JwtRegisteredClaimNames.FamilyName, user.Surname),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Role, user.IsAdmin ? "Admin" : "User"),
                new Claim("isAdmin", user.IsAdmin.ToString().ToLowerInvariant())
            };

            // Profil fotoğrafı varsa custom "picture" claim'i olarak ekle
            if (!string.IsNullOrWhiteSpace(user.ProfilePictureUrl))
            {
                claims.Add(new Claim("picture", user.ProfilePictureUrl));
            }

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

    /// <summary>
    /// Google ID Token'ı doğrula ve kullanıcı bilgilerini çıkar
    /// Google'ın tokeninfo endpoint'ini kullanarak doğrulama yapar
    /// </summary>
    private async Task<GoogleUserInfo?> ValidateGoogleTokenAsync(string idToken)
    {
        try
        {
            var googleClientId = _configuration["GoogleAuth:ClientId"];
            
            // Google tokeninfo endpoint'ini kullanarak doğrula
            using var httpClient = new HttpClient();
            var response = await httpClient.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}");

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Google token doğrulama başarısız: {StatusCode}", response.StatusCode);
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var tokenInfo = JsonSerializer.Deserialize<JsonElement>(content);

            // Audience (Client ID) kontrolü - güvenlik için önemli
            if (!string.IsNullOrEmpty(googleClientId))
            {
                var aud = tokenInfo.GetProperty("aud").GetString();
                if (aud != googleClientId)
                {
                    _logger.LogWarning("Google token audience uyuşmuyor: Beklenen={Expected}, Gelen={Actual}", googleClientId, aud);
                    return null;
                }
            }

            // Token süresi kontrolü
            var expStr = tokenInfo.GetProperty("exp").GetString();
            if (long.TryParse(expStr, out var exp))
            {
                var expiryTime = DateTimeOffset.FromUnixTimeSeconds(exp);
                if (expiryTime < DateTimeOffset.UtcNow)
                {
                    _logger.LogWarning("Google token süresi dolmuş");
                    return null;
                }
            }

            // Kullanıcı bilgilerini çıkar
            return new GoogleUserInfo
            {
                GoogleId = tokenInfo.GetProperty("sub").GetString() ?? string.Empty,
                Email = tokenInfo.GetProperty("email").GetString() ?? string.Empty,
                EmailVerified = tokenInfo.TryGetProperty("email_verified", out var emailVerified) && 
                               emailVerified.GetString()?.ToLower() == "true",
                Name = tokenInfo.TryGetProperty("given_name", out var givenName) 
                       ? givenName.GetString() ?? string.Empty 
                       : string.Empty,
                Surname = tokenInfo.TryGetProperty("family_name", out var familyName) 
                          ? familyName.GetString() ?? string.Empty 
                          : string.Empty,
                Picture = tokenInfo.TryGetProperty("picture", out var picture) 
                          ? picture.GetString() 
                          : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Google token doğrulama sırasında hata");
            return null;
        }
    }

    /// <summary>
    /// Google kullanıcıları için rastgele şifre oluştur
    /// Bu şifre kullanılmayacak ama Identity için gerekli
    /// </summary>
    private static string GenerateRandomPassword()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
        var random = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(random);

        var result = new char[32];
        for (int i = 0; i < 32; i++)
        {
            result[i] = chars[random[i] % chars.Length];
        }
        return new string(result);
    }

    /// <summary>
    /// Şifre sıfırlama isteği - Email'e token gönderir
    /// </summary>
    public async Task<AuthResponseDto> ForgetPasswordAsync(ForgetPasswordDto forgetPasswordDto)
    {
        try
        {
            _logger.LogInformation("Şifre sıfırlama isteği alındı: {Email}", forgetPasswordDto.Email);

            // Kullanıcıyı email ile bul
            var user = await _authRepository.GetUserByEmailAsync(forgetPasswordDto.Email);

            // Kullanıcı yoksa hata mesajı döndür
            if (user == null)
            {
                _logger.LogWarning("Şifre sıfırlama isteği - Kullanıcı bulunamadı: {Email}", forgetPasswordDto.Email);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Bu email adresi ile kayıtlı bir kullanıcı bulunamadı."
                };
            }

            // Google ile giriş yapan kullanıcılar şifre sıfırlayamaz
            if (user.IsGoogleUser)
            {
                _logger.LogWarning("Google kullanıcısı şifre sıfırlama denemesi: {Email}", forgetPasswordDto.Email);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Google ile giriş yapan hesaplar için şifre sıfırlama yapılamaz. Lütfen Google hesabınızla giriş yapın."
                };
            }

            // Güvenli token oluştur
            var resetToken = GeneratePasswordResetToken();

            // Token'ı veritabanına kaydet
            user.PasswordResetToken = resetToken;
            user.PasswordResetExpires = DateTime.UtcNow.AddHours(1); // 1 saat geçerli
            user.UpdatedAt = DateTime.UtcNow;

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                _logger.LogError("Şifre sıfırlama token'ı kaydedilemedi: {Errors}. Kullanıcı ID: {UserId}", errors, user.Id);
                
                // Veritabanı hatası olabilir - migration kontrolü
                _logger.LogWarning("PasswordResetToken veya PasswordResetExpires alanları veritabanında olmayabilir. Migration yapılması gerekebilir.");
                
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Şifre sıfırlama işlemi sırasında bir hata oluştu. Lütfen daha sonra tekrar deneyin."
                };
            }

            // Email gönder
            var userName = $"{user.Name} {user.Surname}".Trim();
            var emailSent = await _emailService.SendPasswordResetEmailAsync(
                user.Email ?? forgetPasswordDto.Email,
                resetToken,
                userName
            );

            if (!emailSent)
            {
                _logger.LogWarning("Şifre sıfırlama email'i gönderilemedi: {Email}", forgetPasswordDto.Email);
                // Email gönderilemese bile token kaydedildi, kullanıcıya başarılı mesaj döndür (güvenlik)
                return new AuthResponseDto
                {
                    Success = true,
                    Message = "Şifre sıfırlama linki email adresinize gönderilmiştir."
                };
            }

            _logger.LogInformation("Şifre sıfırlama email'i başarıyla gönderildi: {Email}", forgetPasswordDto.Email);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Eğer bu email adresi sistemde kayıtlıysa, şifre sıfırlama linki email adresinize gönderilmiştir."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Şifre sıfırlama isteği sırasında hata oluştu: {Email}", forgetPasswordDto.Email);
            return new AuthResponseDto
            {
                Success = false,
                Message = "Şifre sıfırlama işlemi sırasında bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Şifre sıfırlama - Token ile yeni şifre belirleme
    /// </summary>
    public async Task<AuthResponseDto> ResetPasswordAsync(ResetPasswordDto resetPasswordDto)
    {
        try
        {
            _logger.LogInformation("Şifre sıfırlama işlemi başlatıldı: {Email}", resetPasswordDto.Email);

            // Kullanıcıyı email ile bul
            var user = await _authRepository.GetUserByEmailAsync(resetPasswordDto.Email);

            if (user == null)
            {
                _logger.LogWarning("Şifre sıfırlama - Kullanıcı bulunamadı: {Email}", resetPasswordDto.Email);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Geçersiz token veya email adresi"
                };
            }

            // Token kontrolü
            if (string.IsNullOrEmpty(user.PasswordResetToken) || 
                user.PasswordResetToken != resetPasswordDto.Token)
            {
                _logger.LogWarning("Şifre sıfırlama - Geçersiz token: {Email}", resetPasswordDto.Email);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Geçersiz veya süresi dolmuş token"
                };
            }

            // Token süresi kontrolü
            if (user.PasswordResetExpires == null || 
                user.PasswordResetExpires < DateTime.UtcNow)
            {
                _logger.LogWarning("Şifre sıfırlama - Token süresi dolmuş: {Email}", resetPasswordDto.Email);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Token süresi dolmuş. Lütfen yeni bir şifre sıfırlama isteği gönderin."
                };
            }

            // Google kullanıcıları şifre sıfırlayamaz
            if (user.IsGoogleUser)
            {
                _logger.LogWarning("Google kullanıcısı şifre sıfırlama denemesi: {Email}", resetPasswordDto.Email);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Google ile giriş yapan hesaplar için şifre sıfırlama yapılamaz."
                };
            }

            // Identity ile şifre sıfırlama
            // Önce token'ı temizle (güvenlik için)
            user.PasswordResetToken = null;
            user.PasswordResetExpires = null;
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            // Şifreyi sıfırla
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, resetPasswordDto.NewPassword);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogError("Şifre sıfırlama başarısız: {Errors}", errors);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = $"Şifre sıfırlama başarısız: {errors}"
                };
            }

            _logger.LogInformation("Şifre başarıyla sıfırlandı: {Email}", resetPasswordDto.Email);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Şifre sıfırlama işlemi sırasında hata oluştu: {Email}", resetPasswordDto.Email);
            return new AuthResponseDto
            {
                Success = false,
                Message = "Şifre sıfırlama işlemi sırasında bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Şifre değiştirme - Mevcut şifre ile yeni şifre belirleme
    /// </summary>
    public async Task<AuthResponseDto> ChangePasswordAsync(string userId, ChangePasswordDto changePasswordDto)
    {
        try
        {
            _logger.LogInformation("Şifre değiştirme isteği alındı: UserId={UserId}", userId);

            // Kullanıcıyı bul
            var user = await _authRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("Şifre değiştirme - Kullanıcı bulunamadı: UserId={UserId}", userId);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Kullanıcı bulunamadı"
                };
            }

            // Google kullanıcıları şifre değiştiremez
            if (user.IsGoogleUser)
            {
                _logger.LogWarning("Google kullanıcısı şifre değiştirme denemesi: UserId={UserId}", userId);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Google ile giriş yapan hesaplar için şifre değiştirme yapılamaz."
                };
            }

            // Mevcut şifreyi doğrula
            var passwordCheck = await _signInManager.CheckPasswordSignInAsync(user, changePasswordDto.CurrentPassword, lockoutOnFailure: false);
            if (!passwordCheck.Succeeded)
            {
                _logger.LogWarning("Şifre değiştirme - Mevcut şifre yanlış: UserId={UserId}", userId);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Mevcut şifre yanlış"
                };
            }

            // Yeni şifreyi güncelle
            var changePasswordResult = await _userManager.ChangePasswordAsync(user, changePasswordDto.CurrentPassword, changePasswordDto.NewPassword);
            
            if (!changePasswordResult.Succeeded)
            {
                var errors = string.Join(", ", changePasswordResult.Errors.Select(e => e.Description));
                _logger.LogError("Şifre değiştirme başarısız: UserId={UserId}, Errors={Errors}", userId, errors);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = $"Şifre değiştirme başarısız: {errors}"
                };
            }

            // UpdatedAt'i güncelle
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation("Şifre başarıyla değiştirildi: UserId={UserId}", userId);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Şifreniz başarıyla değiştirildi"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Şifre değiştirme işlemi sırasında hata oluştu: UserId={UserId}", userId);
            return new AuthResponseDto
            {
                Success = false,
                Message = "Şifre değiştirme işlemi sırasında bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Hesabı pasife al ve ilanlarını pasif yap
    /// </summary>
    public async Task<AuthResponseDto> DeactivateAccountAsync(string userId)
    {
        try
        {
            _logger.LogInformation("Hesap silme (pasife alma) isteği alındı: UserId={UserId}", userId);

            // Kullanıcıyı bul
            var user = await _authRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Kullanıcı bulunamadı"
                };
            }

            // Hesabı pasif yap
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                _logger.LogError("Hesap pasife alınırken hata oluştu: UserId={UserId}, Errors={Errors}", userId, errors);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Hesap kapatılırken bir hata oluştu: " + errors
                };
            }

            // İlanlarını pasif yap
            await _listingRepository.UpdateUserListingsStatusAsync(userId, ListingStatus.Inactive);

            // Tüm refresh token'ları iptal et (otomatik logout)
            await _authRepository.RevokeAllUserRefreshTokensAsync(userId);

            _logger.LogInformation("Hesap ve ilanlar başarıyla pasife alındı: UserId={UserId}", userId);

            return new AuthResponseDto
            {
                Success = true,
                Message = "Hesabınız başarıyla kapatıldı ve ilanlarınız yayından kaldırıldı."
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Hesap kapatma işlemi sırasında hata oluştu: UserId={UserId}", userId);
            return new AuthResponseDto
            {
                Success = false,
                Message = "Hesap kapatma işlemi sırasında bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Admin için kullanıcıyı email veya kullanıcı adına göre ara
    /// </summary>
    public async Task<AuthResponseDto> GetUserBySearchAsync(string searchTerm)
    {
        _logger.LogInformation("GetUserBySearchAsync başlatıldı. Arama Terimi: {SearchTerm}", searchTerm);
        try
        {
            var cleanEmail = searchTerm.ToLower().Trim();
            _logger.LogInformation("Temizlenmiş e-posta aranıyor: {CleanEmail}", cleanEmail);
            
            var user = await _userManager.FindByEmailAsync(cleanEmail);
            
            if (user == null)
            {
                _logger.LogInformation("FindByEmailAsync ile kullanıcı bulunamadı. NormalizedEmail denenecek.");
                var normalizedEmail = searchTerm.ToUpper().Trim();
                user = await _userManager.Users.FirstOrDefaultAsync(u => u.NormalizedEmail == normalizedEmail);
            }

            if (user == null)
            {
                _logger.LogWarning("Kullanıcı veritabanında hiçbir şekilde bulunamadı: {SearchTerm}", searchTerm);
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Kullanıcı bulunamadı"
                };
            }

            _logger.LogInformation("Kullanıcı başarıyla bulundu: {Email}, Id: {Id}", user.Email, user.Id);
            return new AuthResponseDto
            {
                Success = true,
                User = MapToUserDto(user, true)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kullanıcı arama sırasında kritik hata oluştu: SearchTerm={SearchTerm}", searchTerm);
            return new AuthResponseDto
            {
                Success = false,
                Message = $"Arama hatası: {ex.Message}"
            };
        }
    }

    /// <summary>
    /// Kullanıcının aktiflik durumunu tersine çevir
    /// </summary>
    public async Task<AuthResponseDto> ToggleUserStatusAsync(string userId)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Kullanıcı bulunamadı"
                };
            }

            user.IsActive = !user.IsActive;
            user.UpdatedAt = DateTime.UtcNow;
            
            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                var errors = string.Join(", ", updateResult.Errors.Select(e => e.Description));
                return new AuthResponseDto
                {
                    Success = false,
                    Message = "Kullanıcı durumu güncellenemedi: " + errors
                };
            }

            // Eğer pasif yapılıyorsa ilanları da pasif yap ve tokenları iptal et
            if (!user.IsActive)
            {
                await _listingRepository.UpdateUserListingsStatusAsync(userId, ListingStatus.Inactive);
                await _authRepository.RevokeAllUserRefreshTokensAsync(userId);
            }

            _logger.LogInformation("Kullanıcı durumu admin tarafından güncellendi: UserId={UserId}, NewStatus={Status}", userId, user.IsActive);

            return new AuthResponseDto
            {
                Success = true,
                Message = $"Kullanıcı durumu {(user.IsActive ? "Aktif" : "Pasif")} olarak güncellendi",
                User = MapToUserDto(user, true)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kullanıcı durumu togglenırken hata oluştu: UserId={UserId}", userId);
            return new AuthResponseDto
            {
                Success = false,
                Message = "İşlem sırasında bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Güvenli şifre sıfırlama token'ı oluştur
    /// </summary>
    private static string GeneratePasswordResetToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }
}
