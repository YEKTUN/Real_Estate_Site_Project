namespace RealEstateAPI.DTOs.Listing;

// ============================================================================
// RESPONSE DTO'LARI
// ============================================================================

/// <summary>
/// İlan İşlemleri için Genel Response DTO
/// </summary>
public class ListingResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? ListingId { get; set; }
    public ListingDetailDto? Listing { get; set; }
    public bool RequiresPhoneVerification { get; set; } = false;
}

/// <summary>
/// İlan Listesi için Response DTO (Sayfalama dahil)
/// </summary>
public class ListingListResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<ListingListDto> Listings { get; set; } = new();
    public PaginationDto Pagination { get; set; } = new();
}

/// <summary>
/// Sayfalama Bilgileri DTO
/// </summary>
public class PaginationDto
{
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public int TotalCount { get; set; }
    public bool HasPrevious => CurrentPage > 1;
    public bool HasNext => CurrentPage < TotalPages;
}

/// <summary>
/// Yorum İşlemleri için Response DTO
/// </summary>
public class CommentResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public CommentDto? Comment { get; set; }
}

/// <summary>
/// Yorum Listesi için Response DTO
/// </summary>
public class CommentListResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<CommentDto> Comments { get; set; } = new();
    public int TotalCount { get; set; }
}

/// <summary>
/// Favori İşlemleri için Response DTO
/// </summary>
public class FavoriteResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsFavorited { get; set; }
}

/// <summary>
/// Favori Listesi için Response DTO
/// </summary>
public class FavoriteListResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<FavoriteListingDto> Favorites { get; set; } = new();
    public PaginationDto Pagination { get; set; } = new();
}

/// <summary>
/// Görsel İşlemleri için Response DTO
/// </summary>
public class ImageResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public ListingImageDto? Image { get; set; }
}

/// <summary>
/// Görsel Listesi için Response DTO
/// </summary>
public class ImageListResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<ListingImageDto> Images { get; set; } = new();
}
