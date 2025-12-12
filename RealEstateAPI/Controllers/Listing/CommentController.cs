using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Services.Listing;

namespace RealEstateAPI.Controllers.Listing;

/// <summary>
/// Yorum Controller
/// 
/// İlan yorumları için CRUD işlemleri.
/// </summary>
[ApiController]
[Route("api/listings/{listingId}/comments")]
public class CommentController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly ILogger<CommentController> _logger;

    public CommentController(ICommentService commentService, ILogger<CommentController> logger)
    {
        _commentService = commentService;
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
    // YORUM CRUD İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// İlanın yorumlarını getir
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <returns>Yorum listesi</returns>
    [HttpGet]
    [ProducesResponseType(typeof(CommentListResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetComments(int listingId)
    {
        var userId = GetCurrentUserId();
        
        _logger.LogInformation("Yorumlar isteği. ListingId: {ListingId}", listingId);

        var result = await _commentService.GetByListingIdAsync(listingId, userId);
        return Ok(result);
    }

    /// <summary>
    /// Yorum ekle
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <param name="dto">Yorum bilgileri</param>
    /// <returns>Eklenen yorum</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateComment(int listingId, [FromBody] CreateCommentDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new CommentResponseDto
            {
                Success = false,
                Message = "Geçersiz veri"
            });
        }

        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Yorum ekleme isteği. ListingId: {ListingId}, UserId: {UserId}", listingId, userId);

        var result = await _commentService.CreateAsync(listingId, dto, userId);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Yorum güncelle
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <param name="commentId">Yorum ID</param>
    /// <param name="dto">Güncellenecek bilgiler</param>
    /// <returns>Güncellenmiş yorum</returns>
    [HttpPut("{commentId}")]
    [Authorize]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateComment(int listingId, int commentId, [FromBody] UpdateCommentDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new CommentResponseDto
            {
                Success = false,
                Message = "Geçersiz veri"
            });
        }

        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Yorum güncelleme isteği. CommentId: {CommentId}, UserId: {UserId}", commentId, userId);

        var result = await _commentService.UpdateAsync(commentId, dto, userId);
        
        if (!result.Success)
        {
            if (result.Message.Contains("yetkiniz"))
            {
                return StatusCode(StatusCodes.Status403Forbidden, result);
            }
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Yorum sil
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <param name="commentId">Yorum ID</param>
    /// <returns>Silme sonucu</returns>
    [HttpDelete("{commentId}")]
    [Authorize]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CommentResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteComment(int listingId, int commentId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Yorum silme isteği. CommentId: {CommentId}, UserId: {UserId}", commentId, userId);

        var result = await _commentService.DeleteAsync(commentId, userId);
        
        if (!result.Success)
        {
            if (result.Message.Contains("yetkiniz"))
            {
                return StatusCode(StatusCodes.Status403Forbidden, result);
            }
            return BadRequest(result);
        }

        return Ok(result);
    }
}

/// <summary>
/// Kullanıcı Yorumları Controller
/// 
/// Kullanıcının kendi yorumlarını yönetmek için.
/// </summary>
[ApiController]
[Route("api/my-comments")]
[Authorize]
public class MyCommentsController : ControllerBase
{
    private readonly ICommentService _commentService;
    private readonly ILogger<MyCommentsController> _logger;

    public MyCommentsController(ICommentService commentService, ILogger<MyCommentsController> logger)
    {
        _commentService = commentService;
        _logger = logger;
    }

    /// <summary>
    /// Mevcut kullanıcı ID'sini al
    /// </summary>
    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    /// <summary>
    /// Kullanıcının tüm yorumlarını getir
    /// </summary>
    /// <returns>Kullanıcının yorumları</returns>
    [HttpGet]
    [ProducesResponseType(typeof(CommentListResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyComments()
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Kullanıcı yorumları isteği. UserId: {UserId}", userId);

        var result = await _commentService.GetMyCommentsAsync(userId);
        return Ok(result);
    }
}
