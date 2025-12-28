using RealEstateAPI.Models;

namespace RealEstateAPI.DTOs.Listing;

/// <summary>
/// Admin moderasyon kuralı DTO
/// </summary>
public class AdminModerationRuleDto
{
    public int? Id { get; set; }
    public bool IsAutomataEnabled { get; set; } = true;
    public List<ListingStatus>? Statuses { get; set; }
    public List<string>? BlockedKeywords { get; set; }
}

