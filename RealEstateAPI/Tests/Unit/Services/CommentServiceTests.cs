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
/// CommentService Unit Tests
/// </summary>
public class CommentServiceTests
{
    private readonly Mock<ICommentRepository> _commentRepositoryMock;
    private readonly Mock<IListingRepository> _listingRepositoryMock;
    private readonly Mock<ILogger<CommentService>> _loggerMock;
    private readonly CommentService _commentService;

    public CommentServiceTests()
    {
        _commentRepositoryMock = new Mock<ICommentRepository>();
        _listingRepositoryMock = new Mock<IListingRepository>();
        _loggerMock = new Mock<ILogger<CommentService>>();
        
        _commentService = new CommentService(
            _commentRepositoryMock.Object,
            _listingRepositoryMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WithValidData_ShouldReturnSuccess()
    {
        // Arrange
        var listingId = 1;
        var userId = Guid.NewGuid().ToString();
        var dto = TestDataFactory.CreateCreateCommentDto();
        var comment = new ListingComment
        {
            Id = 1,
            ListingId = listingId,
            UserId = userId,
            Content = dto.Content
        };

        _listingRepositoryMock.Setup(x => x.ExistsAsync(listingId)).ReturnsAsync(true);
        _commentRepositoryMock.Setup(x => x.CreateAsync(It.IsAny<ListingComment>()))
            .ReturnsAsync(comment);

        // Act
        var result = await _commentService.CreateAsync(listingId, dto, userId);

        // Assert
        result.Success.Should().BeTrue();
        result.Comment.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateAsync_WithNonExistentListing_ShouldReturnFailure()
    {
        // Arrange
        var listingId = 999;
        var userId = Guid.NewGuid().ToString();
        var dto = TestDataFactory.CreateCreateCommentDto();

        _listingRepositoryMock.Setup(x => x.ExistsAsync(listingId)).ReturnsAsync(false);

        // Act
        var result = await _commentService.CreateAsync(listingId, dto, userId);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("İlan bulunamadı");
    }

    [Fact]
    public async Task UpdateAsync_WithValidData_ShouldReturnSuccess()
    {
        // Arrange
        var commentId = 1;
        var userId = Guid.NewGuid().ToString();
        var dto = TestDataFactory.CreateUpdateCommentDto();
        var comment = new ListingComment
        {
            Id = commentId,
            UserId = userId,
            Content = "Old content"
        };

        _commentRepositoryMock.Setup(x => x.IsOwnerAsync(commentId, userId)).ReturnsAsync(true);
        _commentRepositoryMock.Setup(x => x.GetByIdAsync(commentId)).ReturnsAsync(comment);
        _commentRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<ListingComment>()))
            .ReturnsAsync(comment);

        // Act
        var result = await _commentService.UpdateAsync(commentId, dto, userId);

        // Assert
        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateAsync_WhenNotOwner_ShouldReturnFailure()
    {
        // Arrange
        var commentId = 1;
        var userId = Guid.NewGuid().ToString();
        var dto = TestDataFactory.CreateUpdateCommentDto();

        _commentRepositoryMock.Setup(x => x.IsOwnerAsync(commentId, userId)).ReturnsAsync(false);

        // Act
        var result = await _commentService.UpdateAsync(commentId, dto, userId);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("yetkiniz yok");
    }

    [Fact]
    public async Task DeleteAsync_WithValidData_ShouldReturnSuccess()
    {
        // Arrange
        var commentId = 1;
        var userId = Guid.NewGuid().ToString();

        _commentRepositoryMock.Setup(x => x.IsOwnerAsync(commentId, userId)).ReturnsAsync(true);
        _commentRepositoryMock.Setup(x => x.DeleteAsync(commentId)).ReturnsAsync(true);

        // Act
        var result = await _commentService.DeleteAsync(commentId, userId);

        // Assert
        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task GetByListingIdAsync_WithValidListingId_ShouldReturnSuccess()
    {
        // Arrange
        var listingId = 1;
        var comments = new List<ListingComment>
        {
            new ListingComment { Id = 1, ListingId = listingId, Content = "Test comment" }
        };

        _commentRepositoryMock.Setup(x => x.GetByListingIdAsync(listingId))
            .ReturnsAsync(comments);
        _commentRepositoryMock.Setup(x => x.GetCommentCountAsync(listingId))
            .ReturnsAsync(1);

        // Act
        var result = await _commentService.GetByListingIdAsync(listingId);

        // Assert
        result.Success.Should().BeTrue();
        result.Comments.Should().NotBeNull();
    }
}

