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
/// CommentController Unit Tests
/// </summary>
public class CommentControllerTests
{
    private readonly Mock<ICommentService> _commentServiceMock;
    private readonly Mock<ILogger<CommentController>> _loggerMock;
    private readonly CommentController _controller;

    public CommentControllerTests()
    {
        _commentServiceMock = new Mock<ICommentService>();
        _loggerMock = new Mock<ILogger<CommentController>>();
        _controller = new CommentController(_commentServiceMock.Object, _loggerMock.Object);
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
    public async Task GetComments_WithValidListingId_ShouldReturnOk()
    {
        // Arrange
        var listResponse = TestDataFactory.CreateCommentListResponse();
        _commentServiceMock.Setup(x => x.GetByListingIdAsync(It.IsAny<int>(), It.IsAny<string?>()))
            .ReturnsAsync(listResponse);

        // Act
        var result = await _controller.GetComments(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<CommentListResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task CreateComment_WithValidData_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var createDto = TestDataFactory.CreateCreateCommentDto();
        var successResponse = TestDataFactory.CreateSuccessCommentResponse();
        _commentServiceMock.Setup(x => x.CreateAsync(It.IsAny<int>(), createDto, userId))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.CreateComment(1, createDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<CommentResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task CreateComment_WhenNotAuthenticated_ShouldReturnUnauthorized()
    {
        // Arrange
        var createDto = TestDataFactory.CreateCreateCommentDto();
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.CreateComment(1, createDto);

        // Assert
        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task UpdateComment_WithValidData_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var updateDto = TestDataFactory.CreateUpdateCommentDto();
        var successResponse = TestDataFactory.CreateSuccessCommentResponse();
        _commentServiceMock.Setup(x => x.UpdateAsync(It.IsAny<int>(), updateDto, userId))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.UpdateComment(1, 1, updateDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<CommentResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteComment_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var successResponse = TestDataFactory.CreateSuccessCommentResponse();
        _commentServiceMock.Setup(x => x.DeleteAsync(It.IsAny<int>(), userId))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.DeleteComment(1, 1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<CommentResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }
}

