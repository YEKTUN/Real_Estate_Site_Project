using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using RealEstateAPI.Data;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Auth;
using RealEstateAPI.Repositories.Listing;
using RealEstateAPI.Services.Auth;
using RealEstateAPI.Services.Listing;
using RealEstateAPI.Services.Cloudinary;
using RealEstateAPI.Helpers;

var builder = WebApplication.CreateBuilder(args);

/**
 * Real Estate API - Program.cs
 * 
 * ASP.NET Core Web API yapılandırma dosyası.
 * Servisler, middleware'ler ve uygulama ayarları burada yapılandırılır.
 */

// ============================================================================
// SERVICES CONFIGURATION
// ============================================================================

// Controllers - JSON serialization ayarları (camelCase)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // JSON property isimlerini camelCase yap (frontend ile uyumluluk için)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // Enum'ları integer olarak serialize/deserialize et (frontend number[] gönderiyor)
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// CORS Policy - Frontend ile iletişim için
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // Next.js frontend
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Database Context - PostgreSQL
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity Configuration - IdentityUserContext ile Role tabloları kaldırıldı
builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 8;

    // User settings
    options.User.RequireUniqueEmail = true;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddSignInManager<SignInManager<ApplicationUser>>()
.AddDefaultTokenProviders();

// JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "YourSuperSecretKeyHere123456789!"; // Geliştirme için varsayılan

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "RealEstateAPI",
        ValidAudience = jwtSettings["Audience"] ?? "RealEstateFrontend",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
    };
});

// AutoMapper
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());

// Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Real Estate API",
        Version = "v1",
        Description = "Gayrimenkul yönetim sistemi API'si",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "Real Estate Team",
            Email = "info@realestate.com"
        }
    });

    // JWT Bearer için Swagger yapılandırması
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\"",
        Name = "Authorization",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Dependency Injection - Services & Repositories

// Auth
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Listing (İlan)
builder.Services.AddScoped<IListingRepository, ListingRepository>();
builder.Services.AddScoped<IListingService, ListingService>();

// Comment (Yorum)
builder.Services.AddScoped<ICommentRepository, CommentRepository>();
builder.Services.AddScoped<ICommentService, CommentService>();

// Favorite (Favori)
builder.Services.AddScoped<IFavoriteRepository, FavoriteRepository>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();

// Cloudinary (Görsel Yükleme)
builder.Services.Configure<CloudinarySettings>(builder.Configuration.GetSection("CloudinarySettings"));
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();

// HttpClient for Google Token Validation
builder.Services.AddHttpClient();

// ============================================================================
// GOOGLE AUTH CONFIGURATION (appsettings.json'dan okunacak)
// Google Cloud Console'dan Client ID alınmalı:
// 1. https://console.cloud.google.com/ adresine git
// 2. Credentials > Create Credentials > OAuth 2.0 Client ID
// 3. Application type: Web application
// 4. Authorized JavaScript origins: http://localhost:3000
// 5. Client ID'yi appsettings.json veya environment variable'a ekle
// ============================================================================

// ============================================================================
// MIDDLEWARE PIPELINE
// ============================================================================

var app = builder.Build();

// ============================================================================
// DATABASE AUTO-MIGRATION
// Uygulama başlatıldığında veritabanı tablolarını otomatik oluşturur
// ============================================================================
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        
        // Veritabanını oluştur ve migration'ları uygula
        // EnsureCreated: Veritabanı yoksa oluşturur (migration kullanmadan)
        // Migrate: Migration'ları uygular (production için önerilir)
        
        // Veritabanı tablolarını oluştur
        // Development ortamında: Önce veritabanını sil, sonra yeniden oluştur (geliştirme için)
        // Production ortamında: Migration kullan
        
        if (app.Environment.IsDevelopment())
        {
            // Development: Veritabanını sil ve yeniden oluştur
            app.Logger.LogInformation("🔄 Development ortamı: Veritabanı kontrol ediliyor...");
            try
            {
                // Önce veritabanını sil (güvenli değil ama development için OK)
                await context.Database.EnsureDeletedAsync();
                app.Logger.LogInformation("🗑️ Eski veritabanı silindi");
                
                // Yeni veritabanını oluştur
                await context.Database.EnsureCreatedAsync();
                app.Logger.LogInformation("✅ Veritabanı tabloları oluşturuldu");
            }
            catch (Exception ex)
            {
                app.Logger.LogError(ex, "❌ Veritabanı oluşturulurken hata oluştu");
            }
        }
        else
        {
            // Production: Migration kullan
            try
            {
                await context.Database.MigrateAsync();
                app.Logger.LogInformation("✅ Veritabanı migration'ları uygulandı");
            }
            catch (Exception ex)
            {
                app.Logger.LogError(ex, "❌ Migration uygulanırken hata oluştu");
            }
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "❌ Veritabanı oluşturulurken hata oluştu");
    }
}

// Development ortamında Swagger kullan
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Real Estate API v1");
        options.RoutePrefix = string.Empty; // Swagger'ı root'ta aç
    });
}

// HTTPS Redirection - Sadece Production ortamında veya HTTPS port'u varsa çalıştır
// Development'ta sadece HTTP kullanılıyorsa uyarı vermemesi için kontrol ediyoruz
if (!app.Environment.IsDevelopment() || 
    app.Configuration["ASPNETCORE_URLS"]?.Contains("https://") == true)
{
    app.UseHttpsRedirection();
}

// CORS
app.UseCors("AllowFrontend");

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Controllers
app.MapControllers();

// Uygulama başlatma mesajı
app.Logger.LogInformation("🏠 Real Estate API başlatıldı!");
app.Logger.LogInformation("📝 Swagger UI: http://localhost:5000");
app.Logger.LogInformation("🌐 API Endpoint: http://localhost:5000/api");

app.Run();
