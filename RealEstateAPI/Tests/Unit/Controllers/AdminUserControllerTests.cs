using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using RealEstateAPI.Controllers.Admin;
using RealEstateAPI.DTOs.Auth;
using RealEstateAPI.Services.Auth;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Controllers;

/// <summary>
/// AdminUserController Unit Tests
/// </summary>
public class AdminUserControllerTests
{
    private readonly Mock<IAuthService> _authServiceMock;
    private readonly Mock<ILogger<AdminUserController>> _loggerMock;
    private readonly AdminUserController _controller;

    public AdminUserControllerTests()
    {
        _authServiceMock = new Mock<IAuthService>();
        _loggerMock = new Mock<ILogger<AdminUserController>>();
        _controller = new AdminUserController(_authServiceMock.Object, _loggerMock.Object);
    }

    // ============================================================================
    // FIND BY EMAIL TESTS
    // ============================================================================

    [Fact]
    public async Task FindByEmail_WithValidEmail_ShouldReturnOk()
    {
        // Arrange
        var email = "test@example.com";
        var successResponse = new AuthResponseDto
        {
            Success = true,
            Message = "Kullanıcı bulundu",
            User = TestDataFactory.CreateUserDto()
        };

        _authServiceMock.Setup(x => x.GetUserBySearchAsync(email))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.FindByEmail(email);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeTrue();
        response.User.Should().NotBeNull();
    }

    [Fact]
    public async Task FindByEmail_WithNonExistingEmail_ShouldReturnNotFound()
    {
        // Arrange
        var email = "nonexisting@example.com";
        var failedResponse = new AuthResponseDto
        {
            Success = false,
            Message = "Kullanıcı bulunamadı"
        };

        _authServiceMock.Setup(x => x.GetUserBySearchAsync(email))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.FindByEmail(email);

        // Assert
        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task FindByEmail_WithEmptyEmail_ShouldReturnBadRequest()
    {
        // Act
        var result = await _controller.FindByEmail("");

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task FindByEmail_WithNullEmail_ShouldReturnBadRequest()
    {
        // Act
        var result = await _controller.FindByEmail(null!);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task FindByEmail_ShouldCallServiceWithCorrectEmail()
    {
        // Arrange
        var email = "test@example.com";
        var successResponse = new AuthResponseDto { Success = true };

        _authServiceMock.Setup(x => x.GetUserBySearchAsync(It.IsAny<string>()))
            .ReturnsAsync(successResponse);

        // Act
        await _controller.FindByEmail(email);

        // Assert
        _authServiceMock.Verify(x => x.GetUserBySearchAsync(email), Times.Once);
    }

    // ============================================================================
    // TOGGLE STATUS TESTS
    // ============================================================================

    [Fact]
    public async Task ToggleStatus_WithValidUserId_ShouldReturnOk()
    {
        // Arrange
        var userId = "user-123";
        var successResponse = new AuthResponseDto
        {
            Success = true,
            Message = "Kullanıcı durumu güncellendi"
        };

        _authServiceMock.Setup(x => x.ToggleUserStatusAsync(userId))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.ToggleStatus(userId);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<AuthResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ToggleStatus_WhenServiceFails_ShouldReturnBadRequest()
    {
        // Arrange
        var userId = "user-123";
        var failedResponse = new AuthResponseDto
        {
            Success = false,
            Message = "Kullanıcı bulunamadı"
        };

        _authServiceMock.Setup(x => x.ToggleUserStatusAsync(userId))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.ToggleStatus(userId);

        // Assert
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ToggleStatus_ShouldCallServiceWithCorrectUserId()
    {
        // Arrange
        var userId = "user-123";
        var successResponse = new AuthResponseDto { Success = true };

        _authServiceMock.Setup(x => x.ToggleUserStatusAsync(It.IsAny<string>()))
            .ReturnsAsync(successResponse);

        // Act
        await _controller.ToggleStatus(userId);

        // Assert
        _authServiceMock.Verify(x => x.ToggleUserStatusAsync(userId), Times.Once);
    }

    // ============================================================================
    // TEST ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public void Test_ShouldReturnOk()
    {
        // Act
        var result = _controller.Test();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().Be("AdminUserController aktif");
    }
}
