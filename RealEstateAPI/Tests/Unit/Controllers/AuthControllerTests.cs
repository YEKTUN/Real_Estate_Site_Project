using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using RealEstateAPI.Controllers.Auth;
using RealEstateAPI.DTOs.Auth;
using RealEstateAPI.Services.Auth;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Controllers;

/// <summary>
/// AuthController Unit Tests
/// 
/// AuthController'ın HTTP endpoint'lerini test eder.
/// Service katmanı mock'lanarak controller mantığı izole edilir.
/// </summary>
public class AuthControllerTests
{
    // ============================================================================
    // MOCK OBJECTS
    // ============================================================================

    private readonly Mock<IAuthService> _authServiceMock;
    private readonly Mock<ILogger<AuthController>> _loggerMock;
    private readonly AuthController _controller;

    /// <summary>
    /// Test constructor - Mock nesneleri ve controller'ı oluşturur
    /// </summary>
    public AuthControllerTests()
    {
        _authServiceMock = new Mock<IAuthService>();
        _loggerMock = new Mock<ILogger<AuthController>>();
        
        _controller = new AuthController(_authServiceMock.Object, _loggerMock.Object);
        
        // HttpContext mock
        SetupHttpContext();
    }

    /// <summary>
    /// HttpContext'i mock'lar (IP adresi için)
    /// </summary>
    private void SetupHttpContext()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Connection.RemoteIpAddress = System.Net.IPAddress.Parse("127.0.0.1");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    /// <summary>
    /// Authenticated user context oluşturur
    /// </summary>
    private void SetupAuthenticatedUser(string userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        
        _controller.ControllerContext.HttpContext.User = claimsPrincipal;
    }

    // ============================================================================
    // REGISTER ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task Register_WithValidData_ShouldReturnOk()
    {
        // Arrange
        var registerDto = TestDataFactory.CreateRegisterDto();
        var successResponse = TestDataFactory.CreateSuccessAuthResponse();
        
        _authServiceMock.Setup(x => x.RegisterAsync(registerDto, It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.Register(registerDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeTrue();
        response.Token.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Register_WhenServiceFails_ShouldReturnBadRequest()
    {
        // Arrange
        var registerDto = TestDataFactory.CreateRegisterDto();
        var failedResponse = TestDataFactory.CreateFailedAuthResponse("E-posta zaten kullanımda");
        
        _authServiceMock.Setup(x => x.RegisterAsync(registerDto, It.IsAny<string?>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.Register(registerDto);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("kullanımda");
    }

    [Fact]
    public async Task Register_WithInvalidModelState_ShouldReturnBadRequest()
    {
        // Arrange
        var registerDto = TestDataFactory.CreateRegisterDto();
        _controller.ModelState.AddModelError("Email", "E-posta zorunludur");

        // Act
        var result = await _controller.Register(registerDto);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeFalse();
    }

    [Fact]
    public async Task Register_ShouldCallServiceWithCorrectParameters()
    {
        // Arrange
        var registerDto = TestDataFactory.CreateRegisterDto();
        var successResponse = TestDataFactory.CreateSuccessAuthResponse();
        
        _authServiceMock.Setup(x => x.RegisterAsync(It.IsAny<RegisterDto>(), It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        await _controller.Register(registerDto);

        // Assert
        _authServiceMock.Verify(
            x => x.RegisterAsync(
                It.Is<RegisterDto>(dto => dto.Email == registerDto.Email),
                It.IsAny<string?>()),
            Times.Once);
    }

    // ============================================================================
    // LOGIN ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnOk()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto();
        var successResponse = TestDataFactory.CreateSuccessAuthResponse();
        
        _authServiceMock.Setup(x => x.LoginAsync(loginDto, It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.Login(loginDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeTrue();
        response.Token.Should().NotBeNullOrEmpty();
        response.RefreshToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ShouldReturnBadRequest()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto();
        var failedResponse = TestDataFactory.CreateFailedAuthResponse("Geçersiz e-posta veya şifre");
        
        _authServiceMock.Setup(x => x.LoginAsync(loginDto, It.IsAny<string?>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.Login(loginDto);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeFalse();
    }

    [Fact]
    public async Task Login_WithInvalidModelState_ShouldReturnBadRequest()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto();
        _controller.ModelState.AddModelError("Password", "Şifre zorunludur");

        // Act
        var result = await _controller.Login(loginDto);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Login_ShouldCallServiceWithCorrectParameters()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto();
        var successResponse = TestDataFactory.CreateSuccessAuthResponse();
        
        _authServiceMock.Setup(x => x.LoginAsync(It.IsAny<LoginDto>(), It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        await _controller.Login(loginDto);

        // Assert
        _authServiceMock.Verify(
            x => x.LoginAsync(
                It.Is<LoginDto>(dto => dto.EmailOrUsername == loginDto.EmailOrUsername),
                It.IsAny<string?>()),
            Times.Once);
    }

    // ============================================================================
    // REFRESH TOKEN ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task RefreshToken_WithValidToken_ShouldReturnOk()
    {
        // Arrange
        var request = new RefreshTokenRequestDto { RefreshToken = "valid-refresh-token" };
        var successResponse = TestDataFactory.CreateSuccessAuthResponse();
        
        _authServiceMock.Setup(x => x.RefreshTokenAsync(request.RefreshToken, It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.RefreshToken(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task RefreshToken_WithInvalidToken_ShouldReturnUnauthorized()
    {
        // Arrange
        var request = new RefreshTokenRequestDto { RefreshToken = "invalid-token" };
        var failedResponse = TestDataFactory.CreateFailedAuthResponse("Geçersiz refresh token");
        
        _authServiceMock.Setup(x => x.RefreshTokenAsync(request.RefreshToken, It.IsAny<string?>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.RefreshToken(request);

        // Assert
        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task RefreshToken_WithEmptyToken_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RefreshTokenRequestDto { RefreshToken = "" };

        // Act
        var result = await _controller.RefreshToken(request);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("gereklidir");
    }

    [Fact]
    public async Task RefreshToken_WithNullToken_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RefreshTokenRequestDto { RefreshToken = null! };

        // Act
        var result = await _controller.RefreshToken(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ============================================================================
    // LOGOUT ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task Logout_WithValidToken_ShouldReturnOk()
    {
        // Arrange
        var request = new RefreshTokenRequestDto { RefreshToken = "valid-token" };
        var successResponse = new AuthResponseDto { Success = true, Message = "Çıkış başarılı" };
        
        _authServiceMock.Setup(x => x.RevokeTokenAsync(request.RefreshToken, It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.Logout(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Logout_WithInvalidToken_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RefreshTokenRequestDto { RefreshToken = "invalid-token" };
        var failedResponse = TestDataFactory.CreateFailedAuthResponse("Geçersiz token");
        
        _authServiceMock.Setup(x => x.RevokeTokenAsync(request.RefreshToken, It.IsAny<string?>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.Logout(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task Logout_WithEmptyToken_ShouldReturnBadRequest()
    {
        // Arrange
        var request = new RefreshTokenRequestDto { RefreshToken = "" };

        // Act
        var result = await _controller.Logout(request);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeFalse();
    }

    // ============================================================================
    // GET CURRENT USER ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task GetCurrentUser_WhenAuthenticated_ShouldReturnUser()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        
        var userDto = new UserDto
        {
            Id = userId,
            Name = "Test",
            Surname = "User",
            Email = "test@example.com"
        };
        
        _authServiceMock.Setup(x => x.GetUserByIdAsync(userId, It.IsAny<string?>()))
            .ReturnsAsync(userDto);

        // Act
        var result = await _controller.GetCurrentUser();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeTrue();
        response.User.Should().NotBeNull();
        response.User!.Id.Should().Be(userId);
    }

    [Fact]
    public async Task GetCurrentUser_WhenUserNotFound_ShouldReturnNotFound()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        
        _authServiceMock.Setup(x => x.GetUserByIdAsync(userId, It.IsAny<string?>()))
            .ReturnsAsync((UserDto?)null);

        // Act
        var result = await _controller.GetCurrentUser();

        // Assert
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        var response = notFoundResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("bulunamadı");
    }

    [Fact]
    public async Task GetCurrentUser_WhenNotAuthenticated_ShouldReturnUnauthorized()
    {
        // Arrange - User claim'i yok
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetCurrentUser();

        // Assert
        var unauthorizedResult = result.Should().BeOfType<UnauthorizedObjectResult>().Subject;
        var response = unauthorizedResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeFalse();
    }

    // ============================================================================
    // IP ADDRESS TESTS
    // ============================================================================

    [Fact]
    public async Task Login_ShouldPassIpAddressToService()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto();
        var successResponse = TestDataFactory.CreateSuccessAuthResponse();
        string? capturedIp = null;
        
        _authServiceMock.Setup(x => x.LoginAsync(It.IsAny<LoginDto>(), It.IsAny<string?>()))
            .Callback<LoginDto, string?>((dto, ip) => capturedIp = ip)
            .ReturnsAsync(successResponse);

        // Act
        await _controller.Login(loginDto);

        // Assert
        capturedIp.Should().NotBeNull();
        capturedIp.Should().Be("127.0.0.1");
    }

    [Fact]
    public async Task Login_WithXForwardedForHeader_ShouldUseHeaderIp()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto();
        var successResponse = TestDataFactory.CreateSuccessAuthResponse();
        string? capturedIp = null;
        
        // X-Forwarded-For header ekle
        _controller.ControllerContext.HttpContext.Request.Headers["X-Forwarded-For"] = "192.168.1.100";
        
        _authServiceMock.Setup(x => x.LoginAsync(It.IsAny<LoginDto>(), It.IsAny<string?>()))
            .Callback<LoginDto, string?>((dto, ip) => capturedIp = ip)
            .ReturnsAsync(successResponse);

        // Act
        await _controller.Login(loginDto);

        // Assert
        capturedIp.Should().Be("192.168.1.100");
    }

    // ============================================================================
    // GOOGLE LOGIN ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task GoogleLogin_WithValidToken_ShouldReturnOk()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateGoogleLoginDto();
        var successResponse = TestDataFactory.CreateGoogleSuccessAuthResponse();
        
        _authServiceMock.Setup(x => x.GoogleLoginAsync(googleLoginDto, It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.GoogleLogin(googleLoginDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeTrue();
        response.Token.Should().NotBeNullOrEmpty();
        response.Message.Should().Contain("Google");
    }

    [Fact]
    public async Task GoogleLogin_WithInvalidToken_ShouldReturnBadRequest()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateGoogleLoginDto();
        var failedResponse = TestDataFactory.CreateFailedAuthResponse("Geçersiz Google token");
        
        _authServiceMock.Setup(x => x.GoogleLoginAsync(googleLoginDto, It.IsAny<string?>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.GoogleLogin(googleLoginDto);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeFalse();
    }

    [Fact]
    public async Task GoogleLogin_WithEmptyToken_ShouldReturnBadRequest()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateEmptyGoogleLoginDto();

        // Act
        var result = await _controller.GoogleLogin(googleLoginDto);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("gereklidir");
    }

    [Fact]
    public async Task GoogleLogin_ShouldCallServiceWithCorrectParameters()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateGoogleLoginDto();
        var successResponse = TestDataFactory.CreateGoogleSuccessAuthResponse();
        
        _authServiceMock.Setup(x => x.GoogleLoginAsync(It.IsAny<GoogleLoginDto>(), It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        await _controller.GoogleLogin(googleLoginDto);

        // Assert
        _authServiceMock.Verify(
            x => x.GoogleLoginAsync(
                It.Is<GoogleLoginDto>(dto => dto.IdToken == googleLoginDto.IdToken),
                It.IsAny<string?>()),
            Times.Once);
    }

    [Fact]
    public async Task GoogleLogin_ShouldPassIpAddressToService()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateGoogleLoginDto();
        var successResponse = TestDataFactory.CreateGoogleSuccessAuthResponse();
        string? capturedIp = null;
        
        _authServiceMock.Setup(x => x.GoogleLoginAsync(It.IsAny<GoogleLoginDto>(), It.IsAny<string?>()))
            .Callback<GoogleLoginDto, string?>((dto, ip) => capturedIp = ip)
            .ReturnsAsync(successResponse);

        // Act
        await _controller.GoogleLogin(googleLoginDto);

        // Assert
        capturedIp.Should().NotBeNull();
        capturedIp.Should().Be("127.0.0.1");
    }

    [Fact]
    public async Task GoogleLogin_Success_ShouldReturn200()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateGoogleLoginDto();
        var successResponse = TestDataFactory.CreateGoogleSuccessAuthResponse();
        
        _authServiceMock.Setup(x => x.GoogleLoginAsync(googleLoginDto, It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.GoogleLogin(googleLoginDto);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task GoogleLogin_Failure_ShouldReturn400()
    {
        // Arrange
        var googleLoginDto = TestDataFactory.CreateGoogleLoginDto();
        var failedResponse = TestDataFactory.CreateFailedAuthResponse("Google ile giriş başarısız");
        
        _authServiceMock.Setup(x => x.GoogleLoginAsync(googleLoginDto, It.IsAny<string?>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.GoogleLogin(googleLoginDto);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    // ============================================================================
    // RESPONSE STATUS CODE TESTS
    // ============================================================================

    [Fact]
    public async Task Register_Success_ShouldReturn200()
    {
        // Arrange
        var registerDto = TestDataFactory.CreateRegisterDto();
        var successResponse = TestDataFactory.CreateSuccessAuthResponse();
        
        _authServiceMock.Setup(x => x.RegisterAsync(registerDto, It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.Register(registerDto);

        // Assert
        var okResult = result as OkObjectResult;
        okResult.Should().NotBeNull();
        okResult!.StatusCode.Should().Be(200);
    }

    [Fact]
    public async Task Login_Failure_ShouldReturn400()
    {
        // Arrange
        var loginDto = TestDataFactory.CreateLoginDto();
        var failedResponse = TestDataFactory.CreateFailedAuthResponse();
        
        _authServiceMock.Setup(x => x.LoginAsync(loginDto, It.IsAny<string?>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.Login(loginDto);

        // Assert
        var badRequestResult = result as BadRequestObjectResult;
        badRequestResult.Should().NotBeNull();
        badRequestResult!.StatusCode.Should().Be(400);
    }

    [Fact]
    public async Task GetCurrentUser_NotFound_ShouldReturn404()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        
        _authServiceMock.Setup(x => x.GetUserByIdAsync(userId, It.IsAny<string?>()))
            .ReturnsAsync((UserDto?)null);

        // Act
        var result = await _controller.GetCurrentUser();

        // Assert
        var notFoundResult = result as NotFoundObjectResult;
        notFoundResult.Should().NotBeNull();
        notFoundResult!.StatusCode.Should().Be(404);
    }
}
