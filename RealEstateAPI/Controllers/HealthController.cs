using Microsoft.AspNetCore.Mvc;

namespace RealEstateAPI.Controllers;

/**
 * Health Controller
 * 
 * API'nin sağlık durumunu kontrol etmek için kullanılır.
 */
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly ILogger<HealthController> _logger;

    public HealthController(ILogger<HealthController> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// API sağlık kontrolü
    /// </summary>
    /// <returns>API durumu</returns>
    [HttpGet]
    public IActionResult Get()
    {
        _logger.LogInformation("Health check endpoint çağrıldı");

        return Ok(new
        {
            status = "healthy",
            message = "🏠 Real Estate API çalışıyor!",
            timestamp = DateTime.UtcNow,
            version = "1.0.0",
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"
        });
    }

    /// <summary>
    /// Detaylı sistem bilgisi
    /// </summary>
    /// <returns>Sistem bilgileri</returns>
    [HttpGet("info")]
    public IActionResult GetInfo()
    {
        return Ok(new
        {
            application = "Real Estate API",
            version = "1.0.0",
            framework = ".NET 8.0",
            uptime = Environment.TickCount64 / 1000, // saniye cinsinden
            timestamp = DateTime.UtcNow,
            features = new[]
            {
                "JWT Authentication",
                "Entity Framework Core",
                "AutoMapper",
                "Swagger/OpenAPI",
                "CORS Support"
            }
        });
    }
}

