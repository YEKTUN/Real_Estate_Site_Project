using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace RealEstateAPI.Services.Email;

/**
 * Email Service
 * 
 * SMTP üzerinden email gönderme işlemlerini yönetir.
 * Şifre sıfırlama, doğrulama email'leri vb. gönderilir.
 */
public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Şifre sıfırlama email'i gönder
    /// </summary>
    public async Task<bool> SendPasswordResetEmailAsync(string email, string resetToken, string userName)
    {
        string? smtpHost = null;
        int smtpPort = 0;
        string? smtpUsername = null;
        string? smtpPassword = null;
        string? fromEmail = null;
        
        try
        {
            _logger.LogInformation("Email gönderme işlemi başlatıldı: {Email}", email);
            
            // Email ayarlarını al
            smtpHost = _configuration["EmailSettings:SmtpHost"] ?? "smtp.gmail.com";
            smtpPort = int.Parse(_configuration["EmailSettings:SmtpPort"] ?? "587");
            smtpUsername = _configuration["EmailSettings:SmtpUsername"] ?? string.Empty;
            smtpPassword = _configuration["EmailSettings:SmtpPassword"] ?? string.Empty;
            fromEmail = _configuration["EmailSettings:FromEmail"] ?? smtpUsername;
            var fromName = _configuration["EmailSettings:FromName"] ?? "Real Estate";
            var frontendUrl = _configuration["EmailSettings:FrontendUrl"] ?? "http://localhost:3000";

            _logger.LogInformation("SMTP Ayarları - Host: {Host}, Port: {Port}, Username: {Username}, FromEmail: {FromEmail}", 
                smtpHost, smtpPort, smtpUsername, fromEmail);

            // Email ayarları kontrolü
            if (string.IsNullOrWhiteSpace(smtpUsername) || string.IsNullOrWhiteSpace(smtpPassword))
            {
                _logger.LogError("Email ayarları eksik: SmtpUsername veya SmtpPassword boş. Lütfen appsettings.json dosyasını kontrol edin.");
                return false;
            }

            if (string.IsNullOrWhiteSpace(fromEmail))
            {
                _logger.LogError("Email ayarları eksik: FromEmail boş. Lütfen appsettings.json dosyasını kontrol edin.");
                return false;
            }

            // Frontend URL'i ile şifre sıfırlama linki oluştur
            var resetLink = $"{frontendUrl}/reset-password?token={Uri.EscapeDataString(resetToken)}&email={Uri.EscapeDataString(email)}";

            // Email içeriği
            var subject = "Şifre Sıfırlama İsteği";
            var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }}
        .button {{ display: inline-block; padding: 12px 30px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
        .button:hover {{ background-color: #45a049; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Şifre Sıfırlama</h1>
        </div>
        <div class='content'>
            <p>Merhaba {userName},</p>
            <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
            <p style='text-align: center;'>
                <a href='{resetLink}' class='button'>Şifremi Sıfırla</a>
            </p>
            <p>Veya aşağıdaki linki tarayıcınıza yapıştırabilirsiniz:</p>
            <p style='word-break: break-all; color: #4CAF50;'>{resetLink}</p>
            <p><strong>Not:</strong> Bu link 1 saat süreyle geçerlidir. Eğer bu isteği siz yapmadıysanız, bu email'i görmezden gelebilirsiniz.</p>
        </div>
        <div class='footer'>
            <p>Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
            <p>&copy; {DateTime.Now.Year} Real Estate. Tüm hakları saklıdır.</p>
        </div>
    </div>
</body>
</html>";

            // SMTP client oluştur
            _logger.LogInformation("SMTP Client oluşturuluyor: Host={Host}, Port={Port}, SSL={Ssl}", 
                smtpHost, smtpPort, true);
            
            // Hostinger için port 465 (SSL) veya 587 (TLS/STARTTLS) kullanılabilir
            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                EnableSsl = true, // Port 465 için SSL, Port 587 için STARTTLS
                Credentials = new NetworkCredential(smtpUsername, smtpPassword),
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Timeout = 20000 // 20 saniye timeout (email gönderme işlemi için)
            };

            _logger.LogInformation("SMTP Client oluşturuldu. Email mesajı hazırlanıyor...");

            // Email mesajı oluştur
            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            message.To.Add(email);

            _logger.LogInformation("Email mesajı hazırlandı. Gönderiliyor: From={From}, To={To}, Subject={Subject}", 
                fromEmail, email, subject);

            // Email gönder
            await client.SendMailAsync(message);

            _logger.LogInformation("✅ Şifre sıfırlama email'i başarıyla gönderildi: {Email}", email);
            return true;
        }
        catch (SmtpException ex)
        {
            _logger.LogError(ex, "❌ SMTP hatası - Email gönderilemedi: {Email}", email);
            _logger.LogError("SMTP Hata Detayları: StatusCode={StatusCode}, Message={Message}, InnerException={InnerException}", 
                ex.StatusCode, ex.Message, ex.InnerException?.Message ?? "Yok");
            _logger.LogError("SMTP Ayarları: Host={Host}, Port={Port}, Username={Username}, FromEmail={FromEmail}", 
                smtpHost, smtpPort, smtpUsername, fromEmail);
            _logger.LogError("Stack Trace: {StackTrace}", ex.StackTrace);
            return false;
        }
        catch (System.Net.Sockets.SocketException ex)
        {
            _logger.LogError(ex, "❌ Network/Socket hatası - SMTP sunucusuna bağlanılamadı: {Email}", email);
            _logger.LogError("Socket Hata Detayları: ErrorCode={ErrorCode}, SocketErrorCode={SocketErrorCode}, Message={Message}", 
                ex.ErrorCode, ex.SocketErrorCode, ex.Message);
            _logger.LogError("SMTP Ayarları: Host={Host}, Port={Port}", smtpHost, smtpPort);
            return false;
        }
        catch (System.TimeoutException ex)
        {
            _logger.LogError(ex, "❌ Timeout hatası - Email gönderme işlemi zaman aşımına uğradı: {Email}", email);
            _logger.LogError("Timeout Hata Detayları: Message={Message}", ex.Message);
            _logger.LogError("SMTP Ayarları: Host={Host}, Port={Port}, Timeout={Timeout}ms", 
                smtpHost, smtpPort, 20000);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Email gönderilirken beklenmeyen hata oluştu: {Email}", email);
            _logger.LogError("Hata Tipi: {ExceptionType}, Message: {Message}", ex.GetType().Name, ex.Message);
            _logger.LogError("Inner Exception: {InnerException}", ex.InnerException?.Message ?? "Yok");
            _logger.LogError("SMTP Ayarları: Host={Host}, Port={Port}, Username={Username}, FromEmail={FromEmail}", 
                smtpHost, smtpPort, smtpUsername, fromEmail);
            _logger.LogError("Stack Trace: {StackTrace}", ex.StackTrace);
            return false;
        }
    }
}

