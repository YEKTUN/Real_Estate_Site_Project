namespace RealEstateAPI.Helpers;

/// <summary>
/// Cloudinary Ayarları Modeli
/// 
/// appsettings.json'dan Cloudinary yapılandırma bilgilerini okumak için kullanılır.
/// Cloudinary Dashboard'dan alınan bilgiler burada tutulur.
/// </summary>
public class CloudinarySettings
{
    /// <summary>
    /// Cloudinary Cloud Name (Dashboard'dan alınır)
    /// Örnek: "dxxxxxx"
    /// </summary>
    public string CloudName { get; set; } = string.Empty;

    /// <summary>
    /// Cloudinary API Key (Dashboard'dan alınır)
    /// Örnek: "123456789012345"
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Cloudinary API Secret (Dashboard'dan alınır)
    /// Güvenlik için environment variable olarak saklanmalı
    /// </summary>
    public string ApiSecret { get; set; } = string.Empty;

    /// <summary>
    /// Varsayılan klasör adı (opsiyonel)
    /// Yüklenen görseller bu klasöre kaydedilir
    /// Örnek: "real-estate"
    /// </summary>
    public string? DefaultFolder { get; set; }

    /// <summary>
    /// Maksimum dosya boyutu (byte cinsinden)
    /// Varsayılan: 10MB
    /// </summary>
    public long MaxFileSize { get; set; } = 10 * 1024 * 1024;

    /// <summary>
    /// İzin verilen dosya uzantıları
    /// </summary>
    public string[] AllowedExtensions { get; set; } = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
}

