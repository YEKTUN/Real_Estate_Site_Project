using Microsoft.AspNetCore.Http;
using RealEstateAPI.DTOs.Cloudinary;

namespace RealEstateAPI.Services.Cloudinary;

/// <summary>
/// Cloudinary Service Interface
/// 
/// Cloudinary ile görsel yükleme, silme ve yönetim işlemleri için arayüz.
/// SOLID - Interface Segregation prensibine uygun.
/// </summary>
public interface ICloudinaryService
{
    /// <summary>
    /// Tek bir görsel yükle
    /// </summary>
    /// <param name="file">Yüklenecek dosya</param>
    /// <param name="folder">Kaydedileceği klasör (opsiyonel)</param>
    /// <returns>Yükleme sonucu</returns>
    Task<CloudinaryUploadResultDto> UploadImageAsync(IFormFile file, string? folder = null);

    /// <summary>
    /// Birden fazla görsel yükle
    /// </summary>
    /// <param name="files">Yüklenecek dosyalar</param>
    /// <param name="folder">Kaydedileceği klasör (opsiyonel)</param>
    /// <returns>Yükleme sonuçları listesi</returns>
    Task<List<CloudinaryUploadResultDto>> UploadImagesAsync(List<IFormFile> files, string? folder = null);

    /// <summary>
    /// Görsel sil (Public ID ile)
    /// </summary>
    /// <param name="publicId">Cloudinary Public ID</param>
    /// <returns>Silme sonucu</returns>
    Task<CloudinaryDeleteResultDto> DeleteImageAsync(string publicId);

    /// <summary>
    /// Birden fazla görsel sil
    /// </summary>
    /// <param name="publicIds">Silinecek görsellerin Public ID'leri</param>
    /// <returns>Silme sonuçları</returns>
    Task<List<CloudinaryDeleteResultDto>> DeleteImagesAsync(List<string> publicIds);

    /// <summary>
    /// Görsel URL'inden Public ID çıkar
    /// </summary>
    /// <param name="imageUrl">Cloudinary görsel URL'i</param>
    /// <returns>Public ID</returns>
    string GetPublicIdFromUrl(string imageUrl);

    /// <summary>
    /// Thumbnail URL oluştur
    /// </summary>
    /// <param name="imageUrl">Orijinal görsel URL'i</param>
    /// <param name="width">Genişlik (pixel)</param>
    /// <param name="height">Yükseklik (pixel)</param>
    /// <returns>Thumbnail URL</returns>
    string GenerateThumbnailUrl(string imageUrl, int width = 300, int height = 200);

    /// <summary>
    /// Optimize edilmiş görsel URL'i oluştur
    /// </summary>
    /// <param name="imageUrl">Orijinal görsel URL'i</param>
    /// <param name="quality">Kalite (1-100)</param>
    /// <returns>Optimize edilmiş URL</returns>
    string GenerateOptimizedUrl(string imageUrl, int quality = 80);
}

