using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using RealEstateAPI.Controllers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Controllers;

/// <summary>
/// HealthController Unit Tests
/// 
/// Health check endpoint'lerini test eder.
/// API'nin sağlık durumunu ve bilgilerini doğrular.
/// </summary>
public class HealthControllerTests
{
    // ============================================================================
    // MOCK OBJECTS
    // ============================================================================
    
    private readonly Mock<ILogger<HealthController>> _loggerMock;
    private readonly HealthController _controller;

    /// <summary>
    /// Test constructor - Mock nesneleri ve controller'ı oluşturur
    /// </summary>
    public HealthControllerTests()
    {
        _loggerMock = new Mock<ILogger<HealthController>>();
        _controller = new HealthController(_loggerMock.Object);
    }

    // ============================================================================
    // GET HEALTH ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public void Get_ShouldReturnOk()
    {
        // Act
        var result = _controller.Get();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void Get_ShouldReturnHealthyStatus()
    {
        // Act
        var result = _controller.Get() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var status = GetPropertyValue(value!, "status");
        status.Should().Be("healthy");
    }

    [Fact]
    public void Get_ShouldReturnCorrectMessage()
    {
        // Act
        var result = _controller.Get() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var message = GetPropertyValue(value!, "message");
        message.Should().Be("🏠 Real Estate API çalışıyor!");
    }

    [Fact]
    public void Get_ShouldReturnVersion()
    {
        // Act
        var result = _controller.Get() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var version = GetPropertyValue(value!, "version");
        version.Should().Be("1.0.0");
    }

    [Fact]
    public void Get_ShouldReturnTimestamp()
    {
        // Act
        var result = _controller.Get() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var timestamp = GetPropertyValue(value!, "timestamp");
        timestamp.Should().NotBeNull();
    }

    [Fact]
    public void Get_ShouldReturnEnvironment()
    {
        // Act
        var result = _controller.Get() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var environment = GetPropertyValue(value!, "environment");
        environment.Should().NotBeNull();
    }

    [Fact]
    public void Get_ShouldReturn200StatusCode()
    {
        // Act
        var result = _controller.Get() as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
    }

    // ============================================================================
    // GET INFO ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public void GetInfo_ShouldReturnOk()
    {
        // Act
        var result = _controller.GetInfo();

        // Assert
        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public void GetInfo_ShouldReturnApplicationName()
    {
        // Act
        var result = _controller.GetInfo() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var application = GetPropertyValue(value!, "application");
        application.Should().Be("Real Estate API");
    }

    [Fact]
    public void GetInfo_ShouldReturnVersion()
    {
        // Act
        var result = _controller.GetInfo() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var version = GetPropertyValue(value!, "version");
        version.Should().Be("1.0.0");
    }

    [Fact]
    public void GetInfo_ShouldReturnFramework()
    {
        // Act
        var result = _controller.GetInfo() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var framework = GetPropertyValue(value!, "framework");
        framework.Should().Be(".NET 8.0");
    }

    [Fact]
    public void GetInfo_ShouldReturnUptime()
    {
        // Act
        var result = _controller.GetInfo() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var uptime = GetPropertyValue(value!, "uptime");
        uptime.Should().NotBeNull();
    }

    [Fact]
    public void GetInfo_ShouldReturnTimestamp()
    {
        // Act
        var result = _controller.GetInfo() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var timestamp = GetPropertyValue(value!, "timestamp");
        timestamp.Should().NotBeNull();
    }

    [Fact]
    public void GetInfo_ShouldReturnFeatures()
    {
        // Act
        var result = _controller.GetInfo() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var features = GetPropertyValue(value!, "features") as string[];
        features.Should().NotBeNull();
        features.Should().HaveCountGreaterThan(0);
    }

    [Fact]
    public void GetInfo_ShouldContainJwtAuthentication()
    {
        // Act
        var result = _controller.GetInfo() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var features = GetPropertyValue(value!, "features") as string[];
        features.Should().Contain("JWT Authentication");
    }

    [Fact]
    public void GetInfo_ShouldContainEntityFrameworkCore()
    {
        // Act
        var result = _controller.GetInfo() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var features = GetPropertyValue(value!, "features") as string[];
        features.Should().Contain("Entity Framework Core");
    }

    [Fact]
    public void GetInfo_ShouldContainSwagger()
    {
        // Act
        var result = _controller.GetInfo() as OkObjectResult;
        var value = result?.Value;

        // Assert
        value.Should().NotBeNull();
        var features = GetPropertyValue(value!, "features") as string[];
        features.Should().Contain("Swagger/OpenAPI");
    }

    [Fact]
    public void GetInfo_ShouldReturn200StatusCode()
    {
        // Act
        var result = _controller.GetInfo() as OkObjectResult;

        // Assert
        result.Should().NotBeNull();
        result!.StatusCode.Should().Be(200);
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    /// <summary>
    /// Anonymous object'ten property değeri alır
    /// </summary>
    private static object? GetPropertyValue(object obj, string propertyName)
    {
        return obj.GetType().GetProperty(propertyName)?.GetValue(obj);
    }
}
