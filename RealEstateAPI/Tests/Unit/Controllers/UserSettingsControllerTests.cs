using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RealEstateAPI.Controllers;
using RealEstateAPI.Data;
using RealEstateAPI.DTOs.User;
using RealEstateAPI.Models;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Controllers;

/// <summary>
/// UserSettingsController Unit Tests
/// </summary>
public class UserSettingsControllerTests : IDisposable
{
    private readonly ApplicationDbContext _context;
    private readonly UserSettingsController _controller;
    private readonly string _testUserId = "test-user-123";

    public UserSettingsControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _controller = new UserSettingsController(_context);
        
        SetupAuthenticatedUser(_testUserId);
    }

    public void Dispose()
    {
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }

    private void SetupAuthenticatedUser(string userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    // ============================================================================
    // GET SETTINGS TESTS
    // ============================================================================

    [Fact]
    public async Task GetSettings_WithExistingSettings_ShouldReturnSettings()
    {
        // Arrange
        var settings = new UserSettings
        {
            UserId = _testUserId,
            ShowPhone = true,
            ShowEmail = false,
            EmailNotifications = true
        };
        await _context.UserSettings.AddAsync(settings);
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.GetSettings();

        // Assert
        var actionResult = result.Should().BeOfType<ActionResult<UserSettingsDto>>().Subject;
        var dto = actionResult.Value;
        dto.Should().NotBeNull();
        dto!.ShowPhone.Should().BeTrue();
        dto.ShowEmail.Should().BeFalse();
        dto.EmailNotifications.Should().BeTrue();
    }

    [Fact]
    public async Task GetSettings_WithNoSettings_ShouldReturnDefaults()
    {
        // Act
        var result = await _controller.GetSettings();

        // Assert
        var actionResult = result.Should().BeOfType<ActionResult<UserSettingsDto>>().Subject;
        var dto = actionResult.Value;
        dto.Should().NotBeNull();
        dto!.EmailNotifications.Should().BeTrue();
        dto.ShowPhone.Should().BeFalse();
        dto.ShowEmail.Should().BeTrue();
        dto.ProfileVisible.Should().BeTrue();
    }

    [Fact]
    public async Task GetSettings_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetSettings();

        // Assert
        result.Result.Should().BeOfType<UnauthorizedResult>();
    }

    // ============================================================================
    // UPDATE SETTINGS TESTS
    // ============================================================================

    [Fact]
    public async Task UpdateSettings_WithNewSettings_ShouldCreateSettings()
    {
        // Arrange
        var dto = new UserSettingsDto
        {
            ShowPhone = true,
            ShowEmail = false,
            EmailNotifications = true,
            SmsNotifications = false,
            PushNotifications = true,
            NewListingNotifications = true,
            PriceDropNotifications = false,
            MessageNotifications = true,
            ProfileVisible = true
        };

        // Act
        var result = await _controller.UpdateSettings(dto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        
        var savedSettings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == _testUserId);
        savedSettings.Should().NotBeNull();
        savedSettings!.ShowPhone.Should().BeTrue();
        savedSettings.ShowEmail.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateSettings_WithExistingSettings_ShouldUpdateSettings()
    {
        // Arrange
        var existingSettings = new UserSettings
        {
            UserId = _testUserId,
            ShowPhone = false,
            ShowEmail = true
        };
        await _context.UserSettings.AddAsync(existingSettings);
        await _context.SaveChangesAsync();

        var dto = new UserSettingsDto
        {
            ShowPhone = true,
            ShowEmail = false,
            EmailNotifications = true,
            SmsNotifications = false,
            PushNotifications = true,
            NewListingNotifications = true,
            PriceDropNotifications = true,
            MessageNotifications = true,
            ProfileVisible = true
        };

        // Act
        var result = await _controller.UpdateSettings(dto);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        
        var updatedSettings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == _testUserId);
        updatedSettings.Should().NotBeNull();
        updatedSettings!.ShowPhone.Should().BeTrue();
        updatedSettings.ShowEmail.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateSettings_WithoutAuthentication_ShouldReturnUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();
        var dto = new UserSettingsDto();

        // Act
        var result = await _controller.UpdateSettings(dto);

        // Assert
        result.Should().BeOfType<UnauthorizedResult>();
    }

    [Fact]
    public async Task UpdateSettings_ShouldUpdateAllNotificationSettings()
    {
        // Arrange
        var dto = new UserSettingsDto
        {
            EmailNotifications = true,
            SmsNotifications = true,
            PushNotifications = false,
            NewListingNotifications = true,
            PriceDropNotifications = false,
            MessageNotifications = true,
            ShowPhone = false,
            ShowEmail = true,
            ProfileVisible = true
        };

        // Act
        await _controller.UpdateSettings(dto);

        // Assert
        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == _testUserId);
        
        settings.Should().NotBeNull();
        settings!.EmailNotifications.Should().BeTrue();
        settings.SmsNotifications.Should().BeTrue();
        settings.PushNotifications.Should().BeFalse();
        settings.NewListingNotifications.Should().BeTrue();
        settings.PriceDropNotifications.Should().BeFalse();
        settings.MessageNotifications.Should().BeTrue();
    }

    [Fact]
    public async Task UpdateSettings_ShouldUpdatePrivacySettings()
    {
        // Arrange
        var dto = new UserSettingsDto
        {
            ShowPhone = true,
            ShowEmail = false,
            ProfileVisible = false,
            EmailNotifications = true,
            SmsNotifications = false,
            PushNotifications = true,
            NewListingNotifications = true,
            PriceDropNotifications = true,
            MessageNotifications = true
        };

        // Act
        await _controller.UpdateSettings(dto);

        // Assert
        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == _testUserId);
        
        settings.Should().NotBeNull();
        settings!.ShowPhone.Should().BeTrue();
        settings.ShowEmail.Should().BeFalse();
        settings.ProfileVisible.Should().BeFalse();
    }

    [Fact]
    public async Task UpdateSettings_MultipleUpdates_ShouldPersistLatestValues()
    {
        // Arrange
        var dto1 = new UserSettingsDto
        {
            ShowPhone = true,
            ShowEmail = true,
            EmailNotifications = true,
            SmsNotifications = false,
            PushNotifications = true,
            NewListingNotifications = true,
            PriceDropNotifications = true,
            MessageNotifications = true,
            ProfileVisible = true
        };

        var dto2 = new UserSettingsDto
        {
            ShowPhone = false,
            ShowEmail = false,
            EmailNotifications = false,
            SmsNotifications = true,
            PushNotifications = false,
            NewListingNotifications = false,
            PriceDropNotifications = false,
            MessageNotifications = false,
            ProfileVisible = false
        };

        // Act
        await _controller.UpdateSettings(dto1);
        await _controller.UpdateSettings(dto2);

        // Assert
        var settings = await _context.UserSettings
            .FirstOrDefaultAsync(s => s.UserId == _testUserId);
        
        settings.Should().NotBeNull();
        settings!.ShowPhone.Should().BeFalse();
        settings.ShowEmail.Should().BeFalse();
        settings.EmailNotifications.Should().BeFalse();
    }
}
