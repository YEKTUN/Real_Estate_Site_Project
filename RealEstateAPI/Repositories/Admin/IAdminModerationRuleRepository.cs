using RealEstateAPI.Models.Admin;

namespace RealEstateAPI.Repositories.Admin;

/// <summary>
/// Admin moderasyon kuralı repository interface'i
/// </summary>
public interface IAdminModerationRuleRepository
{
    Task<AdminModerationRule?> GetByAdminAsync(string adminId);
    Task<AdminModerationRule?> GetEnabledAsync();
    Task<AdminModerationRule> UpsertAsync(string adminId, AdminModerationRule rule);
}

