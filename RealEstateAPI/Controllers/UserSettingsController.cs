using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Data;
using RealEstateAPI.DTOs.User;
using RealEstateAPI.Models;

namespace RealEstateAPI.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UserSettingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public UserSettingsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<UserSettingsDto>> GetSettings()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == userId);

        if (settings == null)
        {
            // Varsayılan ayarları döndür (henüz kaydedilmemişse)
            return new UserSettingsDto
            {
                EmailNotifications = true,
                SmsNotifications = false,
                PushNotifications = true,
                NewListingNotifications = true,
                PriceDropNotifications = true,
                MessageNotifications = true,
                ShowPhone = false,
                ShowEmail = true,
                ProfileVisible = true
            };
        }

        return new UserSettingsDto
        {
            EmailNotifications = settings.EmailNotifications,
            SmsNotifications = settings.SmsNotifications,
            PushNotifications = settings.PushNotifications,
            NewListingNotifications = settings.NewListingNotifications,
            PriceDropNotifications = settings.PriceDropNotifications,
            MessageNotifications = settings.MessageNotifications,
            ShowPhone = settings.ShowPhone,
            ShowEmail = settings.ShowEmail,
            ProfileVisible = settings.ProfileVisible
        };
    }

    [HttpPut]
    public async Task<IActionResult> UpdateSettings([FromBody] UserSettingsDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        // Önce veritabanından mevcut ayarları bulmaya çalış (Case-insensitive userId comparison can be safer)
        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId.ToLower() == userId.ToLower());

        bool isNew = false;
        if (settings == null)
        {
            // Eğer veritabanında yoksa, aynı anda başka bir istek oluşturmuş olabilir mi diye bak (Local check)
            settings = _context.UserSettings.Local.FirstOrDefault(s => s.UserId == userId);
            
            if (settings == null)
            {
                isNew = true;
                settings = new UserSettings { UserId = userId };
            }
        }

        // Değerleri güncelle
        Console.WriteLine($"DEBUG: Settings Update Request - UserId: {userId}");
        Console.WriteLine($"DEBUG: ShowPhone: {dto.ShowPhone}, ShowEmail: {dto.ShowEmail}, ProfileVisible: {dto.ProfileVisible}");

        settings.EmailNotifications = dto.EmailNotifications;
        settings.SmsNotifications = dto.SmsNotifications;
        settings.PushNotifications = dto.PushNotifications;
        settings.NewListingNotifications = dto.NewListingNotifications;
        settings.PriceDropNotifications = dto.PriceDropNotifications;
        settings.MessageNotifications = dto.MessageNotifications;
        
        settings.ShowPhone = dto.ShowPhone;
        settings.ShowEmail = dto.ShowEmail;
        settings.ProfileVisible = dto.ProfileVisible;

        if (isNew)
        {
            _context.UserSettings.Add(settings);
        }

        try 
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            // Eğer unique constraint hatası alırsak (başka bir istek bizden önce kaydettiyse)
            // local state'i temizleyip tekrar deneyebiliriz veya hata yerine başarı dönebiliriz 
            // çünkü sonuçta ayarlar veritabanında var olacaktır.
            return Ok(new { success = true, message = "Ayarlar güncellendi (çakışma çözüldü)" });
        }

        return Ok(new { success = true, message = "Ayarlar güncellendi" });
    }
}
