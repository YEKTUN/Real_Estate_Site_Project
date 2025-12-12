using System.ComponentModel.DataAnnotations;
using RealEstateAPI.Models;

namespace RealEstateAPI.DTOs.Listing;

// ============================================================================
// İLAN DTO'LARI
// ============================================================================

/// <summary>
/// İlan Listesi için DTO (Özet bilgiler)
/// </summary>
public class ListingListDto
{
    public int Id { get; set; }
    public string ListingNumber { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public ListingCategory Category { get; set; }
    public ListingType Type { get; set; }
    public PropertyType PropertyType { get; set; }
    public decimal Price { get; set; }
    public Currency Currency { get; set; }
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string? Neighborhood { get; set; }
    public int? GrossSquareMeters { get; set; }
    public int? NetSquareMeters { get; set; }
    public string? RoomCount { get; set; }
    public int? BuildingAge { get; set; }
    public int? FloorNumber { get; set; }
    public string? CoverImageUrl { get; set; }
    public ListingStatus Status { get; set; }
    public ListingOwnerType OwnerType { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ViewCount { get; set; }
    public int FavoriteCount { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsUrgent { get; set; }
}

/// <summary>
/// İlan Detay için DTO (Tüm bilgiler)
/// </summary>
public class ListingDetailDto
{
    public int Id { get; set; }
    public string ListingNumber { get; set; } = string.Empty;
    
    // Temel Bilgiler
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ListingCategory Category { get; set; }
    public ListingType Type { get; set; }
    public PropertyType PropertyType { get; set; }
    
    // Fiyat Bilgileri
    public decimal Price { get; set; }
    public Currency Currency { get; set; }
    public decimal? MonthlyDues { get; set; }
    public decimal? Deposit { get; set; }
    public bool IsNegotiable { get; set; }
    
    // Konum Bilgileri
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string? Neighborhood { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    
    // Emlak Özellikleri
    public int? GrossSquareMeters { get; set; }
    public int? NetSquareMeters { get; set; }
    public string? RoomCount { get; set; }
    public int? BathroomCount { get; set; }
    public int? BuildingAge { get; set; }
    public int? FloorNumber { get; set; }
    public int? TotalFloors { get; set; }
    public HeatingType? HeatingType { get; set; }
    public BuildingStatus? BuildingStatus { get; set; }
    public UsageStatus? UsageStatus { get; set; }
    public FacingDirection? FacingDirection { get; set; }
    public DeedStatus? DeedStatus { get; set; }
    public bool IsSuitableForCredit { get; set; }
    public bool IsSuitableForTrade { get; set; }
    
    // Özellikler
    public List<InteriorFeatureType> InteriorFeatures { get; set; } = new();
    public List<ExteriorFeatureType> ExteriorFeatures { get; set; } = new();
    
    // Görseller
    public List<ListingImageDto> Images { get; set; } = new();
    
    // İlan Sahibi Bilgileri
    public ListingOwnerDto Owner { get; set; } = new();
    public ListingOwnerType OwnerType { get; set; }
    
    // İlan Durumu
    public ListingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public int ViewCount { get; set; }
    public int FavoriteCount { get; set; }
    public int CommentCount { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsUrgent { get; set; }
    
    // Kullanıcı durumu (giriş yapmış kullanıcı için)
    public bool IsFavorited { get; set; }
}

/// <summary>
/// İlan Oluşturma için DTO
/// </summary>
public class CreateListingDto
{
    [Required(ErrorMessage = "İlan başlığı zorunludur")]
    [StringLength(200, MinimumLength = 10, ErrorMessage = "Başlık 10-200 karakter arasında olmalıdır")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "İlan açıklaması zorunludur")]
    [StringLength(5000, MinimumLength = 50, ErrorMessage = "Açıklama 50-5000 karakter arasında olmalıdır")]
    public string Description { get; set; } = string.Empty;

    [Required]
    public ListingCategory Category { get; set; }

    [Required]
    public ListingType Type { get; set; }

    [Required]
    public PropertyType PropertyType { get; set; }

    // Fiyat
    [Required(ErrorMessage = "Fiyat zorunludur")]
    [Range(1, 100000000000, ErrorMessage = "Geçerli bir fiyat giriniz")]
    public decimal Price { get; set; }

    public Currency Currency { get; set; } = Currency.TRY;
    public decimal? MonthlyDues { get; set; }
    public decimal? Deposit { get; set; }
    public bool IsNegotiable { get; set; }

    // Konum
    [Required(ErrorMessage = "İl zorunludur")]
    [StringLength(50)]
    public string City { get; set; } = string.Empty;

    [Required(ErrorMessage = "İlçe zorunludur")]
    [StringLength(50)]
    public string District { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Neighborhood { get; set; }

    [StringLength(300)]
    public string? FullAddress { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Emlak Özellikleri
    [Range(1, 100000)]
    public int? GrossSquareMeters { get; set; }

    [Range(1, 100000)]
    public int? NetSquareMeters { get; set; }

    [StringLength(20)]
    public string? RoomCount { get; set; }

    [Range(0, 20)]
    public int? BathroomCount { get; set; }

    [Range(0, 200)]
    public int? BuildingAge { get; set; }

    public int? FloorNumber { get; set; }

    [Range(1, 100)]
    public int? TotalFloors { get; set; }

    public HeatingType? HeatingType { get; set; }
    public BuildingStatus? BuildingStatus { get; set; }
    public UsageStatus? UsageStatus { get; set; }
    public FacingDirection? FacingDirection { get; set; }
    public DeedStatus? DeedStatus { get; set; }
    public bool IsSuitableForCredit { get; set; } = true;
    public bool IsSuitableForTrade { get; set; }

    // Özellikler
    public List<InteriorFeatureType> InteriorFeatures { get; set; } = new();
    public List<ExteriorFeatureType> ExteriorFeatures { get; set; } = new();

    // İlan Sahibi Tipi
    public ListingOwnerType OwnerType { get; set; } = ListingOwnerType.Owner;
}

/// <summary>
/// İlan Güncelleme için DTO
/// </summary>
public class UpdateListingDto
{
    [StringLength(200, MinimumLength = 10, ErrorMessage = "Başlık 10-200 karakter arasında olmalıdır")]
    public string? Title { get; set; }

    [StringLength(5000, MinimumLength = 50, ErrorMessage = "Açıklama 50-5000 karakter arasında olmalıdır")]
    public string? Description { get; set; }

    public ListingCategory? Category { get; set; }
    public ListingType? Type { get; set; }
    public PropertyType? PropertyType { get; set; }

    // Fiyat
    [Range(1, 100000000000, ErrorMessage = "Geçerli bir fiyat giriniz")]
    public decimal? Price { get; set; }

    public Currency? Currency { get; set; }
    public decimal? MonthlyDues { get; set; }
    public decimal? Deposit { get; set; }
    public bool? IsNegotiable { get; set; }

    // Konum
    [StringLength(50)]
    public string? City { get; set; }

    [StringLength(50)]
    public string? District { get; set; }

    [StringLength(100)]
    public string? Neighborhood { get; set; }

    [StringLength(300)]
    public string? FullAddress { get; set; }

    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    // Emlak Özellikleri
    [Range(1, 100000)]
    public int? GrossSquareMeters { get; set; }

    [Range(1, 100000)]
    public int? NetSquareMeters { get; set; }

    [StringLength(20)]
    public string? RoomCount { get; set; }

    [Range(0, 20)]
    public int? BathroomCount { get; set; }

    [Range(0, 200)]
    public int? BuildingAge { get; set; }

    public int? FloorNumber { get; set; }

    [Range(1, 100)]
    public int? TotalFloors { get; set; }

    public HeatingType? HeatingType { get; set; }
    public BuildingStatus? BuildingStatus { get; set; }
    public UsageStatus? UsageStatus { get; set; }
    public FacingDirection? FacingDirection { get; set; }
    public DeedStatus? DeedStatus { get; set; }
    public bool? IsSuitableForCredit { get; set; }
    public bool? IsSuitableForTrade { get; set; }

    // Özellikler
    public List<InteriorFeatureType>? InteriorFeatures { get; set; }
    public List<ExteriorFeatureType>? ExteriorFeatures { get; set; }

    // İlan Sahibi Tipi
    public ListingOwnerType? OwnerType { get; set; }
}

/// <summary>
/// İlan Arama/Filtreleme için DTO
/// </summary>
public class ListingSearchDto
{
    // Arama
    public string? SearchTerm { get; set; }
    
    // Kategori & Tip Filtreleri
    public ListingCategory? Category { get; set; }
    public ListingType? Type { get; set; }
    public PropertyType? PropertyType { get; set; }
    
    // Fiyat Aralığı
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public Currency? Currency { get; set; }
    
    // Konum Filtreleri
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Neighborhood { get; set; }
    
    // Alan Filtreleri
    public int? MinSquareMeters { get; set; }
    public int? MaxSquareMeters { get; set; }
    
    // Oda Filtreleri
    public string? RoomCount { get; set; }
    public List<string>? RoomCounts { get; set; }
    
    // Bina Özellikleri
    public int? MinBuildingAge { get; set; }
    public int? MaxBuildingAge { get; set; }
    public int? MinFloor { get; set; }
    public int? MaxFloor { get; set; }
    
    // Diğer Filtreler
    public HeatingType? HeatingType { get; set; }
    public BuildingStatus? BuildingStatus { get; set; }
    public UsageStatus? UsageStatus { get; set; }
    public DeedStatus? DeedStatus { get; set; }
    public ListingOwnerType? OwnerType { get; set; }
    
    // Boolean Filtreler
    public bool? IsSuitableForCredit { get; set; }
    public bool? IsSuitableForTrade { get; set; }
    public bool? IsFeatured { get; set; }
    public bool? IsUrgent { get; set; }
    
    // Özellik Filtreleri
    public List<InteriorFeatureType>? InteriorFeatures { get; set; }
    public List<ExteriorFeatureType>? ExteriorFeatures { get; set; }
    
    // Sıralama
    public ListingSortBy SortBy { get; set; } = ListingSortBy.Newest;
    public bool SortDescending { get; set; } = true;
    
    // Sayfalama
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

/// <summary>
/// Sıralama Seçenekleri
/// </summary>
public enum ListingSortBy
{
    Newest = 1,
    Oldest = 2,
    PriceAsc = 3,
    PriceDesc = 4,
    MostViewed = 5,
    MostFavorited = 6
}

/// <summary>
/// İlan Sahibi Bilgileri DTO
/// </summary>
public class ListingOwnerDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Surname { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public DateTime MemberSince { get; set; }
    public int TotalListings { get; set; }
}

/// <summary>
/// İlan Görseli DTO
/// </summary>
public class ListingImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public string? AltText { get; set; }
    public bool IsCoverImage { get; set; }
    public int DisplayOrder { get; set; }
}

/// <summary>
/// Görsel Yükleme DTO
/// </summary>
public class UploadImageDto
{
    [Required]
    public string ImageUrl { get; set; } = string.Empty;
    
    public string? ThumbnailUrl { get; set; }
    
    [StringLength(200)]
    public string? AltText { get; set; }
    
    public bool IsCoverImage { get; set; }
    public int DisplayOrder { get; set; }
}
