using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Services.Admin;
using RealEstateAPI.Models;
using System.Security.Claims;

namespace RealEstateAPI.Controllers.Admin;

/// <summary>
/// Admin moderasyon kuralı controller'ı
/// </summary>
[ApiController]
[Route("api/admin/moderation-rule")]
[Authorize(Policy = "AdminOnly")]
public class AdminModerationRuleController : ControllerBase
{
    private readonly IAdminModerationRuleService _service;
    private readonly ILogger<AdminModerationRuleController> _logger;

    public AdminModerationRuleController(IAdminModerationRuleService service, ILogger<AdminModerationRuleController> logger)
    {
        _service = service;
        _logger = logger;
    }

    private string? GetAdminId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    [HttpGet]
    [ProducesResponseType(typeof(AdminModerationRuleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Get()
    {
        try
        {
            var adminId = GetAdminId();
            if (string.IsNullOrEmpty(adminId))
            {
                _logger.LogWarning("Admin moderasyon kuralı getirme isteği: AdminId bulunamadı");
                return Unauthorized();
            }

            _logger.LogInformation("Admin moderasyon kuralı getiriliyor. AdminId: {AdminId}", adminId);

            var rule = await _service.GetAsync(adminId);
            if (rule != null)
            {
                _logger.LogInformation("Admin moderasyon kuralı bulundu. AdminId: {AdminId}, RuleId: {RuleId}", adminId, rule.Id);
                return Ok(rule);
            }

            // Kayıt yoksa varsayılan bir kural oluştur ve kaydet
            _logger.LogInformation("Admin moderasyon kuralı bulunamadı, varsayılan kural oluşturuluyor. AdminId: {AdminId}", adminId);
            var created = await _service.UpsertAsync(adminId, new AdminModerationRuleDto
            {
                IsAutomataEnabled = false,
                Statuses = new List<ListingStatus> { ListingStatus.Pending },
            });

            _logger.LogInformation("Varsayılan admin moderasyon kuralı oluşturuldu. AdminId: {AdminId}, RuleId: {RuleId}", adminId, created.Id);
            return Ok(created);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin moderasyon kuralı getirilirken hata oluştu. AdminId: {AdminId}", GetAdminId());
            return StatusCode(500, new { error = "Admin moderasyon kuralı yüklenirken bir hata oluştu", message = ex.Message });
        }
    }

    [HttpPut]
    [ProducesResponseType(typeof(AdminModerationRuleDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Upsert([FromBody] AdminModerationRuleDto dto)
    {
        try
        {
            var adminId = GetAdminId();
            if (string.IsNullOrEmpty(adminId))
            {
                _logger.LogWarning("Admin moderasyon kuralı kaydetme isteği: AdminId bulunamadı");
                return Unauthorized();
            }

            _logger.LogInformation("Admin moderasyon kuralı kaydediliyor. Admin: {AdminId}, IsEnabled: {IsEnabled}", adminId, dto.IsAutomataEnabled);
            var saved = await _service.UpsertAsync(adminId, dto);
            _logger.LogInformation("Admin moderasyon kuralı başarıyla kaydedildi. AdminId: {AdminId}, RuleId: {RuleId}", adminId, saved.Id);
            return Ok(saved);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin moderasyon kuralı kaydedilirken hata oluştu. AdminId: {AdminId}", GetAdminId());
            return StatusCode(500, new { error = "Admin moderasyon kuralı kaydedilirken bir hata oluştu", message = ex.Message });
        }
    }
}

