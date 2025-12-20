using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using RealEstateAPI.Controllers.Listing;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Services.Listing;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Controllers;

/// <summary>
/// MessageController Unit Tests
/// </summary>
public class MessageControllerTests
{
    private readonly Mock<IMessageService> _messageServiceMock;
    private readonly Mock<ILogger<MessageController>> _loggerMock;
    private readonly MessageController _controller;

    public MessageControllerTests()
    {
        _messageServiceMock = new Mock<IMessageService>();
        _loggerMock = new Mock<ILogger<MessageController>>();
        _controller = new MessageController(_messageServiceMock.Object, _loggerMock.Object);
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
    public async Task GetThreads_WithValidUser_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var response = new ListingThreadListResponseDto
        {
            Success = true,
            Threads = new List<ListingMessageThreadDto>()
        };

        _messageServiceMock.Setup(x => x.GetThreadsAsync(userId))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.GetThreads();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var responseDto = okResult.Value.Should().BeOfType<ListingThreadListResponseDto>().Subject;
        responseDto.Success.Should().BeTrue();
    }

    [Fact]
    public async Task SendMessage_WithValidData_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var listingId = 1;
        var dto = new CreateListingMessageDto
        {
            Content = "Test message",
            IsOffer = false
        };

        var response = new ListingMessageResponseDto
        {
            Success = true,
            Message = "Mesaj gönderildi"
        };

        _messageServiceMock.Setup(x => x.SendMessageAsync(listingId, userId, dto))
            .ReturnsAsync(response);

        // Act
        var result = await _controller.SendMessage(listingId, dto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var responseDto = okResult.Value.Should().BeOfType<ListingMessageResponseDto>().Subject;
        responseDto.Success.Should().BeTrue();
    }

    [Fact]
    public async Task SendMessage_WhenNotAuthenticated_ShouldReturnUnauthorized()
    {
        // Arrange
        var listingId = 1;
        var dto = new CreateListingMessageDto { Content = "Test" };
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.SendMessage(listingId, dto);

        // Assert
        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task DeleteThread_WithValidData_ShouldReturnNoContent()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var threadId = 1;

        _messageServiceMock.Setup(x => x.DeleteThreadAsync(threadId, userId))
            .ReturnsAsync(true);

        // Act
        var result = await _controller.DeleteThread(threadId);

        // Assert
        result.Should().BeOfType<NoContentResult>();
    }
}

