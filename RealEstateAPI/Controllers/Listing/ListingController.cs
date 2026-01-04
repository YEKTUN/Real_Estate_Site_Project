using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Services.Listing;

namespace RealEstateAPI.Controllers.Listing;

/// <summary>
/// İlan Controller
/// 
/// Emlak ilanları için CRUD işlemleri, arama, filtreleme ve listeleme endpoint'leri.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ListingController : ControllerBase
{
    private readonly IListingService _listingService;
    private readonly ILogger<ListingController> _logger;
    private readonly UserManager<ApplicationUser> _userManager;

    public ListingController(
        IListingService listingService, 
        ILogger<ListingController> logger,
        UserManager<ApplicationUser> userManager)
    {
        _listingService = listingService;
        _logger = logger;
        _userManager = userManager;
    }

    /// <summary>
    /// Mevcut kullanıcı ID'sini al
    /// </summary>
    private string? GetCurrentUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    // ============================================================================
    // İLAN CRUD İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Yeni ilan oluştur
    /// </summary>
    /// <param name="dto">İlan bilgileri</param>
    /// <returns>Oluşturulan ilan bilgisi</returns>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create([FromBody] CreateListingDto dto)
    {
        // ModelState validation kontrolü - detaylı hata loglama
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .SelectMany(x => x.Value!.Errors.Select(e => $"{x.Key}: {e.ErrorMessage}"))
                .ToList();

            var errorMessage = string.Join("; ", errors);
            
            _logger.LogWarning("İlan oluşturma validation hatası. Hatalar: {Errors}", errorMessage);
            
            return BadRequest(new ListingResponseDto
            {
                Success = false,
                Message = $"Geçersiz veri: {errorMessage}"
            });
        }

        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("İlan oluşturma hatası: Kullanıcı kimliği bulunamadı");
            return Unauthorized();
        }

        // Telefon doğrulama kontrolü
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("İlan oluşturma hatası: Kullanıcı bulunamadı. UserId: {UserId}", userId);
            return Unauthorized();
        }

        if (!user.PhoneVerified)
        {
            _logger.LogWarning("İlan oluşturma hatası: Telefon doğrulanmamış. UserId: {UserId}", userId);
            return BadRequest(new ListingResponseDto
            {
                Success = false,
                Message = "İlan oluşturmak için telefon numaranızı doğrulamanız gerekmektedir.",
                RequiresPhoneVerification = true
            });
        }

        _logger.LogInformation("İlan oluşturma isteği. UserId: {UserId}, DTO: {@Dto}", userId, dto);

        var result = await _listingService.CreateAsync(dto, userId);
        
        if (!result.Success)
        {
            _logger.LogWarning("İlan oluşturma başarısız. UserId: {UserId}, Hata: {Message}", userId, result.Message);
            return BadRequest(result);
        }

        _logger.LogInformation("İlan başarıyla oluşturuldu. ListingId: {ListingId}, UserId: {UserId}", 
            result.Listing?.Id, userId);
        
        return Ok(result);
    }

    /// <summary>
    /// İlan güncelle
    /// </summary>
    /// <param name="id">İlan ID</param>
    /// <param name="dto">Güncellenecek bilgiler</param>
    /// <returns>Güncellenmiş ilan bilgisi</returns>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateListingDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("İlan güncelleme isteği. ListingId: {ListingId}, UserId: {UserId}", id, userId);

        var result = await _listingService.UpdateAsync(id, dto, userId);
        
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
    /// İlan sil
    /// </summary>
    /// <param name="id">İlan ID</param>
    /// <returns>Silme sonucu</returns>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("İlan silme isteği. ListingId: {ListingId}, UserId: {UserId}", id, userId);

        var result = await _listingService.DeleteAsync(id, userId);
        
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
    /// İlan detayı getir
    /// </summary>
    /// <param name="id">İlan ID</param>
    /// <returns>İlan detayları</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var userId = GetCurrentUserId();
        
        _logger.LogInformation("İlan detay isteği. ListingId: {ListingId}", id);

        var result = await _listingService.GetByIdAsync(id, userId);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// İlan numarasına göre getir
    /// </summary>
    /// <param name="listingNumber">İlan numarası</param>
    /// <returns>İlan detayları</returns>
    [HttpGet("number/{listingNumber}")]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetByListingNumber(string listingNumber)
    {
        var userId = GetCurrentUserId();
        
        _logger.LogInformation("İlan numarası ile detay isteği. ListingNumber: {ListingNumber}", listingNumber);

        var result = await _listingService.GetByListingNumberAsync(listingNumber, userId);
        
        if (!result.Success)
        {
            return NotFound(result);
        }

        return Ok(result);
    }

    // ============================================================================
    // İLAN LİSTELEME & ARAMA
    // ============================================================================

    /// <summary>
    /// Tüm ilanları listele
    /// </summary>
    /// <param name="page">Sayfa numarası</param>
    /// <param name="pageSize">Sayfa başına ilan sayısı</param>
    /// <returns>İlan listesi</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ListingListResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        _logger.LogInformation("İlan listesi isteği. Page: {Page}, PageSize: {PageSize}", page, pageSize);

        var result = await _listingService.GetAllAsync(page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// İlan ara ve filtrele
    /// </summary>
    /// <param name="searchDto">Arama ve filtreleme kriterleri</param>
    /// <returns>Filtrelenmiş ilan listesi</returns>
    [HttpPost("search")]
    [ProducesResponseType(typeof(ListingListResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromBody] ListingSearchDto searchDto)
    {
        _logger.LogInformation("İlan arama isteği. SearchTerm: {SearchTerm}", searchDto.SearchTerm);

        var result = await _listingService.SearchAsync(searchDto);
        return Ok(result);
    }

    /// <summary>
    /// Kullanıcının kendi ilanlarını getir
    /// </summary>
    /// <param name="page">Sayfa numarası</param>
    /// <param name="pageSize">Sayfa başına ilan sayısı</param>
    /// <returns>Kullanıcının ilanları</returns>
    [HttpGet("my-listings")]
    [Authorize]
    [ProducesResponseType(typeof(ListingListResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyListings([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Kullanıcı ilanları isteği. UserId: {UserId}", userId);

        var result = await _listingService.GetMyListingsAsync(userId, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Belirli bir kullanıcının ilanlarını getir
    /// 
    /// Profil sayfalarında başka bir kullanıcının aktif/pasif ilanlarını
    /// listelemek için kullanılır. Kullanıcı kimliği JWT'den değil,
    /// route parametresinden alınır.
    /// </summary>
    /// <param name="userId">İlanları listelenecek kullanıcı ID'si</param>
    /// <param name="page">Sayfa numarası</param>
    /// <param name="pageSize">Sayfa boyutu</param>
    /// <returns>Kullanıcının ilanları</returns>
    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ListingListResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetListingsByUser(
        string userId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new ListingListResponseDto
            {
                Success = false,
                Message = "Kullanıcı ID'si gereklidir",
                Listings = new List<ListingListDto>(),
                Pagination = new PaginationDto
                {
                    CurrentPage = 1,
                    PageSize = pageSize,
                    TotalCount = 0,
                    TotalPages = 0,
                }
            });
        }

        var result = await _listingService.GetMyListingsAsync(userId, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Öne çıkan ilanları getir
    /// </summary>
    /// <param name="count">İlan sayısı</param>
    /// <returns>Öne çıkan ilanlar</returns>
    [HttpGet("featured")]
    [ProducesResponseType(typeof(ListingListResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFeatured([FromQuery] int count = 10)
    {
        var result = await _listingService.GetFeaturedAsync(count);
        return Ok(result);
    }

    /// <summary>
    /// Son eklenen ilanları getir
    /// </summary>
    /// <param name="count">İlan sayısı</param>
    /// <returns>Son eklenen ilanlar</returns>
    [HttpGet("latest")]
    [ProducesResponseType(typeof(ListingListResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLatest([FromQuery] int count = 10)
    {
        var result = await _listingService.GetLatestAsync(count);
        return Ok(result);
    }

    /// <summary>
    /// Benzer ilanları getir
    /// </summary>
    /// <param name="id">İlan ID</param>
    /// <param name="count">İlan sayısı</param>
    /// <returns>Benzer ilanlar</returns>
    [HttpGet("{id}/similar")]
    [ProducesResponseType(typeof(ListingListResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSimilar(int id, [FromQuery] int count = 6)
    {
        var result = await _listingService.GetSimilarAsync(id, count);
        return Ok(result);
    }

    // ============================================================================
    // İLAN DURUMU
    // ============================================================================

    /// <summary>
    /// İlan durumunu güncelle
    /// </summary>
    /// <param name="id">İlan ID</param>
    /// <param name="status">Yeni durum</param>
    /// <returns>Güncelleme sonucu</returns>
    [HttpPatch("{id}/status")]
    [Authorize]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ListingResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] ListingStatus status)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("İlan durumu güncelleme isteği. ListingId: {ListingId}, Status: {Status}", id, status);

        var result = await _listingService.UpdateStatusAsync(id, status, userId);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    // ============================================================================
    // GÖRSEL İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// İlana görsel ekle
    /// </summary>
    /// <param name="id">İlan ID</param>
    /// <param name="dto">Görsel bilgileri</param>
    /// <returns>Eklenen görsel</returns>
    [HttpPost("{id}/images")]
    [Authorize]
    [ProducesResponseType(typeof(ImageResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ImageResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AddImage(int id, [FromBody] UploadImageDto dto)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Görsel ekleme isteği. ListingId: {ListingId}", id);

        var result = await _listingService.AddImageAsync(id, dto, userId);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Görsel sil
    /// </summary>
    /// <param name="id">İlan ID</param>
    /// <param name="imageId">Görsel ID</param>
    /// <returns>Silme sonucu</returns>
    [HttpDelete("{id}/images/{imageId}")]
    [Authorize]
    [ProducesResponseType(typeof(ImageResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ImageResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteImage(int id, int imageId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Görsel silme isteği. ListingId: {ListingId}, ImageId: {ImageId}", id, imageId);

        var result = await _listingService.DeleteImageAsync(id, imageId, userId);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Kapak fotoğrafını değiştir
    /// </summary>
    /// <param name="id">İlan ID</param>
    /// <param name="imageId">Görsel ID</param>
    /// <returns>Değiştirme sonucu</returns>
    [HttpPatch("{id}/images/{imageId}/cover")]
    [Authorize]
    [ProducesResponseType(typeof(ImageResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ImageResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SetCoverImage(int id, int imageId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        _logger.LogInformation("Kapak fotoğrafı değiştirme isteği. ListingId: {ListingId}, ImageId: {ImageId}", id, imageId);

        var result = await _listingService.SetCoverImageAsync(id, imageId, userId);
        
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// İlanın görsellerini getir
    /// </summary>
    /// <param name="id">İlan ID</param>
    /// <returns>Görsel listesi</returns>
    [HttpGet("{id}/images")]
    [ProducesResponseType(typeof(ImageListResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetImages(int id)
    {
        var result = await _listingService.GetImagesAsync(id);
        return Ok(result);
    }
}
