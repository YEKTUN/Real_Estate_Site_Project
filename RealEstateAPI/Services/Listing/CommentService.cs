using Microsoft.Extensions.Logging;
using RealEstateAPI.DTOs.Listing;
using RealEstateAPI.Models;
using RealEstateAPI.Repositories.Listing;

namespace RealEstateAPI.Services.Listing;

/// <summary>
/// Yorum Service Implementasyonu
/// 
/// Yorum iş mantığını yönetir.
/// </summary>
public class CommentService : ICommentService
{
    private readonly ICommentRepository _commentRepository;
    private readonly IListingRepository _listingRepository;
    private readonly ILogger<CommentService> _logger;

    public CommentService(
        ICommentRepository commentRepository,
        IListingRepository listingRepository,
        ILogger<CommentService> logger)
    {
        _commentRepository = commentRepository;
        _listingRepository = listingRepository;
        _logger = logger;
    }

    // ============================================================================
    // YORUM CRUD İŞLEMLERİ
    // ============================================================================

    public async Task<CommentResponseDto> CreateAsync(int listingId, CreateCommentDto dto, string userId)
    {
        try
        {
            // İlan var mı kontrol et
            if (!await _listingRepository.ExistsAsync(listingId))
            {
                return new CommentResponseDto
                {
                    Success = false,
                    Message = "İlan bulunamadı"
                };
            }

            // Üst yorum kontrolü (yanıt ise)
            if (dto.ParentCommentId.HasValue)
            {
                if (!await _commentRepository.ExistsAsync(dto.ParentCommentId.Value))
                {
                    return new CommentResponseDto
                    {
                        Success = false,
                        Message = "Yanıt verilecek yorum bulunamadı"
                    };
                }
            }

            var comment = new ListingComment
            {
                ListingId = listingId,
                UserId = userId,
                Content = dto.Content,
                ParentCommentId = dto.ParentCommentId
            };

            var createdComment = await _commentRepository.CreateAsync(comment);

            _logger.LogInformation("Yorum oluşturuldu. CommentId: {CommentId}, ListingId: {ListingId}", 
                createdComment.Id, listingId);

            return new CommentResponseDto
            {
                Success = true,
                Message = "Yorum başarıyla eklendi",
                Comment = MapToDto(createdComment, userId)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Yorum oluşturma hatası. ListingId: {ListingId}", listingId);
            return new CommentResponseDto
            {
                Success = false,
                Message = "Yorum eklenirken bir hata oluştu"
            };
        }
    }

    public async Task<CommentResponseDto> UpdateAsync(int commentId, UpdateCommentDto dto, string userId)
    {
        try
        {
            // Yetki kontrolü
            if (!await _commentRepository.IsOwnerAsync(commentId, userId))
            {
                return new CommentResponseDto
                {
                    Success = false,
                    Message = "Bu yorumu düzenleme yetkiniz yok"
                };
            }

            var comment = await _commentRepository.GetByIdAsync(commentId);
            if (comment == null)
            {
                return new CommentResponseDto
                {
                    Success = false,
                    Message = "Yorum bulunamadı"
                };
            }

            comment.Content = dto.Content;
            var updatedComment = await _commentRepository.UpdateAsync(comment);

            _logger.LogInformation("Yorum güncellendi. CommentId: {CommentId}", commentId);

            return new CommentResponseDto
            {
                Success = true,
                Message = "Yorum başarıyla güncellendi",
                Comment = MapToDto(updatedComment, userId)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Yorum güncelleme hatası. CommentId: {CommentId}", commentId);
            return new CommentResponseDto
            {
                Success = false,
                Message = "Yorum güncellenirken bir hata oluştu"
            };
        }
    }

    public async Task<CommentResponseDto> DeleteAsync(int commentId, string userId)
    {
        try
        {
            // Yetki kontrolü
            if (!await _commentRepository.IsOwnerAsync(commentId, userId))
            {
                return new CommentResponseDto
                {
                    Success = false,
                    Message = "Bu yorumu silme yetkiniz yok"
                };
            }

            var result = await _commentRepository.DeleteAsync(commentId);
            if (!result)
            {
                return new CommentResponseDto
                {
                    Success = false,
                    Message = "Yorum bulunamadı"
                };
            }

            _logger.LogInformation("Yorum silindi. CommentId: {CommentId}", commentId);

            return new CommentResponseDto
            {
                Success = true,
                Message = "Yorum başarıyla silindi"
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Yorum silme hatası. CommentId: {CommentId}", commentId);
            return new CommentResponseDto
            {
                Success = false,
                Message = "Yorum silinirken bir hata oluştu"
            };
        }
    }

    // ============================================================================
    // YORUM LİSTELEME
    // ============================================================================

    public async Task<CommentListResponseDto> GetByListingIdAsync(int listingId, string? userId = null)
    {
        try
        {
            var comments = await _commentRepository.GetByListingIdAsync(listingId);
            var totalCount = await _commentRepository.GetCommentCountAsync(listingId);

            return new CommentListResponseDto
            {
                Success = true,
                Message = "Yorumlar başarıyla getirildi",
                Comments = comments.Select(c => MapToDto(c, userId)).ToList(),
                TotalCount = totalCount
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Yorumlar getirme hatası. ListingId: {ListingId}", listingId);
            return new CommentListResponseDto
            {
                Success = false,
                Message = "Yorumlar getirilirken bir hata oluştu"
            };
        }
    }

    public async Task<CommentListResponseDto> GetMyCommentsAsync(string userId)
    {
        try
        {
            var comments = await _commentRepository.GetByUserIdAsync(userId);

            return new CommentListResponseDto
            {
                Success = true,
                Message = "Yorumlarınız başarıyla getirildi",
                Comments = comments.Select(c => MapToDto(c, userId)).ToList(),
                TotalCount = comments.Count
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Kullanıcı yorumları getirme hatası. UserId: {UserId}", userId);
            return new CommentListResponseDto
            {
                Success = false,
                Message = "Yorumlarınız getirilirken bir hata oluştu"
            };
        }
    }

    // ============================================================================
    // HELPER METHODS
    // ============================================================================

    private static CommentDto MapToDto(ListingComment comment, string? currentUserId = null)
    {
        return new CommentDto
        {
            Id = comment.Id,
            ListingId = comment.ListingId,
            Content = comment.Content,
            User = new CommentUserDto
            {
                Id = comment.User?.Id ?? string.Empty,
                Name = comment.User?.Name ?? string.Empty,
                Surname = comment.User?.Surname ?? string.Empty,
                ProfilePictureUrl = comment.User?.ProfilePictureUrl
            },
            ParentCommentId = comment.ParentCommentId,
            Replies = comment.Replies.Select(r => MapToDto(r, currentUserId)).ToList(),
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
            IsEdited = comment.IsEdited,
            IsOwner = !string.IsNullOrEmpty(currentUserId) && comment.UserId == currentUserId
        };
    }
}
