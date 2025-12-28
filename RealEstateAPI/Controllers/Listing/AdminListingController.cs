using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Services.Listing;
using System.Security.Claims;

namespace RealEstateAPI.Controllers.Listing;

/// <summary>
/// Admin ilan yönetimi controller'ı
/// </summary>
[ApiController]
[Route("api/admin/listings")]
[Authorize(Policy = "AdminOnly")]
public class AdminListingController : ControllerBase
{
    private readonly IListingService _listingService;
    private readonly ILogger<AdminListingController> _logger;

    public AdminListingController(IListingService listingService, ILogger<AdminListingController> logger)
    {
        _listingService = listingService;
        _logger = logger;
    }

    private string? GetAdminId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    [ProducesResponseType(typeof(ListingListResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get([FromQuery] string? searchTerm, [FromQuery] List<ListingStatus>? statuses,
        [FromQuery] string? city, [FromQuery] string? district, [FromQuery] string? ownerEmail,
        [FromQuery] ListingType? type, [FromQuery] ListingCategory? category,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        _logger.LogInformation("Admin ilan listesi isteği alındı. Statuses: {Statuses}, SearchTerm: {SearchTerm}, Page: {Page}, PageSize: {PageSize}", 
            statuses != null ? string.Join(",", statuses) : "null", 
            searchTerm ?? "null", 
            page, 
            pageSize);

        var filter = new AdminListingFilterDto
        {
            SearchTerm = searchTerm,
            Statuses = statuses,
            City = city,
            District = district,
            OwnerEmail = ownerEmail,
            Type = type,
            Category = category,
            Page = page,
            PageSize = pageSize
        };

        var result = await _listingService.GetForAdminAsync(filter);
        _logger.LogInformation("Admin ilan listesi isteği tamamlandı. Dönen ilan sayısı: {Count}, Toplam: {Total}", 
            result.Listings?.Count ?? 0, 
            result.Pagination?.TotalCount ?? 0);
            
        return Ok(result);
    }

    [HttpPatch("{id}/approve")]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Approve(int id, [FromQuery] bool auto = false)
    {
        var adminId = GetAdminId();
        if (string.IsNullOrEmpty(adminId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Admin onay isteği. ListingId: {ListingId}, AdminId: {AdminId}, Auto: {Auto}", id, adminId, auto);
        var result = await _listingService.UpdateStatusAsAdminAsync(id, ListingStatus.Active, adminId, autoApprove: auto);
        return Ok(result);
    }

    [HttpPatch("{id}/reject")]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Reject(int id, [FromBody] string? note = null)
    {
        var adminId = GetAdminId();
        if (string.IsNullOrEmpty(adminId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Admin red isteği. ListingId: {ListingId}, AdminId: {AdminId}", id, adminId);
        var result = await _listingService.UpdateStatusAsAdminAsync(id, ListingStatus.Rejected, adminId, note);
        return Ok(result);
    }

    /// <summary>
    /// Reddedilmiş ilanı tekrar aç (Pending durumuna döndür)
    /// </summary>
    [HttpPatch("{id}/reopen")]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Reopen(int id)
    {
        var adminId = GetAdminId();
        if (string.IsNullOrEmpty(adminId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Admin ilanı tekrar açma isteği. ListingId: {ListingId}, AdminId: {AdminId}", id, adminId);
        var result = await _listingService.UpdateStatusAsAdminAsync(id, ListingStatus.Pending, adminId);
        return Ok(result);
    }

    /// <summary>
    /// İlan durumunu güncelle (genel amaçlı - Active, Inactive, Pending vb.)
    /// </summary>
    [HttpPatch("{id}/status")]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] ListingStatus status)
    {
        var adminId = GetAdminId();
        if (string.IsNullOrEmpty(adminId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Admin ilan durumu güncelleme isteği. ListingId: {ListingId}, Status: {Status}, AdminId: {AdminId}", id, status, adminId);
        var result = await _listingService.UpdateStatusAsAdminAsync(id, status, adminId);
        return Ok(result);
    }

    /// <summary>
    /// İlan numarasına göre admin için detaylı ilan bilgisi getir
    /// </summary>
    [HttpGet("number/{listingNumber}")]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByListingNumber(string listingNumber)
    {
        var adminId = GetAdminId();
        if (string.IsNullOrEmpty(adminId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Admin ilan numarası ile detay isteği. ListingNumber: {ListingNumber}, AdminId: {AdminId}", listingNumber, adminId);
        var result = await _listingService.GetByListingNumberAsync(listingNumber, adminId);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }
}

