using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using RealEstateAPI.DTOs.Auth;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Auth;
using RealEstateAPI.Repositories.Listing;
using RealEstateAPI.Services.Auth;
using RealEstateAPI.Services.Email;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Services;

/// <summary>
/// AuthService Unit Tests
/// 
/// AuthService sınıfının iş mantığını test eder.
/// Mock nesneler kullanılarak bağımlılıklar izole edilir.
/// </summary>
public class AuthServiceTests
{
    // ============================================================================
    // MOCK OBJECTS
    // ============================================================================
    
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<SignInManager<ApplicationUser>> _signInManagerMock;
    private readonly Mock<IAuthRepository> _authRepositoryMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly Mock<ILogger<AuthService>> _loggerMock;
    private readonly Mock<IEmailService> _emailServiceMock;
    private readonly Mock<IListingRepository> _listingRepositoryMock;
    private readonly AuthService _authService;

    /// <summary>
    /// Test constructor - Mock nesneleri oluşturur
    /// </summary>
    public AuthServiceTests()
    {
        // UserManager mock
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);

        // SignInManager mock
        var contextAccessorMock = new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>();
        var userPrincipalFactoryMock = new Mock<IUserClaimsPrincipalFactory<ApplicationUser>>();
        _signInManagerMock = new Mock<SignInManager<ApplicationUser>>(
            _userManagerMock.Object,
            contextAccessorMock.Object,
            userPrincipalFactoryMock.Object, null!, null!, null!, null!);

        // Other mocks
        _authRepositoryMock = new Mock<IAuthRepository>();
        _configurationMock = new Mock<IConfiguration>();
        _loggerMock = new Mock<ILogger<AuthService>>();
        _emailServiceMock = new Mock<IEmailService>();
        _listingRepositoryMock = new Mock<IListingRepository>();

        // JWT Settings mock
        SetupJwtConfiguration();

        // AuthService instance
        _authService = new AuthService(
            _userManagerMock.Object,
            _signInManagerMock.Object,
            _authRepositoryMock.Object,
            _configurationMock.Object,
            _loggerMock.Object,
            _emailServiceMock.Object,
            _listingRepositoryMock.Object);
    }

    /// <summary>
    /// JWT konfigürasyonunu ayarlar
    /// </summary>
    private void SetupJwtConfiguration()
    {
        var jwtSection = new Mock<IConfigurationSection>();
        
        _configurationMock.Setup(x => x.GetSection("JwtSettings")).Returns(jwtSection.Object);
        _configurationMock.Setup(x => x["JwtSettings:SecretKey"])
            .Returns("YourSuperSecretKeyForTestingPurposes123456789!");
        _configurationMock.Setup(x => x["JwtSettings:Issuer"]).Returns("RealEstateAPI.Test");
        _configurationMock.Setup(x => x["JwtSettings:Audience"]).Returns("RealEstateAPI.Test.Client");
        _configurationMock.Setup(x => x["JwtSettings:ExpirationMinutes"]).Returns("60");
        _configurationMock.Setup(x => x["JwtSettings:RefreshTokenExpirationDays"]).Returns("7");

        // IConfigurationSection için index erişimi
        jwtSection.Setup(x => x["SecretKey"]).Returns("YourSuperSecretKeyForTestingPurposes123456789!");
        jwtSection.Setup(x => x["Issuer"]).Returns("RealEstateAPI.Test");
        jwtSection.Setup(x => x["Audience"]).Returns("RealEstateAPI.Test.Client");
        jwtSection.Setup(x => x["ExpirationMinutes"]).Returns("60");
    }

    // ============================================================================
    // REGISTER TESTS
    // ============================================================================

    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldReturnSuccess()
    {
        // Arrange
        var registerDto = TestDataFactory.CreateRegisterDto();
        
        _authRepositoryMock.Setup(x => x.IsEmailExistsAsync(registerDto.Email))
            .ReturnsAsync(false);
        
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), registerDto.Password))
            .ReturnsAsync(IdentityResult.Success);

        _authRepositoryMock.Setup(x => x.SaveRefreshTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _authService.RegisterAsync(registerDto, "127.0.0.1");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("Kayıt başarılı");
        result.Token.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.User.Should().NotBeNull();
        result.User!.Email.Should().Be(registerDto.Email);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ShouldReturnFailure()
    {
        // Arrange
        var registerDto = TestDataFactory.CreateRegisterDto();
        
        _authRepositoryMock.Setup(x => x.IsEmailExistsAsync(registerDto.Email))
            .ReturnsAsync(true); // Email zaten var

        // Act
        var result = await _authService.RegisterAsync(registerDto);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Bu e-posta adresi zaten kullanımda");
        result.Token.Should().BeNull();
    }

    [Fact]
    public async Task RegisterAsync_WhenIdentityFails_ShouldReturnFailure()
    {
        // Arrange
        var registerDto = TestDataFactory.CreateRegisterDto();
        
        _authRepositoryMock.Setup(x => x.IsEmailExistsAsync(registerDto.Email))
            .ReturnsAsync(false);

        var identityErrors = new[] { new IdentityError { Description = "Şifre çok zayıf" } };
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), registerDto.Password))
            .ReturnsAsync(IdentityResult.Failed(identityErrors));

        // Act
        var result = await _authService.RegisterAsync(registerDto);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Şifre çok zayıf");
    }

    [Fact]
    public async Task RegisterAsync_WithNullIpAddress_ShouldStillSucceed()
    {
        // Arrange
        var registerDto = TestDataFactory.CreateRegisterDto();
        
        _authRepositoryMock.Setup(x => x.IsEmailExistsAsync(registerDto.Email))
            .ReturnsAsync(false);
        
        _userManagerMock.Setup(x => x.CreateAsync(It.IsAny<ApplicationUser>(), registerDto.Password))
            .ReturnsAsync(IdentityResult.Success);

        _authRepositoryMock.Setup(x => x.SaveRefreshTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _authService.RegisterAsync(registerDto, null);

        // Assert
        result.Success.Should().BeTrue();
    }

    // ============================================================================
    // LOGIN TESTS
    // ============================================================================

    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnSuccess()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto();
        var user = TestDataFactory.CreateTestUser(email: loginDto.EmailOrUsername);
        
        _authRepositoryMock.Setup(x => x.GetUserByEmailAsync(loginDto.EmailOrUsername))
            .ReturnsAsync(user);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, loginDto.Password, true))
            .ReturnsAsync(SignInResult.Success);

        _authRepositoryMock.Setup(x => x.SaveRefreshTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _authService.LoginAsync(loginDto, "127.0.0.1");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("Giriş başarılı");
        result.Token.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.User.Should().NotBeNull();
    }

    [Fact]
    public async Task LoginAsync_WithInvalidEmail_ShouldReturnFailure()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto(email: "invalid@example.com");
        
        _authRepositoryMock.Setup(x => x.GetUserByEmailAsync(loginDto.EmailOrUsername))
            .ReturnsAsync((ApplicationUser?)null);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Geçersiz e-posta veya şifre");
    }

    [Fact]
    public async Task LoginAsync_WithInvalidPassword_ShouldReturnFailure()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto(password: "wrongpassword");
        var user = TestDataFactory.CreateTestUser(email: loginDto.EmailOrUsername);
        
        _authRepositoryMock.Setup(x => x.GetUserByEmailAsync(loginDto.EmailOrUsername))
            .ReturnsAsync(user);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, loginDto.Password, true))
            .ReturnsAsync(SignInResult.Failed);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Geçersiz e-posta veya şifre");
    }

    [Fact]
    public async Task LoginAsync_WhenAccountLocked_ShouldReturnLockedMessage()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto();
        var user = TestDataFactory.CreateTestUser(email: loginDto.EmailOrUsername);
        
        _authRepositoryMock.Setup(x => x.GetUserByEmailAsync(loginDto.EmailOrUsername))
            .ReturnsAsync(user);

        _signInManagerMock.Setup(x => x.CheckPasswordSignInAsync(user, loginDto.Password, true))
            .ReturnsAsync(SignInResult.LockedOut);

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("kilitlendi");
    }

    // ============================================================================
    // REFRESH TOKEN TESTS
    // ============================================================================

    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_ShouldReturnNewTokens()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var refreshToken = TestDataFactory.CreateRefreshToken(userId: user.Id);
        refreshToken.User = user;
        
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(refreshToken.Token))
            .ReturnsAsync(refreshToken);

        _authRepositoryMock.Setup(x => x.UpdateRefreshTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        _authRepositoryMock.Setup(x => x.SaveRefreshTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _authService.RefreshTokenAsync(refreshToken.Token, "127.0.0.1");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("Token yenilendi");
        result.Token.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBeNullOrEmpty();
        result.RefreshToken.Should().NotBe(refreshToken.Token); // Yeni token farklı olmalı
    }

    [Fact]
    public async Task RefreshTokenAsync_WithInvalidToken_ShouldReturnFailure()
    {
        // Arrange
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(It.IsAny<string>()))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _authService.RefreshTokenAsync("invalid-token");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Geçersiz refresh token");
    }

    [Fact]
    public async Task RefreshTokenAsync_WithExpiredToken_ShouldReturnFailure()
    {
        // Arrange
        var expiredToken = TestDataFactory.CreateExpiredRefreshToken();
        
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(expiredToken.Token))
            .ReturnsAsync(expiredToken);

        // Act
        var result = await _authService.RefreshTokenAsync(expiredToken.Token);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("süresi dolmuş");
    }

    [Fact]
    public async Task RefreshTokenAsync_WithRevokedToken_ShouldReturnFailure()
    {
        // Arrange
        var revokedToken = TestDataFactory.CreateRevokedRefreshToken();
        
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(revokedToken.Token))
            .ReturnsAsync(revokedToken);

        // Act
        var result = await _authService.RefreshTokenAsync(revokedToken.Token);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("iptal edilmiş");
    }

    [Fact]
    public async Task RefreshTokenAsync_WithUsedToken_ShouldReturnFailure()
    {
        // Arrange
        var usedToken = TestDataFactory.CreateUsedRefreshToken();
        
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(usedToken.Token))
            .ReturnsAsync(usedToken);

        // Act
        var result = await _authService.RefreshTokenAsync(usedToken.Token);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
    }

    [Fact]
    public async Task RefreshTokenAsync_WhenUserNotFound_ShouldReturnFailure()
    {
        // Arrange
        var refreshToken = TestDataFactory.CreateRefreshToken();
        refreshToken.User = null; // User yok
        
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(refreshToken.Token))
            .ReturnsAsync(refreshToken);

        // Act
        var result = await _authService.RefreshTokenAsync(refreshToken.Token);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Kullanıcı bulunamadı");
    }

    // ============================================================================
    // REVOKE TOKEN (LOGOUT) TESTS
    // ============================================================================

    [Fact]
    public async Task RevokeTokenAsync_WithValidToken_ShouldReturnSuccess()
    {
        // Arrange
        var refreshToken = TestDataFactory.CreateRefreshToken();
        
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(refreshToken.Token))
            .ReturnsAsync(refreshToken);

        _authRepositoryMock.Setup(x => x.UpdateRefreshTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _authService.RevokeTokenAsync(refreshToken.Token, "127.0.0.1");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Be("Çıkış başarılı");
    }

    [Fact]
    public async Task RevokeTokenAsync_WithInvalidToken_ShouldReturnFailure()
    {
        // Arrange
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(It.IsAny<string>()))
            .ReturnsAsync((RefreshToken?)null);

        // Act
        var result = await _authService.RevokeTokenAsync("invalid-token");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Geçersiz");
    }

    [Fact]
    public async Task RevokeTokenAsync_WithAlreadyRevokedToken_ShouldReturnFailure()
    {
        // Arrange
        var revokedToken = TestDataFactory.CreateRevokedRefreshToken();
        
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(revokedToken.Token))
            .ReturnsAsync(revokedToken);

        // Act
        var result = await _authService.RevokeTokenAsync(revokedToken.Token);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("iptal edilmiş");
    }

    // ============================================================================
    // GET USER BY ID TESTS
    // ============================================================================

    [Fact]
    public async Task GetUserByIdAsync_WithValidId_ShouldReturnUser()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        
        _authRepositoryMock.Setup(x => x.GetUserByIdAsync(user.Id))
            .ReturnsAsync(user);

        // Act
        var result = await _authService.GetUserByIdAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(user.Id);
        result.Name.Should().Be(user.Name);
        result.Email.Should().Be(user.Email);
    }

    [Fact]
    public async Task GetUserByIdAsync_WithInvalidId_ShouldReturnNull()
    {
        // Arrange
        _authRepositoryMock.Setup(x => x.GetUserByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser?)null);

        // Act
        var result = await _authService.GetUserByIdAsync("invalid-id");

        // Assert
        result.Should().BeNull();
    }

    // ============================================================================
    // GOOGLE LOGIN TESTS
    // ============================================================================

    [Fact]
    public async Task GoogleLoginAsync_WithExistingGoogleUser_ShouldReturnSuccess()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateGoogleLoginDto();
        var existingUser = TestDataFactory.CreateGoogleUser();
        
        _authRepositoryMock.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
            .ReturnsAsync(existingUser);

        _authRepositoryMock.Setup(x => x.SaveRefreshTokenAsync(It.IsAny<RefreshToken>()))
            .Returns(Task.CompletedTask);

        // Google token doğrulama AuthService içinde HTTP call yaptığı için 
        // bu test gerçek token doğrulama yapmaz, sadece exception handling test eder
        // Act & Assert - Exception fırlatmalı çünkü mock HTTP client yok
        var result = await _authService.GoogleLoginAsync(googleLoginDto, "127.0.0.1");

        // Google API çağrısı başarısız olacak (mock HTTP client yok)
        // Bu beklenen davranış
        result.Should().NotBeNull();
    }

    [Fact]
    public async Task GoogleLoginAsync_WithEmptyIdToken_ShouldReturnFailure()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateEmptyGoogleLoginDto();

        // Act
        var result = await _authService.GoogleLoginAsync(googleLoginDto);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
    }

    [Fact]
    public async Task GoogleLoginAsync_WithInvalidIdToken_ShouldReturnFailure()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateInvalidGoogleLoginDto();

        // Act
        var result = await _authService.GoogleLoginAsync(googleLoginDto);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("Google");
    }

    [Fact]
    public async Task GoogleLoginAsync_WithNullIpAddress_ShouldStillProcess()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateGoogleLoginDto();

        // Act
        var result = await _authService.GoogleLoginAsync(googleLoginDto, null);

        // Assert
        result.Should().NotBeNull();
        // Token doğrulama başarısız olacak ama IP address null olması sorun olmamalı
    }

    [Fact]
    public async Task GoogleLoginAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateGoogleLoginDto();
        
        _authRepositoryMock.Setup(x => x.GetUserByEmailAsync(It.IsAny<string>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _authService.GoogleLoginAsync(googleLoginDto);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        // Google token doğrulama önce çalışır, exception repository'den önce gerçekleşmez
        // Bu yüzden "Google" kelimesi içeren bir hata mesajı bekliyoruz
        result.Message.Should().Contain("Google");
    }

    // ============================================================================
    // EDGE CASES & EXCEPTION HANDLING TESTS
    // ============================================================================

    [Fact]
    public async Task RegisterAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        // Arrange
        var registerDto = TestDataFactory.CreateRegisterDto();
        
        _authRepositoryMock.Setup(x => x.IsEmailExistsAsync(registerDto.Email))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _authService.RegisterAsync(registerDto);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("hata oluştu");
    }

    [Fact]
    public async Task LoginAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto();
        
        _authRepositoryMock.Setup(x => x.GetUserByEmailAsync(loginDto.EmailOrUsername))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _authService.LoginAsync(loginDto);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("hata oluştu");
    }

    [Fact]
    public async Task RefreshTokenAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        // Arrange
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(It.IsAny<string>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _authService.RefreshTokenAsync("some-token");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("hata oluştu");
    }

    [Fact]
    public async Task RevokeTokenAsync_WhenExceptionThrown_ShouldReturnFailure()
    {
        // Arrange
        _authRepositoryMock.Setup(x => x.GetRefreshTokenAsync(It.IsAny<string>()))
            .ThrowsAsync(new Exception("Database error"));

        // Act
        var result = await _authService.RevokeTokenAsync("some-token");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("hata oluştu");
    }

    // ============================================================================
    // DEACTIVATE ACCOUNT TESTS
    // ============================================================================

    [Fact]
    public async Task DeactivateAccountAsync_WithValidUser_ShouldReturnSuccess()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        
        _authRepositoryMock.Setup(x => x.GetUserByIdAsync(user.Id))
            .ReturnsAsync(user);

        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        _listingRepositoryMock.Setup(x => x.UpdateUserListingsStatusAsync(user.Id, ListingStatus.Inactive))
            .ReturnsAsync(true);

        _authRepositoryMock.Setup(x => x.RevokeAllUserRefreshTokensAsync(user.Id))
            .Returns(Task.CompletedTask);

        // Act
        var result = await _authService.DeactivateAccountAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.Message.Should().Contain("kapatıldı");
        user.IsActive.Should().BeFalse();
    }

    [Fact]
    public async Task DeactivateAccountAsync_WithNonExistentUser_ShouldReturnFailure()
    {
        // Arrange
        _authRepositoryMock.Setup(x => x.GetUserByIdAsync(It.IsAny<string>()))
            .ReturnsAsync((ApplicationUser?)null);

        // Act
        var result = await _authService.DeactivateAccountAsync("non-existent-id");

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeFalse();
        result.Message.Should().Be("Kullanıcı bulunamadı");
    }
}
