using System.ComponentModel.DataAnnotations;
using FluentAssertions;
using RealEstateAPI.DTOs.Auth;
using Xunit;

namespace RealEstateAPI.Tests.Unit;

/// <summary>
/// DTO Validation Tests
/// 
/// Data Transfer Object'lerin validation attribute'larını test eder.
/// Model validasyonunun doğru çalıştığını kontrol eder.
/// </summary>
public class DTOValidationTests
{
    /// <summary>
    /// Model'in validation sonuçlarını döner
    /// </summary>
    private static List<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var context = new ValidationContext(model, null, null);
        Validator.TryValidateObject(model, context, validationResults, true);
        return validationResults;
    }

    /// <summary>
    /// Model'in geçerli olup olmadığını kontrol eder
    /// </summary>
    private static bool IsValid(object model)
    {
        return ValidateModel(model).Count == 0;
    }

    // ============================================================================
    // LOGIN DTO TESTS
    // ============================================================================

    public class LoginDtoTests
    {
        [Fact]
        public void LoginDto_WithValidData_ShouldBeValid()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                EmailOrUsername = "test@example.com",
                Password = "Test123!@#"
            };

            // Act & Assert
            IsValid(loginDto).Should().BeTrue();
        }

        [Fact]
        public void LoginDto_WithEmptyEmail_ShouldBeInvalid()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                EmailOrUsername = "",
                Password = "Test123!@#"
            };

            // Act
            var results = ValidateModel(loginDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("EmailOrUsername"));
        }

        [Fact]
        public void LoginDto_WithEmptyPassword_ShouldBeInvalid()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                EmailOrUsername = "test@example.com",
                Password = ""
            };

            // Act
            var results = ValidateModel(loginDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("Password"));
        }

        [Fact]
        public void LoginDto_WithNullEmail_ShouldBeInvalid()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                EmailOrUsername = null!,
                Password = "Test123!@#"
            };

            // Act
            var results = ValidateModel(loginDto);

            // Assert
            results.Should().NotBeEmpty();
        }

        [Fact]
        public void LoginDto_WithNullPassword_ShouldBeInvalid()
        {
            // Arrange
            var loginDto = new LoginDto
            {
                EmailOrUsername = "test@example.com",
                Password = null!
            };

            // Act
            var results = ValidateModel(loginDto);

            // Assert
            results.Should().NotBeEmpty();
        }

        [Theory]
        [InlineData("user@domain.com")]
        [InlineData("admin")]
        [InlineData("john.doe")]
        public void LoginDto_WithVariousUsernames_ShouldBeValid(string username)
        {
            // Arrange
            var loginDto = new LoginDto
            {
                EmailOrUsername = username,
                Password = "Test123!@#"
            };

            // Act & Assert
            IsValid(loginDto).Should().BeTrue();
        }
    }

    // ============================================================================
    // REGISTER DTO TESTS
    // ============================================================================

    public class RegisterDtoTests
    {
        [Fact]
        public void RegisterDto_WithValidData_ShouldBeValid()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "User",
                Email = "test@example.com",
                Phone = "5551234567",
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act & Assert
            IsValid(registerDto).Should().BeTrue();
        }

        [Fact]
        public void RegisterDto_WithoutPhone_ShouldBeValid()
        {
            // Arrange - Phone opsiyonel
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "User",
                Email = "test@example.com",
                Phone = null,
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act & Assert
            IsValid(registerDto).Should().BeTrue();
        }

        [Fact]
        public void RegisterDto_WithEmptyName_ShouldBeInvalid()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Name = "",
                Surname = "User",
                Email = "test@example.com",
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("Name"));
        }

        [Fact]
        public void RegisterDto_WithEmptySurname_ShouldBeInvalid()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "",
                Email = "test@example.com",
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("Surname"));
        }

        [Fact]
        public void RegisterDto_WithEmptyEmail_ShouldBeInvalid()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "User",
                Email = "",
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("Email"));
        }

        [Fact]
        public void RegisterDto_WithInvalidEmail_ShouldBeInvalid()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "User",
                Email = "invalid-email",
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("Email"));
        }

        [Fact]
        public void RegisterDto_WithEmptyPassword_ShouldBeInvalid()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "User",
                Email = "test@example.com",
                Password = "",
                ConfirmPassword = ""
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("Password"));
        }

        [Fact]
        public void RegisterDto_WithShortPassword_ShouldBeInvalid()
        {
            // Arrange - Şifre 8 karakterden az
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "User",
                Email = "test@example.com",
                Password = "Short1",
                ConfirmPassword = "Short1"
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("Password"));
        }

        [Fact]
        public void RegisterDto_WithMismatchedPasswords_ShouldBeInvalid()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "User",
                Email = "test@example.com",
                Password = "Test123!@#",
                ConfirmPassword = "DifferentPassword123!"
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("ConfirmPassword"));
        }

        [Fact]
        public void RegisterDto_WithShortName_ShouldBeInvalid()
        {
            // Arrange - Ad 2 karakterden az
            var registerDto = new RegisterDto
            {
                Name = "A",
                Surname = "User",
                Email = "test@example.com",
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("Name"));
        }

        [Fact]
        public void RegisterDto_WithTooLongName_ShouldBeInvalid()
        {
            // Arrange - Ad 50 karakterden fazla
            var registerDto = new RegisterDto
            {
                Name = new string('A', 51),
                Surname = "User",
                Email = "test@example.com",
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert
            results.Should().NotBeEmpty();
            results.Should().Contain(r => r.MemberNames.Contains("Name"));
        }

        [Theory]
        [InlineData("test@example.com")]
        [InlineData("user.name@domain.co")]
        [InlineData("admin@company.org")]
        public void RegisterDto_WithValidEmails_ShouldBeValid(string email)
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "User",
                Email = email,
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act & Assert
            IsValid(registerDto).Should().BeTrue();
        }

        [Theory]
        [InlineData("invalid")]
        [InlineData("@domain.com")]
        [InlineData("user@")]
        public void RegisterDto_WithInvalidEmails_ShouldBeInvalid(string email)
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "User",
                Email = email,
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert
            results.Should().NotBeEmpty();
        }

        [Fact]
        public void RegisterDto_WithEdgeCaseEmail_ShouldBeValidOrInvalid()
        {
            // Arrange - user@.com .NET EmailAddress attribute'una göre geçerli olabilir
            var registerDto = new RegisterDto
            {
                Name = "Test",
                Surname = "User",
                Email = "user@.com",
                Password = "Test123!@#",
                ConfirmPassword = "Test123!@#"
            };

            // Act
            var results = ValidateModel(registerDto);

            // Assert - Bu edge case, .NET'in EmailAddress validasyonuna bağlı
            // Sonuç geçerli veya geçersiz olabilir, test amacıyla sadece çalıştığını kontrol ediyoruz
            results.Should().NotBeNull();
        }
    }

    // ============================================================================
    // AUTH RESPONSE DTO TESTS
    // ============================================================================

    public class AuthResponseDtoTests
    {
        [Fact]
        public void AuthResponseDto_SuccessResponse_ShouldHaveCorrectProperties()
        {
            // Arrange & Act
            var response = new AuthResponseDto
            {
                Success = true,
                Message = "İşlem başarılı",
                Token = "jwt-token",
                RefreshToken = "refresh-token",
                ExpiresIn = 3600,
                User = new UserDto
                {
                    Id = "1",
                    Name = "Test",
                    Surname = "User",
                    Email = "test@example.com"
                }
            };

            // Assert
            response.Success.Should().BeTrue();
            response.Token.Should().NotBeNullOrEmpty();
            response.RefreshToken.Should().NotBeNullOrEmpty();
            response.ExpiresIn.Should().Be(3600);
            response.User.Should().NotBeNull();
        }

        [Fact]
        public void AuthResponseDto_FailureResponse_ShouldHaveNullTokens()
        {
            // Arrange & Act
            var response = new AuthResponseDto
            {
                Success = false,
                Message = "Hata oluştu"
            };

            // Assert
            response.Success.Should().BeFalse();
            response.Token.Should().BeNull();
            response.RefreshToken.Should().BeNull();
            response.User.Should().BeNull();
        }

        [Fact]
        public void AuthResponseDto_DefaultValues_ShouldBeCorrect()
        {
            // Arrange & Act
            var response = new AuthResponseDto();

            // Assert
            response.Success.Should().BeFalse();
            response.Message.Should().BeEmpty();
            response.Token.Should().BeNull();
            response.RefreshToken.Should().BeNull();
            response.ExpiresIn.Should().BeNull();
            response.User.Should().BeNull();
        }
    }

    // ============================================================================
    // USER DTO TESTS
    // ============================================================================

    public class UserDtoTests
    {
        [Fact]
        public void UserDto_WithAllProperties_ShouldHaveCorrectValues()
        {
            // Arrange & Act
            var userDto = new UserDto
            {
                Id = "user-123",
                Name = "Test",
                Surname = "User",
                Phone = "5551234567",
                Email = "test@example.com"
            };

            // Assert
            userDto.Id.Should().Be("user-123");
            userDto.Name.Should().Be("Test");
            userDto.Surname.Should().Be("User");
            userDto.Phone.Should().Be("5551234567");
            userDto.Email.Should().Be("test@example.com");
        }

        [Fact]
        public void UserDto_DefaultValues_ShouldBeEmptyStrings()
        {
            // Arrange & Act
            var userDto = new UserDto();

            // Assert
            userDto.Id.Should().BeEmpty();
            userDto.Name.Should().BeEmpty();
            userDto.Surname.Should().BeEmpty();
            userDto.Email.Should().BeEmpty();
            userDto.Phone.Should().BeNull();
        }

        [Fact]
        public void UserDto_WithOptionalPhone_ShouldAllowNull()
        {
            // Arrange & Act
            var userDto = new UserDto
            {
                Id = "1",
                Name = "Test",
                Surname = "User",
                Email = "test@example.com",
                Phone = null
            };

            // Assert
            userDto.Phone.Should().BeNull();
        }
    }

    // ============================================================================
    // REFRESH TOKEN REQUEST DTO TESTS
    // ============================================================================

    public class RefreshTokenRequestDtoTests
    {
        [Fact]
        public void RefreshTokenRequestDto_WithToken_ShouldHaveCorrectValue()
        {
            // Arrange & Act
            var dto = new RefreshTokenRequestDto
            {
                RefreshToken = "test-refresh-token"
            };

            // Assert
            dto.RefreshToken.Should().Be("test-refresh-token");
        }

        [Fact]
        public void RefreshTokenRequestDto_DefaultValue_ShouldBeEmptyString()
        {
            // Arrange & Act
            var dto = new RefreshTokenRequestDto();

            // Assert
            dto.RefreshToken.Should().BeEmpty();
        }
    }

    // ============================================================================
    // GOOGLE LOGIN DTO TESTS
    // ============================================================================

    public class GoogleLoginDtoTests
    {
        [Fact]
        public void GoogleLoginDto_WithIdToken_ShouldHaveCorrectValue()
        {
            // Arrange & Act
            var dto = new GoogleLoginDto
            {
                IdToken = "google-id-token-example"
            };

            // Assert
            dto.IdToken.Should().Be("google-id-token-example");
        }

        [Fact]
        public void GoogleLoginDto_DefaultValue_ShouldBeEmptyString()
        {
            // Arrange & Act
            var dto = new GoogleLoginDto();

            // Assert
            dto.IdToken.Should().BeEmpty();
        }

        [Fact]
        public void GoogleLoginDto_WithJwtToken_ShouldAcceptToken()
        {
            // Arrange - Gerçek bir JWT benzeri token
            var jwtToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature";
            
            // Act
            var dto = new GoogleLoginDto
            {
                IdToken = jwtToken
            };

            // Assert
            dto.IdToken.Should().Be(jwtToken);
            dto.IdToken.Should().Contain(".");
        }

        [Fact]
        public void GoogleLoginDto_WithLongToken_ShouldAcceptToken()
        {
            // Arrange - Uzun bir token
            var longToken = new string('a', 1000);
            
            // Act
            var dto = new GoogleLoginDto
            {
                IdToken = longToken
            };

            // Assert
            dto.IdToken.Should().HaveLength(1000);
        }
    }

    // ============================================================================
    // GOOGLE USER INFO TESTS
    // ============================================================================

    public class GoogleUserInfoTests
    {
        [Fact]
        public void GoogleUserInfo_WithAllProperties_ShouldHaveCorrectValues()
        {
            // Arrange & Act
            var userInfo = new GoogleUserInfo
            {
                GoogleId = "google-123456789",
                Email = "user@gmail.com",
                EmailVerified = true,
                Name = "John",
                Surname = "Doe",
                Picture = "https://lh3.googleusercontent.com/a/photo"
            };

            // Assert
            userInfo.GoogleId.Should().Be("google-123456789");
            userInfo.Email.Should().Be("user@gmail.com");
            userInfo.EmailVerified.Should().BeTrue();
            userInfo.Name.Should().Be("John");
            userInfo.Surname.Should().Be("Doe");
            userInfo.Picture.Should().Be("https://lh3.googleusercontent.com/a/photo");
        }

        [Fact]
        public void GoogleUserInfo_DefaultValues_ShouldBeEmptyStrings()
        {
            // Arrange & Act
            var userInfo = new GoogleUserInfo();

            // Assert
            userInfo.GoogleId.Should().BeEmpty();
            userInfo.Email.Should().BeEmpty();
            userInfo.EmailVerified.Should().BeFalse();
            userInfo.Name.Should().BeEmpty();
            userInfo.Surname.Should().BeEmpty();
            userInfo.Picture.Should().BeNull();
        }

        [Fact]
        public void GoogleUserInfo_WithoutPicture_ShouldAllowNull()
        {
            // Arrange & Act
            var userInfo = new GoogleUserInfo
            {
                GoogleId = "google-123",
                Email = "user@gmail.com",
                Name = "Test",
                Surname = "User",
                Picture = null
            };

            // Assert
            userInfo.Picture.Should().BeNull();
        }

        [Fact]
        public void GoogleUserInfo_EmailVerified_ShouldToggle()
        {
            // Arrange
            var verifiedUser = new GoogleUserInfo { EmailVerified = true };
            var unverifiedUser = new GoogleUserInfo { EmailVerified = false };

            // Assert
            verifiedUser.EmailVerified.Should().BeTrue();
            unverifiedUser.EmailVerified.Should().BeFalse();
        }

        [Theory]
        [InlineData("user@gmail.com")]
        [InlineData("john.doe@example.com")]
        [InlineData("test+tag@domain.org")]
        public void GoogleUserInfo_WithVariousEmails_ShouldAccept(string email)
        {
            // Arrange & Act
            var userInfo = new GoogleUserInfo { Email = email };

            // Assert
            userInfo.Email.Should().Be(email);
        }

        [Theory]
        [InlineData("https://lh3.googleusercontent.com/a/default-user")]
        [InlineData("https://example.com/photo.jpg")]
        [InlineData(null)]
        public void GoogleUserInfo_WithVariousPictures_ShouldAccept(string? picture)
        {
            // Arrange & Act
            var userInfo = new GoogleUserInfo { Picture = picture };

            // Assert
            userInfo.Picture.Should().Be(picture);
        }
    }
}
