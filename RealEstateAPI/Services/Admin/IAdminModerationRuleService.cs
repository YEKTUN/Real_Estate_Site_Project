using RealEstateAPI.DTOs.Listing;

namespace RealEstateAPI.Services.Admin;

/// <summary>
/// Admin moderasyon kuralı servis interface'i
/// </summary>
public interface IAdminModerationRuleService
{
    Task<AdminModerationRuleDto?> GetAsync(string adminId);
    Task<AdminModerationRuleDto> UpsertAsync(string adminId, AdminModerationRuleDto dto);
    Task<AdminModerationRuleDto?> GetEnabledAsync();
}

