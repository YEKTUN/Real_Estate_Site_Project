using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RealEstateAPI.DTOs.Cloudinary;
using RealEstateAPI.Helpers;

namespace RealEstateAPI.Services.Cloudinary;

/// <summary>
/// Cloudinary Service Implementasyonu
/// 
/// Cloudinary ile görsel yükleme, silme ve yönetim işlemlerini gerçekleştirir.
/// CloudinaryDotNet kütüphanesini kullanır.
/// </summary>
public class CloudinaryService : ICloudinaryService
{
    private readonly CloudinaryDotNet.Cloudinary _cloudinary;
    private readonly CloudinarySettings _settings;
    private readonly ILogger<CloudinaryService> _logger;

    public CloudinaryService(
        IOptions<CloudinarySettings> settings,
        ILogger<CloudinaryService> logger)
    {
        _settings = settings.Value;
        _logger = logger;

        // Cloudinary hesap bilgilerini doğrula
        if (string.IsNullOrEmpty(_settings.CloudName) ||
            string.IsNullOrEmpty(_settings.ApiKey) ||
            string.IsNullOrEmpty(_settings.ApiSecret))
        {
            _logger.LogError("❌ Cloudinary ayarları eksik! CloudName, ApiKey ve ApiSecret gerekli.");
            throw new ArgumentException("Cloudinary ayarları eksik. appsettings.json dosyasını kontrol edin.");
        }

        // Cloudinary client'ı oluştur
        var account = new Account(
            _settings.CloudName,
            _settings.ApiKey,
            _settings.ApiSecret
        );

        _cloudinary = new CloudinaryDotNet.Cloudinary(account);
        _cloudinary.Api.Secure = true; // HTTPS kullan

        _logger.LogInformation("✅ Cloudinary servisi başlatıldı. CloudName: {CloudName}", _settings.CloudName);
    }

    // ============================================================================
    // GÖRSEL YÜKLEME
    // ============================================================================

    /// <summary>
    /// Tek bir görsel yükle
    /// </summary>
    public async Task<CloudinaryUploadResultDto> UploadImageAsync(IFormFile file, string? folder = null)
    {
        try
        {
            _logger.LogInformation("📤 Görsel yükleniyor: {FileName}", file.FileName);

            // Dosya doğrulama
            var validationError = ValidateFile(file);
            if (validationError != null)
            {
                _logger.LogWarning("⚠️ Dosya doğrulama hatası: {Error}", validationError);
                return new CloudinaryUploadResultDto
                {
                    Success = false,
                    Message = validationError
                };
            }

            // Yükleme için klasör belirle
            var uploadFolder = folder ?? _settings.DefaultFolder ?? "real-estate/listings";

            // Yükleme parametrelerini ayarla
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, file.OpenReadStream()),
                Folder = uploadFolder,
                UseFilename = true,
                UniqueFilename = true,
                Overwrite = false,
                Transformation = new Transformation()
                    .Quality("auto")           // Otomatik kalite optimizasyonu
                    .FetchFormat("auto")       // Otomatik format (WebP, AVIF vb.)
            };

            // Cloudinary'e yükle
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            // Sonucu kontrol et
            if (uploadResult.Error != null)
            {
                _logger.LogError("❌ Cloudinary yükleme hatası: {Error}", uploadResult.Error.Message);
                return new CloudinaryUploadResultDto
                {
                    Success = false,
                    Message = $"Cloudinary hatası: {uploadResult.Error.Message}"
                };
            }

            // Thumbnail URL oluştur
            var thumbnailUrl = GenerateThumbnailUrl(uploadResult.SecureUrl.ToString(), 300, 200);

            _logger.LogInformation("✅ Görsel başarıyla yüklendi. PublicId: {PublicId}", uploadResult.PublicId);

            return new CloudinaryUploadResultDto
            {
                Success = true,
                Message = "Görsel başarıyla yüklendi",
                PublicId = uploadResult.PublicId,
                SecureUrl = uploadResult.SecureUrl?.ToString(),
                Url = uploadResult.Url?.ToString(),
                ThumbnailUrl = thumbnailUrl,
                Width = uploadResult.Width,
                Height = uploadResult.Height,
                FileSize = uploadResult.Bytes,
                Format = uploadResult.Format,
                UploadedAt = DateTime.UtcNow,
                OriginalFileName = file.FileName
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Görsel yükleme sırasında beklenmeyen hata");
            return new CloudinaryUploadResultDto
            {
                Success = false,
                Message = "Görsel yüklenirken bir hata oluştu"
            };
        }
    }

    /// <summary>
    /// Birden fazla görsel yükle
    /// </summary>
    public async Task<List<CloudinaryUploadResultDto>> UploadImagesAsync(List<IFormFile> files, string? folder = null)
    {
        _logger.LogInformation("📤 Çoklu görsel yükleme başlatıldı. Dosya sayısı: {Count}", files.Count);

        var results = new List<CloudinaryUploadResultDto>();

        // Paralel yükleme için task listesi
        var uploadTasks = files.Select(file => UploadImageAsync(file, folder)).ToList();
        
        // Tüm yüklemeleri bekle
        var uploadResults = await Task.WhenAll(uploadTasks);
        results.AddRange(uploadResults);

        var successCount = results.Count(r => r.Success);
        _logger.LogInformation("✅ Çoklu yükleme tamamlandı. Başarılı: {Success}/{Total}", successCount, files.Count);

        return results;
    }

    // ============================================================================
    // GÖRSEL SİLME
    // ============================================================================

    /// <summary>
    /// Görsel sil (Public ID ile)
    /// </summary>
    public async Task<CloudinaryDeleteResultDto> DeleteImageAsync(string publicId)
    {
        try
        {
            _logger.LogInformation("🗑️ Görsel siliniyor. PublicId: {PublicId}", publicId);

            if (string.IsNullOrEmpty(publicId))
            {
                return new CloudinaryDeleteResultDto
                {
                    Success = false,
                    Message = "Public ID boş olamaz"
                };
            }

            var deleteParams = new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image
            };

            var result = await _cloudinary.DestroyAsync(deleteParams);

            if (result.Result == "ok")
            {
                _logger.LogInformation("✅ Görsel başarıyla silindi. PublicId: {PublicId}", publicId);
                return new CloudinaryDeleteResultDto
                {
                    Success = true,
                    Message = "Görsel başarıyla silindi",
                    PublicId = publicId
                };
            }
            else
            {
                _logger.LogWarning("⚠️ Görsel silinemedi. PublicId: {PublicId}, Result: {Result}", publicId, result.Result);
                return new CloudinaryDeleteResultDto
                {
                    Success = false,
                    Message = $"Görsel silinemedi: {result.Result}",
                    PublicId = publicId
                };
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Görsel silme sırasında hata. PublicId: {PublicId}", publicId);
            return new CloudinaryDeleteResultDto
            {
                Success = false,
                Message = "Görsel silinirken bir hata oluştu",
                PublicId = publicId
            };
        }
    }

    /// <summary>
    /// Birden fazla görsel sil
    /// </summary>
    public async Task<List<CloudinaryDeleteResultDto>> DeleteImagesAsync(List<string> publicIds)
    {
        _logger.LogInformation("🗑️ Çoklu görsel silme başlatıldı. Sayı: {Count}", publicIds.Count);

        var results = new List<CloudinaryDeleteResultDto>();

        foreach (var publicId in publicIds)
        {
            var result = await DeleteImageAsync(publicId);
            results.Add(result);
        }

        var successCount = results.Count(r => r.Success);
        _logger.LogInformation("✅ Çoklu silme tamamlandı. Başarılı: {Success}/{Total}", successCount, publicIds.Count);

        return results;
    }

    // ============================================================================
    // URL İŞLEMLERİ
    // ============================================================================

    /// <summary>
    /// Görsel URL'inden Public ID çıkar
    /// </summary>
    public string GetPublicIdFromUrl(string imageUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl))
            {
                return string.Empty;
            }

            // Cloudinary URL formatı: 
            // https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
            // veya
            // https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}.{format}

            var uri = new Uri(imageUrl);
            var path = uri.AbsolutePath;

            // "/image/upload/" kısmından sonrasını al
            var uploadIndex = path.IndexOf("/upload/", StringComparison.OrdinalIgnoreCase);
            if (uploadIndex < 0)
            {
                return string.Empty;
            }

            var afterUpload = path.Substring(uploadIndex + 8); // "/upload/" = 8 karakter

            // Version (v1234567890) varsa atla
            if (afterUpload.StartsWith("v") && afterUpload.Length > 1)
            {
                var slashIndex = afterUpload.IndexOf('/');
                if (slashIndex > 0)
                {
                    afterUpload = afterUpload.Substring(slashIndex + 1);
                }
            }

            // Dosya uzantısını kaldır
            var lastDotIndex = afterUpload.LastIndexOf('.');
            if (lastDotIndex > 0)
            {
                afterUpload = afterUpload.Substring(0, lastDotIndex);
            }

            return afterUpload;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "URL'den Public ID çıkarılamadı: {Url}", imageUrl);
            return string.Empty;
        }
    }

    /// <summary>
    /// Thumbnail URL oluştur
    /// </summary>
    public string GenerateThumbnailUrl(string imageUrl, int width = 300, int height = 200)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl))
            {
                return string.Empty;
            }

            // Cloudinary transformation URL'i oluştur
            // https://res.cloudinary.com/{cloud}/image/upload/c_fill,w_300,h_200/{public_id}
            
            var publicId = GetPublicIdFromUrl(imageUrl);
            if (string.IsNullOrEmpty(publicId))
            {
                return imageUrl;
            }

            var transformation = new Transformation()
                .Width(width)
                .Height(height)
                .Crop("fill")
                .Gravity("auto")
                .Quality("auto")
                .FetchFormat("auto");

            return _cloudinary.Api.UrlImgUp
                .Transform(transformation)
                .Secure(true)
                .BuildUrl(publicId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Thumbnail URL oluşturulamadı: {Url}", imageUrl);
            return imageUrl;
        }
    }

    /// <summary>
    /// Optimize edilmiş görsel URL'i oluştur
    /// </summary>
    public string GenerateOptimizedUrl(string imageUrl, int quality = 80)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl))
            {
                return string.Empty;
            }

            var publicId = GetPublicIdFromUrl(imageUrl);
            if (string.IsNullOrEmpty(publicId))
            {
                return imageUrl;
            }

            var transformation = new Transformation()
                .Quality(quality)
                .FetchFormat("auto");

            return _cloudinary.Api.UrlImgUp
                .Transform(transformation)
                .Secure(true)
                .BuildUrl(publicId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Optimize edilmiş URL oluşturulamadı: {Url}", imageUrl);
            return imageUrl;
        }
    }

    // ============================================================================
    // DOSYA DOĞRULAMA
    // ============================================================================

    /// <summary>
    /// Dosya doğrulama
    /// </summary>
    private string? ValidateFile(IFormFile file)
    {
        // Dosya boş mu?
        if (file == null || file.Length == 0)
        {
            return "Dosya boş olamaz";
        }

        // Dosya boyutu kontrolü
        if (file.Length > _settings.MaxFileSize)
        {
            var maxSizeMB = _settings.MaxFileSize / (1024 * 1024);
            return $"Dosya boyutu {maxSizeMB}MB'dan büyük olamaz";
        }

        // Dosya uzantısı kontrolü
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!_settings.AllowedExtensions.Contains(extension))
        {
            return $"İzin verilen dosya türleri: {string.Join(", ", _settings.AllowedExtensions)}";
        }

        // MIME type kontrolü (güvenlik için)
        var allowedMimeTypes = new[]
        {
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp"
        };

        if (!allowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
        {
            return "Geçersiz dosya türü. Sadece resim dosyaları yükleyebilirsiniz.";
        }

        return null; // Doğrulama başarılı
    }
}

