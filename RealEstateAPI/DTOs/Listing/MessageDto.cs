namespace RealEstateAPI.DTOs.Listing;

public class ListingMessageDto
{
    public int Id { get; set; }
    public int ThreadId { get; set; }
    public string SenderId { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string? SenderSurname { get; set; }
    public string? SenderProfilePictureUrl { get; set; }
    public string Content { get; set; } = string.Empty;
    public decimal? OfferPrice { get; set; }
    public bool IsOffer { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentType { get; set; }
    public string? AttachmentFileName { get; set; }
    public long? AttachmentFileSize { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ListingMessageThreadDto
{
    public int Id { get; set; }
    public int ListingId { get; set; }
    public string ListingTitle { get; set; } = string.Empty;
    public string SellerId { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public string? SellerSurname { get; set; }
    public string? SellerProfilePictureUrl { get; set; }
    public string BuyerId { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string? BuyerSurname { get; set; }
    public string? BuyerProfilePictureUrl { get; set; }
    public DateTime? LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
    public List<ListingMessageDto> Messages { get; set; } = new();
}

public class CreateListingMessageDto
{
    public string Content { get; set; } = string.Empty;
    public decimal? OfferPrice { get; set; }
    public bool IsOffer { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentType { get; set; }
    public string? AttachmentFileName { get; set; }
    public long? AttachmentFileSize { get; set; }
}

public class ListingMessageListResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<ListingMessageDto> Messages { get; set; } = new();
}

public class ListingThreadListResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<ListingMessageThreadDto> Threads { get; set; } = new();
}

public class ListingMessageResponseDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public ListingMessageDto? Data { get; set; }
}

