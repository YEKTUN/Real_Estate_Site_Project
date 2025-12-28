using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Services.Listing;
using System.Security.Claims;

namespace RealEstateAPI.Controllers.Listing;

[ApiController]
[Route("api/messages")]
[Authorize]
public class MessageController : ControllerBase
{
    private readonly IMessageService _messageService;
    private readonly ILogger<MessageController> _logger;

    public MessageController(IMessageService messageService, ILogger<MessageController> logger)
    {
        _messageService = messageService;
        _logger = logger;
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    /// <summary>
    /// Mesaj kutum (gelen/giden threadler)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ListingThreadListResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetThreads()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _messageService.GetThreadsAsync(userId);
        return Ok(result);
    }

    /// <summary>
    /// Thread mesajlarını getir
    /// </summary>
    [HttpGet("{threadId:int}")]
    [ProducesResponseType(typeof(ListingMessageListResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMessages(int threadId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _messageService.GetMessagesAsync(threadId, userId);
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// İlan sahibine mesaj/teklif gönder
    /// </summary>
    [HttpPost("listing/{listingId:int}")]
    [ProducesResponseType(typeof(ListingMessageResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendMessage(int listingId, [FromBody] CreateListingMessageDto dto)
    {
        _logger.LogInformation("SendMessage endpoint çağrıldı. ListingId: {ListingId}", listingId);
        _logger.LogInformation("Request body: Content: {Content}, IsOffer: {IsOffer}, OfferPrice: {OfferPrice}, AttachmentUrl: {AttachmentUrl}, AttachmentType: {AttachmentType}, AttachmentFileName: {AttachmentFileName}, AttachmentFileSize: {AttachmentFileSize}",
            dto.Content, dto.IsOffer, dto.OfferPrice, dto.AttachmentUrl, dto.AttachmentType, dto.AttachmentFileName, dto.AttachmentFileSize);

        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("Kullanıcı kimliği bulunamadı");
            return Unauthorized();
        }

        _logger.LogInformation("Kullanıcı kimliği: {UserId}", userId);

        try
        {
            var result = await _messageService.SendMessageAsync(listingId, userId, dto);
            if (!result.Success)
            {
                _logger.LogWarning("Mesaj gönderme başarısız: {Message}", result.Message);
                return BadRequest(result);
            }

            _logger.LogInformation("Mesaj başarıyla gönderildi. MessageId: {MessageId}", result.Data?.Id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Mesaj gönderme sırasında beklenmeyen hata oluştu. ListingId: {ListingId}, UserId: {UserId}", listingId, userId);
            return StatusCode(500, new ListingMessageResponseDto 
            { 
                Success = false, 
                Message = "Mesaj gönderilirken bir hata oluştu: " + ex.Message 
            });
        }
    }

    /// <summary>
    /// Bir mesajı okundu olarak işaretle
    /// </summary>
    [HttpPatch("{messageId:int}/read")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkMessageAsRead(int messageId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var result = await _messageService.MarkMessageAsReadAsync(messageId, userId);
        if (!result)
        {
            return NotFound(new { success = false, message = "Mesaj bulunamadı veya erişim yetkiniz yok" });
        }

        return Ok(new { success = true, message = "Mesaj okundu olarak işaretlendi" });
    }

    /// <summary>
    /// Bir mesajlaşma thread'ini ve içindeki mesajları kalıcı olarak sil
    /// </summary>
    [HttpDelete("{threadId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteThread(int threadId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        var deleted = await _messageService.DeleteThreadAsync(threadId, userId);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }
}

