using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealEstateAPI.DTOs.Cloudinary;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Listing;
using RealEstateAPI.Services.Cloudinary;
using RealEstateAPI.Services.Listing;

namespace RealEstateAPI.Controllers;

/// <summary>
/// Görsel Yükleme Controller
/// 
/// Cloudinary üzerinden görsel yükleme, silme ve yönetim işlemleri.
/// İlan görselleri için özel endpoint'ler içerir.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ImageUploadController : ControllerBase
{
    private readonly ICloudinaryService _cloudinaryService;
    private readonly IListingService _listingService;
    private readonly IListingRepository _listingRepository;
    private readonly ILogger<ImageUploadController> _logger;

    public ImageUploadController(
        ICloudinaryService cloudinaryService,
        IListingService listingService,
        IListingRepository listingRepository,
        ILogger<ImageUploadController> logger)
    {
        _cloudinaryService = cloudinaryService;
        _listingService = listingService;
        _listingRepository = listingRepository;
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
    // GENEL GÖRSEL YÜKLEME
    // ============================================================================

    /// <summary>
    /// Tek görsel yükle (Cloudinary'e)
    /// </summary>
    /// <param name="file">Yüklenecek görsel dosyası</param>
    /// <param name="folder">Opsiyonel klasör adı</param>
    /// <returns>Yükleme sonucu</returns>
    [HttpPost("upload")]
    [Authorize]
    [ProducesResponseType(typeof(CloudinaryUploadResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CloudinaryUploadResultDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadImage(IFormFile file, [FromQuery] string? folder = null)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new CloudinaryUploadResultDto
            {
                Success = false,
                Message = "Dosya seçilmedi"
            });
        }

        _logger.LogInformation("📤 Görsel yükleme isteği. Dosya: {FileName}, Boyut: {Size} bytes", 
            file.FileName, file.Length);

        var result = await _cloudinaryService.UploadImageAsync(file, folder);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    /// <summary>
    /// Birden fazla görsel yükle (Cloudinary'e)
    /// </summary>
    /// <param name="files">Yüklenecek görsel dosyaları</param>
    /// <param name="folder">Opsiyonel klasör adı</param>
    /// <returns>Yükleme sonuçları</returns>
    [HttpPost("upload-multiple")]
    [Authorize]
    [ProducesResponseType(typeof(CloudinaryMultiUploadResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CloudinaryMultiUploadResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadMultipleImages(List<IFormFile> files, [FromQuery] string? folder = null)
    {
        if (files == null || files.Count == 0)
        {
            return BadRequest(new CloudinaryMultiUploadResponseDto
            {
                Success = false,
                Message = "Dosya seçilmedi"
            });
        }

        // Maksimum 10 dosya sınırı
        if (files.Count > 10)
        {
            return BadRequest(new CloudinaryMultiUploadResponseDto
            {
                Success = false,
                Message = "Tek seferde en fazla 10 görsel yükleyebilirsiniz"
            });
        }

        _logger.LogInformation("📤 Çoklu görsel yükleme isteği. Dosya sayısı: {Count}", files.Count);

        var results = await _cloudinaryService.UploadImagesAsync(files, folder);

        var response = new CloudinaryMultiUploadResponseDto
        {
            Success = results.Any(r => r.Success),
            Message = $"{results.Count(r => r.Success)}/{files.Count} görsel başarıyla yüklendi",
            UploadedImages = results,
            SuccessCount = results.Count(r => r.Success),
            FailedCount = results.Count(r => !r.Success),
            TotalCount = files.Count
        };

        return Ok(response);
    }

    /// <summary>
    /// Görsel sil (Cloudinary'den)
    /// </summary>
    /// <param name="publicId">Cloudinary Public ID</param>
    /// <returns>Silme sonucu</returns>
    [HttpDelete("{publicId}")]
    [Authorize]
    [ProducesResponseType(typeof(CloudinaryDeleteResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CloudinaryDeleteResultDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteImage(string publicId)
    {
        if (string.IsNullOrEmpty(publicId))
        {
            return BadRequest(new CloudinaryDeleteResultDto
            {
                Success = false,
                Message = "Public ID gerekli"
            });
        }

        _logger.LogInformation("🗑️ Görsel silme isteği. PublicId: {PublicId}", publicId);

        var result = await _cloudinaryService.DeleteImageAsync(publicId);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    // ============================================================================
    // İLAN GÖRSELLERİ
    // ============================================================================

    /// <summary>
    /// İlana görsel yükle ve kaydet
    /// 
    /// Hem Cloudinary'e yükler hem de veritabanına kaydeder.
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <param name="file">Yüklenecek görsel</param>
    /// <param name="isCoverImage">Kapak fotoğrafı olarak ayarla</param>
    /// <param name="altText">Görsel açıklaması</param>
    /// <param name="displayOrder">Görüntüleme sırası</param>
    /// <returns>Yükleme sonucu</returns>
    [HttpPost("listing/{listingId}")]
    [Authorize]
    [ProducesResponseType(typeof(ListingImageUploadResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ListingImageUploadResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UploadListingImage(
        int listingId,
        IFormFile file,
        [FromQuery] bool isCoverImage = false,
        [FromQuery] string? altText = null,
        [FromQuery] int displayOrder = 0)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Yetki kontrolü - İlan sahibi mi?
        if (!await _listingRepository.IsOwnerAsync(listingId, userId))
        {
            _logger.LogWarning("⚠️ Yetkisiz görsel yükleme denemesi. UserId: {UserId}, ListingId: {ListingId}", 
                userId, listingId);
            return StatusCode(StatusCodes.Status403Forbidden, new ListingImageUploadResponseDto
            {
                Success = false,
                Message = "Bu ilana görsel ekleme yetkiniz yok"
            });
        }

        if (file == null || file.Length == 0)
        {
            return BadRequest(new ListingImageUploadResponseDto
            {
                Success = false,
                Message = "Dosya seçilmedi"
            });
        }

        _logger.LogInformation("📤 İlan görseli yükleniyor. ListingId: {ListingId}, Dosya: {FileName}", 
            listingId, file.FileName);

        // Cloudinary'e yükle (klasör: listings/{listingId})
        var folder = $"real-estate/listings/{listingId}";
        var uploadResult = await _cloudinaryService.UploadImageAsync(file, folder);

        if (!uploadResult.Success)
        {
            return BadRequest(new ListingImageUploadResponseDto
            {
                Success = false,
                Message = uploadResult.Message
            });
        }

        // Veritabanına kaydet
        var imageDto = new UploadImageDto
        {
            ImageUrl = uploadResult.SecureUrl ?? string.Empty,
            ThumbnailUrl = uploadResult.ThumbnailUrl,
            CloudinaryPublicId = uploadResult.PublicId,
            AltText = altText,
            IsCoverImage = isCoverImage,
            DisplayOrder = displayOrder
        };

        var addResult = await _listingService.AddImageAsync(listingId, imageDto, userId);

        if (!addResult.Success)
        {
            // Veritabanı kaydı başarısız olursa Cloudinary'den de sil
            if (!string.IsNullOrEmpty(uploadResult.PublicId))
            {
                await _cloudinaryService.DeleteImageAsync(uploadResult.PublicId);
            }

            return BadRequest(new ListingImageUploadResponseDto
            {
                Success = false,
                Message = addResult.Message
            });
        }

        _logger.LogInformation("✅ İlan görseli başarıyla eklendi. ListingId: {ListingId}, ImageId: {ImageId}", 
            listingId, addResult.Image?.Id);

        return Ok(new ListingImageUploadResponseDto
        {
            Success = true,
            Message = "Görsel başarıyla yüklendi",
            ImageId = addResult.Image?.Id,
            ImageUrl = uploadResult.SecureUrl,
            ThumbnailUrl = uploadResult.ThumbnailUrl,
            PublicId = uploadResult.PublicId
        });
    }

    /// <summary>
    /// İlana birden fazla görsel yükle
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <param name="files">Yüklenecek görseller</param>
    /// <returns>Yükleme sonuçları</returns>
    [HttpPost("listing/{listingId}/multiple")]
    [Authorize]
    [ProducesResponseType(typeof(CloudinaryMultiUploadResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(CloudinaryMultiUploadResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UploadMultipleListingImages(int listingId, List<IFormFile> files)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Yetki kontrolü
        if (!await _listingRepository.IsOwnerAsync(listingId, userId))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new CloudinaryMultiUploadResponseDto
            {
                Success = false,
                Message = "Bu ilana görsel ekleme yetkiniz yok"
            });
        }

        if (files == null || files.Count == 0)
        {
            return BadRequest(new CloudinaryMultiUploadResponseDto
            {
                Success = false,
                Message = "Dosya seçilmedi"
            });
        }

        // Maksimum 10 dosya sınırı
        if (files.Count > 10)
        {
            return BadRequest(new CloudinaryMultiUploadResponseDto
            {
                Success = false,
                Message = "Tek seferde en fazla 10 görsel yükleyebilirsiniz"
            });
        }

        _logger.LogInformation("📤 İlana çoklu görsel yükleniyor. ListingId: {ListingId}, Dosya sayısı: {Count}", 
            listingId, files.Count);

        var folder = $"real-estate/listings/{listingId}";
        var results = new List<CloudinaryUploadResultDto>();
        var successCount = 0;

        for (int i = 0; i < files.Count; i++)
        {
            var file = files[i];
            var uploadResult = await _cloudinaryService.UploadImageAsync(file, folder);

            if (uploadResult.Success)
            {
                // Veritabanına kaydet
                var imageDto = new UploadImageDto
                {
                    ImageUrl = uploadResult.SecureUrl ?? string.Empty,
                    ThumbnailUrl = uploadResult.ThumbnailUrl,
                    CloudinaryPublicId = uploadResult.PublicId,
                    AltText = null,
                    IsCoverImage = (i == 0 && successCount == 0), // İlk başarılı yüklemeyi kapak yap
                    DisplayOrder = i
                };

                var addResult = await _listingService.AddImageAsync(listingId, imageDto, userId);
                
                if (addResult.Success)
                {
                    successCount++;
                }
            }

            results.Add(uploadResult);
        }

        _logger.LogInformation("✅ İlana çoklu görsel yükleme tamamlandı. Başarılı: {Success}/{Total}", 
            successCount, files.Count);

        return Ok(new CloudinaryMultiUploadResponseDto
        {
            Success = successCount > 0,
            Message = $"{successCount}/{files.Count} görsel başarıyla yüklendi",
            UploadedImages = results,
            SuccessCount = successCount,
            FailedCount = files.Count - successCount,
            TotalCount = files.Count
        });
    }

    /// <summary>
    /// İlan görselini sil
    /// 
    /// Hem Cloudinary'den hem de veritabanından siler.
    /// </summary>
    /// <param name="listingId">İlan ID</param>
    /// <param name="imageId">Görsel ID</param>
    /// <returns>Silme sonucu</returns>
    [HttpDelete("listing/{listingId}/image/{imageId}")]
    [Authorize]
    [ProducesResponseType(typeof(ImageResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ImageResponseDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteListingImage(int listingId, int imageId)
    {
        var userId = GetCurrentUserId();
        if (string.IsNullOrEmpty(userId))
        {
            return Unauthorized();
        }

        // Yetki kontrolü
        if (!await _listingRepository.IsOwnerAsync(listingId, userId))
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ImageResponseDto
            {
                Success = false,
                Message = "Bu görseli silme yetkiniz yok"
            });
        }

        _logger.LogInformation("🗑️ İlan görseli siliniyor. ListingId: {ListingId}, ImageId: {ImageId}", 
            listingId, imageId);

        // Önce görsel bilgisini al
        var imagesResult = await _listingService.GetImagesAsync(listingId);
        var image = imagesResult.Images.FirstOrDefault(i => i.Id == imageId);

        if (image == null)
        {
            return BadRequest(new ImageResponseDto
            {
                Success = false,
                Message = "Görsel bulunamadı"
            });
        }

        // Cloudinary'den sil
        // Önce veritabanındaki PublicId'yi kontrol et, yoksa URL'den çıkar
        var publicId = image.CloudinaryPublicId ?? _cloudinaryService.GetPublicIdFromUrl(image.ImageUrl);
        if (!string.IsNullOrEmpty(publicId))
        {
            var cloudinaryDeleteResult = await _cloudinaryService.DeleteImageAsync(publicId);
            _logger.LogInformation("Cloudinary silme sonucu: {Result}", cloudinaryDeleteResult.Success);
        }

        // Veritabanından sil
        var deleteResult = await _listingService.DeleteImageAsync(listingId, imageId, userId);

        if (!deleteResult.Success)
        {
            return BadRequest(deleteResult);
        }

        return Ok(deleteResult);
    }
}

