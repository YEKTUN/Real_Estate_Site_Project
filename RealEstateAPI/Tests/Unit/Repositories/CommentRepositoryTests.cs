using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Data;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Listing;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Repositories;

/// <summary>
/// CommentRepository Unit Tests
/// 
/// CommentRepository'nin veritabanı işlemlerini test eder.
/// In-memory database kullanılarak izole testler yapılır.
/// </summary>
public class CommentRepositoryTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly CommentRepository _repository;

    public CommentRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new CommentRepository(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // ============================================================================
    // CREATE TESTS
    // ============================================================================

    [Fact]
    public async Task CreateAsync_WithValidComment_ShouldCreateComment()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        await _context.SaveChangesAsync();

        var comment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Great property!"
        };

        // Act
        var result = await _repository.CreateAsync(comment);

        // Assert
        result.Should().NotBeNull();
        result.Id.Should().BeGreaterThan(0);
        result.Content.Should().Be("Great property!");
        result.IsActive.Should().BeTrue();
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
        result.User.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateAsync_ShouldSetIsActiveToTrue()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        await _context.SaveChangesAsync();

        var comment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Test comment"
        };

        // Act
        var result = await _repository.CreateAsync(comment);

        // Assert
        result.IsActive.Should().BeTrue();
    }

    // ============================================================================
    // UPDATE TESTS
    // ============================================================================

    [Fact]
    public async Task UpdateAsync_WithValidComment_ShouldUpdateComment()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var comment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Original content",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.ListingComments.AddAsync(comment);
        await _context.SaveChangesAsync();

        // Act
        comment.Content = "Updated content";
        var result = await _repository.UpdateAsync(comment);

        // Assert
        result.Content.Should().Be("Updated content");
        result.IsEdited.Should().BeTrue();
        result.UpdatedAt.Should().NotBeNull();
        result.UpdatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    // ============================================================================
    // DELETE TESTS
    // ============================================================================

    [Fact]
    public async Task DeleteAsync_WithExistingComment_ShouldSoftDelete()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var comment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "To be deleted",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.ListingComments.AddAsync(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.DeleteAsync(comment.Id);

        // Assert
        result.Should().BeTrue();
        
        var deletedComment = await _context.ListingComments.FindAsync(comment.Id);
        deletedComment.Should().NotBeNull();
        deletedComment!.IsActive.Should().BeFalse();
        deletedComment.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteAsync_WithNonExistingComment_ShouldReturnFalse()
    {
        // Act
        var result = await _repository.DeleteAsync(999);

        // Assert
        result.Should().BeFalse();
    }

    // ============================================================================
    // GET BY ID TESTS
    // ============================================================================

    [Fact]
    public async Task GetByIdAsync_WithExistingComment_ShouldReturnComment()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var comment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Test comment",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.ListingComments.AddAsync(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(comment.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(comment.Id);
        result.Content.Should().Be("Test comment");
        result.User.Should().NotBeNull();
    }

    [Fact]
    public async Task GetByIdAsync_WithNonExistingComment_ShouldReturnNull()
    {
        // Act
        var result = await _repository.GetByIdAsync(999);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetByIdAsync_WithInactiveComment_ShouldReturnNull()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var comment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Inactive comment",
            CreatedAt = DateTime.UtcNow,
            IsActive = false
        };
        await _context.ListingComments.AddAsync(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByIdAsync(comment.Id);

        // Assert
        result.Should().BeNull();
    }

    // ============================================================================
    // GET BY LISTING ID TESTS
    // ============================================================================

    [Fact]
    public async Task GetByListingIdAsync_ShouldReturnOnlyParentComments()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        await _context.SaveChangesAsync();

        var parentComment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Parent comment",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.ListingComments.AddAsync(parentComment);
        await _context.SaveChangesAsync();

        var replyComment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            ParentCommentId = parentComment.Id,
            Content = "Reply comment",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.ListingComments.AddAsync(replyComment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByListingIdAsync(listing.Id);

        // Assert
        result.Should().HaveCount(1);
        result[0].Content.Should().Be("Parent comment");
        result[0].Replies.Should().HaveCount(1);
        result[0].Replies.First().Content.Should().Be("Reply comment");
    }

    [Fact]
    public async Task GetByListingIdAsync_ShouldNotReturnInactiveComments()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        await _context.SaveChangesAsync();

        var activeComment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Active comment",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        var inactiveComment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Inactive comment",
            CreatedAt = DateTime.UtcNow,
            IsActive = false
        };
        await _context.ListingComments.AddRangeAsync(activeComment, inactiveComment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByListingIdAsync(listing.Id);

        // Assert
        result.Should().HaveCount(1);
        result[0].Content.Should().Be("Active comment");
    }

    // ============================================================================
    // GET BY USER ID TESTS
    // ============================================================================

    [Fact]
    public async Task GetByUserIdAsync_ShouldReturnUserComments()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        await _context.SaveChangesAsync();

        var comment1 = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Comment 1",
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            IsActive = true
        };
        var comment2 = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Comment 2",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.ListingComments.AddRangeAsync(comment1, comment2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetByUserIdAsync(user.Id);

        // Assert
        result.Should().HaveCount(2);
        result[0].Content.Should().Be("Comment 2"); // Newest first
        result[1].Content.Should().Be("Comment 1");
    }

    // ============================================================================
    // GET COMMENT COUNT TESTS
    // ============================================================================

    [Fact]
    public async Task GetCommentCountAsync_ShouldReturnCorrectCount()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        await _context.SaveChangesAsync();

        var comments = new[]
        {
            new ListingComment { ListingId = listing.Id, UserId = user.Id, Content = "C1", CreatedAt = DateTime.UtcNow, IsActive = true },
            new ListingComment { ListingId = listing.Id, UserId = user.Id, Content = "C2", CreatedAt = DateTime.UtcNow, IsActive = true },
            new ListingComment { ListingId = listing.Id, UserId = user.Id, Content = "C3", CreatedAt = DateTime.UtcNow, IsActive = false }
        };
        await _context.ListingComments.AddRangeAsync(comments);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetCommentCountAsync(listing.Id);

        // Assert
        result.Should().Be(2); // Only active comments
    }

    // ============================================================================
    // OWNERSHIP TESTS
    // ============================================================================

    [Fact]
    public async Task IsOwnerAsync_WithOwner_ShouldReturnTrue()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var comment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "My comment",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.ListingComments.AddAsync(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.IsOwnerAsync(comment.Id, user.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsOwnerAsync_WithNonOwner_ShouldReturnFalse()
    {
        // Arrange
        var user1 = TestDataFactory.CreateTestUser();
        var user2 = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user1.Id);
        await _context.Users.AddRangeAsync(user1, user2);
        await _context.Listings.AddAsync(listing);
        
        var comment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user1.Id,
            Content = "User1's comment",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.ListingComments.AddAsync(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.IsOwnerAsync(comment.Id, user2.Id);

        // Assert
        result.Should().BeFalse();
    }

    // ============================================================================
    // EXISTS TESTS
    // ============================================================================

    [Fact]
    public async Task ExistsAsync_WithExistingActiveComment_ShouldReturnTrue()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var comment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Exists",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        await _context.ListingComments.AddAsync(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.ExistsAsync(comment.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task ExistsAsync_WithInactiveComment_ShouldReturnFalse()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var comment = new ListingComment
        {
            ListingId = listing.Id,
            UserId = user.Id,
            Content = "Inactive",
            CreatedAt = DateTime.UtcNow,
            IsActive = false
        };
        await _context.ListingComments.AddAsync(comment);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.ExistsAsync(comment.Id);

        // Assert
        result.Should().BeFalse();
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private Models.Listing CreateTestListing(string userId)
    {
        return new Models.Listing
        {
            UserId = userId,
            Title = "Test Listing",
            Description = "Test Description",
            Price = 100000,
            City = "Istanbul",
            District = "Kadikoy",
            Neighborhood = "Moda",
            FullAddress = "Test Address",
            PropertyType = PropertyType.Apartment,
            Type = ListingType.ForSale,
            Status = ListingStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
    }
}
