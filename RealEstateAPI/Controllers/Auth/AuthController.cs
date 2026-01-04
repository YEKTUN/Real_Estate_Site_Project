using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealEstateAPI.DTOs.Auth;
using RealEstateAPI.Services.Auth;

namespace RealEstateAPI.Controllers.Auth;

/**
 * Auth Controller
 * 
 * Kimlik doğrulama işlemleri için API endpoint'leri.
 * Login, Register, Refresh Token ve Logout işlemlerini yönetir.
 */
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Kullanıcı kayıt endpoint'i
    /// </summary>
    /// <param name="registerDto">Kayıt bilgileri</param>
    /// <returns>Kayıt sonucu, JWT token ve Refresh token</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        // Model validasyonu
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);

            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = string.Join(", ", errors)
            });
        }

        _logger.LogInformation("Kayıt isteği alındı: {Email}", registerDto.Email);

        var ipAddress = GetIpAddress();
        var result = await _authService.RegisterAsync(registerDto, ipAddress);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Kullanıcı giriş endpoint'i
    /// </summary>
    /// <param name="loginDto">Giriş bilgileri</param>
    /// <returns>Giriş sonucu, JWT token ve Refresh token</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        // Model validasyonu
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);

            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = string.Join(", ", errors)
            });
        }

        _logger.LogInformation("Giriş isteği alındı: {EmailOrUsername}", loginDto.EmailOrUsername);

        var ipAddress = GetIpAddress();
        var result = await _authService.LoginAsync(loginDto, ipAddress);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Token yenileme endpoint'i
    /// </summary>
    /// <param name="request">Refresh token</param>
    /// <returns>Yeni JWT token ve Refresh token</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken))
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "Refresh token gereklidir"
            });
        }

        _logger.LogInformation("Token yenileme isteği alındı");

        var ipAddress = GetIpAddress();
        var result = await _authService.RefreshTokenAsync(request.RefreshToken, ipAddress);

        if (!result.Success)
        {
            return Unauthorized(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Çıkış endpoint'i - Refresh token'ı iptal eder
    /// </summary>
    /// <param name="request">İptal edilecek refresh token</param>
    /// <returns>İşlem sonucu</returns>
    [HttpPost("logout")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto request)
    {
        if (string.IsNullOrEmpty(request.RefreshToken))
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "Refresh token gereklidir"
            });
        }

        _logger.LogInformation("Çıkış isteği alındı");

        var ipAddress = GetIpAddress();
        var result = await _authService.RevokeTokenAsync(request.RefreshToken, ipAddress);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Google OAuth ile giriş endpoint'i
    /// Frontend'den gelen Google ID Token'ı doğrular ve JWT token döner
    /// </summary>
    /// <param name="googleLoginDto">Google ID Token</param>
    /// <returns>Giriş sonucu, JWT token ve Refresh token</returns>
    [HttpPost("google")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto googleLoginDto)
    {
        // Model validasyonu
        if (string.IsNullOrEmpty(googleLoginDto.IdToken))
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "Google ID Token gereklidir"
            });
        }

        _logger.LogInformation("Google OAuth giriş isteği alındı");

        var ipAddress = GetIpAddress();
        var result = await _authService.GoogleLoginAsync(googleLoginDto, ipAddress);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Mevcut kullanıcı bilgilerini getir
    /// </summary>
    /// <returns>Kullanıcı bilgileri</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUser()
    {
        // JWT token'dan kullanıcı ID'sini al
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new AuthResponseDto
            {
                Success = false,
                Message = "Kullanıcı kimliği doğrulanamadı"
            });
        }

        var user = await _authService.GetUserByIdAsync(userId, userId);

        if (user == null)
        {
            return NotFound(new AuthResponseDto
            {
                Success = false,
                Message = "Kullanıcı bulunamadı"
            });
        }

        return Ok(new AuthResponseDto
        {
            Success = true,
            Message = "Kullanıcı bilgileri başarıyla getirildi",
            User = user
        });
    }

    /// <summary>
    /// Belirli bir kullanıcıyı ID'sine göre getir
    /// 
    /// Profil sayfalarında başka bir kullanıcının temel bilgilerini
    /// (ad, soyad, email, telefon, profil fotoğrafı) göstermek için kullanılır.
    /// Hassas bilgi içermediği için anonim erişime açıktır.
    /// </summary>
    /// <param name="id">Kullanıcı ID'si</param>
    /// <returns>Kullanıcı bilgileri</returns>
    [HttpGet("user/{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById(string id)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = "Kullanıcı ID'si gereklidir"
            });
        }

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _authService.GetUserByIdAsync(id, currentUserId);
        if (user == null)
        {
            return NotFound(new AuthResponseDto
            {
                Success = false,
                Message = "Kullanıcı bulunamadı"
            });
        }

        return Ok(new AuthResponseDto
        {
            Success = true,
            Message = "Kullanıcı bilgileri başarıyla getirildi",
            User = user
        });
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /// <summary>
    /// İstemci IP adresini al
    /// </summary>
    private string? GetIpAddress()
    {
        // X-Forwarded-For header'ı (proxy arkasında)
        if (Request.Headers.ContainsKey("X-Forwarded-For"))
        {
            return Request.Headers["X-Forwarded-For"].FirstOrDefault();
        }

        // Doğrudan bağlantı
        return HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString();
    }

    /// <summary>
    /// Mevcut kullanıcının profil fotoğrafını güncelle
    /// </summary>
    [HttpPut("profile-picture")]
    [Authorize]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateProfilePicture([FromBody] string profilePictureUrl)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _authService.UpdateProfilePictureAsync(userId, profilePictureUrl);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Şifre sıfırlama isteği - Email'e token gönderir
    /// </summary>
    /// <param name="forgetPasswordDto">Email adresi</param>
    /// <returns>İşlem sonucu</returns>
    [HttpPost("forget-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgetPassword([FromBody] ForgetPasswordDto forgetPasswordDto)
    {
        // Model validasyonu
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);

            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = string.Join(", ", errors)
            });
        }

        _logger.LogInformation("Şifre sıfırlama isteği alındı: {Email}", forgetPasswordDto.Email);

        var result = await _authService.ForgetPasswordAsync(forgetPasswordDto);

        // Güvenlik: Her zaman başarılı mesaj döndür (email enumeration saldırısını önlemek için)
        return Ok(result);
    }

    /// <summary>
    /// Şifre sıfırlama - Token ile yeni şifre belirleme
    /// </summary>
    /// <param name="resetPasswordDto">Token, email ve yeni şifre</param>
    /// <returns>İşlem sonucu</returns>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto resetPasswordDto)
    {
        // Model validasyonu
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);

            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = string.Join(", ", errors)
            });
        }

        _logger.LogInformation("Şifre sıfırlama işlemi başlatıldı: {Email}", resetPasswordDto.Email);

        var result = await _authService.ResetPasswordAsync(resetPasswordDto);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Şifre değiştirme - Mevcut şifre ile yeni şifre belirleme
    /// </summary>
    /// <param name="changePasswordDto">Mevcut şifre, yeni şifre ve yeni şifre tekrarı</param>
    /// <returns>İşlem sonucu</returns>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        // Model validasyonu
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage);

            return BadRequest(new AuthResponseDto
            {
                Success = false,
                Message = string.Join(", ", errors)
            });
        }

        // JWT token'dan kullanıcı ID'sini al
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new AuthResponseDto
            {
                Success = false,
                Message = "Kullanıcı kimliği doğrulanamadı"
            });
        }

        _logger.LogInformation("Şifre değiştirme isteği alındı: UserId={UserId}", userId);

        var result = await _authService.ChangePasswordAsync(userId, changePasswordDto);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Hesabı pasife al ve ilanlarını pasif yap (Hesap Silme)
    /// </summary>
    /// <returns>İşlem sonucu</returns>
    [HttpPost("deactivate")]
    [Authorize]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeactivateAccount()
    {
        // JWT token'dan kullanıcı ID'sini al
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized(new AuthResponseDto
            {
                Success = false,
                Message = "Kullanıcı kimliği doğrulanamadı"
            });
        }

        _logger.LogInformation("Hesap kapatma isteği alındı: UserId={UserId}", userId);

        var result = await _authService.DeactivateAccountAsync(userId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
