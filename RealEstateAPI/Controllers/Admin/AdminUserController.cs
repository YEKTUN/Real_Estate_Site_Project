using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealEstateAPI.DTOs.Auth;
using RealEstateAPI.Services.Auth;

namespace RealEstateAPI.Controllers.Admin;

/// <summary>
/// Admin kullanıcı yönetimi controller'ı
/// </summary>
[ApiController]
[Route("api/admin/users")]
[Authorize(Policy = "AdminOnly")]
public class AdminUserController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AdminUserController> _logger;

    public AdminUserController(IAuthService authService, ILogger<AdminUserController> logger)
    {
        _authService = authService;
        _logger = logger;
        _logger.LogInformation("AdminUserController başlatıldı.");
    }

    [HttpGet("test")]
    [AllowAnonymous]
    public IActionResult Test()
    {
        return Ok("AdminUserController aktif");
    }

    /// <summary>
    /// Email adresine göre kullanıcı ara
    /// </summary>
    [HttpGet("find-user-by-email")]
    public async Task<IActionResult> FindByEmail([FromQuery] string email)
    {
        _logger.LogInformation("FindByEmail isteği alındı. Email: {Email}", email);

        if (string.IsNullOrWhiteSpace(email))
        {
            _logger.LogWarning("FindByEmail: Email adresi boş.");
            return BadRequest(new { Message = "Email adresi boş olamaz" });
        }

        var result = await _authService.GetUserBySearchAsync(email);
        _logger.LogInformation("FindByEmail sonucu: Success={Success}, Message={Message}", result.Success, result.Message);

        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Kullanıcının aktiflik durumunu değiştir
    /// </summary>
    [HttpPatch("{userId}/toggle-status")]
    public async Task<IActionResult> ToggleStatus(string userId)
    {
        var result = await _authService.ToggleUserStatusAsync(userId);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
