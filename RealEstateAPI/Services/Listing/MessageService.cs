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
        var thread = await _messageRepository.GetThreadByIdAsync(threadId);
        if (thread == null || (thread.BuyerId != userId && thread.SellerId != userId))
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

