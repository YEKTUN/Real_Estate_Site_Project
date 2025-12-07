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
            return Unauthorized(result);
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

        var user = await _authService.GetUserByIdAsync(userId);

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
}
