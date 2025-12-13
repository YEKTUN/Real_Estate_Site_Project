namespace RealEstateAPI.DTOs.Cloudinary;

// ============================================================================
// CLOUDINARY DTO'LARI
// ============================================================================

/// <summary>
/// Cloudinary Görsel Yükleme Sonuç DTO
/// 
/// Cloudinary'e yüklenen görselin bilgilerini içerir.
/// </summary>
public class CloudinaryUploadResultDto
{
    /// <summary>
    /// İşlem başarılı mı?
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Mesaj (Başarı veya hata mesajı)
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Cloudinary Public ID (Görseli silmek için gerekli)
    /// </summary>
    public string? PublicId { get; set; }

    /// <summary>
    /// Güvenli URL (HTTPS)
    /// </summary>
    public string? SecureUrl { get; set; }

    /// <summary>
    /// Normal URL (HTTP)
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// Thumbnail URL (Küçük boyut)
    /// </summary>
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Görsel genişliği (pixel)
    /// </summary>
    public int? Width { get; set; }

    /// <summary>
    /// Görsel yüksekliği (pixel)
    /// </summary>
    public int? Height { get; set; }

    /// <summary>
    /// Dosya boyutu (byte)
    /// </summary>
    public long? FileSize { get; set; }

    /// <summary>
    /// Dosya formatı (jpg, png, vb.)
    /// </summary>
    public string? Format { get; set; }

    /// <summary>
    /// Yükleme tarihi
    /// </summary>
    public DateTime? UploadedAt { get; set; }

    /// <summary>
    /// Orijinal dosya adı
    /// </summary>
    public string? OriginalFileName { get; set; }
}

/// <summary>
/// Cloudinary Görsel Silme Sonuç DTO
/// </summary>
public class CloudinaryDeleteResultDto
{
    /// <summary>
    /// İşlem başarılı mı?
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Mesaj
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Silinen görselin Public ID'si
    /// </summary>
    public string? PublicId { get; set; }
}

/// <summary>
/// Birden fazla görsel yükleme için Response DTO
/// </summary>
public class CloudinaryMultiUploadResponseDto
{
    /// <summary>
    /// İşlem başarılı mı?
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Mesaj
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Yüklenen görseller
    /// </summary>
    public List<CloudinaryUploadResultDto> UploadedImages { get; set; } = new();

    /// <summary>
    /// Başarılı yükleme sayısı
    /// </summary>
    public int SuccessCount { get; set; }

    /// <summary>
    /// Başarısız yükleme sayısı
    /// </summary>
    public int FailedCount { get; set; }

    /// <summary>
    /// Toplam dosya sayısı
    /// </summary>
    public int TotalCount { get; set; }
}

/// <summary>
/// İlan için görsel yükleme request DTO
/// </summary>
public class ListingImageUploadDto
{
    /// <summary>
    /// İlan ID'si (görsel eklenecek ilan)
    /// </summary>
    public int ListingId { get; set; }

    /// <summary>
    /// Kapak fotoğrafı olarak ayarla
    /// </summary>
    public bool IsCoverImage { get; set; }

    /// <summary>
    /// Görsel açıklaması (Alt text)
    /// </summary>
    public string? AltText { get; set; }

    /// <summary>
    /// Görüntüleme sırası
    /// </summary>
    public int DisplayOrder { get; set; }
}

/// <summary>
/// İlan görseli yükleme response DTO
/// </summary>
public class ListingImageUploadResponseDto
{
    /// <summary>
    /// İşlem başarılı mı?
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Mesaj
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Oluşturulan görsel ID'si (veritabanındaki)
    /// </summary>
    public int? ImageId { get; set; }

    /// <summary>
    /// Görsel URL'i
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Thumbnail URL
    /// </summary>
    public string? ThumbnailUrl { get; set; }

    /// <summary>
    /// Cloudinary Public ID
    /// </summary>
    public string? PublicId { get; set; }
}

