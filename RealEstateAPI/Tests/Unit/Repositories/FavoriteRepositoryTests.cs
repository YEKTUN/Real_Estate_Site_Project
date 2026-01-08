using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Data;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Listing;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Repositories;

/// <summary>
/// FavoriteRepository Unit Tests
/// 
/// FavoriteRepository'nin veritabanı işlemlerini test eder.
/// In-memory database kullanılarak izole testler yapılır.
/// </summary>
public class FavoriteRepositoryTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly FavoriteRepository _repository;

    public FavoriteRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new FavoriteRepository(_context);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // ============================================================================
    // ADD TESTS
    // ============================================================================

    [Fact]
    public async Task AddAsync_WithValidFavorite_ShouldAddFavorite()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        await _context.SaveChangesAsync();

        var favorite = new FavoriteListing
        {
            UserId = user.Id,
            ListingId = listing.Id
        };

        // Act
        var result = await _repository.AddAsync(favorite);

        // Assert
        result.Should().NotBeNull();
        result.UserId.Should().Be(user.Id);
        result.ListingId.Should().Be(listing.Id);
        result.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task AddAsync_ShouldIncrementListingFavoriteCount()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        listing.FavoriteCount = 5;
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        await _context.SaveChangesAsync();

        var favorite = new FavoriteListing
        {
            UserId = user.Id,
            ListingId = listing.Id
        };

        // Act
        await _repository.AddAsync(favorite);

        // Assert
        var updatedListing = await _context.Listings.FindAsync(listing.Id);
        updatedListing!.FavoriteCount.Should().Be(6);
    }

    // ============================================================================
    // REMOVE TESTS
    // ============================================================================

    [Fact]
    public async Task RemoveAsync_WithExistingFavorite_ShouldRemoveFavorite()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var favorite = new FavoriteListing
        {
            UserId = user.Id,
            ListingId = listing.Id,
            CreatedAt = DateTime.UtcNow
        };
        await _context.FavoriteListings.AddAsync(favorite);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.RemoveAsync(user.Id, listing.Id);

        // Assert
        result.Should().BeTrue();
        
        var removedFavorite = await _context.FavoriteListings
            .FirstOrDefaultAsync(f => f.UserId == user.Id && f.ListingId == listing.Id);
        removedFavorite.Should().BeNull();
    }

    [Fact]
    public async Task RemoveAsync_ShouldDecrementListingFavoriteCount()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        listing.FavoriteCount = 5;
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var favorite = new FavoriteListing
        {
            UserId = user.Id,
            ListingId = listing.Id,
            CreatedAt = DateTime.UtcNow
        };
        await _context.FavoriteListings.AddAsync(favorite);
        await _context.SaveChangesAsync();

        // Act
        await _repository.RemoveAsync(user.Id, listing.Id);

        // Assert
        var updatedListing = await _context.Listings.FindAsync(listing.Id);
        updatedListing!.FavoriteCount.Should().Be(4);
    }

    [Fact]
    public async Task RemoveAsync_WithNonExistingFavorite_ShouldReturnFalse()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.RemoveAsync(user.Id, 999);

        // Assert
        result.Should().BeFalse();
    }

    // ============================================================================
    // UPDATE NOTE TESTS
    // ============================================================================

    [Fact]
    public async Task UpdateNoteAsync_WithExistingFavorite_ShouldUpdateNote()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var favorite = new FavoriteListing
        {
            UserId = user.Id,
            ListingId = listing.Id,
            Note = "Old note",
            CreatedAt = DateTime.UtcNow
        };
        await _context.FavoriteListings.AddAsync(favorite);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.UpdateNoteAsync(user.Id, listing.Id, "New note");

        // Assert
        result.Should().NotBeNull();
        result!.Note.Should().Be("New note");
    }

    [Fact]
    public async Task UpdateNoteAsync_WithNonExistingFavorite_ShouldReturnNull()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.UpdateNoteAsync(user.Id, 999, "Note");

        // Assert
        result.Should().BeNull();
    }

    // ============================================================================
    // GET BY USER ID TESTS
    // ============================================================================

    [Fact]
    public async Task GetByUserIdAsync_ShouldReturnUserFavorites()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing1 = CreateTestListing(user.Id);
        var listing2 = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddRangeAsync(listing1, listing2);
        await _context.SaveChangesAsync();

        var favorite1 = new FavoriteListing
        {
            UserId = user.Id,
            ListingId = listing1.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
        var favorite2 = new FavoriteListing
        {
            UserId = user.Id,
            ListingId = listing2.Id,
            CreatedAt = DateTime.UtcNow
        };
        await _context.FavoriteListings.AddRangeAsync(favorite1, favorite2);
        await _context.SaveChangesAsync();

        // Act
        var (favorites, totalCount) = await _repository.GetByUserIdAsync(user.Id, 1, 10);

        // Assert
        favorites.Should().HaveCount(2);
        totalCount.Should().Be(2);
        favorites[0].ListingId.Should().Be(listing2.Id); // Newest first
        favorites[1].ListingId.Should().Be(listing1.Id);
    }

    [Fact]
    public async Task GetByUserIdAsync_WithPagination_ShouldReturnCorrectPage()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        for (int i = 0; i < 5; i++)
        {
            var listing = CreateTestListing(user.Id);
            await _context.Listings.AddAsync(listing);
            await _context.SaveChangesAsync();

            var favorite = new FavoriteListing
            {
                UserId = user.Id,
                ListingId = listing.Id,
                CreatedAt = DateTime.UtcNow.AddDays(-i)
            };
            await _context.FavoriteListings.AddAsync(favorite);
        }
        await _context.SaveChangesAsync();

        // Act
        var (favorites, totalCount) = await _repository.GetByUserIdAsync(user.Id, 2, 2);

        // Assert
        favorites.Should().HaveCount(2);
        totalCount.Should().Be(5);
    }

    // ============================================================================
    // GET SINGLE FAVORITE TESTS
    // ============================================================================

    [Fact]
    public async Task GetAsync_WithExistingFavorite_ShouldReturnFavorite()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var favorite = new FavoriteListing
        {
            UserId = user.Id,
            ListingId = listing.Id,
            Note = "Test note",
            CreatedAt = DateTime.UtcNow
        };
        await _context.FavoriteListings.AddAsync(favorite);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAsync(user.Id, listing.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Note.Should().Be("Test note");
        result.Listing.Should().NotBeNull();
    }

    [Fact]
    public async Task GetAsync_WithNonExistingFavorite_ShouldReturnNull()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetAsync(user.Id, 999);

        // Assert
        result.Should().BeNull();
    }

    // ============================================================================
    // IS FAVORITED TESTS
    // ============================================================================

    [Fact]
    public async Task IsFavoritedAsync_WithExistingFavorite_ShouldReturnTrue()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddAsync(listing);
        
        var favorite = new FavoriteListing
        {
            UserId = user.Id,
            ListingId = listing.Id,
            CreatedAt = DateTime.UtcNow
        };
        await _context.FavoriteListings.AddAsync(favorite);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.IsFavoritedAsync(user.Id, listing.Id);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsFavoritedAsync_WithNonExistingFavorite_ShouldReturnFalse()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.IsFavoritedAsync(user.Id, 999);

        // Assert
        result.Should().BeFalse();
    }

    // ============================================================================
    // GET FAVORITE COUNT TESTS
    // ============================================================================

    [Fact]
    public async Task GetFavoriteCountAsync_ShouldReturnCorrectCount()
    {
        // Arrange
        var user1 = TestDataFactory.CreateTestUser();
        var user2 = TestDataFactory.CreateTestUser();
        var listing = CreateTestListing(user1.Id);
        await _context.Users.AddRangeAsync(user1, user2);
        await _context.Listings.AddAsync(listing);
        await _context.SaveChangesAsync();

        var favorite1 = new FavoriteListing { UserId = user1.Id, ListingId = listing.Id, CreatedAt = DateTime.UtcNow };
        var favorite2 = new FavoriteListing { UserId = user2.Id, ListingId = listing.Id, CreatedAt = DateTime.UtcNow };
        await _context.FavoriteListings.AddRangeAsync(favorite1, favorite2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetFavoriteCountAsync(listing.Id);

        // Assert
        result.Should().Be(2);
    }

    // ============================================================================
    // GET USER FAVORITE IDS TESTS
    // ============================================================================

    [Fact]
    public async Task GetUserFavoriteIdsAsync_ShouldReturnListingIds()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        var listing1 = CreateTestListing(user.Id);
        var listing2 = CreateTestListing(user.Id);
        await _context.Users.AddAsync(user);
        await _context.Listings.AddRangeAsync(listing1, listing2);
        await _context.SaveChangesAsync();

        var favorite1 = new FavoriteListing { UserId = user.Id, ListingId = listing1.Id, CreatedAt = DateTime.UtcNow };
        var favorite2 = new FavoriteListing { UserId = user.Id, ListingId = listing2.Id, CreatedAt = DateTime.UtcNow };
        await _context.FavoriteListings.AddRangeAsync(favorite1, favorite2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetUserFavoriteIdsAsync(user.Id);

        // Assert
        result.Should().HaveCount(2);
        result.Should().Contain(listing1.Id);
        result.Should().Contain(listing2.Id);
    }

    [Fact]
    public async Task GetUserFavoriteIdsAsync_WithNoFavorites_ShouldReturnEmptyList()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetUserFavoriteIdsAsync(user.Id);

        // Assert
        result.Should().BeEmpty();
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
            CreatedAt = DateTime.UtcNow,
            FavoriteCount = 0
        };
    }
}
