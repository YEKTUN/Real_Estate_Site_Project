using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Data;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Auth;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Repositories;

/// <summary>
/// AuthRepository Unit Tests
/// 
/// AuthRepository sınıfının veritabanı işlemlerini test eder.
/// InMemory database kullanılarak izole testler yapılır.
/// </summary>
public class AuthRepositoryTests : IDisposable
{
    // ============================================================================
    // TEST SETUP
    // ============================================================================
    
    private readonly ApplicationDbContext _context;
    private readonly AuthRepository _repository;

    /// <summary>
    /// Test constructor - InMemory database ve repository oluşturur
    /// </summary>
    public AuthRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _repository = new AuthRepository(_context);
    }

    /// <summary>
    /// Test sonrası temizlik
    /// </summary>
    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    // ============================================================================
    // GET USER BY EMAIL TESTS
    // ============================================================================

    [Fact]
    public async Task GetUserByEmailAsync_WithExistingEmail_ShouldReturnUser()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser(email: "test@example.com");
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetUserByEmailAsync("test@example.com");

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be("test@example.com");
    }

    [Fact]
    public async Task GetUserByEmailAsync_WithNonExistingEmail_ShouldReturnNull()
    {
        // Arrange - Veritabanında kullanıcı yok

        // Act
        var result = await _repository.GetUserByEmailAsync("nonexistent@example.com");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserByEmailAsync_ShouldBeCaseInsensitive()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser(email: "Test@Example.com");
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetUserByEmailAsync("TEST@EXAMPLE.COM");

        // Assert
        result.Should().NotBeNull();
        result!.Email.Should().Be("Test@Example.com");
    }

    [Fact]
    public async Task GetUserByEmailAsync_WithMultipleUsers_ShouldReturnCorrectUser()
    {
        // Arrange
        var users = TestDataFactory.CreateTestUsers(3);
        await _context.Users.AddRangeAsync(users);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetUserByEmailAsync(users[1].Email!);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(users[1].Id);
    }

    // ============================================================================
    // GET USER BY ID TESTS
    // ============================================================================

    [Fact]
    public async Task GetUserByIdAsync_WithExistingId_ShouldReturnUser()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetUserByIdAsync(user.Id);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(user.Id);
    }

    [Fact]
    public async Task GetUserByIdAsync_WithNonExistingId_ShouldReturnNull()
    {
        // Arrange - Veritabanında kullanıcı yok

        // Act
        var result = await _repository.GetUserByIdAsync("non-existing-id");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserByIdAsync_WithEmptyId_ShouldReturnNull()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetUserByIdAsync(string.Empty);

        // Assert
        result.Should().BeNull();
    }

    // ============================================================================
    // IS EMAIL EXISTS TESTS
    // ============================================================================

    [Fact]
    public async Task IsEmailExistsAsync_WithExistingEmail_ShouldReturnTrue()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser(email: "existing@example.com");
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.IsEmailExistsAsync("existing@example.com");

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsEmailExistsAsync_WithNonExistingEmail_ShouldReturnFalse()
    {
        // Arrange - Veritabanında kullanıcı yok

        // Act
        var result = await _repository.IsEmailExistsAsync("new@example.com");

        // Assert
        result.Should().BeFalse();
    }

    [Fact]
    public async Task IsEmailExistsAsync_ShouldBeCaseInsensitive()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser(email: "Test@Example.com");
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.IsEmailExistsAsync("test@example.com");

        // Assert
        result.Should().BeTrue();
    }

    // ============================================================================
    // SAVE REFRESH TOKEN TESTS
    // ============================================================================

    [Fact]
    public async Task SaveRefreshTokenAsync_ShouldSaveToken()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var refreshToken = TestDataFactory.CreateRefreshToken(userId: user.Id);

        // Act
        await _repository.SaveRefreshTokenAsync(refreshToken);

        // Assert
        var savedToken = await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken.Token);
        savedToken.Should().NotBeNull();
        savedToken!.UserId.Should().Be(user.Id);
    }

    [Fact]
    public async Task SaveRefreshTokenAsync_ShouldGenerateId()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        var refreshToken = new RefreshToken
        {
            Token = "test-token",
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        // Act
        await _repository.SaveRefreshTokenAsync(refreshToken);

        // Assert
        var savedToken = await _context.RefreshTokens.FirstAsync();
        savedToken.Id.Should().BeGreaterThan(0);
    }

    // ============================================================================
    // GET REFRESH TOKEN TESTS
    // ============================================================================

    [Fact]
    public async Task GetRefreshTokenAsync_WithExistingToken_ShouldReturnToken()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        
        var refreshToken = TestDataFactory.CreateRefreshToken(userId: user.Id, token: "valid-token");
        refreshToken.User = user;
        await _context.RefreshTokens.AddAsync(refreshToken);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetRefreshTokenAsync("valid-token");

        // Assert
        result.Should().NotBeNull();
        result!.Token.Should().Be("valid-token");
    }

    [Fact]
    public async Task GetRefreshTokenAsync_WithNonExistingToken_ShouldReturnNull()
    {
        // Arrange - Veritabanında token yok

        // Act
        var result = await _repository.GetRefreshTokenAsync("non-existing-token");

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetRefreshTokenAsync_ShouldIncludeUser()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        
        var refreshToken = TestDataFactory.CreateRefreshToken(userId: user.Id, token: "token-with-user");
        refreshToken.User = user;
        await _context.RefreshTokens.AddAsync(refreshToken);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetRefreshTokenAsync("token-with-user");

        // Assert
        result.Should().NotBeNull();
        result!.User.Should().NotBeNull();
        result.User!.Id.Should().Be(user.Id);
    }

    // ============================================================================
    // REVOKE ALL USER REFRESH TOKENS TESTS
    // ============================================================================

    [Fact]
    public async Task RevokeAllUserRefreshTokensAsync_ShouldRevokeAllActiveTokens()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);

        var token1 = TestDataFactory.CreateRefreshToken(userId: user.Id, token: "token-1");
        var token2 = TestDataFactory.CreateRefreshToken(userId: user.Id, token: "token-2");
        var token3 = TestDataFactory.CreateRefreshToken(userId: user.Id, token: "token-3");
        
        await _context.RefreshTokens.AddRangeAsync(token1, token2, token3);
        await _context.SaveChangesAsync();

        // Act
        await _repository.RevokeAllUserRefreshTokensAsync(user.Id);

        // Assert
        var tokens = await _context.RefreshTokens.Where(rt => rt.UserId == user.Id).ToListAsync();
        tokens.Should().AllSatisfy(t => t.IsRevoked.Should().BeTrue());
    }

    [Fact]
    public async Task RevokeAllUserRefreshTokensAsync_ShouldSetRevokedAtDate()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);

        var token = TestDataFactory.CreateRefreshToken(userId: user.Id);
        await _context.RefreshTokens.AddAsync(token);
        await _context.SaveChangesAsync();

        // Act
        await _repository.RevokeAllUserRefreshTokensAsync(user.Id);

        // Assert
        var revokedToken = await _context.RefreshTokens.FirstAsync();
        revokedToken.RevokedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task RevokeAllUserRefreshTokensAsync_ShouldNotAffectOtherUsers()
    {
        // Arrange
        var user1 = TestDataFactory.CreateTestUser(id: "user1", email: "user1@example.com");
        var user2 = TestDataFactory.CreateTestUser(id: "user2", email: "user2@example.com");
        await _context.Users.AddRangeAsync(user1, user2);

        var token1 = TestDataFactory.CreateRefreshToken(userId: user1.Id, token: "token-user1");
        var token2 = TestDataFactory.CreateRefreshToken(userId: user2.Id, token: "token-user2");
        await _context.RefreshTokens.AddRangeAsync(token1, token2);
        await _context.SaveChangesAsync();

        // Act
        await _repository.RevokeAllUserRefreshTokensAsync(user1.Id);

        // Assert
        var user2Token = await _context.RefreshTokens.FirstAsync(rt => rt.UserId == user2.Id);
        user2Token.IsRevoked.Should().BeFalse();
    }

    [Fact]
    public async Task RevokeAllUserRefreshTokensAsync_ShouldNotRevokeAlreadyRevokedTokens()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);

        var revokedToken = TestDataFactory.CreateRevokedRefreshToken(userId: user.Id);
        var revokedAtBefore = revokedToken.RevokedAt;
        await _context.RefreshTokens.AddAsync(revokedToken);
        await _context.SaveChangesAsync();

        // Act
        await _repository.RevokeAllUserRefreshTokensAsync(user.Id);

        // Assert - Önceden iptal edilmiş token'ın RevokedAt'ı değişmemeli
        var token = await _context.RefreshTokens.FirstAsync();
        // Zaten revoked olan token'ın tarihi değişmemiş olmalı
        token.IsRevoked.Should().BeTrue();
    }

    // ============================================================================
    // UPDATE REFRESH TOKEN TESTS
    // ============================================================================

    [Fact]
    public async Task UpdateRefreshTokenAsync_ShouldUpdateToken()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);

        var refreshToken = TestDataFactory.CreateRefreshToken(userId: user.Id);
        await _context.RefreshTokens.AddAsync(refreshToken);
        await _context.SaveChangesAsync();

        // Act
        refreshToken.IsUsed = true;
        refreshToken.ReplacedByToken = "new-token";
        await _repository.UpdateRefreshTokenAsync(refreshToken);

        // Assert
        var updatedToken = await _context.RefreshTokens.FirstAsync();
        updatedToken.IsUsed.Should().BeTrue();
        updatedToken.ReplacedByToken.Should().Be("new-token");
    }

    [Fact]
    public async Task UpdateRefreshTokenAsync_ShouldUpdateRevokedStatus()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);

        var refreshToken = TestDataFactory.CreateRefreshToken(userId: user.Id);
        await _context.RefreshTokens.AddAsync(refreshToken);
        await _context.SaveChangesAsync();

        // Act
        refreshToken.IsRevoked = true;
        refreshToken.RevokedAt = DateTime.UtcNow;
        refreshToken.RevokedByIp = "192.168.1.1";
        await _repository.UpdateRefreshTokenAsync(refreshToken);

        // Assert
        var updatedToken = await _context.RefreshTokens.FirstAsync();
        updatedToken.IsRevoked.Should().BeTrue();
        updatedToken.RevokedAt.Should().NotBeNull();
        updatedToken.RevokedByIp.Should().Be("192.168.1.1");
    }

    // ============================================================================
    // CLEANUP EXPIRED REFRESH TOKENS TESTS
    // ============================================================================

    [Fact]
    public async Task CleanupExpiredRefreshTokensAsync_ShouldRemoveOldExpiredTokens()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);

        // 30 günden eski ve süresi dolmuş token
        var oldExpiredToken = new RefreshToken
        {
            Token = "old-expired-token",
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-35),
            ExpiresAt = DateTime.UtcNow.AddDays(-32),
            IsRevoked = false,
            IsUsed = false
        };

        // Yeni ve aktif token
        var activeToken = TestDataFactory.CreateRefreshToken(userId: user.Id);

        await _context.RefreshTokens.AddRangeAsync(oldExpiredToken, activeToken);
        await _context.SaveChangesAsync();

        // Act
        await _repository.CleanupExpiredRefreshTokensAsync();

        // Assert
        var remainingTokens = await _context.RefreshTokens.ToListAsync();
        remainingTokens.Should().HaveCount(1);
        remainingTokens.First().Token.Should().Be(activeToken.Token);
    }

    [Fact]
    public async Task CleanupExpiredRefreshTokensAsync_ShouldRemoveOldRevokedTokens()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);

        // 30 günden eski ve iptal edilmiş token
        var oldRevokedToken = new RefreshToken
        {
            Token = "old-revoked-token",
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-35),
            ExpiresAt = DateTime.UtcNow.AddDays(-28),
            IsRevoked = true,
            RevokedAt = DateTime.UtcNow.AddDays(-30)
        };

        await _context.RefreshTokens.AddAsync(oldRevokedToken);
        await _context.SaveChangesAsync();

        // Act
        await _repository.CleanupExpiredRefreshTokensAsync();

        // Assert
        var remainingTokens = await _context.RefreshTokens.ToListAsync();
        remainingTokens.Should().BeEmpty();
    }

    [Fact]
    public async Task CleanupExpiredRefreshTokensAsync_ShouldNotRemoveRecentExpiredTokens()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);

        // 30 günden yeni ama süresi dolmuş token
        var recentExpiredToken = new RefreshToken
        {
            Token = "recent-expired-token",
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-10),
            ExpiresAt = DateTime.UtcNow.AddDays(-3),
            IsRevoked = false,
            IsUsed = false
        };

        await _context.RefreshTokens.AddAsync(recentExpiredToken);
        await _context.SaveChangesAsync();

        // Act
        await _repository.CleanupExpiredRefreshTokensAsync();

        // Assert
        var remainingTokens = await _context.RefreshTokens.ToListAsync();
        remainingTokens.Should().HaveCount(1); // 30 günden yeni olduğu için silinmemeli
    }

    // ============================================================================
    // EDGE CASES
    // ============================================================================

    [Fact]
    public async Task Repository_WithEmptyDatabase_ShouldNotThrowException()
    {
        // Arrange - Boş veritabanı

        // Act & Assert - Exception fırlatmamalı
        var emailExists = await _repository.IsEmailExistsAsync("any@example.com");
        var user = await _repository.GetUserByEmailAsync("any@example.com");
        var token = await _repository.GetRefreshTokenAsync("any-token");

        emailExists.Should().BeFalse();
        user.Should().BeNull();
        token.Should().BeNull();
    }

    [Fact]
    public async Task CleanupExpiredRefreshTokensAsync_WithEmptyDatabase_ShouldNotThrowException()
    {
        // Arrange - Boş veritabanı

        // Act & Assert - Exception fırlatmamalı
        await _repository.CleanupExpiredRefreshTokensAsync();
        
        var tokens = await _context.RefreshTokens.ToListAsync();
        tokens.Should().BeEmpty();
    }

    [Fact]
    public async Task RevokeAllUserRefreshTokensAsync_WithNoTokens_ShouldNotThrowException()
    {
        // Arrange
        var user = TestDataFactory.CreateTestUser();
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();

        // Act & Assert - Exception fırlatmamalı
        await _repository.RevokeAllUserRefreshTokensAsync(user.Id);
    }
}
