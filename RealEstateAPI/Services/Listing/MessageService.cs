using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Listing;

namespace RealEstateAPI.Services.Listing;

public class MessageService : IMessageService
{
    private readonly IListingRepository _listingRepository;
    private readonly IMessageRepository _messageRepository;
    private readonly ILogger<MessageService> _logger;

    public MessageService(
        IListingRepository listingRepository,
        IMessageRepository messageRepository,
        ILogger<MessageService> logger)
    {
        _listingRepository = listingRepository;
        _messageRepository = messageRepository;
        _logger = logger;
    }

    public async Task<ListingMessageResponseDto> SendMessageAsync(int listingId, string senderId, CreateListingMessageDto dto)
    {
        _logger.LogInformation("SendMessageAsync başlatıldı. ListingId: {ListingId}, SenderId: {SenderId}", listingId, senderId);
        _logger.LogInformation("DTO içeriği: Content: {Content}, IsOffer: {IsOffer}, OfferPrice: {OfferPrice}, AttachmentUrl: {AttachmentUrl}", 
            dto.Content, dto.IsOffer, dto.OfferPrice, dto.AttachmentUrl);

        var listing = await _listingRepository.GetByIdAsync(listingId);
        if (listing == null)
        {
            _logger.LogWarning("İlan bulunamadı. ListingId: {ListingId}", listingId);
            return new ListingMessageResponseDto { Success = false, Message = "İlan bulunamadı" };
        }

        var sellerId = listing.UserId;
        var isSeller = sellerId == senderId;

        ListingMessageThread? thread = null;

        if (isSeller)
        {
            // İlan sahibi ise, bu ilan için mevcut thread'i bul
            // İlan sahibi sadece mevcut thread'lere mesaj gönderebilir, yeni thread oluşturamaz
            thread = await _messageRepository.GetThreadByListingAndUserAsync(listingId, senderId);
            
            if (thread == null)
            {
                _logger.LogWarning("İlan sahibi kendi ilanına yeni thread oluşturmaya çalıştı. ListingId: {ListingId}, UserId: {UserId}", listingId, senderId);
                return new ListingMessageResponseDto { Success = false, Message = "Kendi ilanınıza yeni mesajlaşma başlatamazsınız. Sadece mevcut mesajlaşmalara cevap verebilirsiniz." };
            }
            
            _logger.LogInformation("İlan sahibi mevcut thread'e mesaj gönderiyor. ThreadId: {ThreadId}, ListingId: {ListingId}", thread.Id, listingId);
        }
        else
        {
            // Kullanıcı buyer ise, normal thread araması yap
            var buyerId = senderId;
            _logger.LogInformation("Thread aranıyor. ListingId: {ListingId}, BuyerId: {BuyerId}, SellerId: {SellerId}", listingId, buyerId, sellerId);
            
            thread = await _messageRepository.GetThreadAsync(listingId, buyerId, sellerId);
            
            // Thread yoksa, yeni thread oluştur
            if (thread == null)
            {
                _logger.LogInformation("Yeni thread oluşturuluyor. ListingId: {ListingId}, BuyerId: {BuyerId}, SellerId: {SellerId}", listingId, buyerId, sellerId);
                thread = await _messageRepository.AddThreadAsync(new ListingMessageThread
                {
                    ListingId = listingId,
                    BuyerId = buyerId,
                    SellerId = sellerId,
                    CreatedAt = DateTime.UtcNow,
                    LastMessageAt = DateTime.UtcNow
                });
            }
        }

        if (thread == null)
        {
            _logger.LogError("Thread oluşturulamadı veya bulunamadı. ListingId: {ListingId}, SenderId: {SenderId}", listingId, senderId);
            return new ListingMessageResponseDto { Success = false, Message = "Mesajlaşma thread'i bulunamadı" };
        }

        // Thread'i Buyer ve Seller bilgileriyle birlikte çek (admin kontrolü için)
        var threadWithUsers = await _messageRepository.GetThreadByIdAsync(thread.Id);
        if (threadWithUsers == null)
        {
            _logger.LogError("Thread detayları alınamadı. ThreadId: {ThreadId}", thread.Id);
            return new ListingMessageResponseDto { Success = false, Message = "Mesajlaşma thread'i bulunamadı" };
        }

        // Eğer mesaj gönderen taraf thread'i silmişse, silme flag'ini kaldır (thread geri gelsin)
        // Mesaj gönderen kişi thread'i açık tutmak istiyor demektir
        if (threadWithUsers.BuyerId == senderId && threadWithUsers.DeletedByBuyer)
        {
            threadWithUsers.DeletedByBuyer = false;
            _logger.LogInformation("Buyer thread'i geri getirdi (yeni mesaj gönderdi). ThreadId: {ThreadId}", thread.Id);
        }
        else if (threadWithUsers.SellerId == senderId && threadWithUsers.DeletedBySeller)
        {
            threadWithUsers.DeletedBySeller = false;
            _logger.LogInformation("Seller thread'i geri getirdi (yeni mesaj gönderdi). ThreadId: {ThreadId}", thread.Id);
        }

        // Alıcı tarafın thread'i silme flag'ini de kaldır (yeni mesaj geldi, thread görünür olmalı)
        var receiverId = threadWithUsers.BuyerId == senderId ? threadWithUsers.SellerId : threadWithUsers.BuyerId;
        if (receiverId == threadWithUsers.BuyerId && threadWithUsers.DeletedByBuyer)
        {
            threadWithUsers.DeletedByBuyer = false;
            _logger.LogInformation("Buyer thread'i geri getirildi (yeni mesaj geldi). ThreadId: {ThreadId}", thread.Id);
        }
        else if (receiverId == threadWithUsers.SellerId && threadWithUsers.DeletedBySeller)
        {
            threadWithUsers.DeletedBySeller = false;
            _logger.LogInformation("Seller thread'i geri getirildi (yeni mesaj geldi). ThreadId: {ThreadId}", thread.Id);
        }

        // Admin thread kontrolü: Eğer thread'in buyer'ı admin ise, seller bu thread'e mesaj gönderemez
        if (threadWithUsers.Buyer?.IsAdmin == true && threadWithUsers.SellerId == senderId)
        {
            _logger.LogWarning("Admin thread'ine mesaj gönderilmeye çalışıldı. ThreadId: {ThreadId}, SenderId: {SenderId}", thread.Id, senderId);
            return new ListingMessageResponseDto 
            { 
                Success = false, 
                Message = "Sistem mesajlarına cevap verilemez. Bu mesajlar sadece bilgilendirme amaçlıdır." 
            };
        }

        _logger.LogInformation("Thread hazır. ThreadId: {ThreadId}", thread.Id);

        var message = new ListingMessage
        {
            ThreadId = thread.Id,
            SenderId = senderId,
            Content = dto.Content,
            OfferPrice = dto.OfferPrice,
            IsOffer = dto.IsOffer,
            AttachmentUrl = dto.AttachmentUrl,
            AttachmentType = dto.AttachmentType,
            AttachmentFileName = dto.AttachmentFileName,
            AttachmentFileSize = dto.AttachmentFileSize,
            CreatedAt = DateTime.UtcNow
        };

        _logger.LogInformation("Mesaj oluşturuldu. AttachmentUrl: {AttachmentUrl}, AttachmentType: {AttachmentType}", 
            message.AttachmentUrl, message.AttachmentType);

        var savedMessage = await _messageRepository.AddMessageAsync(message);

        thread.LastMessageAt = message.CreatedAt;
        thread.UpdatedAt = message.CreatedAt;
        await _messageRepository.SaveChangesAsync();

        // Mesajı sender bilgisiyle birlikte tekrar çek
        var messages = await _messageRepository.GetMessagesAsync(thread.Id);
        var messageWithSender = messages.FirstOrDefault(m => m.Id == savedMessage.Id);

        if (messageWithSender == null)
        {
            _logger.LogError("Gönderilen mesaj bulunamadı. MessageId: {MessageId}", savedMessage.Id);
            // Sender bilgisi olmadan da dönebiliriz, frontend'de sorun olmaz
            messageWithSender = savedMessage;
        }

        _logger.LogInformation("Mesaj gönderildi. ThreadId: {ThreadId}, ListingId: {ListingId}, Sender: {SenderId}, MessageId: {MessageId}", 
            thread.Id, listingId, senderId, messageWithSender.Id);

        return new ListingMessageResponseDto
        {
            Success = true,
            Message = "Mesaj gönderildi",
            Data = MapMessage(messageWithSender)
        };
    }

    public async Task<ListingThreadListResponseDto> GetThreadsAsync(string userId)
    {
        var threads = await _messageRepository.GetThreadsForUserAsync(userId);

        return new ListingThreadListResponseDto
        {
            Success = true,
            Message = "Mesajlaşma kutusu getirildi",
            Threads = threads.Select(MapThread).ToList()
        };
    }

    public async Task<ListingMessageListResponseDto> GetMessagesAsync(int threadId, string userId)
    {
        var thread = await _messageRepository.GetThreadByIdAsync(threadId, userId);
        if (thread == null || (thread.BuyerId != userId && thread.SellerId != userId))
        {
            return new ListingMessageListResponseDto { Success = false, Message = "Mesajlaşma bulunamadı" };
        }

        // Kullanıcı thread'i silmişse mesajları gösterme
        if ((thread.BuyerId == userId && thread.DeletedByBuyer) || (thread.SellerId == userId && thread.DeletedBySeller))
        {
            return new ListingMessageListResponseDto { Success = false, Message = "Mesajlaşma bulunamadı" };
        }

        var messages = await _messageRepository.GetMessagesAsync(threadId);
        return new ListingMessageListResponseDto
        {
            Success = true,
            Message = "Mesajlar getirildi",
            Messages = messages.Select(MapMessage).ToList()
        };
    }

    public async Task<bool> DeleteThreadAsync(int threadId, string userId)
    {
        return await _messageRepository.DeleteThreadAsync(threadId, userId);
    }

    public async Task<bool> MarkMessageAsReadAsync(int messageId, string userId)
    {
        _logger.LogInformation("Mesaj okundu olarak işaretleniyor. MessageId: {MessageId}, UserId: {UserId}", messageId, userId);
        
        var result = await _messageRepository.MarkMessageAsReadAsync(messageId, userId);
        
        if (result)
        {
            _logger.LogInformation("Mesaj başarıyla okundu olarak işaretlendi. MessageId: {MessageId}", messageId);
        }
        else
        {
            _logger.LogWarning("Mesaj okundu olarak işaretlenemedi. MessageId: {MessageId}, UserId: {UserId}", messageId, userId);
        }
        
        return result;
    }

    /// <summary>
    /// Admin olarak ilan sahibine mesaj gönder (ilan durumu değişikliği bildirimi)
    /// </summary>
    public async Task<bool> SendAdminNotificationAsync(int listingId, string adminUserId, string messageContent)
    {
        try
        {
            _logger.LogInformation("Admin bildirim mesajı gönderiliyor. ListingId: {ListingId}, AdminId: {AdminId}, Content: {Content}", 
                listingId, adminUserId, messageContent);

            var listing = await _listingRepository.GetByIdAsync(listingId);
            if (listing == null)
            {
                _logger.LogWarning("İlan bulunamadı. ListingId: {ListingId}", listingId);
                return false;
            }

            var sellerId = listing.UserId;
            _logger.LogInformation("İlan sahibi bulundu. SellerId: {SellerId}, ListingNumber: {ListingNumber}", sellerId, listing.ListingNumber);

            // Admin için özel thread oluştur veya mevcut thread'i bul
            // Admin'i buyer olarak kullanıyoruz (admin-seller thread)
            // Seller thread'i görebilir çünkü SellerId = sellerId
            var thread = await _messageRepository.GetThreadAsync(listingId, adminUserId, sellerId);
            _logger.LogInformation("Thread kontrolü yapıldı. Thread bulundu mu: {Found}", thread != null);

            // Thread yoksa, admin için özel thread oluştur
            if (thread == null)
            {
                _logger.LogInformation("Admin için yeni thread oluşturuluyor. ListingId: {ListingId}, AdminId: {AdminId}, SellerId: {SellerId}", 
                    listingId, adminUserId, sellerId);
                
                var newThread = new ListingMessageThread
                {
                    ListingId = listingId,
                    BuyerId = adminUserId, // Admin buyer olarak
                    SellerId = sellerId,
                    CreatedAt = DateTime.UtcNow,
                    LastMessageAt = DateTime.UtcNow
                };
                
                thread = await _messageRepository.AddThreadAsync(newThread);
                _logger.LogInformation("Yeni thread oluşturuldu. ThreadId: {ThreadId}", thread.Id);
            }
            else
            {
                _logger.LogInformation("Mevcut thread kullanılıyor. ThreadId: {ThreadId}", thread.Id);
            }

            // Mesaj oluştur
            var message = new ListingMessage
            {
                ThreadId = thread.Id,
                SenderId = adminUserId,
                Content = messageContent,
                IsOffer = false,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _logger.LogInformation("Mesaj oluşturuluyor. ThreadId: {ThreadId}, SenderId: {SenderId}", thread.Id, adminUserId);
            
            // Thread'i önce güncelle (LastMessageAt için)
            thread.LastMessageAt = message.CreatedAt;
            thread.UpdatedAt = message.CreatedAt;
            
            // Mesajı kaydet (AddMessageAsync içinde SaveChangesAsync var)
            var savedMessage = await _messageRepository.AddMessageAsync(message);
            _logger.LogInformation("Mesaj kaydedildi. MessageId: {MessageId}", savedMessage.Id);

            // Thread güncellemesini kaydet
            await _messageRepository.SaveChangesAsync();
            _logger.LogInformation("Thread güncellendi. ThreadId: {ThreadId}, LastMessageAt: {LastMessageAt}", 
                thread.Id, thread.LastMessageAt);

            _logger.LogInformation("Admin bildirim mesajı başarıyla gönderildi. ThreadId: {ThreadId}, ListingId: {ListingId}, MessageId: {MessageId}", 
                thread.Id, listingId, savedMessage.Id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Admin bildirim mesajı gönderme hatası. ListingId: {ListingId}, AdminId: {AdminId}, Error: {Error}", 
                listingId, adminUserId, ex.Message);
            return false;
        }
    }

    // Helpers
    private static ListingMessageDto MapMessage(ListingMessage msg)
    {
        return new ListingMessageDto
        {
            Id = msg.Id,
            ThreadId = msg.ThreadId,
            SenderId = msg.SenderId,
            SenderName = msg.Sender?.Name ?? msg.Sender?.UserName ?? string.Empty,
            SenderSurname = msg.Sender?.Surname,
            SenderProfilePictureUrl = msg.Sender?.ProfilePictureUrl,
            IsAdminSender = msg.Sender?.IsAdmin ?? false,
            Content = msg.Content,
            OfferPrice = msg.OfferPrice,
            IsOffer = msg.IsOffer,
            AttachmentUrl = msg.AttachmentUrl,
            AttachmentType = msg.AttachmentType,
            AttachmentFileName = msg.AttachmentFileName,
            AttachmentFileSize = msg.AttachmentFileSize,
            IsRead = msg.IsRead,
            CreatedAt = msg.CreatedAt
        };
    }

    private static ListingMessageThreadDto MapThread(ListingMessageThread thread)
    {
        return new ListingMessageThreadDto
        {
            Id = thread.Id,
            ListingId = thread.ListingId,
            ListingTitle = thread.Listing?.Title ?? string.Empty,
            SellerId = thread.SellerId,
            SellerName = thread.Seller?.Name ?? thread.Seller?.UserName ?? string.Empty,
            SellerSurname = thread.Seller?.Surname,
            SellerProfilePictureUrl = thread.Seller?.ProfilePictureUrl,
            BuyerId = thread.BuyerId,
            BuyerName = thread.Buyer?.Name ?? thread.Buyer?.UserName ?? string.Empty,
            BuyerSurname = thread.Buyer?.Surname,
            BuyerProfilePictureUrl = thread.Buyer?.ProfilePictureUrl,
            LastMessageAt = thread.LastMessageAt,
            Messages = thread.Messages?.Select(MapMessage).ToList() ?? new List<ListingMessageDto>()
        };
    }
}

