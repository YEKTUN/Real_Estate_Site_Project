using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using RealEstateAPI.Controllers.Listing;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Services.Listing;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Controllers;

/// <summary>
/// FavoriteController Unit Tests
/// </summary>
public class FavoriteControllerTests
{
    private readonly Mock<IFavoriteService> _favoriteServiceMock;
    private readonly Mock<ILogger<FavoriteController>> _loggerMock;
    private readonly FavoriteController _controller;

    public FavoriteControllerTests()
    {
        _favoriteServiceMock = new Mock<IFavoriteService>();
        _loggerMock = new Mock<ILogger<FavoriteController>>();
        _controller = new FavoriteController(_favoriteServiceMock.Object, _loggerMock.Object);
        SetupHttpContext();
    }

    private void SetupHttpContext()
    {
        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
    }

    private void SetupAuthenticatedUser(string userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal(identity);
    }

    [Fact]
    public async Task GetMyFavorites_WhenAuthenticated_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var listResponse = TestDataFactory.CreateFavoriteListResponse();
        _favoriteServiceMock.Setup(x => x.GetMyFavoritesAsync(userId, It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(listResponse);

        // Act
        var result = await _controller.GetMyFavorites();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<FavoriteListResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task AddToFavorites_WithValidData_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var addDto = TestDataFactory.CreateAddFavoriteDto();
        var successResponse = TestDataFactory.CreateSuccessFavoriteResponse();
        _favoriteServiceMock.Setup(x => x.AddToFavoritesAsync(It.IsAny<int>(), addDto, userId))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.AddToFavorites(1, addDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<FavoriteResponseDto>().Subject;
        response.Success.Should().BeTrue();
        response.IsFavorited.Should().BeTrue();
    }

    [Fact]
    public async Task RemoveFromFavorites_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var successResponse = TestDataFactory.CreateSuccessFavoriteResponse(false);
        _favoriteServiceMock.Setup(x => x.RemoveFromFavoritesAsync(It.IsAny<int>(), userId))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.RemoveFromFavorites(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<FavoriteResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task ToggleFavorite_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var successResponse = TestDataFactory.CreateSuccessFavoriteResponse(true);
        _favoriteServiceMock.Setup(x => x.ToggleFavoriteAsync(It.IsAny<int>(), userId))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.ToggleFavorite(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<FavoriteResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task CheckFavorite_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        _favoriteServiceMock.Setup(x => x.IsFavoritedAsync(It.IsAny<int>(), userId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.CheckFavorite(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<FavoriteResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }
}

