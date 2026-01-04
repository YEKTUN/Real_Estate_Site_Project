using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using RealEstateAPI.Models;

namespace RealEstateAPI.Controllers;

/**
 * Phone Verification Controller
 * 
 * Telefon numarası doğrulama işlemleri için endpoint'ler.
 * SMS simülasyonu ile çalışır (gerçek SMS gönderimi yok).
 */
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PhoneVerificationController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<PhoneVerificationController> _logger;

    public PhoneVerificationController(
        UserManager<ApplicationUser> userManager,
        ILogger<PhoneVerificationController> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    /// <summary>
    /// Telefon numarası doğrulama kodu gönder (Simülasyon)
    /// </summary>
    [HttpPost("send-code")]
    public async Task<IActionResult> SendVerificationCode([FromBody] SendCodeRequest request)
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Kullanıcı bulunamadı" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "Kullanıcı bulunamadı" });
            }

            // Telefon numarası kontrolü
            if (string.IsNullOrEmpty(request.Phone))
            {
                return BadRequest(new { success = false, message = "Telefon numarası gereklidir" });
            }

            // Telefon numarası formatı kontrolü (05XXXXXXXXX)
            var cleanedPhone = request.Phone.Replace("-", "").Replace(" ", "");
            if (cleanedPhone.Length != 11 || !cleanedPhone.StartsWith("05"))
            {
                return BadRequest(new { success = false, message = "Geçerli bir telefon numarası giriniz (05XXXXXXXXX)" });
            }

            // Simülasyon için sabit kod (Test amaçlı - her zaman 111111)
            var code = "111111";

            // Telefon numarasını henüz kaydetme - sadece doğrulama bilgilerini sakla
            // Telefon numarası sadece doğrulama başarılı olunca kaydedilecek
            user.PhoneVerificationCode = code;
            user.PhoneVerificationExpires = DateTime.UtcNow.AddMinutes(5); // 5 dakika geçerli
            // Doğrulanacak telefon numarasını geçici olarak verification code ile birlikte sakla
            // (Gerçek uygulamada ayrı bir PendingPhone field'ı kullanılabilir)
            // Şimdilik kodu phone ile birlikte session'da tutacağız

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { success = false, message = "Doğrulama kodu oluşturulamadı" });
            }

            _logger.LogInformation($"Doğrulama kodu oluşturuldu: {code} (Kullanıcı: {user.Email}, Telefon: {cleanedPhone})");

            // Simülasyon: Gerçek uygulamada burada SMS gönderilir
            // Şimdilik kodu response'da döneceğiz (sadece development için)
            return Ok(new
            {
                success = true,
                message = "Doğrulama kodu gönderildi",
                // PRODUCTION'da bu satırı kaldırın!
                code = code, // Simülasyon için kodu gösteriyoruz
                expiresAt = user.PhoneVerificationExpires
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Doğrulama kodu gönderme hatası");
            return StatusCode(500, new { success = false, message = "Bir hata oluştu" });
        }
    }

    /// <summary>
    /// Telefon numarası doğrulama kodunu kontrol et
    /// </summary>
    [HttpPost("verify-code")]
    public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeRequest request)
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Kullanıcı bulunamadı" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "Kullanıcı bulunamadı" });
            }

            // Kod kontrolü
            if (string.IsNullOrEmpty(request.Code))
            {
                return BadRequest(new { success = false, message = "Doğrulama kodu gereklidir" });
            }

            // Telefon numarası kontrolü
            if (string.IsNullOrEmpty(request.Phone))
            {
                return BadRequest(new { success = false, message = "Telefon numarası gereklidir" });
            }

            // Telefon numarası formatı kontrolü
            var cleanedPhone = request.Phone.Replace("-", "").Replace(" ", "");
            if (cleanedPhone.Length != 11 || !cleanedPhone.StartsWith("05"))
            {
                return BadRequest(new { success = false, message = "Geçerli bir telefon numarası giriniz (05XXXXXXXXX)" });
            }

            // Kod var mı?
            if (string.IsNullOrEmpty(user.PhoneVerificationCode))
            {
                return BadRequest(new { success = false, message = "Doğrulama kodu bulunamadı. Lütfen yeni kod isteyin." });
            }

            // Kod süresi dolmuş mu?
            if (user.PhoneVerificationExpires == null || user.PhoneVerificationExpires < DateTime.UtcNow)
            {
                return BadRequest(new { success = false, message = "Doğrulama kodunun süresi dolmuş. Lütfen yeni kod isteyin." });
            }

            // Kod eşleşiyor mu?
            if (user.PhoneVerificationCode != request.Code)
            {
                return BadRequest(new { success = false, message = "Geçersiz doğrulama kodu" });
            }

            // Doğrulama başarılı - Telefon numarasını şimdi kaydet
            user.Phone = cleanedPhone;
            user.PhoneVerified = true;
            user.PhoneVerificationCode = null; // Kodu temizle
            user.PhoneVerificationExpires = null;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                return BadRequest(new { success = false, message = "Telefon doğrulaması başarısız oldu" });
            }

            _logger.LogInformation($"Telefon doğrulandı: {user.Phone} (Kullanıcı: {user.Email})");

            return Ok(new
            {
                success = true,
                message = "Telefon numaranız başarıyla doğrulandı",
                phoneVerified = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Telefon doğrulama hatası");
            return StatusCode(500, new { success = false, message = "Bir hata oluştu" });
        }
    }

    /// <summary>
    /// Telefon doğrulama durumunu kontrol et
    /// </summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetVerificationStatus()
    {
        try
        {
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { success = false, message = "Kullanıcı bulunamadı" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { success = false, message = "Kullanıcı bulunamadı" });
            }

            return Ok(new
            {
                success = true,
                phoneVerified = user.PhoneVerified,
                hasPhone = !string.IsNullOrEmpty(user.Phone),
                phone = user.Phone
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Doğrulama durumu kontrolü hatası");
            return StatusCode(500, new { success = false, message = "Bir hata oluştu" });
        }
    }
}

// ============================================================================
// REQUEST DTOs
// ============================================================================

public class SendCodeRequest
{
    public string Phone { get; set; } = string.Empty;
}

public class VerifyCodeRequest
{
    public string Code { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}
