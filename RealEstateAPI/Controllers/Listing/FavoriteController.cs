using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Services.Listing;

namespace RealEstateAPI.Controllers.Listing;

/// <summary>
/// Favori Controller
/// 
/// Favori ilan işlemleri için endpoint'ler.
/// </summary>
[ApiController]
[Route("api/favorites")]
[Authorize]
public class FavoriteController : ControllerBase
{
    private readonly IFavoriteService _favoriteService;
    private readonly ILogger<FavoriteController> _logger;

    public FavoriteController(IFavoriteService favoriteService, ILogger<FavoriteController> logger)
    {
        _favoriteService = favoriteService;
        _logger = logger;
    }

    /// <summary>
    /// Mevcut kullanıcı ID'sini al
    /// </summary>
    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    // ============================================================================
    // FAVORİ İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Kullanıcının favorilerini getir
    /// </summary>
    /// <param name="page">Sayfa numarası</param>
    /// <param name="pageSize">Sayfa başına ilan sayısı</param>
    /// <returns>Favori listesi</returns>
    [HttpGet]
    [ProducesResponseType(typeof(FavoriteListResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyFavorites([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Favoriler isteği. UserId: {UserId}", userId);

        var result = await _favoriteService.GetMyFavoritesAsync(userId, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Favorilere ekle
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <param name="dto">Favori bilgileri (opsiyonel not)</param>
    /// <returns>İşlem sonucu</returns>
    [HttpPost("{listingId}")]
    [ProducesResponseType(typeof(FavoriteResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(FavoriteResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddToFavorites(int listingId, [FromBody] AddFavoriteDto? dto = null)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Favoriye ekleme isteği. ListingId: {ListingId}, UserId: {UserId}", listingId, userId);

        var result = await _favoriteService.AddToFavoritesAsync(listingId, dto, userId);
        
        if (!result.Success && !result.IsFavorited)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Favorilerden kaldır
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <returns>İşlem sonucu</returns>
    [HttpDelete("{listingId}")]
    [ProducesResponseType(typeof(FavoriteResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(FavoriteResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RemoveFromFavorites(int listingId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Favoriden kaldırma isteği. ListingId: {ListingId}, UserId: {UserId}", listingId, userId);

        var result = await _favoriteService.RemoveFromFavoritesAsync(listingId, userId);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Favori toggle (varsa kaldır, yoksa ekle)
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <returns>İşlem sonucu</returns>
    [HttpPost("{listingId}/toggle")]
    [ProducesResponseType(typeof(FavoriteResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(FavoriteResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ToggleFavorite(int listingId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Favori toggle isteği. ListingId: {ListingId}, UserId: {UserId}", listingId, userId);

        var result = await _favoriteService.ToggleFavoriteAsync(listingId, userId);
        return Ok(result);
    }

    /// <summary>
    /// Favori notunu güncelle
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <param name="dto">Not bilgisi</param>
    /// <returns>İşlem sonucu</returns>
    [HttpPatch("{listingId}/note")]
    [ProducesResponseType(typeof(FavoriteResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(FavoriteResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateNote(int listingId, [FromBody] UpdateFavoriteNoteDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Favori not güncelleme isteği. ListingId: {ListingId}, UserId: {UserId}", listingId, userId);

        var result = await _favoriteService.UpdateNoteAsync(listingId, dto, userId);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// İlan favori mi kontrol et
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <returns>Favori durumu</returns>
    [HttpGet("{listingId}/check")]
    [ProducesResponseType(typeof(FavoriteResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CheckFavorite(int listingId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var isFavorited = await _favoriteService.IsFavoritedAsync(listingId, userId);

        return Ok(new FavoriteResponseDto
        {
            Success = true,
            Message = isFavorited ? "İlan favorilerde" : "İlan favorilerde değil",
            IsFavorited = isFavorited
        });
    }
}
