using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using RealEstateAPI.Controllers.Listing;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Services.Listing;
using RealEstateAPI.Tests.Helpers;
using Xunit;

namespace RealEstateAPI.Tests.Unit.Controllers;

/// <summary>
/// ListingController Unit Tests
/// 
/// ListingController'ın HTTP endpoint'lerini test eder.
/// Service katmanı mock'lanarak controller mantığı izole edilir.
/// </summary>
public class ListingControllerTests
{
    // ============================================================================
    // MOCK OBJECTS
    // ============================================================================

    private readonly Mock<IListingService> _listingServiceMock;
    private readonly Mock<ILogger<ListingController>> _loggerMock;
    private readonly Mock<UserManager<ApplicationUser>> _userManagerMock;
    private readonly ListingController _controller;

    /// <summary>
    /// Test constructor - Mock nesneleri ve controller'ı oluşturur
    /// </summary>
    public ListingControllerTests()
    {
        _listingServiceMock = new Mock<IListingService>();
        _loggerMock = new Mock<ILogger<ListingController>>();
        
        // UserManager mock
        var userStoreMock = new Mock<IUserStore<ApplicationUser>>();
        _userManagerMock = new Mock<UserManager<ApplicationUser>>(
            userStoreMock.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        
        _controller = new ListingController(
            _listingServiceMock.Object, 
            _loggerMock.Object, 
            _userManagerMock.Object);
        
        // HttpContext mock
        SetupHttpContext();
    }

    /// <summary>
    /// HttpContext'i mock'lar
    /// </summary>
    private void SetupHttpContext()
    {
        var httpContext = new DefaultHttpContext();
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = httpContext
        };
    }

    /// <summary>
    /// Authenticated user context oluşturur
    /// </summary>
    private void SetupAuthenticatedUser(string userId)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim(ClaimTypes.Email, "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        
        _controller.ControllerContext.HttpContext.User = claimsPrincipal;
    }

    // ============================================================================
    // CREATE ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task Create_WithValidData_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var createDto = TestDataFactory.CreateCreateListingDto();
        var successResponse = TestDataFactory.CreateSuccessListingResponse();
        
        _listingServiceMock.Setup(x => x.CreateAsync(createDto, userId))
            .ReturnsAsync(successResponse);

        _userManagerMock.Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync(new ApplicationUser { Id = userId, PhoneVerified = true });

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingResponseDto>().Subject;
        response.Success.Should().BeTrue();
        response.Listing.Should().NotBeNull();
    }

    [Fact]
    public async Task Create_WhenServiceFails_ShouldReturnBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var createDto = TestDataFactory.CreateCreateListingDto();
        var failedResponse = TestDataFactory.CreateFailedListingResponse("İlan oluşturulamadı");
        
        _listingServiceMock.Setup(x => x.CreateAsync(createDto, userId))
            .ReturnsAsync(failedResponse);

        _userManagerMock.Setup(x => x.FindByIdAsync(userId))
            .ReturnsAsync(new ApplicationUser { Id = userId, PhoneVerified = true });

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeOfType<ListingResponseDto>().Subject;
        response.Success.Should().BeFalse();
    }

    [Fact]
    public async Task Create_WithInvalidModelState_ShouldReturnBadRequest()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var createDto = TestDataFactory.CreateCreateListingDto();
        _controller.ModelState.AddModelError("Title", "Başlık zorunludur");

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        var badRequestResult = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequestResult.Value.Should().BeOfType<ListingResponseDto>().Subject;
        response.Success.Should().BeFalse();
    }

    [Fact]
    public async Task Create_WhenNotAuthenticated_ShouldReturnUnauthorized()
    {
        // Arrange
        var createDto = TestDataFactory.CreateCreateListingDto();
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.Create(createDto);

        // Assert
        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ============================================================================
    // UPDATE ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task Update_WithValidData_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var updateDto = TestDataFactory.CreateUpdateListingDto();
        var successResponse = TestDataFactory.CreateSuccessListingResponse();
        
        _listingServiceMock.Setup(x => x.UpdateAsync(It.IsAny<int>(), updateDto, userId))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.Update(1, updateDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Update_WhenUnauthorized_ShouldReturnForbidden()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var updateDto = TestDataFactory.CreateUpdateListingDto();
        var failedResponse = TestDataFactory.CreateFailedListingResponse("Bu ilanı güncelleme yetkiniz yok");
        
        _listingServiceMock.Setup(x => x.UpdateAsync(It.IsAny<int>(), updateDto, userId))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.Update(1, updateDto);

        // Assert
        var forbiddenResult = result.Should().BeOfType<ObjectResult>().Subject;
        forbiddenResult.StatusCode.Should().Be(403);
    }

    [Fact]
    public async Task Update_WhenNotAuthenticated_ShouldReturnUnauthorized()
    {
        // Arrange
        var updateDto = TestDataFactory.CreateUpdateListingDto();
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.Update(1, updateDto);

        // Assert
        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ============================================================================
    // DELETE ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task Delete_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var successResponse = TestDataFactory.CreateSuccessListingResponse();
        
        _listingServiceMock.Setup(x => x.DeleteAsync(It.IsAny<int>(), userId))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.Delete(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task Delete_WhenUnauthorized_ShouldReturnForbidden()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var failedResponse = TestDataFactory.CreateFailedListingResponse("Bu ilanı silme yetkiniz yok");
        
        _listingServiceMock.Setup(x => x.DeleteAsync(It.IsAny<int>(), userId))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.Delete(1);

        // Assert
        var forbiddenResult = result.Should().BeOfType<ObjectResult>().Subject;
        forbiddenResult.StatusCode.Should().Be(403);
    }

    // ============================================================================
    // GET BY ID ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task GetById_WithValidId_ShouldReturnOk()
    {
        // Arrange
        var successResponse = TestDataFactory.CreateSuccessListingResponse();
        
        _listingServiceMock.Setup(x => x.GetByIdAsync(It.IsAny<int>(), It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.GetById(1);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task GetById_WhenNotFound_ShouldReturnNotFound()
    {
        // Arrange
        var failedResponse = TestDataFactory.CreateFailedListingResponse("İlan bulunamadı");
        
        _listingServiceMock.Setup(x => x.GetByIdAsync(It.IsAny<int>(), It.IsAny<string?>()))
            .ReturnsAsync(failedResponse);

        // Act
        var result = await _controller.GetById(1);

        // Assert
        var notFoundResult = result.Should().BeOfType<NotFoundObjectResult>().Subject;
        var response = notFoundResult.Value.Should().BeOfType<ListingResponseDto>().Subject;
        response.Success.Should().BeFalse();
    }

    // ============================================================================
    // GET LISTINGS BY USER ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task GetListingsByUser_WithValidUserId_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        var listResponse = TestDataFactory.CreateListingListResponse();

        _listingServiceMock
            .Setup(x => x.GetMyListingsAsync(userId, 1, 20))
            .ReturnsAsync(listResponse);

        // Act
        var result = await _controller.GetListingsByUser(userId, 1, 20);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingListResponseDto>().Subject;
        response.Should().Be(listResponse);
        _listingServiceMock.Verify(
            x => x.GetMyListingsAsync(userId, 1, 20),
            Times.Once);
    }

    [Fact]
    public async Task GetListingsByUser_WhenUserIdIsEmpty_ShouldReturnBadRequest()
    {
        // Arrange
        var emptyUserId = string.Empty;

        // Act
        var result = await _controller.GetListingsByUser(emptyUserId, 1, 20);

        // Assert
        var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
        var response = badRequest.Value.Should().BeOfType<ListingListResponseDto>().Subject;
        response.Success.Should().BeFalse();
        response.Message.Should().Contain("Kullanıcı ID'si gereklidir");
    }

    // ============================================================================
    // GET BY LISTING NUMBER ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task GetByListingNumber_WithValidNumber_ShouldReturnOk()
    {
        // Arrange
        var listingNumber = "ABC123456789";
        var successResponse = TestDataFactory.CreateSuccessListingResponse();
        
        _listingServiceMock.Setup(x => x.GetByListingNumberAsync(listingNumber, It.IsAny<string?>()))
            .ReturnsAsync(successResponse);

        // Act
        var result = await _controller.GetByListingNumber(listingNumber);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    // ============================================================================
    // GET ALL ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task GetAll_ShouldReturnOk()
    {
        // Arrange
        var listResponse = TestDataFactory.CreateListingListResponse();
        
        _listingServiceMock.Setup(x => x.GetAllAsync(It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(listResponse);

        // Act
        var result = await _controller.GetAll();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingListResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task GetAll_WithPagination_ShouldReturnOk()
    {
        // Arrange
        var listResponse = TestDataFactory.CreateListingListResponse();
        
        _listingServiceMock.Setup(x => x.GetAllAsync(2, 10))
            .ReturnsAsync(listResponse);

        // Act
        var result = await _controller.GetAll(2, 10);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingListResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    // ============================================================================
    // SEARCH ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task Search_WithValidCriteria_ShouldReturnOk()
    {
        // Arrange
        var searchDto = new ListingSearchDto
        {
            City = "İstanbul",
            Type = ListingType.ForSale,
            Page = 1,
            PageSize = 12
        };
        var listResponse = TestDataFactory.CreateListingListResponse();
        
        _listingServiceMock.Setup(x => x.SearchAsync(searchDto))
            .ReturnsAsync(listResponse);

        // Act
        var result = await _controller.Search(searchDto);

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingListResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    // ============================================================================
    // GET MY LISTINGS ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task GetMyListings_WhenAuthenticated_ShouldReturnOk()
    {
        // Arrange
        var userId = Guid.NewGuid().ToString();
        SetupAuthenticatedUser(userId);
        var listResponse = TestDataFactory.CreateListingListResponse();
        
        _listingServiceMock.Setup(x => x.GetMyListingsAsync(userId, It.IsAny<int>(), It.IsAny<int>()))
            .ReturnsAsync(listResponse);

        // Act
        var result = await _controller.GetMyListings();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingListResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }

    [Fact]
    public async Task GetMyListings_WhenNotAuthenticated_ShouldReturnUnauthorized()
    {
        // Arrange
        _controller.ControllerContext.HttpContext.User = new ClaimsPrincipal();

        // Act
        var result = await _controller.GetMyListings();

        // Assert
        result.Should().BeOfType<UnauthorizedResult>();
    }

    // ============================================================================
    // GET FEATURED ENDPOINT TESTS
    // ============================================================================

    [Fact]
    public async Task GetFeatured_ShouldReturnOk()
    {
        // Arrange
        var listResponse = TestDataFactory.CreateListingListResponse();
        
        _listingServiceMock.Setup(x => x.GetFeaturedAsync(It.IsAny<int>()))
            .ReturnsAsync(listResponse);

        // Act
        var result = await _controller.GetFeatured();

        // Assert
        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ListingListResponseDto>().Subject;
        response.Success.Should().BeTrue();
    }
}

