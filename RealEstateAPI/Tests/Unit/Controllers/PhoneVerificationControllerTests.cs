using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using RealEstateAPI.Controllers;
using RealEstateAPI.Models;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Controllers;

/// <summary>
/// PhoneVerificationController Unit Tests
/// </summary>
public class PhoneVerificationControllerTests
{
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly Mock<ILogger<PhoneVerificationController>> _loggerMock;
    private readonly PhoneVerificationController _controller;

    public PhoneVerificationControllerTests()
    {
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        
        _loggerMock = new Mock<ILogger<PhoneVerificationController>>();
        _controller = new PhoneVerificationController(_userManagerMock.Object, _loggerMock.Object);
        
        SetupAuthenticatedUser("test-user-id");
    }

    private void SetupAuthenticatedUser(string userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    // ============================================================================
    // SEND CODE TESTS
    // ============================================================================

    [Fact]
    public async Task SendVerificationCode_WithValidPhone_ShouldReturnOk()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var request = new SendCodeRequest { Phone = "05551234567" };

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);
        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _controller.SendVerificationCode(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value;
        response.Should().NotBeNull();
    }

    [Fact]
    public async Task SendVerificationCode_WithEmptyPhone_ShouldReturnBadRequest()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var request = new SendCodeRequest { Phone = "" };

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.SendVerificationCode(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task SendVerificationCode_WithInvalidPhoneFormat_ShouldReturnBadRequest()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var request = new SendCodeRequest { Phone = "123456" }; // Invalid format

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.SendVerificationCode(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task SendVerificationCode_WithNonExistingUser_ShouldReturnNotFound()
    {
        // Arrange
        var request = new SendCodeRequest { Phone = "05551234567" };

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync((ApplicationUser?)null);

        // Act
        var result = await _controller.SendVerificationCode(request);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task SendVerificationCode_ShouldSetVerificationCode()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var request = new SendCodeRequest { Phone = "05551234567" };

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);
        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        await _controller.SendVerificationCode(request);

        // Assert
        user.PhoneVerificationCode.Should().Be("111111");
        user.PhoneVerificationExpires.Should().NotBeNull();
        user.PhoneVerificationExpires.Should().BeAfter(DateTime.UtcNow);
    }

    // ============================================================================
    // VERIFY CODE TESTS
    // ============================================================================

    [Fact]
    public async Task VerifyCode_WithValidCode_ShouldReturnOk()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        user.PhoneVerificationCode = "111111";
        user.PhoneVerificationExpires = DateTime.UtcNow.AddMinutes(5);
        
        var request = new VerifyCodeRequest 
        { 
            Code = "111111",
            Phone = "05551234567"
        };

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);
        _userManagerMock.Setup(x => x.UpdateAsync(It.IsAny<ApplicationUser>()))
            .ReturnsAsync(IdentityResult.Success);

        // Act
        var result = await _controller.VerifyCode(request);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        user.PhoneVerified.Should().BeTrue();
        user.Phone.Should().Be("05551234567");
        user.PhoneVerificationCode.Should().BeNull();
    }

    [Fact]
    public async Task VerifyCode_WithInvalidCode_ShouldReturnBadRequest()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        user.PhoneVerificationCode = "111111";
        user.PhoneVerificationExpires = DateTime.UtcNow.AddMinutes(5);
        
        var request = new VerifyCodeRequest 
        { 
            Code = "999999", // Wrong code
            Phone = "05551234567"
        };

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.VerifyCode(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task VerifyCode_WithExpiredCode_ShouldReturnBadRequest()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        user.PhoneVerificationCode = "111111";
        user.PhoneVerificationExpires = DateTime.UtcNow.AddMinutes(-1); // Expired
        
        var request = new VerifyCodeRequest 
        { 
            Code = "111111",
            Phone = "05551234567"
        };

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.VerifyCode(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task VerifyCode_WithNoCodeSent_ShouldReturnBadRequest()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        user.PhoneVerificationCode = null; // No code sent
        
        var request = new VerifyCodeRequest 
        { 
            Code = "111111",
            Phone = "05551234567"
        };

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.VerifyCode(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task VerifyCode_WithEmptyCode_ShouldReturnBadRequest()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var request = new VerifyCodeRequest 
        { 
            Code = "",
            Phone = "05551234567"
        };

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.VerifyCode(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task VerifyCode_WithInvalidPhoneFormat_ShouldReturnBadRequest()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        user.PhoneVerificationCode = "111111";
        user.PhoneVerificationExpires = DateTime.UtcNow.AddMinutes(5);
        
        var request = new VerifyCodeRequest 
        { 
            Code = "111111",
            Phone = "123" // Invalid format
        };

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.VerifyCode(request);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    // ============================================================================
    // GET STATUS TESTS
    // ============================================================================

    [Fact]
    public async Task GetVerificationStatus_WithVerifiedPhone_ShouldReturnStatus()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        user.Phone = "05551234567";
        user.PhoneVerified = true;

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.GetVerificationStatus();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().NotBeNull();
    }

    [Fact]
    public async Task GetVerificationStatus_WithNonExistingUser_ShouldReturnNotFound()
    {
        // Arrange
        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync((ApplicationUser?)null);

        // Act
        var result = await _controller.GetVerificationStatus();

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetVerificationStatus_WithUnverifiedPhone_ShouldReturnFalse()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        user.PhoneVerified = false;

        _userManagerMock.Setup(x => x.FindByIdAsync("test-user-id"))
            .ReturnsAsync(user);

        // Act
        var result = await _controller.GetVerificationStatus();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }
}
