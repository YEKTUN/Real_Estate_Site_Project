using RealEstateAPI.DTOs.Auth;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Models.listing;
using System.Text;
using System.Text.Json;

namespace RealEstateAPI.Tests.Helpers;

/// <summary>
/// Test Data Factory
/// 
/// Test verilerini oluşturmak için yardımcı sınıf.
/// Mock nesneler ve test verileri burada tanımlanır.
/// </summary>
public static class TestDataFactory
{
    // ============================================================================
    // USER DATA
    // ============================================================================

    /// <summary>
    /// Test için ApplicationUser oluşturur
    /// </summary>
    /// <param name="id">Kullanıcı ID (opsiyonel)</param>
    /// <param name="email">Email (opsiyonel)</param>
    /// <returns>ApplicationUser nesnesi</returns>
    public static ApplicationUser CreateTestUser(
        string? id = null, 
        string? email = null,
        string? name = null,
        string? surname = null)
    {
        return new ApplicationUser
        {
            Id = id ?? Guid.NewGuid().ToString(),
            UserName = email ?? "test@example.com",
            Email = email ?? "test@example.com",
            Name = name ?? "Test",
            Surname = surname ?? "User",
            Phone = "5551234567",
            PhoneNumber = "5551234567",
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = true
        };
    }

    /// <summary>
    /// Test için birden fazla kullanıcı oluşturur
    /// </summary>
    /// <param name="count">Oluşturulacak kullanıcı sayısı</param>
    /// <returns>Kullanıcı listesi</returns>
    public static List<ApplicationUser> CreateTestUsers(int count)
    {
        var users = new List<ApplicationUser>();
        for (int i = 1; i <= count; i++)
        {
            users.Add(CreateTestUser(
                id: Guid.NewGuid().ToString(),
                email: $"user{i}@example.com",
                name: $"User{i}",
                surname: $"Test{i}"
            ));
        }
        return users;
    }

    // ============================================================================
    // DTO DATA
    // ============================================================================

    /// <summary>
    /// Test için LoginDto oluşturur
    /// </summary>
    public static LoginDto CreateLoginDto(
        string? email = null, 
        string? password = null)
    {
        return new LoginDto
        {
            EmailOrUsername = email ?? "test@example.com",
            Password = password ?? "Test123!@#"
        };
    }

    /// <summary>
    /// Test için RegisterDto oluşturur
    /// </summary>
    public static RegisterDto CreateRegisterDto(
        string? name = null,
        string? surname = null,
        string? email = null,
        string? password = null,
        string? phone = null)
    {
        var pwd = password ?? "Test123!@#";
        return new RegisterDto
        {
            Name = name ?? "Test",
            Surname = surname ?? "User",
            Email = email ?? "newuser@example.com",
            Phone = phone ?? "5559876543",
            Password = pwd,
            ConfirmPassword = pwd
        };
    }

    /// <summary>
    /// Başarılı AuthResponseDto oluşturur
    /// </summary>
    public static AuthResponseDto CreateSuccessAuthResponse(
        ApplicationUser? user = null,
        string? token = null,
        string? refreshToken = null)
    {
        var testUser = user ?? CreateTestUser();
        return new AuthResponseDto
        {
            Success = true,
            Message = "İşlem başarılı",
            Token = token ?? "test-jwt-token",
            RefreshToken = refreshToken ?? "test-refresh-token",
            ExpiresIn = 3600,
            User = new UserDto
            {
                Id = testUser.Id,
                Name = testUser.Name,
                Surname = testUser.Surname,
                Email = testUser.Email ?? string.Empty,
                Phone = testUser.Phone
            }
        };
    }

    /// <summary>
    /// Başarısız AuthResponseDto oluşturur
    /// </summary>
    public static AuthResponseDto CreateFailedAuthResponse(string message = "İşlem başarısız")
    {
        return new AuthResponseDto
        {
            Success = false,
            Message = message
        };
    }

    // ============================================================================
    // REFRESH TOKEN DATA
    // ============================================================================

    /// <summary>
    /// Test için RefreshToken oluşturur
    /// </summary>
    public static RefreshToken CreateRefreshToken(
        string? userId = null,
        string? token = null,
        bool isActive = true,
        int expiresInDays = 7)
    {
        var refreshToken = new RefreshToken
        {
            Id = new Random().Next(1, 10000),
            Token = token ?? Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            UserId = userId ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(expiresInDays),
            IsRevoked = !isActive,
            IsUsed = false,
            CreatedByIp = "127.0.0.1"
        };

        return refreshToken;
    }

    /// <summary>
    /// Süresi dolmuş RefreshToken oluşturur
    /// </summary>
    public static RefreshToken CreateExpiredRefreshToken(string? userId = null)
    {
        return new RefreshToken
        {
            Id = new Random().Next(1, 10000),
            Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            UserId = userId ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            ExpiresAt = DateTime.UtcNow.AddDays(-3), // Süresi dolmuş
            IsRevoked = false,
            IsUsed = false
        };
    }

    /// <summary>
    /// İptal edilmiş RefreshToken oluşturur
    /// </summary>
    public static RefreshToken CreateRevokedRefreshToken(string? userId = null)
    {
        return new RefreshToken
        {
            Id = new Random().Next(1, 10000),
            Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            UserId = userId ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            ExpiresAt = DateTime.UtcNow.AddDays(2),
            IsRevoked = true, // İptal edilmiş
            IsUsed = false,
            RevokedAt = DateTime.UtcNow.AddDays(-1)
        };
    }

    /// <summary>
    /// Kullanılmış RefreshToken oluşturur
    /// </summary>
    public static RefreshToken CreateUsedRefreshToken(string? userId = null)
    {
        return new RefreshToken
        {
            Id = new Random().Next(1, 10000),
            Token = Convert.ToBase64String(Guid.NewGuid().ToByteArray()),
            UserId = userId ?? Guid.NewGuid().ToString(),
            CreatedAt = DateTime.UtcNow.AddDays(-5),
            ExpiresAt = DateTime.UtcNow.AddDays(2),
            IsRevoked = false,
            IsUsed = true, // Kullanılmış
            ReplacedByToken = "new-token"
        };
    }

    // ============================================================================
    // CONFIGURATION DATA
    // ============================================================================

    /// <summary>
    /// Test için JWT ayarlarını içeren Dictionary oluşturur
    /// </summary>
    public static Dictionary<string, string?> CreateJwtSettings()
    {
        return new Dictionary<string, string?>
        {
            {"JwtSettings:SecretKey", "YourSuperSecretKeyForTestingPurposes123456789!"},
            {"JwtSettings:Issuer", "RealEstateAPI.Test"},
            {"JwtSettings:Audience", "RealEstateAPI.Test.Client"},
            {"JwtSettings:ExpirationMinutes", "60"},
            {"JwtSettings:RefreshTokenExpirationDays", "7"}
        };
    }

    // ============================================================================
    // GOOGLE OAUTH DATA
    // ============================================================================

    /// <summary>
    /// Test için GoogleLoginDto oluşturur
    /// </summary>
    /// <param name="idToken">Google ID Token (opsiyonel - varsayılan mock token)</param>
    public static GoogleLoginDto CreateGoogleLoginDto(string? idToken = null)
    {
        return new GoogleLoginDto
        {
            IdToken = idToken ?? CreateMockGoogleIdToken()
        };
    }

    /// <summary>
    /// Test için GoogleUserInfo oluşturur
    /// </summary>
    public static GoogleUserInfo CreateGoogleUserInfo(
        string? googleId = null,
        string? email = null,
        string? name = null,
        string? surname = null,
        bool emailVerified = true,
        string? picture = null)
    {
        return new GoogleUserInfo
        {
            GoogleId = googleId ?? "google-user-id-123456789",
            Email = email ?? "googleuser@gmail.com",
            Name = name ?? "Google",
            Surname = surname ?? "User",
            EmailVerified = emailVerified,
            Picture = picture ?? "https://lh3.googleusercontent.com/a/default-user"
        };
    }

    /// <summary>
    /// Google kullanıcısı olan ApplicationUser oluşturur
    /// </summary>
    public static ApplicationUser CreateGoogleUser(
        string? id = null,
        string? email = null,
        string? name = null,
        string? surname = null,
        string? googleId = null,
        string? profilePictureUrl = null)
    {
        return new ApplicationUser
        {
            Id = id ?? Guid.NewGuid().ToString(),
            UserName = email ?? "googleuser@gmail.com",
            Email = email ?? "googleuser@gmail.com",
            Name = name ?? "Google",
            Surname = surname ?? "User",
            Phone = null,
            PhoneNumber = null,
            CreatedAt = DateTime.UtcNow,
            EmailConfirmed = true,
            GoogleId = googleId ?? "google-user-id-123456789",
            ProfilePictureUrl = profilePictureUrl ?? "https://lh3.googleusercontent.com/a/default-user"
        };
    }

    /// <summary>
    /// Mock Google ID Token oluşturur (test amaçlı)
    /// Gerçek bir Google token'ı değil, sadece test için mock değer
    /// </summary>
    public static string CreateMockGoogleIdToken()
    {
        // Mock bir JWT benzeri token oluştur
        var header = Convert.ToBase64String(Encoding.UTF8.GetBytes("{\"alg\":\"RS256\",\"typ\":\"JWT\"}"));
        var payload = Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new
        {
            sub = "google-user-id-123456789",
            email = "googleuser@gmail.com",
            email_verified = true,
            given_name = "Google",
            family_name = "User",
            picture = "https://lh3.googleusercontent.com/a/default-user",
            aud = "test-google-client-id.apps.googleusercontent.com",
            iss = "https://accounts.google.com",
            exp = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds()
        })));
        var signature = Convert.ToBase64String(Encoding.UTF8.GetBytes("mock-signature"));

        return $"{header}.{payload}.{signature}";
    }

    /// <summary>
    /// Google OAuth başarılı yanıt oluşturur
    /// </summary>
    public static AuthResponseDto CreateGoogleSuccessAuthResponse(
        ApplicationUser? user = null,
        string? token = null,
        string? refreshToken = null)
    {
        var testUser = user ?? CreateGoogleUser();
        return new AuthResponseDto
        {
            Success = true,
            Message = "Google ile giriş başarılı",
            Token = token ?? "google-jwt-token",
            RefreshToken = refreshToken ?? "google-refresh-token",
            ExpiresIn = 3600,
            User = new UserDto
            {
                Id = testUser.Id,
                Name = testUser.Name,
                Surname = testUser.Surname,
                Email = testUser.Email ?? string.Empty,
                Phone = testUser.Phone
            }
        };
    }

    /// <summary>
    /// Boş Google ID Token ile GoogleLoginDto oluşturur
    /// </summary>
    public static GoogleLoginDto CreateEmptyGoogleLoginDto()
    {
        return new GoogleLoginDto
        {
            IdToken = string.Empty
        };
    }

    /// <summary>
    /// Geçersiz Google ID Token ile GoogleLoginDto oluşturur
    /// </summary>
    public static GoogleLoginDto CreateInvalidGoogleLoginDto()
    {
        return new GoogleLoginDto
        {
            IdToken = "invalid-google-token"
        };
    }

    // ============================================================================
    // LISTING DATA
    // ============================================================================

    /// <summary>
    /// Test için CreateListingDto oluşturur
    /// </summary>
    public static CreateListingDto CreateCreateListingDto(
        string? title = null,
        string? description = null,
        string? userId = null)
    {
        return new CreateListingDto
        {
            Title = title ?? "Test İlan Başlığı",
            Description = description ?? "Bu bir test ilan açıklamasıdır. Detaylı bilgiler burada yer alacaktır.",
            Category = ListingCategory.Residential,
            Type = ListingType.ForSale,
            PropertyType = PropertyType.Apartment,
            Price = 1000000,
            Currency = Currency.TRY,
            City = "İstanbul",
            District = "Kadıköy",
            Neighborhood = "Moda",
            GrossSquareMeters = 150,
            NetSquareMeters = 120,
            RoomCount = "3+1",
            BathroomCount = 2,
            BuildingAge = 5,
            FloorNumber = 3,
            TotalFloors = 5,
            OwnerType = ListingOwnerType.Owner,
            InteriorFeatures = new List<InteriorFeatureType> { InteriorFeatureType.Balcony, InteriorFeatureType.Elevator },
            ExteriorFeatures = new List<ExteriorFeatureType> { ExteriorFeatureType.Security, ExteriorFeatureType.Parking }
        };
    }

    /// <summary>
    /// Test için UpdateListingDto oluşturur
    /// </summary>
    public static UpdateListingDto CreateUpdateListingDto(
        string? title = null,
        decimal? price = null)
    {
        return new UpdateListingDto
        {
            Title = title ?? "Güncellenmiş İlan Başlığı",
            Price = price ?? 1200000,
            Description = "Güncellenmiş açıklama"
        };
    }

    /// <summary>
    /// Test için Listing model oluşturur
    /// </summary>
    public static Listing CreateListing(
        string? userId = null,
        ListingStatus? status = null)
    {
        return new Listing
        {
            Id = new Random().Next(1, 10000),
            ListingNumber = Guid.NewGuid().ToString().Replace("-", "").Substring(0, 12).ToUpper(),
            Title = "Test İlan",
            Description = "Test açıklama",
            Category = ListingCategory.Residential,
            Type = ListingType.ForSale,
            PropertyType = PropertyType.Apartment,
            Price = 1000000,
            Currency = Currency.TRY,
            City = "İstanbul",
            District = "Kadıköy",
            Neighborhood = "Moda",
            GrossSquareMeters = 150,
            NetSquareMeters = 120,
            RoomCount = "3+1",
            BathroomCount = 2,
            BuildingAge = 5,
            FloorNumber = 3,
            TotalFloors = 5,
            UserId = userId ?? Guid.NewGuid().ToString(),
            Status = status ?? ListingStatus.Active,
            CreatedAt = DateTime.UtcNow,
            OwnerType = ListingOwnerType.Owner
        };
    }

    /// <summary>
    /// Test için ListingDetailDto oluşturur
    /// </summary>
    public static ListingDetailDto CreateListingDetailDto(int? id = null)
    {
        return new ListingDetailDto
        {
            Id = id ?? 1,
            ListingNumber = Guid.NewGuid().ToString().Replace("-", "").Substring(0, 12).ToUpper(),
            Title = "Test İlan",
            Description = "Test açıklama",
            Category = ListingCategory.Residential,
            Type = ListingType.ForSale,
            PropertyType = PropertyType.Apartment,
            Price = 1000000,
            Currency = Currency.TRY,
            City = "İstanbul",
            District = "Kadıköy",
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow,
            Owner = new ListingOwnerDto
            {
                Id = Guid.NewGuid().ToString(),
                Name = "Test",
                Surname = "User",
                Email = "test@example.com"
            }
        };
    }

    /// <summary>
    /// Test için ListingListDto oluşturur
    /// </summary>
    public static ListingListDto CreateListingListDto(int? id = null)
    {
        return new ListingListDto
        {
            Id = id ?? 1,
            ListingNumber = Guid.NewGuid().ToString().Replace("-", "").Substring(0, 12).ToUpper(),
            Title = "Test İlan",
            Category = ListingCategory.Residential,
            Type = ListingType.ForSale,
            PropertyType = PropertyType.Apartment,
            Price = 1000000,
            Currency = Currency.TRY,
            City = "İstanbul",
            District = "Kadıköy",
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow,
            ViewCount = 100,
            FavoriteCount = 25
        };
    }

    /// <summary>
    /// Başarılı ListingResponseDto oluşturur
    /// </summary>
    public static ListingResponseDto CreateSuccessListingResponse(ListingDetailDto? listing = null)
    {
        return new ListingResponseDto
        {
            Success = true,
            Message = "İşlem başarılı",
            Listing = listing ?? CreateListingDetailDto()
        };
    }

    /// <summary>
    /// Başarısız ListingResponseDto oluşturur
    /// </summary>
    public static ListingResponseDto CreateFailedListingResponse(string message = "İşlem başarısız")
    {
        return new ListingResponseDto
        {
            Success = false,
            Message = message
        };
    }

    /// <summary>
    /// Test için ListingListResponseDto oluşturur
    /// </summary>
    public static ListingListResponseDto CreateListingListResponse(List<ListingListDto>? listings = null)
    {
        return new ListingListResponseDto
        {
            Success = true,
            Message = "İşlem başarılı",
            Listings = listings ?? new List<ListingListDto> { CreateListingListDto() },
            Pagination = new PaginationDto
            {
                CurrentPage = 1,
                PageSize = 12,
                TotalPages = 1,
                TotalCount = 1,
                HasPrevious = false,
                HasNext = false
            }
        };
    }

    // ============================================================================
    // COMMENT DATA
    // ============================================================================

    /// <summary>
    /// Test için CreateCommentDto oluşturur
    /// </summary>
    public static CreateCommentDto CreateCreateCommentDto(
        string? content = null,
        int? parentCommentId = null)
    {
        return new CreateCommentDto
        {
            Content = content ?? "Bu bir test yorumudur.",
            ParentCommentId = parentCommentId
        };
    }

    /// <summary>
    /// Test için UpdateCommentDto oluşturur
    /// </summary>
    public static UpdateCommentDto CreateUpdateCommentDto(string? content = null)
    {
        return new UpdateCommentDto
        {
            Content = content ?? "Güncellenmiş yorum içeriği"
        };
    }

    /// <summary>
    /// Test için CommentDto oluşturur
    /// </summary>
    public static CommentDto CreateCommentDto(
        int? id = null,
        int? listingId = null,
        string? userId = null,
        string? content = null)
    {
        var user = CreateTestUser(userId);
        return new CommentDto
        {
            Id = id ?? 1,
            ListingId = listingId ?? 1,
            Content = content ?? "Test yorumu",
            User = new CommentUserDto
            {
                Id = user.Id,
                Name = user.Name,
                Surname = user.Surname,
                ProfilePictureUrl = user.ProfilePictureUrl
            },
            CreatedAt = DateTime.UtcNow,
            Replies = new List<CommentDto>()
        };
    }

    /// <summary>
    /// Test için CommentResponseDto oluşturur
    /// </summary>
    public static CommentResponseDto CreateSuccessCommentResponse(CommentDto? comment = null)
    {
        return new CommentResponseDto
        {
            Success = true,
            Message = "İşlem başarılı",
            Comment = comment ?? CreateCommentDto()
        };
    }

    /// <summary>
    /// Test için CommentListResponseDto oluşturur
    /// </summary>
    public static CommentListResponseDto CreateCommentListResponse(List<CommentDto>? comments = null)
    {
        return new CommentListResponseDto
        {
            Success = true,
            Message = "İşlem başarılı",
            Comments = comments ?? new List<CommentDto> { CreateCommentDto() },
            TotalCount = 1
        };
    }

    // ============================================================================
    // FAVORITE DATA
    // ============================================================================

    /// <summary>
    /// Test için AddFavoriteDto oluşturur
    /// </summary>
    public static AddFavoriteDto CreateAddFavoriteDto(string? note = null)
    {
        return new AddFavoriteDto
        {
            Note = note ?? "Test favori notu"
        };
    }

    /// <summary>
    /// Test için UpdateFavoriteNoteDto oluşturur
    /// </summary>
    public static UpdateFavoriteNoteDto CreateUpdateFavoriteNoteDto(string? note = null)
    {
        return new UpdateFavoriteNoteDto
        {
            Note = note ?? "Güncellenmiş favori notu"
        };
    }

    /// <summary>
    /// Test için FavoriteListingDto oluşturur
    /// </summary>
    public static FavoriteListingDto CreateFavoriteListingDto(int? id = null, int? listingId = null)
    {
        return new FavoriteListingDto
        {
            Id = id ?? 1,
            ListingId = listingId ?? 1,
            Listing = CreateListingListDto(listingId),
            Note = "Test favori notu",
            CreatedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Test için FavoriteResponseDto oluşturur
    /// </summary>
    public static FavoriteResponseDto CreateSuccessFavoriteResponse(bool isFavorited = true)
    {
        return new FavoriteResponseDto
        {
            Success = true,
            Message = "İşlem başarılı",
            IsFavorited = isFavorited
        };
    }

    /// <summary>
    /// Test için FavoriteListResponseDto oluşturur
    /// </summary>
    public static FavoriteListResponseDto CreateFavoriteListResponse(List<FavoriteListingDto>? favorites = null)
    {
        return new FavoriteListResponseDto
        {
            Success = true,
            Message = "İşlem başarılı",
            Favorites = favorites ?? new List<FavoriteListingDto> { CreateFavoriteListingDto() },
            Pagination = new PaginationDto
            {
                CurrentPage = 1,
                PageSize = 20,
                TotalPages = 1,
                TotalCount = 1,
                HasPrevious = false,
                HasNext = false
            }
        };
    }
}
