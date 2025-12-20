namespace RealEstateAPI.Services.Email;

/**
 * Email Service Interface
 * 
 * Email gönderme işlemleri için interface.
 * Şifre sıfırlama, doğrulama email'leri vb. gönderilir.
 */
public interface IEmailService
{
    /// <summary>
    /// Şifre sıfırlama email'i gönder
    /// </summary>
    /// <param name="email">Alıcı email adresi</param>
    /// <param name="resetToken">Şifre sıfırlama token'ı</param>
    /// <param name="userName">Kullanıcı adı (gösterim için)</param>
    /// <returns>Email gönderildi mi?</returns>
    Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string userName);
}

