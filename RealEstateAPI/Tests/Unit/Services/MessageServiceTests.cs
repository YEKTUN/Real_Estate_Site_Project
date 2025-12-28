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
/// MessageService Unit Tests
/// </summary>
public class MessageServiceTests
{
    private readonly Mock<IListingRepository> _listingRepositoryMock;
    private readonly Mock<IMessageRepository> _messageRepositoryMock;
    private readonly Mock<ILogger<MessageService>> _loggerMock;
    private readonly MessageService _messageService;

    public MessageServiceTests()
    {
        _listingRepositoryMock = new Mock<IListingRepository>();
        _messageRepositoryMock = new Mock<IMessageRepository>();
        _loggerMock = new Mock<ILogger<MessageService>>();
        
        _messageService = new MessageService(
            _listingRepositoryMock.Object,
            _messageRepositoryMock.Object,
            _loggerMock.Object);
    }

    [Fact]
    public async Task SendMessageAsync_WithValidData_ShouldReturnSuccess()
    {
        // Arrange
        var listingId = 1;
        var senderId = Guid.NewGuid().ToString();
        var sellerId = Guid.NewGuid().ToString();
        var dto = new CreateListingMessageDto
        {
            Content = "Test message",
            IsOffer = false
        };

        var listing = TestDataFactory.CreateListing(sellerId);
        listing.Id = listingId;

        var thread = new ListingMessageThread
        {
            Id = 1,
            ListingId = listingId,
            BuyerId = senderId,
            SellerId = sellerId,
            DeletedByBuyer = false,
            DeletedBySeller = false
        };

        var message = new ListingMessage
        {
            Id = 1,
            ThreadId = thread.Id,
            SenderId = senderId,
            Content = dto.Content
        };

        _listingRepositoryMock.Setup(x => x.GetByIdAsync(listingId))
            .ReturnsAsync(listing);
        _messageRepositoryMock.Setup(x => x.GetThreadAsync(listingId, senderId, sellerId))
            .ReturnsAsync(thread);
        // GetThreadByIdAsync çağrısı için mock (userId opsiyonel olduğu için null geçebiliriz)
        _messageRepositoryMock.Setup(x => x.GetThreadByIdAsync(thread.Id, It.IsAny<string?>()))
            .ReturnsAsync(thread);
        _messageRepositoryMock.Setup(x => x.AddMessageAsync(It.IsAny<ListingMessage>()))
            .ReturnsAsync(message);
        _messageRepositoryMock.Setup(x => x.GetMessagesAsync(thread.Id))
            .ReturnsAsync(new List<ListingMessage> { message });
        _messageRepositoryMock.Setup(x => x.SaveChangesAsync())
            .Returns(Task.CompletedTask);

        // Act
        var result = await _messageService.SendMessageAsync(listingId, senderId, dto);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
    }

    [Fact]
    public async Task SendMessageAsync_WithNonExistentListing_ShouldReturnFailure()
    {
        // Arrange
        var listingId = 999;
        var senderId = Guid.NewGuid().ToString();
        var dto = new CreateListingMessageDto { Content = "Test message" };

        _listingRepositoryMock.Setup(x => x.GetByIdAsync(listingId))
            .ReturnsAsync((Listing?)null);

        // Act
        var result = await _messageService.SendMessageAsync(listingId, senderId, dto);

        // Assert
        result.Success.Should().BeFalse();
        result.Message.Should().Contain("İlan bulunamadı");
    }

    [Fact]
    public async Task GetThreadsAsync_WithValidUserId_ShouldReturnSuccess()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var threads = new List<ListingMessageThread>
        {
            new ListingMessageThread { Id = 1, BuyerId = userId }
        };

        _messageRepositoryMock.Setup(x => x.GetThreadsForUserAsync(userId))
            .ReturnsAsync(threads);

        // Act
        var result = await _messageService.GetThreadsAsync(userId);

        // Assert
        result.Success.Should().BeTrue();
        result.Threads.Should().NotBeNull();
    }

    [Fact]
    public async Task GetMessagesAsync_WithValidThreadId_ShouldReturnSuccess()
    {
        // Arrange
        var threadId = 1;
        var userId = Guid.NewGuid().ToString();
        var thread = new ListingMessageThread
        {
            Id = threadId,
            BuyerId = userId,
            SellerId = Guid.NewGuid().ToString(),
            DeletedByBuyer = false,
            DeletedBySeller = false
        };

        var messages = new List<ListingMessage>
        {
            new ListingMessage { Id = 1, ThreadId = threadId, Content = "Test" }
        };

        _messageRepositoryMock.Setup(x => x.GetThreadByIdAsync(threadId, userId))
            .ReturnsAsync(thread);
        _messageRepositoryMock.Setup(x => x.GetMessagesAsync(threadId))
            .ReturnsAsync(messages);

        // Act
        var result = await _messageService.GetMessagesAsync(threadId, userId);

        // Assert
        result.Success.Should().BeTrue();
        result.Messages.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteThreadAsync_WithValidData_ShouldReturnTrue()
    {
        // Arrange
        var threadId = 1;
        var userId = Guid.NewGuid().ToString();

        _messageRepositoryMock.Setup(x => x.DeleteThreadAsync(threadId, userId))
            .ReturnsAsync(true);

        // Act
        var result = await _messageService.DeleteThreadAsync(threadId, userId);

        // Assert
        result.Should().BeTrue();
    }
}

