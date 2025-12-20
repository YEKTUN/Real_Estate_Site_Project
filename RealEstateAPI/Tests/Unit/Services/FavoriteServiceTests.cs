using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Listing;
using RealEstateAPI.Services.Listing;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Services;

/// <summary>
/// FavoriteService Unit Tests
/// </summary>
public class FavoriteServiceTests
{
    private readonly Mock<IFavoriteRepository> _favoriteRepositoryMock;
    private readonly Mock<IListingRepository> _listingRepositoryMock;
    private readonly Mock<ILogger<FavoriteService>> _loggerMock;
    private readonly FavoriteService _favoriteService;

    public FavoriteServiceTests()
    {
        _favoriteRepositoryMock = new Mock<IFavoriteRepository>();
        _listingRepositoryMock = new Mock<IListingRepository>();
        _loggerMock = new Mock<ILogger<FavoriteService>>();
        
        _favoriteService = new FavoriteService(
            _favoriteRepositoryMock.Object,
            _listingRepositoryMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task AddToFavoritesAsync_WithValidData_ShouldReturnSuccess()
    {
        // Arrange
        var listingId = 1;
        var userId = Guid.NewGuid().ToString();
        var dto = TestDataFactory.CreateAddFavoriteDto();
        var favorite = new FavoriteListing { Id = 1, UserId = userId, ListingId = listingId };

        _listingRepositoryMock.Setup(x => x.ExistsAsync(listingId)).ReturnsAsync(true);
        _favoriteRepositoryMock.Setup(x => x.IsFavoritedAsync(userId, listingId))
            .ReturnsAsync(false);
        _favoriteRepositoryMock.Setup(x => x.AddAsync(It.IsAny<FavoriteListing>()))
            .ReturnsAsync(favorite);

        // Act
        var result = await _favoriteService.AddToFavoritesAsync(listingId, dto, userId);

        // Assert
        result.Success.Should().BeTrue();
        result.IsFavorited.Should().BeTrue();
    }

    [Fact]
    public async Task AddToFavoritesAsync_WhenAlreadyFavorited_ShouldReturnFailure()
    {
        // Arrange
        var listingId = 1;
        var userId = Guid.NewGuid().ToString();
        var dto = TestDataFactory.CreateAddFavoriteDto();

        _listingRepositoryMock.Setup(x => x.ExistsAsync(listingId)).ReturnsAsync(true);
        _favoriteRepositoryMock.Setup(x => x.IsFavoritedAsync(userId, listingId))
            .ReturnsAsync(true);

        // Act
        var result = await _favoriteService.AddToFavoritesAsync(listingId, dto, userId);

        // Assert
        result.Success.Should().BeFalse();
        result.IsFavorited.Should().BeTrue();
    }

    [Fact]
    public async Task RemoveFromFavoritesAsync_WithValidData_ShouldReturnSuccess()
    {
        // Arrange
        var listingId = 1;
        var userId = Guid.NewGuid().ToString();

        _favoriteRepositoryMock.Setup(x => x.RemoveAsync(userId, listingId))
            .ReturnsAsync(true);

        // Act
        var result = await _favoriteService.RemoveFromFavoritesAsync(listingId, userId);

        // Assert
        result.Success.Should().BeTrue();
        result.IsFavorited.Should().BeFalse();
    }

    [Fact]
    public async Task ToggleFavoriteAsync_WhenNotFavorited_ShouldAddToFavorites()
    {
        // Arrange
        var listingId = 1;
        var userId = Guid.NewGuid().ToString();
        var favorite = new FavoriteListing { Id = 1, UserId = userId, ListingId = listingId };

        _listingRepositoryMock.Setup(x => x.ExistsAsync(listingId)).ReturnsAsync(true);
        _favoriteRepositoryMock.Setup(x => x.IsFavoritedAsync(userId, listingId))
            .ReturnsAsync(false);
        _favoriteRepositoryMock.Setup(x => x.AddAsync(It.IsAny<FavoriteListing>()))
            .ReturnsAsync(favorite);

        // Act
        var result = await _favoriteService.ToggleFavoriteAsync(listingId, userId);

        // Assert
        result.Success.Should().BeTrue();
        result.IsFavorited.Should().BeTrue();
    }

    [Fact]
    public async Task GetMyFavoritesAsync_WithValidUserId_ShouldReturnSuccess()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var favorites = new List<FavoriteListing>
        {
            new FavoriteListing { Id = 1, UserId = userId, ListingId = 1 }
        };

        _favoriteRepositoryMock.Setup(x => x.GetByUserIdAsync(userId, 1, 20))
            .ReturnsAsync((favorites, 1));

        // Act
        var result = await _favoriteService.GetMyFavoritesAsync(userId);

        // Assert
        result.Success.Should().BeTrue();
        result.Favorites.Should().NotBeNull();
    }
}

