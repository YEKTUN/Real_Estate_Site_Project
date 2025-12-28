using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Models.Admin;
using RealEstateAPI.Repositories.Admin;
using RealEstateAPI.Repositories.Listing;

namespace RealEstateAPI.Services.Admin;

/// <summary>
/// Admin moderasyon kuralı servis implementasyonu
/// </summary>
public class AdminModerationRuleService : IAdminModerationRuleService
{
    private readonly IAdminModerationRuleRepository _repository;
    private readonly IListingRepository _listingRepository;
    private readonly ILogger<AdminModerationRuleService> _logger;

    public AdminModerationRuleService(
        IAdminModerationRuleRepository repository, 
        IListingRepository listingRepository,
        ILogger<AdminModerationRuleService> logger)
    {
        _repository = repository;
        _listingRepository = listingRepository;
        _logger = logger;
    }

    public async Task<AdminModerationRuleDto?> GetAsync(string adminId)
    {
        try
        {
            _logger.LogDebug("Admin moderasyon kuralı getiriliyor. AdminId: {AdminId}", adminId);
            var rule = await _repository.GetByAdminAsync(adminId);
            
            if (rule == null)
            {
                _logger.LogDebug("Admin moderasyon kuralı bulunamadı. AdminId: {AdminId}", adminId);
                return null;
            }

            var dto = Map(rule);
            _logger.LogDebug("Admin moderasyon kuralı başarıyla getirildi. AdminId: {AdminId}, RuleId: {RuleId}", adminId, dto.Id);
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin moderasyon kuralı getirilirken hata oluştu. AdminId: {AdminId}", adminId);
            throw;
        }
    }

    public async Task<AdminModerationRuleDto?> GetEnabledAsync()
    {
        try
        {
            _logger.LogDebug("Aktif admin moderasyon kuralı getiriliyor");
            var rule = await _repository.GetEnabledAsync();
            
            if (rule == null)
            {
                _logger.LogDebug("Aktif admin moderasyon kuralı bulunamadı");
                return null;
            }

            var dto = Map(rule);
            _logger.LogDebug("Aktif admin moderasyon kuralı başarıyla getirildi. RuleId: {RuleId}", dto.Id);
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Aktif admin moderasyon kuralı getirilirken hata oluştu");
            throw;
        }
    }

    public async Task<AdminModerationRuleDto> UpsertAsync(string adminId, AdminModerationRuleDto dto)
    {
        try
        {
            _logger.LogDebug("Admin moderasyon kuralı kaydediliyor. AdminId: {AdminId}, IsEnabled: {IsEnabled}", adminId, dto.IsAutomataEnabled);
            
            var entity = await _repository.UpsertAsync(adminId, new AdminModerationRule
            {
                IsAutomataEnabled = dto.IsAutomataEnabled,
                Statuses = dto.Statuses?.Select(s => (int)s).ToList(),
                BlockedKeywords = dto.BlockedKeywords
            });

            var result = Map(entity);
            _logger.LogDebug("Admin moderasyon kuralı başarıyla kaydedildi. AdminId: {AdminId}, RuleId: {RuleId}", adminId, result.Id);
            
            // Eğer otomatik onay aktifse, tüm bekleyen ilanları kontrol et
            if (dto.IsAutomataEnabled)
            {
                _logger.LogInformation("Otomatik onay aktif edildi, tüm bekleyen ilanlar kontrol ediliyor. AdminId: {AdminId}", adminId);
                await ProcessAllPendingListingsAsync(result);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin moderasyon kuralı kaydedilirken hata oluştu. AdminId: {AdminId}", adminId);
            throw;
        }
    }

    /// <summary>
    /// Otomatik onay aktif olduğunda tüm bekleyen ilanları kontrol eder
    /// </summary>
    private async Task ProcessAllPendingListingsAsync(AdminModerationRuleDto rule)
    {
        try
        {
            _logger.LogInformation("🔄 Tüm bekleyen ilanlar otomatik onay için işleniyor...");
            
            // Tüm bekleyen ilanları getir
            var filter = new AdminListingFilterDto
            {
                Statuses = new List<ListingStatus> { ListingStatus.Pending },
                Page = 1,
                PageSize = 1000 // Tüm bekleyen ilanları al
            };
            
            var (listings, totalCount) = await _listingRepository.GetForAdminAsync(filter);
            _logger.LogInformation("📊 Toplam {Count} bekleyen ilan bulundu", totalCount);
            
            if (!listings.Any())
            {
                _logger.LogInformation("✅ İşlenecek bekleyen ilan yok");
                return;
            }

            int approvedCount = 0;
            int rejectedCount = 0;

            foreach (var listing in listings)
            {
                try
                {
                    // Yasaklı kelime kontrolü
                    bool hasBlockedKeyword = false;
                    string? blockedKeyword = null;

                    if (rule.BlockedKeywords != null && rule.BlockedKeywords.Any())
                    {
                        var title = listing.Title?.ToLowerInvariant() ?? string.Empty;
                        var description = listing.Description?.ToLowerInvariant() ?? string.Empty;

                        foreach (var keyword in rule.BlockedKeywords)
                        {
                            var kw = keyword.ToLowerInvariant();
                            if (title.Contains(kw) || description.Contains(kw))
                            {
                                hasBlockedKeyword = true;
                                blockedKeyword = keyword;
                                break;
                            }
                        }
                    }

                    if (hasBlockedKeyword)
                    {
                        // Yasaklı kelime varsa reddet
                        var rejectionReason = $"Otomatik red: Yasaklı kelime tespit edildi ('{blockedKeyword}')";
                        await _listingRepository.UpdateStatusAsync(listing.Id, ListingStatus.Rejected, rejectionReason);
                        rejectedCount++;
                        _logger.LogInformation("❌ İlan reddedildi - ID: {ListingId}, Sebep: {Reason}", listing.Id, rejectionReason);
                    }
                    else
                    {
                        // Yasaklı kelime yoksa onayla
                        await _listingRepository.UpdateStatusAsync(listing.Id, ListingStatus.Active, null);
                        approvedCount++;
                        _logger.LogInformation("✅ İlan onaylandı - ID: {ListingId}, Başlık: {Title}", listing.Id, listing.Title);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "⚠️ İlan işlenirken hata oluştu - ID: {ListingId}", listing.Id);
                    // Bir ilan hata verse bile diğerlerini işlemeye devam et
                }
            }

            _logger.LogInformation("🎉 Otomatik onay tamamlandı - Onaylanan: {Approved}, Reddedilen: {Rejected}, Toplam: {Total}", 
                approvedCount, rejectedCount, totalCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Bekleyen ilanlar işlenirken kritik hata oluştu");
            // Hata olsa bile kural kaydedilmiş olsun
        }
    }

    private static AdminModerationRuleDto Map(AdminModerationRule rule)
    {
        return new AdminModerationRuleDto
        {
            Id = rule.Id,
            IsAutomataEnabled = rule.IsAutomataEnabled,
            Statuses = rule.Statuses?.Select(s => (ListingStatus)s).ToList(),
            BlockedKeywords = rule.BlockedKeywords
        };
    }
}

