using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Data;
using RealEstateAPI.Models.Admin;

namespace RealEstateAPI.Repositories.Admin;

/// <summary>
/// Admin moderasyon kuralı repository implementasyonu
/// </summary>
public class AdminModerationRuleRepository : IAdminModerationRuleRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AdminModerationRuleRepository> _logger;

    public AdminModerationRuleRepository(ApplicationDbContext context, ILogger<AdminModerationRuleRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<AdminModerationRule?> GetByAdminAsync(string adminId)
    {
        try
        {
            _logger.LogDebug("Veritabanından admin moderasyon kuralı sorgulanıyor. AdminId: {AdminId}", adminId);
            
            var rule = await _context.AdminModerationRules
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.AdminUserId == adminId);

            if (rule == null)
            {
                _logger.LogDebug("Admin moderasyon kuralı bulunamadı. AdminId: {AdminId}", adminId);
            }
            else
            {
                _logger.LogDebug("Admin moderasyon kuralı bulundu. AdminId: {AdminId}, RuleId: {RuleId}", adminId, rule.Id);
            }

            return rule;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Veritabanından admin moderasyon kuralı getirilirken hata oluştu. AdminId: {AdminId}", adminId);
            throw;
        }
    }

    public async Task<AdminModerationRule?> GetEnabledAsync()
    {
        try
        {
            _logger.LogDebug("Aktif admin moderasyon kuralı veritabanından sorgulanıyor");
            
            var rule = await _context.AdminModerationRules
                .AsNoTracking()
                .Where(r => r.IsAutomataEnabled)
                .OrderByDescending(r => r.UpdatedAt ?? r.CreatedAt)
                .FirstOrDefaultAsync();

            if (rule == null)
            {
                _logger.LogDebug("Aktif admin moderasyon kuralı bulunamadı");
            }
            else
            {
                _logger.LogDebug("Aktif admin moderasyon kuralı bulundu. RuleId: {RuleId}", rule.Id);
            }

            return rule;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Aktif admin moderasyon kuralı veritabanından getirilirken hata oluştu");
            throw;
        }
    }

    public async Task<AdminModerationRule> UpsertAsync(string adminId, AdminModerationRule rule)
    {
        try
        {
            _logger.LogDebug("Admin moderasyon kuralı veritabanına kaydediliyor. AdminId: {AdminId}", adminId);
            
            var existing = await _context.AdminModerationRules.FirstOrDefaultAsync(r => r.AdminUserId == adminId);
            if (existing == null)
            {
                _logger.LogDebug("Yeni admin moderasyon kuralı oluşturuluyor. AdminId: {AdminId}", adminId);
                rule.AdminUserId = adminId;
                rule.CreatedAt = DateTime.UtcNow;
                _context.AdminModerationRules.Add(rule);
            }
            else
            {
                _logger.LogDebug("Mevcut admin moderasyon kuralı güncelleniyor. AdminId: {AdminId}, RuleId: {RuleId}", adminId, existing.Id);
                existing.Name = rule.Name;
                existing.IsAutomataEnabled = rule.IsAutomataEnabled;
                existing.Statuses = rule.Statuses;
                existing.BlockedKeywords = rule.BlockedKeywords;
                existing.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            
            var result = existing ?? rule;
            _logger.LogDebug("Admin moderasyon kuralı başarıyla kaydedildi. AdminId: {AdminId}, RuleId: {RuleId}", adminId, result.Id);
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin moderasyon kuralı veritabanına kaydedilirken hata oluştu. AdminId: {AdminId}", adminId);
            throw;
        }
    }
}

